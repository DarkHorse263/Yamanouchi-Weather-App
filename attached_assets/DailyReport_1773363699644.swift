import Foundation

struct ResortRef: Codable {
    let name: String?
}

struct DailyReport: Identifiable, Codable {
    let id: UUID

    let region_id: UUID?
    let resort_id: UUID?
    let report_date: String?

    let headline: String?
    let lift_wind_risk: String?

    let temp_now_c: Double?
    let wind_now_ms: Double?
    let snow_24h_cm: Int?

    let generated_at: String?

    let resorts: ResortRef?

    var resortName: String {
        resorts?.name ?? "Resort"
    }
}
