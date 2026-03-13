// ============================================================
//  EigomenyuConfig.swift
//  Single reference file for all app settings and API keys
//
//  HOW TO USE:
//  Replace every value that says PASTE_YOUR_..._HERE
//  with your real key. Keep this file private — do not
//  share it or upload it to GitHub.
// ============================================================


// ── 1. MAKE.COM WEBHOOK URL ──────────────────────────────────
//
//  This is the address your app sends Japanese dish names to.
//  Make.com receives them and passes them to Claude AI.
//
//  HOW TO FIND IT:
//  1. Go to make.com and open your scenario
//  2. Click on the Webhook module (the first circle)
//  3. Click "Copy address to clipboard"
//  4. Paste it below, replacing the placeholder
//
enum AppConfig {
    static let makeTranslateWebhook = "PASTE_YOUR_MAKE_WEBHOOK_URL_HERE"
    // Example of what it looks like when real:
    // "https://hook.eu1.make.com/xxxxxxxxxxxxxxxxxxxxxxxxxx"
}


// ── 2. ANTHROPIC API KEY (used inside Make.com, NOT here) ────
//
//  IMPORTANT: Your Anthropic key does NOT go in the iPhone app.
//  It lives inside Make.com so it stays safe off the device.
//
//  HOW TO FIND IT:
//  1. Go to console.anthropic.com
//  2. Sign in to your account
//  3. Click "API Keys" in the left sidebar
//  4. Click "Create Key", give it a name like "Eigomenyu"
//  5. Copy it immediately — you only see it once
//  6. Go to Make.com → your scenario → the Claude/HTTP module
//  7. Paste it into the Authorization header as:
//     Bearer PASTE_YOUR_KEY_HERE
//
//  The key looks like this: sk-ant-api03-xxxxxxxxxxxxxxxx...
//  Never paste it into this Swift file.


// ── 3. TRANSLATOR SELECTION ──────────────────────────────────
//
//  This controls which translator the app uses.
//  Switch between Mock (fake, for testing) and
//  MakeWebhook (real, calls Claude AI via Make.com)
//
//  HOW TO USE:
//  Change the line below to switch modes.
//  Use MockTranslator() while testing UI.
//  Use MakeWebhookTranslator() for real translations.

enum TranslatorConfig {
    static func activeTranslator() -> Translator {

        // ✅ OPTION A — Real translations via Make.com + Claude AI
        // Use this when you are ready for live translations
        return MakeWebhookTranslator(
            webhookURL: URL(string: AppConfig.makeTranslateWebhook)!
        )

        // 🧪 OPTION B — Fake local translations for testing
        // Uncomment this line and comment out Option A to test without the internet
        // return MockTranslator()
    }
}


// ── 4. RESTAURANT SLUG (for testing) ─────────────────────────
//
//  This is the default restaurant that loads when you type
//  a name into the home screen during testing.
//  You can change this to any name you like.
//
enum TestConfig {
    static let defaultSlug = "yudanaka-sakura"
}


// ── 5. HOW THE DEEP LINK WORKS ───────────────────────────────
//
//  When a customer scans a QR code, it opens a link like:
//  onsenmenu://r/yudanaka-sakura
//
//  The app reads that link and loads the right restaurant.
//  The URL scheme "onsenmenu" is registered in:
//  Local-English-Menus-Info.plist → CFBundleURLSchemes
//
//  You do not need to change anything here unless you
//  want to rename the app's URL scheme.


// ── 6. CULTURAL TRANSLATION RULES (for Make.com prompt) ──────
//
//  When you set up Claude AI inside Make.com, paste this
//  text as the system prompt so Claude translates correctly:
//
//  ---
//  You are a menu translator for small rural Japanese restaurants.
//  Rules:
//  - Preserve authentic Japanese dish names. Do not replace them with Western equivalents.
//  - Keep English descriptions short and clear (1-2 sentences).
//  - Focus on ingredients and cooking method.
//  - Avoid awkward literal translations.
//  - Do not use marketing language.
//  - Return ONLY valid JSON in this exact format:
//  {
//    "title_en": "English dish name",
//    "description_en": "Short English description",
//    "name_romaji": "romaji spelling",
//    "name_phonetic_en": "phonetic pronunciation",
//    "confidence": 0.9,
//    "warnings": []
//  }
//  ---
