import SwiftUI

struct HomeView: View {
    @State private var dashboard: DashboardFeed?
    @State private var topSnow: [TopSnowfallRow] = []
    @State private var resorts: [ResortForecastRow] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var appRefreshedAt = Date()

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    loadingView
                } else if let errorMessage {
                    errorView(message: errorMessage)
                } else if let dashboard {
                    ScrollView(.vertical, showsIndicators: true) {
                        VStack(spacing: 18) {
                            heroCard(dashboard: dashboard)
                            yamanouchiConditionsCard
                            bestSnowRightNowCard
                            snapshotSection(dashboard: dashboard)
                            methodologyCard

                            if !topSnow.isEmpty {
                                topSnowSection
                            }

                            if let alertHeadline = dashboard.topAlertHeadline,
                               !alertHeadline.isEmpty {
                                alertCard(
                                    headline: alertHeadline,
                                    message: dashboard.topAlertMessage ?? "",
                                    type: dashboard.topAlertType ?? "Live"
                                )
                            }

                            explanationCard(
                                text: dashboard.explanation ?? "This dashboard highlights current snow, temperature and wind across Yamanouchi Town ski areas. Forecast indicators are supportive guidance and not official resort reports."
                            )

                            footerCard
                        }
                        .padding(20)
                    }
                    .background(Color(.systemGroupedBackground))
                    .refreshable {
                        await loadDashboard()
                    }
                } else {
                    ContentUnavailableView(
                        "No data available",
                        systemImage: "snowflake",
                        description: Text("The dashboard could not load any current weather data.")
                    )
                }
            }
            .navigationTitle("Gateway to the Mountains")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                await loadDashboard()
            }
        }
    }

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.15)

            Text("Loading Yamanouchi conditions...")
                .font(.headline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    private func errorView(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 42))
                .foregroundStyle(.orange)

            Text("Could not load dashboard")
                .font(.title3)
                .fontWeight(.semibold)

            Text(message)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

            Button {
                Task { await loadDashboard() }
            } label: {
                Text("Retry")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    private func heroCard(dashboard: DashboardFeed) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Yamanouchi Town")
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(.white)

            Text("Gateway to the Mountains")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundStyle(.white)

            Text("Shiga Kogen • Ryuo • Yomase")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.95))

            HStack(spacing: 10) {
                heroPill(title: "Ski Areas", value: "\(dashboard.resortsCount ?? 0)")
                heroPill(title: "LIVE", value: formattedTime(appRefreshedAt))
                heroPill(title: "Next Update", value: nextUpdateTime())
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(24)
        .background(
            LinearGradient(
                colors: [.blue, .red, .orange],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private func heroPill(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.9))

            Text(value)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.black.opacity(0.18))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private var yamanouchiConditionsCard: some View {
        let temps = resorts.compactMap { $0.tempNowC }
        let winds = resorts.compactMap { $0.windKmh }
        let avgTemp = temps.isEmpty ? 0.0 : temps.reduce(0, +) / Double(temps.count)
        let avgWind = winds.isEmpty ? 0.0 : winds.reduce(0, +) / Double(winds.count)
        let bestSnow = resorts.map { $0.snow24hCm ?? 0 }.max() ?? 0
        let bestBase = resorts.map { $0.snowDepthCm ?? 0 }.max() ?? 0

        return VStack(alignment: .leading, spacing: 14) {
            Text("Yamanouchi Conditions")
                .font(.title3)
                .fontWeight(.bold)

            HStack(spacing: 12) {
                snapshotCard(
                    title: "Average Temp",
                    value: String(format: "%.1f°", avgTemp),
                    background: .red
                )

                snapshotCard(
                    title: "Average Wind",
                    value: String(format: "%.1f km/h", avgWind),
                    background: .green
                )
            }

            HStack(spacing: 12) {
                snapshotCard(
                    title: "Top Snow",
                    value: "\(bestSnow) cm",
                    background: .blue
                )

                snapshotCard(
                    title: "Best Base",
                    value: "\(bestBase) cm",
                    background: .indigo
                )
            }
        }
    }

    private var bestSnowRightNowCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Best Snow Right Now", systemImage: "trophy.fill")
                    .font(.headline)
                    .foregroundStyle(.orange)

                Spacer()

                if let leader = topSnow.first {
                    Text("#\(leader.snowRank)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.orange)
                        .clipShape(Capsule())
                }
            }

            if let leader = topSnow.first {
                Text(leader.name)
                    .font(.title3)
                    .fontWeight(.bold)

                Text(leader.cluster ?? "")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                HStack(spacing: 10) {
                    smallMetric(title: "24h Snow", value: "\(leader.snow24hCm ?? 0) cm", background: .blue)
                    smallMetric(title: "Base", value: "\(leader.snowDepthCm ?? 0) cm", background: .indigo)
                }

                Text("This highlights the highest current 24 hour snowfall value in the Yamanouchi resort feed.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                Text("No snowfall data available")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }

    private func smallMetric(title: String, value: String, background: Color) -> some View {
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

    private func snapshotSection(dashboard: DashboardFeed) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Area Snapshot")
                .font(.title3)
                .fontWeight(.bold)

            HStack(spacing: 12) {
                snapshotCard(
                    title: "Average Temp",
                    value: dashboard.avgTempC.map { String(format: "%.1f°", $0) } ?? "--",
                    background: .red
                )

                snapshotCard(
                    title: "Average Wind",
                    value: dashboard.avgWindKmh.map { String(format: "%.1f km/h", $0) } ?? "--",
                    background: .green
                )
            }

            HStack(spacing: 12) {
                snapshotCard(
                    title: "Best 24h Snow",
                    value: "\(dashboard.maxSnow24hCm ?? 0) cm",
                    background: .blue
                )

                snapshotCard(
                    title: "Best Snow Tomorrow",
                    value: "\(dashboard.maxSnowTomorrowCm ?? 0) cm",
                    background: .orange
                )
            }
        }
    }

    private func snapshotCard(title: String, value: String, background: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.9))

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(background)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private var methodologyCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Data confidence", systemImage: "checkmark.shield.fill")
                .font(.headline)
                .foregroundStyle(.green)

            Text("Live weather inputs refresh hourly from 6am to 5pm. Resort conditions are mapped from station data and adjusted by elevation. Snow Outlook and alerts are supportive guidance only.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }

    private var topSnowSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Top Snow Today")
                .font(.title3)
                .fontWeight(.bold)

            VStack(spacing: 12) {
                ForEach(topSnow.prefix(5)) { row in
                    HStack(alignment: .top, spacing: 12) {
                        Text("#\(row.snowRank)")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundStyle(.blue)
                            .frame(width: 32, alignment: .leading)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(row.name)
                                .font(.headline)
                                .fontWeight(.semibold)

                            Text(row.cluster ?? "")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)

                            Text("\(row.snow24hCm ?? 0) cm in 24h • Base \(row.snowDepthCm ?? 0) cm")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(18)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
                }
            }
        }
    }

    private func alertCard(headline: String, message: String, type: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Current Alert", systemImage: "bell.fill")
                    .font(.headline)
                    .foregroundStyle(.red)

                Spacer()

                Text(type.replacingOccurrences(of: "_", with: " ").capitalized)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.red)
                    .clipShape(Capsule())
            }

            Text(headline)
                .font(.title3)
                .fontWeight(.bold)

            if !message.isEmpty {
                Text(message)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }

    private func explanationCard(text: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("How it works", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(.blue)

            Text(text)
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }

    private var footerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Update window")
                .font(.headline)

            Text("Source data refreshes hourly between 6am and 5pm. Resort values reflect the latest ingested weather feed, mapped station inputs, and elevation-adjusted resort modelling.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }

    private func formattedTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        formatter.dateStyle = .none
        return formatter.string(from: date)
    }

    private func nextUpdateTime() -> String {
        let calendar = Calendar.current
        let now = Date()
        let hour = calendar.component(.hour, from: now)

        if hour >= 17 {
            return "Tomorrow 6:00"
        }

        if hour < 6 {
            return "6:00"
        }

        let nextHour = hour + 1

        var components = calendar.dateComponents([.year, .month, .day], from: now)
        components.hour = nextHour
        components.minute = 0

        let formatter = DateFormatter()
        formatter.dateFormat = "H:mm"

        if let nextDate = calendar.date(from: components) {
            return formatter.string(from: nextDate)
        }

        return "--"
    }

    @MainActor
    private func loadDashboard() async {
        isLoading = true
        errorMessage = nil

        do {
            async let dashboardTask = SupabaseManager.shared.fetchDashboard()
            async let snowfallTask = SupabaseManager.shared.fetchTopSnowfall()
            async let resortsTask = SupabaseManager.shared.fetchYamanouchiResorts()

            dashboard = try await dashboardTask
            topSnow = try await snowfallTask
            resorts = try await resortsTask
            appRefreshedAt = Date()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
