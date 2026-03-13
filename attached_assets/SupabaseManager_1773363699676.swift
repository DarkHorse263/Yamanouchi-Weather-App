import Foundation
import Supabase
import PostgREST

final class SupabaseManager {
    static let shared = SupabaseManager()

    private let client: SupabaseClient
    private let decoder: JSONDecoder

    private init() {
        let url = URL(string: "https://rbeyhfotgpsigjpptcnl.supabase.co")!
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZXloZm90Z3BzaWdqcHB0Y25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTY4ODUsImV4cCI6MjA4ODA5Mjg4NX0.N3T4KQ49tMWWw1_rakgpBPwUOX84KQwXMWxC6bsrSZg"

        self.client = SupabaseClient(
            supabaseURL: url,
            supabaseKey: anonKey
        )

        let jsonDecoder = JSONDecoder()
        jsonDecoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder = jsonDecoder
    }

    func fetchDashboard() async throws -> DashboardFeed {
        let response = try await client
            .from("app_home_focus_today")
            .select()
            .limit(1)
            .single()
            .execute()

        return try decoder.decode(DashboardFeed.self, from: response.data)
    }

    func fetchStormTracker() async throws -> [StormTrackerRow] {
        let response = try await client
            .from("yamanouchi_storms_today")
            .select()
            .order("storm_rank", ascending: true)
            .execute()

        return try decoder.decode([StormTrackerRow].self, from: response.data)
    }

    func fetchPowderAlerts() async throws -> [PowderAlertRow] {
        let response = try await client
            .from("powder_alerts_today")
            .select()
            .order("created_at", ascending: false)
            .execute()

        return try decoder.decode([PowderAlertRow].self, from: response.data)
    }

    func fetchYamanouchiResorts() async throws -> [ResortForecastRow] {
        let response = try await client
            .from("yamanouchi_resorts_today")
            .select()
            .execute()

        return try decoder.decode([ResortForecastRow].self, from: response.data)
    }

    func fetchTopSnowfall() async throws -> [TopSnowfallRow] {
        let response = try await client
            .from("top_snowfall_today")
            .select()
            .order("snow_rank", ascending: true)
            .execute()

        return try decoder.decode([TopSnowfallRow].self, from: response.data)
    }

    func fetchPremiumCards() async throws -> [PremiumHomeCard] {
        return []
    }
}
