import SwiftUI

struct ResortsView: View {
    @State private var resorts: [ResortForecastRow] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var searchText = ""

    private var filteredResorts: [ResortForecastRow] {
        guard !searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return resorts
        }

        let query = searchText.lowercased()

        return resorts.filter { resort in
            resort.name.lowercased().contains(query) ||
            (resort.cluster?.lowercased().contains(query) ?? false)
        }
    }

    private var shigaResorts: [ResortForecastRow] {
        filteredResorts.filter { ($0.cluster ?? "").localizedCaseInsensitiveContains("Shiga Kogen") }
    }

    private var ryuoResorts: [ResortForecastRow] {
        filteredResorts.filter { $0.name.localizedCaseInsensitiveContains("Ryuo") }
    }

    private var yomaseResorts: [ResortForecastRow] {
        filteredResorts.filter { $0.name.localizedCaseInsensitiveContains("Yomase") }
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading ski resorts...")
                } else if let errorMessage {
                    VStack(spacing: 16) {
                        Text("Could not load resorts")
                            .font(.headline)

                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)

                        Button("Retry") {
                            Task { await loadResorts() }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                } else {
                    ScrollView(.vertical, showsIndicators: true) {
                        VStack(alignment: .leading, spacing: 18) {
                            topNote
                            groupedExplanation

                            if !shigaResorts.isEmpty {
                                resortGroup(title: "Shiga Kogen Ski Resorts", resorts: shigaResorts)
                            }

                            if !ryuoResorts.isEmpty {
                                resortGroup(title: "Ryuo Ski Park", resorts: ryuoResorts)
                            }

                            if !yomaseResorts.isEmpty {
                                resortGroup(title: "Yomase Ski Resort", resorts: yomaseResorts)
                            }
                        }
                        .padding(20)
                    }
                    .background(Color(.systemGroupedBackground))
                    .searchable(text: $searchText, prompt: "Search Yamanouchi ski resorts")
                    .refreshable {
                        await loadResorts()
                    }
                }
            }
            .navigationTitle("Resorts")
            .navigationBarTitleDisplayMode(.large)
            .task {
                await loadResorts()
            }
        }
    }

    private var topNote: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Yamanouchi Town Ski Resorts")
                .font(.system(size: 28, weight: .bold, design: .rounded))

            Text("Live conditions for Shiga Kogen, Ryuo and Yomase")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private var groupedExplanation: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("How resort weather is shown")
                .font(.headline)

            Text("Resort conditions use the latest station-based weather inputs, mapped to Yamanouchi ski areas and adjusted by elevation where relevant.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }

    private func resortGroup(title: String, resorts: [ResortForecastRow]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.title3)
                .fontWeight(.bold)

            ForEach(resorts) { resort in
                ResortRowView(resort: resort)
            }
        }
    }

    @MainActor
    private func loadResorts() async {
        isLoading = true
        errorMessage = nil

        do {
            resorts = try await SupabaseManager.shared.fetchYamanouchiResorts()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

struct ResortRowView: View {
    let resort: ResortForecastRow

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text(resort.name)
                    .font(.headline)
                    .fontWeight(.bold)

                Text(resort.cluster ?? resort.region ?? "Yamanouchi Town")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 10) {
                metricPill(title: "24h Snow", value: "\(resort.snow24hCm ?? 0) cm", background: .blue)

                metricPill(title: "Base Depth", value: "\(resort.snowDepthCm ?? 0) cm", background: .indigo)

                metricPill(title: "Temp", value: tempText(resort.tempNowC), background: .red)

                metricPill(title: "Wind", value: windText(resort.windKmh), background: .green)
            }

            HStack(spacing: 10) {
                metricPill(title: "Tomorrow", value: "\(resort.expectedSnowTomorrowCm ?? 0) cm", background: .orange)
            }

            Divider()

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(sourceText)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Text(stationText)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text(sourceUpdatedText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }

    private func metricPill(title: String, value: String, background: Color) -> some View {
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
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(background)
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

    private var sourceText: String {
        if let source = resort.source, !source.isEmpty {
            return "Source: \(source)"
        }
        return "Source: --"
    }

    private var stationText: String {
        if let stationName = resort.stationName, !stationName.isEmpty {
            return "Station: \(stationName)"
        }
        return "Station: --"
    }

    private var sourceUpdatedText: String {
        guard let raw = resort.lastUpdatedAt,
              let date = parseDate(raw) else {
            return "Source updated: --"
        }

        return "Source updated: \(timeFormatter.string(from: date))"
    }

    private func parseDate(_ raw: String) -> Date? {
        let isoWithFractional = ISO8601DateFormatter()
        isoWithFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = isoWithFractional.date(from: raw) { return date }

        let isoBasic = ISO8601DateFormatter()
        isoBasic.formatOptions = [.withInternetDateTime]
        if let date = isoBasic.date(from: raw) { return date }

        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")

        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSSSSSXXXXX"
        if let date = formatter.date(from: raw) { return date }

        formatter.dateFormat = "yyyy-MM-dd HH:mm:ssXXXXX"
        if let date = formatter.date(from: raw) { return date }

        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return formatter.date(from: raw)
    }

    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        formatter.dateStyle = .none
        return formatter
    }
}
