import SwiftUI
import MapKit

struct MapsView: View {
    @State private var resorts: [ResortForecastRow] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var selectedResort: ResortForecastRow?

    @State private var cameraPosition: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 36.75, longitude: 138.48),
            span: MKCoordinateSpan(latitudeDelta: 0.22, longitudeDelta: 0.22)
        )
    )

    private var validResorts: [ResortForecastRow] {
        resorts.filter { resort in
            resort.latitude != nil && resort.longitude != nil
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    VStack(spacing: 16) {
                        ProgressView()
                        Text("Loading resort map...")
                            .foregroundStyle(.secondary)
                    }
                } else if let errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "map.fill")
                            .font(.system(size: 42))
                            .foregroundStyle(.blue)

                        Text("Could not load map")
                            .font(.headline)

                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)

                        Button("Retry") {
                            Task { await loadResorts() }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                } else {
                    VStack(spacing: 0) {
                        headerCard

                        Map(position: $cameraPosition) {
                            ForEach(validResorts) { resort in
                                if let latitude = resort.latitude,
                                   let longitude = resort.longitude {
                                    Annotation(
                                        resort.name,
                                        coordinate: CLLocationCoordinate2D(
                                            latitude: latitude,
                                            longitude: longitude
                                        )
                                    ) {
                                        ResortMapMarker(resort: resort)
                                            .onTapGesture {
                                                selectedResort = resort
                                            }
                                    }
                                }
                            }
                        }
                        .mapStyle(.standard(elevation: .realistic))
                        .overlay(alignment: .bottom) {
                            legendCard
                                .padding()
                        }
                    }
                    .background(Color(.systemGroupedBackground))
                }
            }
            .navigationTitle("Map")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                await loadResorts()
            }
            .sheet(item: $selectedResort) { resort in
                ResortMapDetailSheet(resort: resort)
            }
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Yamanouchi Resort Map")
                .font(.system(size: 26, weight: .bold, design: .rounded))

            Text("Shiga Kogen, Ryuo and Yomase ski areas with live mapped resort points.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(Color.white)
    }

    private var legendCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Map legend")
                .font(.headline)

            HStack {
                Circle()
                    .fill(Color.red)
                    .frame(width: 12, height: 12)
                Text("Heavy snowfall")
                    .font(.footnote)
            }

            HStack {
                Circle()
                    .fill(Color.orange)
                    .frame(width: 12, height: 12)
                Text("Moderate snowfall")
                    .font(.footnote)
            }

            HStack {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 12, height: 12)
                Text("Light snowfall")
                    .font(.footnote)
            }

            HStack {
                Image(systemName: "trophy.fill")
                    .foregroundStyle(.orange)
                Text("Top snow leader")
                    .font(.footnote)
            }

            Text("Tap a marker for directions and resort links.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(.thinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    @MainActor
    private func loadResorts() async {
        isLoading = true
        errorMessage = nil

        do {
            resorts = try await SupabaseManager.shared.fetchYamanouchiResorts()

            if let region = mapRegion(for: resorts) {
                cameraPosition = .region(region)
            }
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func mapRegion(for resorts: [ResortForecastRow]) -> MKCoordinateRegion? {
        let points = resorts.compactMap { resort -> CLLocationCoordinate2D? in
            guard let lat = resort.latitude, let lon = resort.longitude else { return nil }
            return CLLocationCoordinate2D(latitude: lat, longitude: lon)
        }

        guard !points.isEmpty else { return nil }

        let latitudes = points.map { $0.latitude }
        let longitudes = points.map { $0.longitude }

        let minLat = latitudes.min() ?? 36.70
        let maxLat = latitudes.max() ?? 36.80
        let minLon = longitudes.min() ?? 138.40
        let maxLon = longitudes.max() ?? 138.55

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2
        )

        let span = MKCoordinateSpan(
            latitudeDelta: max(0.08, (maxLat - minLat) * 1.6),
            longitudeDelta: max(0.08, (maxLon - minLon) * 1.6)
        )

        return MKCoordinateRegion(center: center, span: span)
    }
}

struct ResortMapMarker: View {
    let resort: ResortForecastRow

    private var snowLevelColor: Color {
        let snow = resort.snow24hCm ?? 0

        if snow >= 20 {
            return .red
        } else if snow >= 10 {
            return .orange
        } else if snow > 0 {
            return .blue
        } else {
            return .gray
        }
    }

    private var isLeader: Bool {
        (resort.snow24hCm ?? 0) >= 20
    }

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                Circle()
                    .fill(snowLevelColor)
                    .frame(width: 34, height: 34)

                Image(systemName: isLeader ? "trophy.fill" : "mountain.2.fill")
                    .foregroundStyle(.white)
                    .font(.system(size: 14, weight: .bold))
            }

            VStack(spacing: 2) {
                Text(resort.name)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                Text("\(resort.snow24hCm ?? 0) cm")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
        }
    }
}

struct ResortMapDetailSheet: View {
    let resort: ResortForecastRow
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                Text(resort.name)
                    .font(.title2)
                    .fontWeight(.bold)

                Text(resort.cluster ?? "Yamanouchi Town")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    mapMetric(title: "24h", value: "\(resort.snow24hCm ?? 0) cm", color: .blue)
                    mapMetric(title: "Base", value: "\(resort.snowDepthCm ?? 0) cm", color: .indigo)
                }

                HStack(spacing: 12) {
                    mapMetric(title: "Temp", value: tempText(resort.tempNowC), color: .red)
                    mapMetric(title: "Wind", value: windText(resort.windKmh), color: .green)
                }

                VStack(alignment: .leading, spacing: 10) {
                    if let googleMapsURL {
                        Link("Open in Google Maps", destination: googleMapsURL)
                            .font(.headline)
                    }

                    if let websiteURL {
                        Link("Open Resort Website", destination: websiteURL)
                            .font(.headline)
                    }
                }

                Spacer()
            }
            .padding(20)
            .navigationTitle("Resort")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    private var googleMapsURL: URL? {
        guard let lat = resort.latitude, let lon = resort.longitude else { return nil }
        return URL(string: "https://www.google.com/maps/search/?api=1&query=\(lat),\(lon)")
    }

    private var websiteURL: URL? {
        let name = resort.name.lowercased()

        if name.contains("ryuo") {
            return URL(string: "https://ryuoo.com/winter/")
        }

        if name.contains("yomase") {
            return URL(string: "https://xplorejapan.com/yomase-onsen-ski-resort/")
        }

        if (resort.cluster ?? "").lowercased().contains("shiga kogen") {
            return URL(string: "https://www.shigakogen-ski.or.jp/english/")
        }

        return nil
    }

    private func mapMetric(title: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.9))

            Text(value)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(color)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func tempText(_ value: Double?) -> String {
        guard let value else { return "--" }
        return String(format: "%.1f°", value)
    }

    private func windText(_ value: Double?) -> String {
        guard let value else { return "--" }
        return String(format: "%.1f km/h", value)
    }
}
