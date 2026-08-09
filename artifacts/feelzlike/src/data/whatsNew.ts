/**
 * whatsNew · hand-written release notes for the in-app "what's new" surface.
 *
 * How to update (owner or agent, at each publish):
 * - prepend a new entry to the TOP of the list · newest first
 * - id must be unique and sortable · use the publish date as YYYY-MM-DD,
 *   suffix -b, -c if two entries share a day
 * - keep it to plain language, brand voice: lowercase, middot ·,
 *   no em dashes, no emojis
 * - keep the list short · trim entries older than ~5 so the note stays small
 *
 * The newest entry's id doubles as the "have you seen this yet" marker:
 * WhatsNewNote on the home page compares it against the id stored in
 * localStorage and only re-appears when a genuinely new entry lands.
 * No CMS, no backend · this file is the single source of truth.
 */

export interface WhatsNewEntry {
  /** unique + sortable · publish date as YYYY-MM-DD (suffix -b if needed) */
  id: string;
  /** short display date, lowercase · e.g. "aug 2026" */
  date: string;
  /** one-line plain-language note · english */
  text: string;
  /** one-line plain-language note · japanese */
  textJa: string;
}

/** newest first · WhatsNewNote keys off WHATS_NEW[0].id */
export const WHATS_NEW: WhatsNewEntry[] = [
  {
    id: "2026-08-03",
    date: "aug 2026",
    text: "this what's new list · a small note on the home page tells you when something changes, and the full list lives here",
    textJa: "この「最新情報」リスト · 何かが変わるとホーム画面に小さなお知らせが出て、詳しい一覧はここで見られます",
  },
  {
    id: "2026-08-01",
    date: "aug 2026",
    text: "a fresh bluebird look · brighter blue across the whole app, easier to read in the sun",
    textJa: "新しいブルーバードデザイン · アプリ全体がより明るいブルーになり、日差しの下でも読みやすくなりました",
  },
  {
    id: "2026-07-28",
    date: "jul 2026",
    text: "new about page · how the app works, how to use it and where the numbers come from",
    textJa: "新しい about ページ · アプリの仕組み、使い方、数字の出どころをまとめました",
  },
  {
    id: "2026-07-20",
    date: "jul 2026",
    text: "coverage map upgrades · every town and mountain pin now opens straight to its page",
    textJa: "カバレッジマップを強化 · 町や山のピンをタップすると、そのページに直接移動できます",
  },
  {
    id: "2026-07-15",
    date: "jul 2026",
    text: "back links everywhere · one tap on the home page returns you to your last town",
    textJa: "戻るリンクを追加 · ホーム画面からワンタップで最後に見ていた町に戻れます",
  },
];

/** id of the newest entry · used to decide whether the home-page note shows */
export const LATEST_WHATS_NEW_ID = WHATS_NEW[0]?.id ?? "";
