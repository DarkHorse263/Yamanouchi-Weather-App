import SwiftUI

struct PremiumView: View {
    @State private var cards: [PremiumHomeCard] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading premium rankings...")
                } else if let errorMessage {
                    VStack(spacing: 16) {
                        Text("Could not load premium rankings")
                            .font(.headline)

                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)

                        Button("Retry") {
                            Task { await loadCards() }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                } else {
                    List(cards) { card in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("#\(card.premiumRank)")
                                    .font(.headline)
                                    .foregroundStyle(.blue)

                                Spacer()

                                Text(scoreText(card.powderQualityScore))
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                            }

                            Text(card.name)
                                .font(.headline)

                            Text(card.cluster)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)

                            Text(detailLine(for: card))
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 6)
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await loadCards()
                    }
                }
            }
            .navigationTitle("Premium Picks")
            .task {
                await loadCards()
            }
        }
    }

    private func scoreText(_ score: Double?) -> String {
        guard let score else { return "Score 0" }
        return "Score \(String(format: "%.1f", score))"
    }

    private func detailLine(for card: PremiumHomeCard) -> String {
        let tomorrow = card.expectedSnowTomorrowCm.map { "\($0) cm tomorrow" } ?? "No forecast"
        let today = card.snow24hCm.map { "\($0) cm today" } ?? "No today snow"
        let type = card.powderType ?? "Unknown snow type"
        return "\(tomorrow) • \(today) • \(type)"
    }

    @MainActor
    private func loadCards() async {
        isLoading = true
        errorMessage = nil

        do {
            cards = try await SupabaseManager.shared.fetchPremiumCards()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
