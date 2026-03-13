import SwiftUI

struct AlertsView: View {
    @State private var alerts: [PowderAlertRow] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading alerts...")
                } else if let errorMessage {
                    VStack(spacing: 16) {
                        Text("Could not load alerts")
                            .font(.headline)

                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)

                        Button("Retry") {
                            Task { await loadAlerts() }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                } else {
                    List(alerts) { alert in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(alert.headline ?? "Alert")
                                .font(.headline)

                            Text(alert.name ?? "Unknown resort")
                                .font(.subheadline)
                                .fontWeight(.semibold)

                            Text(alert.cluster ?? "")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)

                            Text(alert.message ?? "")
                                .font(.footnote)

                            Text(detailLine(for: alert))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 6)
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await loadAlerts()
                    }
                }
            }
            .navigationTitle("Powder Alerts")
            .task {
                await loadAlerts()
            }
        }
    }

    private func detailLine(for alert: PowderAlertRow) -> String {
        let probability = alert.powderProbability.map { String(format: "%.1f%%", $0) } ?? "0%"
        let snow = alert.expectedSnowCm.map { String(format: "%.0f cm", $0) } ?? "0 cm"
        return "\(probability) • \(snow)"
    }

    @MainActor
    private func loadAlerts() async {
        isLoading = true
        errorMessage = nil

        do {
            alerts = try await SupabaseManager.shared.fetchPowderAlerts()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
