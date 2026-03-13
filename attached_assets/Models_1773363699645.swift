import Foundation

struct DashboardFeed: Decodable {
    let reportDate: String?
    let featuredRegionName: String?
    let resortsCount: Int?
    let avgTempC: Double?
    let avgWindKmh: Double?
    let maxSnow24hCm: Int?
    let maxSnowTomorrowCm: Int?
    let explanation: String?
    let topAlertHeadline: String?
    let topAlertMessage: String?
    let topAlertResort: String?
    let topAlertCluster: String?
    let topAlertType: String?
    let topAlertProbability: Double?
    let topAlertExpectedSnowCm: Double?
}

struct PremiumHomeCard: Decodable, Identifiable {
    let premiumRank: Int
    let name: String
    let cluster: String
    let powderQualityScore: Double?
    let opportunityScore: Double?
    let expectedSnowTomorrowCm: Int?
    let snow24hCm: Int?
    let powderType: String?

    var id: Int { premiumRank }
}

struct StormTrackerRow: Decodable, Identifiable {
    let outlookDate: String?
    let cluster: String
    let snow24hCm: Int?
    let snow48hCm: Int?
    let snow72hCm: Int?
    let stormLevel: String?
    let headline: String?
    let stormRank: Int?

    var id: String { cluster }
}

struct PowderAlertRow: Decodable, Identifiable {
    let id: String
    let reportDate: String?
    let resortId: String?
    let name: String?
    let cluster: String?
    let alertType: String?
    let headline: String?
    let message: String?
    let powderIndex: Double?
    let powderProbability: Double?
    let expectedSnowCm: Double?
    let createdAt: String?
}

struct ResortForecastRow: Decodable, Identifiable {
    let resortId: String
    let name: String
    let cluster: String?
    let region: String?
    let prefecture: String?
    let slug: String?
    let reportDate: String?
    let snow24hCm: Int?
    let snowDepthCm: Int?
    let tempNowC: Double?
    let windKmh: Double?
    let expectedSnowTomorrowCm: Int?
    let source: String?
    let lastUpdatedAt: String?
    let latitude: Double?
    let longitude: Double?
    let elevationM: Int?
    let stationName: String?
    let stationElevationM: Int?

    var id: String { resortId }
}

struct TopSnowfallRow: Decodable, Identifiable {
    let name: String
    let cluster: String?
    let snow24hCm: Int?
    let snowDepthCm: Int?
    let tempNowC: Double?
    let windKmh: Double?
    let snowRank: Int

    var id: Int { snowRank }
}
