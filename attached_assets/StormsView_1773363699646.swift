import SwiftUI

struct StormsView: View {
    @State private var storms: [StormTrackerRow] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var lastUpdated = Date()

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    VStack(spacing: 16) {
                        ProgressView()
                        Text("Loading Snow Outlook...")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(.systemGroupedBackground))

                } else if let errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "cloud.snow.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.blue)

                        Text("Could not load Snow Outlook")
                            .font(.headline)

                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)

                        Button("Retry") {
                            Task { await loadStorms() }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(.systemGroupedBackground))

                } else {
                    ScrollView(.vertical, showsIndicators: true) {
                        VStack(spacing: 18) {
                            headerCard

                            if storms.isEmpty {
                                emptyStateView
                            } else {
                                ForEach(storms) { storm in
                                    stormCard(storm)
                                }
                            }

                            explanationCard
                        }
                        .padding(20)
                    }
                    .background(Color(.systemGroupedBackground))
                    .refreshable {
                        await loadStorms()
                    }
                }
            }
            .navigationTitle("Snow Outlook")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                await loadStorms()
            }
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Snow Outlook")
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(.white)

            Text("Short-range snowfall outlook for Yamanouchi Town ski areas.")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.95))

            Text("Forecast values are derived from weather models and mapped station inputs to highlight potential snow events across Shiga Kogen, Ryuo and Yomase.")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.9))

            Text("Updated \(formattedLastUpdated(lastUpdated))")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.9))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(22)
        .background(
            LinearGradient(
                colors: [.indigo, .blue, .cyan],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private var emptyStateView: some View {
        VStack(spacing: 12) {
            Image(systemName: "cloud.sun.fill")
                .font(.system(size: 34))
                .foregroundStyle(.orange)

            Text("No current snow outlook")
                .font(.headline)

            Text("There are no snow outlook rows available right now.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }

    private func stormCard(_ storm: StormTrackerRow) -> some View {
        let level = calculateStormLevel(
            snow24: storm.snow24hCm,
            snow48: storm.snow48hCm,
            snow72: storm.snow72hCm
        )

        return VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(storm.cluster)
                        .font(.headline)
                        .fontWeight(.bold)

                    Text(storm.headline ?? "Snow outlook available")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text("#\(storm.stormRank ?? 0)")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundStyle(.blue)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.blue.opacity(0.14))
                    .clipShape(Capsule())
            }

            HStack(spacing: 10) {
                metric(title: "24h", value: "\(storm.snow24hCm ?? 0) cm", color: .blue)
                metric(title: "48h", value: "\(storm.snow48hCm ?? 0) cm", color: .purple)
                metric(title: "72h", value: "\(storm.snow72hCm ?? 0) cm", color: .indigo)
                metric(title: "Level", value: level.text, color: level.color)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }

    private func metric(title: String, value: String, color: Color) -> some View {
        return VStack(alignment: .leading, spacing: 4) {
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
        .background(color)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func calculateStormLevel(snow24: Int?, snow48: Int?, snow72: Int?) -> (text: String, color: Color) {
        let total = (snow24 ?? 0) + (snow48 ?? 0) + (snow72 ?? 0)

        if total >= 40 {
            return ("Strong", .red)
        } else if total >= 15 {
            return ("Moderate", .orange)
        } else if total > 0 {
            return ("Light", .blue)
        } else {
            return ("None", .gray)
        }
    }

    private var explanationCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("About snow outlook", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(.blue)

            Text("Snow Outlook summarises the strongest near-term snowfall signals across the Yamanouchi Town ski areas. It is intended as supportive guidance for visitors and operators, rather than an official resort bulletin.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }

    private func formattedLastUpdated(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        formatter.dateStyle = .none
        return formatter.string(from: date)
    }

    @MainActor
    private func loadStorms() async {
        isLoading = true
        errorMessage = nil

        do {
            storms = try await SupabaseManager.shared.fetchStormTracker()
            lastUpdated = Date()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
