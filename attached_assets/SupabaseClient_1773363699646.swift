import Foundation
import Supabase

enum AppConfig {
    // Put these in your Info.plist:
    // SUPABASE_URL = https://xxxx.supabase.co
    // SUPABASE_ANON_KEY = your publishable / anon key
    static var supabaseURL: URL {
        guard
            let s = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
            let url = URL(string: s)
        else {
            fatalError("Missing SUPABASE_URL in Info.plist")
        }
        return url
    }

    static var supabaseAnonKey: String {
        guard let s = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String else {
            fatalError("Missing SUPABASE_ANON_KEY in Info.plist")
        }
        return s
    }
}

final class SupabaseService {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        self.client = SupabaseClient(
            supabaseURL: AppConfig.supabaseURL,
            supabaseKey: AppConfig.supabaseAnonKey
        )
    }
}
