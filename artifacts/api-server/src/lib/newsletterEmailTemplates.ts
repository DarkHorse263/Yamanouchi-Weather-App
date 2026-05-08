import { brandedEmail } from "./emailTemplates.js";

// `brandedEmail` is still the canonical chrome for transactional emails
// (verification, alerts). The newsletter digest uses its own renderer
// because the wordmark + headline + palette differ from the older
// alerts chrome. Keep the import so existing call-sites elsewhere in
// this module (verification email) continue to compile.

// Brand palette pulled from the feelzlike wordmark + site nav.
const BRAND = {
  navy: "#0a2240",
  ink: "#1a3556",
  sky: "#3b82f6",
  skyDeep: "#1e5fc7",
  paper: "#f5f8fc",
  rule: "#dbe5f0",
  muted: "#5b6b80",
};

/**
 * Sample digest content used by the newsletter preview route. Real
 * digests will pull from the same Open-Meteo + radar + lifts data
 * the site uses, but this captures the structure + voice we're aiming
 * for: terse, plain-English, "feelzlike voice", country-relevant.
 */
export interface DigestSection {
  region: "snowy-mountains" | "yamanouchi";
  regionLabel: string;
  headline: string;
  feelzlikeRead: string;
  bullets: { label: string; value: string }[];
  thisWeek: string;
  ctaLabel: string;
  ctaUrl: string;
}

export function sampleDigest(baseUrl: string): DigestSection[] {
  return [
    {
      region: "snowy-mountains",
      regionLabel: "Snowy Mountains, AU",
      headline: "Cold front Friday. Worth the drive.",
      feelzlikeRead:
        "Feels like winter is finally showing up. A southerly front rolls in late Thursday and parks over the range Friday into Saturday. 20-30cm at Perisher and Thredbo by Sunday lunch is a fair bet, with lifts reopening higher up. Quiet again Monday.",
      bullets: [
        { label: "Perisher", value: "23cm forecast · -6°C · lifts open" },
        { label: "Thredbo", value: "27cm forecast · -7°C · most lifts spinning" },
        { label: "Selwyn", value: "12cm · base still thin, weekday only" },
        { label: "Charlotte's Pass", value: "21cm · road chains required Fri PM" },
      ],
      thisWeek:
        "Drive: black ice on the Alpine Way from 5am Friday. Stay: Jindabyne booked out Sat, Berridale still has rooms.",
      ctaLabel: "Open Snowy Mountains",
      ctaUrl: `${baseUrl}/snowy-mountains/`,
    },
    {
      region: "yamanouchi",
      regionLabel: "Yamanouchi, JP",
      headline: "Spring in Shibu Onsen. Snow monkeys still around.",
      feelzlikeRead:
        "Feels like the season turned overnight. Plum blossoms out in the village, monkeys still bathing daily at Jigokudani (less crowded now the snow's gone). Shiga Kogen closed for the season Sunday, but onsen-hopping weather is perfect.",
      bullets: [
        { label: "Yudanaka", value: "16°C · light drizzle · onsen weather" },
        { label: "Shibu Onsen", value: "All 9 outer baths open · book the stamp tour" },
        { label: "Jigokudani", value: "Monkey park open 8:30-17:00 daily" },
        { label: "Shiga Kogen", value: "Lifts closed · summer trails open mid-June" },
      ],
      thisWeek:
        "Eat: enzo soba pop-up at Yorozuya weekends only. Stay: kaiseki ryokan rates drop ~30% from next week.",
      ctaLabel: "Open Yamanouchi",
      ctaUrl: `${baseUrl}/yamanouchi/`,
    },
  ];
}

function renderDigestSection(s: DigestSection): string {
  const bullets = s.bullets
    .map(
      (b) =>
        `<tr>
          <td style="padding:7px 0;font-size:14px;color:${BRAND.navy};font-weight:600;width:40%;vertical-align:top;">${b.label}</td>
          <td style="padding:7px 0;font-size:14px;color:${BRAND.ink};vertical-align:top;">${b.value}</td>
        </tr>`,
    )
    .join("");
  return `
    <div class="digest-section keep-together" style="margin:0 0 32px 0;padding:0 0 32px 0;border-bottom:1px solid ${BRAND.rule};page-break-inside:avoid;break-inside:avoid;">
      <div class="section-eyebrow" style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;margin-bottom:8px;">${s.regionLabel}</div>
      <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${BRAND.navy};margin:0 0 12px 0;line-height:1.25;">${s.headline}</h2>
      <p style="font-size:15px;line-height:1.65;color:${BRAND.ink};margin:0 0 18px 0;">${s.feelzlikeRead}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:14px 0 18px 0;background:${BRAND.paper};border-radius:10px;">
        <tr><td style="padding:10px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${bullets}
          </table>
        </td></tr>
      </table>
      <p style="font-size:13px;line-height:1.6;color:${BRAND.muted};margin:0 0 16px 0;">${s.thisWeek}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 0 0;">
        <tr><td style="border-radius:6px;background:${BRAND.sky};">
          <a href="${s.ctaUrl}" style="display:inline-block;padding:11px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.02em;">${s.ctaLabel} &rarr;</a>
        </td></tr>
      </table>
    </div>`;
}

/**
 * Build the full branded digest as a self-contained HTML document. We
 * deliberately don't reuse `brandedEmail` here because the newsletter
 * needs the lowercase feelzlike wordmark logo, the new "What it
 * feelzlike in the mountains" headline, and the brand palette from
 * the site (not the older alerts-email navy chrome).
 *
 * `logoUrl` should be an absolute URL the recipient's mail client can
 * fetch. The feelzlike SPA serves the logo at /branding/logo-full.png,
 * which the api-server proxies in production and which Vite serves in
 * dev (same origin via the workspace proxy).
 */
export function newsletterDigestEmail(opts: {
  baseUrl: string;
  unsubscribeUrl: string;
  manageUrl?: string;
  sections?: DigestSection[];
  dateLabel?: string;
}): { subject: string; html: string; text: string } {
  const sections = opts.sections ?? sampleDigest(opts.baseUrl);
  const dateLabel = opts.dateLabel ?? "This fortnight";
  const logoUrl = `${opts.baseUrl}/branding/logo-full.png`;
  const headline = "What it feelzlike in the mountains";

  const body = sections.map(renderDigestSection).join("");

  const footerHtml = `You're getting this because you subscribed to the feelzlike newsletter.<br>
    <a href="${opts.unsubscribeUrl}" style="color:${BRAND.skyDeep};text-decoration:underline;">Unsubscribe</a>${opts.manageUrl ? ` &middot; <a href="${opts.manageUrl}" style="color:${BRAND.skyDeep};text-decoration:underline;">Manage preferences</a>` : ""}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${headline}</title>
<style>
  @page { size: A4; margin: 14mm 10mm 16mm 10mm; }
  .keep-together { page-break-inside: avoid; break-inside: avoid; }
  .section-eyebrow, h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
  .digest-section { page-break-inside: avoid; break-inside: avoid; }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.navy};">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;">${sections[0]?.headline ?? "Your mountain read."}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.paper};padding:36px 0 28px 0;">
    <tr><td align="center" style="padding:0 0 24px 0;">
      <img src="${logoUrl}" alt="feelzlike" width="280" style="display:block;margin:0 auto 8px auto;width:280px;max-width:80%;height:auto;border:0;outline:none;text-decoration:none;">
      <div style="font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.2em;margin-top:6px;">Mountain weather, told straight.</div>
    </td></tr>
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(10,34,64,0.07);">

        <!-- Hero -->
        <tr><td style="padding:36px 36px 8px 36px;">
          <div style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;margin-bottom:10px;">${dateLabel}</div>
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;color:${BRAND.navy};margin:0 0 6px 0;line-height:1.2;letter-spacing:-0.005em;">${headline}</h1>
          <div style="height:3px;width:48px;background:${BRAND.sky};border-radius:2px;margin:14px 0 0 0;"></div>
        </td></tr>

        <!-- Sections -->
        <tr><td style="padding:28px 36px 8px 36px;">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 36px 24px 36px;font-size:12px;color:${BRAND.muted};line-height:1.55;background:${BRAND.paper};">
          ${footerHtml}
        </td></tr>
      </table>
      <div style="font-size:11px;color:${BRAND.muted};margin-top:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        feelzlike &middot; Snowy Mountains, AU &middot; Yamanouchi, JP
      </div>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `feelzlike. ${headline}.\n${dateLabel}.\n\n` +
    sections
      .map(
        (s) =>
          `${s.regionLabel.toUpperCase()}\n${s.headline}\n\n${s.feelzlikeRead}\n\n` +
          s.bullets.map((b) => `  ${b.label}: ${b.value}`).join("\n") +
          `\n\n${s.thisWeek}\n\n${s.ctaLabel}: ${s.ctaUrl}\n`,
      )
      .join("\n---\n\n") +
    `\nUnsubscribe: ${opts.unsubscribeUrl}\n`;

  return { subject: `feelzlike: ${headline.toLowerCase()}`, html, text };
}

// ───────────────────────────────────────────────────────────────────────────
// Snowy Mountains - Winter season outlook
// ───────────────────────────────────────────────────────────────────────────
//
// A different shape from the fortnightly digest: this is a one-off
// season preview sent before opening weekend. Whole-of-season summary
// up top, July deep-dive (the peak month for Snowy), then a mountain-
// by-mountain card and a "plan ahead" footer block.
//
// Same chrome (header, palette, footer) so it reads as the same brand.

export interface SeasonMonthBlock {
  month: string; // "June"
  label: string; // "Opening run"
  body: string; // 1-2 sentences
}

export interface SeasonMountainBlock {
  name: string; // "Perisher"
  opens: string; // "7 June"
  baseTarget: string; // "60-90cm by mid-July"
  note: string; // 1 sentence colour
}

export interface JulyWeekBlock {
  span: string; // "Mon 6 to Sun 12 Jul"
  headline: string; // "School holidays, biggest week of the year"
  read: string; // 2-3 sentences
  bullets: { label: string; value: string }[];
}

export interface SeasonSource {
  label: string; // "Bureau of Meteorology long-range outlook"
  informs: string; // "Temperature and rainfall trend for Jun-Sep"
  url: string;
}

export interface SeasonOutlook {
  regionLabel: string; // "Snowy Mountains, AU"
  seasonLabel: string; // "Winter 2026"
  headline: string; // hero headline
  intro: string; // 2-3 sentence stand-first
  months: SeasonMonthBlock[]; // June to September
  julyHeadline: string;
  julyRead: string; // overall July paragraph
  julyWeeks: JulyWeekBlock[]; // 4 weeks of July
  mountains: SeasonMountainBlock[];
  methodologyHeadline: string;
  methodologyRead: string; // 2-3 sentence narrative on how the outlook is built
  sources: SeasonSource[];
  planAhead: { label: string; value: string }[];
  ctaLabel: string;
  ctaUrl: string;
}

export function sampleSnowySeasonOutlook(baseUrl: string): SeasonOutlook {
  return {
    regionLabel: "Snowy Mountains, AU",
    seasonLabel: "Winter 2026 outlook",
    headline: "What it feelzlike for winter in the Snowies.",
    intro:
      "It is shaping up as a proper winter. After two thin years, the long-range models are pointing to a colder, wetter season across the Main Range, with the storm track sitting further north than usual. Opening weekend looks more ceremonial than skiable, but a run of southerly fronts from late June should put the season on its feet. By the time school holidays start, this should feel like the winter the Snowies has been waiting for.",
    months: [
      {
        month: "June",
        label: "The slow start",
        body: "Opening weekend on 7 June will be cold and clear, with cover thin and mostly machine-made. The first real fronts arrive mid-month, dusting the high country above 1,500m. Patient skiers only.",
      },
      {
        month: "July",
        label: "When it lands",
        body: "School holidays bookend the busiest fortnight of the year, and the modelling is on side. Three to four cold fronts are likely, with bases climbing to 90-120cm by month's end. Book early or stay flexible.",
      },
      {
        month: "August",
        label: "The deep month",
        body: "Historically the heaviest snow falls of the year. Long-range guidance shows storm cycles every five to seven days, with crowds well off their July peak. The connoisseur's month.",
      },
      {
        month: "September",
        label: "Spring lap",
        body: "Warm afternoons, soft corn, long runs in T-shirts. Lower elevations turn patchy by mid-month, but the high country usually holds until closing weekend on 4-5 October.",
      },
    ],
    julyHeadline: "July: when the Snowies stops pretending.",
    julyRead:
      "If only one month of this winter goes to plan, let it be this one. Current modelling has three to four cold fronts working their way across the range, with the biggest stretch landing in week two. Resort bases should sit between 70 and 110cm for most of the month, and the village of Jindabyne is already 80% booked for the week of 6 July. The pattern matters because, in good Julys, the Snowies skis as well as anywhere in the southern hemisphere. In bad ones, it doesn't ski at all. This one looks like the former.",
    julyWeeks: [
      {
        span: "Wed 1 to Sun 5 Jul",
        headline: "The calm before.",
        read: "A high parks itself over the range and refuses to budge. Mornings start at -8°C at 1,800m and warm to bluebird, with snow-making humming through the night. The terrain is limited but the conditions are flattering, which is to say: an excellent week to put the kids in lessons or relearn what edges feel like.",
        bullets: [
          { label: "New snow", value: "5-10cm machine, no natural" },
          { label: "Crowds", value: "Light, pre-holidays" },
          { label: "Best for", value: "Lessons, groomers, families" },
        ],
      },
      {
        span: "Mon 6 to Sun 12 Jul",
        headline: "The week everything turns.",
        read: "School holidays open with a roar. The first serious front of the season rolls in late Thursday and parks over the range into Friday, dropping 25 to 40cm across Perisher and Thredbo before clearing for what should be a Saturday powder day for the ages. The catch: every other skier in the country has the same plan. Book parking now, not on the morning.",
        bullets: [
          { label: "New snow", value: "30-45cm Thu to Fri" },
          { label: "Crowds", value: "Heavy, school holidays" },
          { label: "Best for", value: "Powder Saturday, all-mountain" },
        ],
      },
      {
        span: "Mon 13 to Sun 19 Jul",
        headline: "The locals' favourite.",
        read: "A second front sweeps through Tuesday into Wednesday, laying down another 15 to 25cm on top of the previous week's haul. Cold air sticks around. Midweek is the sweet spot: every lift open, fresh snow underfoot, and the school-holiday throng thinning enough that lift queues become bearable again.",
        bullets: [
          { label: "New snow", value: "20-30cm Tue to Wed" },
          { label: "Crowds", value: "Heavy weekend, easing midweek" },
          { label: "Best for", value: "Backcountry tours, all-mountain" },
        ],
      },
      {
        span: "Mon 20 to Fri 31 Jul",
        headline: "The quiet finish.",
        read: "School holidays end and the resorts breathe out. Long-range models point to two more fronts, around 22-23 July and again on 28-29 July, which should push bases to their seasonal peak of 110 to 130cm. Locals call this the best value fortnight of the year: full snow, half the people, and warmer afternoons that make it easy to stay out until the lifts close.",
        bullets: [
          { label: "New snow", value: "20-35cm across the fortnight" },
          { label: "Crowds", value: "Quiet weekdays" },
          { label: "Best for", value: "Value, fresh tracks, longer days" },
        ],
      },
    ],
    mountains: [
      {
        name: "Perisher",
        opens: "Sat 7 Jun",
        baseTarget: "70-110cm by late July",
        note: "The biggest resort in the country and the easiest place to lose a friend for an afternoon. Front Valley and Smiggins open first; Blue Cow and Guthega follow once the cover holds.",
      },
      {
        name: "Thredbo",
        opens: "Sat 7 Jun",
        baseTarget: "75-115cm by late July",
        note: "Australia's highest lifted terrain, and the only resort here that consistently offers true top-to-bottom skiing in early July. Steeper, longer, and a touch wilder than Perisher.",
      },
      {
        name: "Selwyn",
        opens: "Sat 14 Jun (planned)",
        baseTarget: "30-50cm by late July",
        note: "Smaller, lower, and built for families. The post-fire rebuild brought in serious snow-making, but it remains a weekday-only proposition outside the holidays.",
      },
      {
        name: "Charlotte's Pass",
        opens: "Sat 14 Jun",
        baseTarget: "60-100cm by late July",
        note: "The highest village in Australia, reached by snow-cat from Perisher Valley. Quiet, slightly old-world, and home to some of the most reliable snow in the range.",
      },
    ],
    methodologyHeadline: "How we built this read.",
    methodologyRead:
      "This outlook blends the Bureau of Meteorology's official seasonal guidance with snowpack data from Snowy Hydro, the resorts' own opening plans, and our own pattern-matching against the last fifteen Snowies winters. We do not run our own climate model. What we do is read the same public sources every serious snow watcher reads, then write the result in plain English. Where a number is a target, not a measurement, we say so. Where the modelling is uncertain, we say that too. Treat the week-by-week breakdown as a probable shape of the season, not a daily forecast. For that, check the alerts page in the week of travel.",
    sources: [
      {
        label: "Bureau of Meteorology long-range outlook",
        informs: "Temperature and rainfall trend across the Australian Alps for Jun-Sep",
        url: "http://www.bom.gov.au/climate/outlooks/",
      },
      {
        label: "Snowy Hydro snow depth records",
        informs: "Historical baseline for Spencers Creek snow depth, used to gauge whether the season is tracking above or below average",
        url: "https://www.snowyhydro.com.au/snowy-scheme/water-and-energy/snow-data/",
      },
      {
        label: "Perisher and Thredbo snow reports",
        informs: "Stated opening dates, lift status, snow-making capacity",
        url: "https://www.perisher.com.au/snow-report",
      },
      {
        label: "Mountainwatch model guidance",
        informs: "Short and medium-range storm tracking for the Main Range",
        url: "https://www.mountainwatch.com/snow-forecasts/australia/",
      },
      {
        label: "Transport for NSW alpine road conditions",
        informs: "Chain rules, road closures, and overnight ice warnings on the Alpine Way and Kosciuszko Road",
        url: "https://www.livetraffic.com/",
      },
      {
        label: "Destination NSW accommodation availability",
        informs: "Aggregate room availability for Jindabyne, Thredbo Village and Charlotte's Pass",
        url: "https://www.snowymountains.com.au/",
      },
    ],
    planAhead: [
      { label: "Lift passes", value: "Multi-day passes are cheaper before 30 June. After that, prices step up sharply through the holidays." },
      { label: "Accommodation", value: "Jindabyne and Thredbo village are already 80% booked for the week of 6 July. Berridale and Cooma still have rooms." },
      { label: "Driving", value: "Carry chains from 1 June. The Alpine Way closes overnight when temperatures crash, and the road from Berridale ices up before sunrise." },
      { label: "Backcountry", value: "Avalanche risk briefings begin on 1 July on the alerts page. If you're heading off-piste, read them." },
    ],
    ctaLabel: "Open Snowy Mountains",
    ctaUrl: `${baseUrl}/snowy-mountains/`,
  };
}

function renderMonthCard(m: SeasonMonthBlock): string {
  return `
    <td valign="top" width="25%" style="padding:0 6px;page-break-inside:avoid;break-inside:avoid;">
      <div style="background:${BRAND.paper};border-radius:10px;padding:14px 14px;height:100%;page-break-inside:avoid;break-inside:avoid;">
        <div style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;">${m.month}</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${BRAND.navy};font-weight:700;margin-top:4px;">${m.label}</div>
        <div style="font-size:13px;color:${BRAND.ink};line-height:1.55;margin-top:8px;">${m.body}</div>
      </div>
    </td>`;
}

function renderJulyWeek(w: JulyWeekBlock): string {
  const bullets = w.bullets
    .map(
      (b) =>
        `<tr>
          <td style="padding:5px 0;font-size:13px;color:${BRAND.navy};font-weight:600;width:38%;vertical-align:top;">${b.label}</td>
          <td style="padding:5px 0;font-size:13px;color:${BRAND.ink};vertical-align:top;">${b.value}</td>
        </tr>`,
    )
    .join("");
  return `
    <div class="keep-together" style="margin:0 0 18px 0;padding:16px 18px;background:#ffffff;border:1px solid ${BRAND.rule};border-radius:10px;page-break-inside:avoid;break-inside:avoid;">
      <div style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.14em;font-weight:700;">${w.span}</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:${BRAND.navy};font-weight:700;margin-top:4px;line-height:1.3;">${w.headline}</div>
      <p style="font-size:14px;line-height:1.6;color:${BRAND.ink};margin:8px 0 10px 0;">${w.read}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:6px;">
        ${bullets}
      </table>
    </div>`;
}

function renderSourceRow(s: SeasonSource): string {
  return `
    <tr class="keep-together" style="page-break-inside:avoid;break-inside:avoid;">
      <td style="padding:10px 0;border-top:1px solid ${BRAND.rule};vertical-align:top;width:42%;page-break-inside:avoid;break-inside:avoid;">
        <a href="${s.url}" style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${BRAND.skyDeep};font-weight:700;text-decoration:none;">${s.label}</a>
      </td>
      <td style="padding:10px 0 10px 14px;border-top:1px solid ${BRAND.rule};vertical-align:top;font-size:13px;color:${BRAND.ink};line-height:1.55;page-break-inside:avoid;break-inside:avoid;">
        ${s.informs}
      </td>
    </tr>`;
}

function renderMountainRow(m: SeasonMountainBlock): string {
  return `
    <tr class="keep-together" style="page-break-inside:avoid;break-inside:avoid;">
      <td style="padding:12px 0;border-top:1px solid ${BRAND.rule};vertical-align:top;width:30%;page-break-inside:avoid;break-inside:avoid;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${BRAND.navy};font-weight:700;">${m.name}</div>
        <div style="font-size:12px;color:${BRAND.muted};margin-top:2px;">Opens ${m.opens}</div>
      </td>
      <td style="padding:12px 0 12px 14px;border-top:1px solid ${BRAND.rule};vertical-align:top;page-break-inside:avoid;break-inside:avoid;">
        <div style="font-size:13px;color:${BRAND.skyDeep};font-weight:700;">${m.baseTarget}</div>
        <div style="font-size:13px;color:${BRAND.ink};line-height:1.55;margin-top:4px;">${m.note}</div>
      </td>
    </tr>`;
}

export function snowySeasonOutlookEmail(opts: {
  baseUrl: string;
  unsubscribeUrl: string;
  manageUrl?: string;
  outlook?: SeasonOutlook;
}): { subject: string; html: string; text: string } {
  const o = opts.outlook ?? sampleSnowySeasonOutlook(opts.baseUrl);
  const logoUrl = `${opts.baseUrl}/branding/logo-full.png`;

  const monthsRow = o.months.map(renderMonthCard).join("");
  const julyWeeks = o.julyWeeks.map(renderJulyWeek).join("");
  const mountainRows = o.mountains.map(renderMountainRow).join("");
  const sourceRows = o.sources.map(renderSourceRow).join("");
  const planRows = o.planAhead
    .map(
      (p) =>
        `<tr>
          <td style="padding:7px 0;font-size:14px;color:${BRAND.navy};font-weight:600;width:38%;vertical-align:top;">${p.label}</td>
          <td style="padding:7px 0;font-size:14px;color:${BRAND.ink};vertical-align:top;">${p.value}</td>
        </tr>`,
    )
    .join("");

  const footerHtml = `You're getting this because you subscribed to the feelzlike newsletter.<br>
    <a href="${opts.unsubscribeUrl}" style="color:${BRAND.skyDeep};text-decoration:underline;">Unsubscribe</a>${opts.manageUrl ? ` &middot; <a href="${opts.manageUrl}" style="color:${BRAND.skyDeep};text-decoration:underline;">Manage preferences</a>` : ""}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${o.headline}</title>
<style>
  @page { size: A4; margin: 14mm 10mm 16mm 10mm; }
  /* Stop sections breaking across pages. Inline styles cover most
     clients; this @media print block ensures Chromium honours the
     same rules in PDF mode even where inline cascade is overridden. */
  .keep-together { page-break-inside: avoid; break-inside: avoid; }
  .section-eyebrow, h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
  .section { page-break-inside: avoid; break-inside: avoid; }
  /* Allow the long July spotlight section itself to break, but each
     week card inside it stays whole. */
  .section--july { page-break-inside: auto; break-inside: auto; }
  /* Keep the eyebrow + first paragraph with what follows. */
  .lede { page-break-after: avoid; break-after: avoid; }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.navy};">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;">${o.intro}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.paper};padding:36px 0 28px 0;">
    <tr><td align="center" style="padding:0 0 24px 0;" class="keep-together">
      <img src="${logoUrl}" alt="feelzlike" width="300" style="display:block;margin:0 auto 8px auto;width:300px;max-width:80%;height:auto;border:0;outline:none;text-decoration:none;">
      <div style="font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.2em;margin-top:6px;">Mountain weather, told straight.</div>
    </td></tr>
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(10,34,64,0.07);">

        <tr><td style="padding:36px 36px 12px 36px;" class="section keep-together">
          <div class="section-eyebrow" style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;margin-bottom:10px;">${o.regionLabel} &middot; ${o.seasonLabel}</div>
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;color:${BRAND.navy};margin:0 0 6px 0;line-height:1.2;letter-spacing:-0.005em;">${o.headline}</h1>
          <p style="font-size:15px;line-height:1.65;color:${BRAND.ink};margin:14px 0 0 0;">${o.intro}</p>
          <div style="height:3px;width:48px;background:${BRAND.sky};border-radius:2px;margin:18px 0 0 0;"></div>
        </td></tr>

        <tr><td style="padding:24px 30px 8px 30px;" class="section keep-together">
          <div class="section-eyebrow" style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;padding:0 6px 10px 6px;">The season at a glance</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>${monthsRow}</tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 36px 8px 36px;" class="section--july">
          <div class="lede keep-together">
            <div class="section-eyebrow" style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;margin-bottom:8px;">July spotlight</div>
            <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${BRAND.navy};margin:0 0 10px 0;line-height:1.25;">${o.julyHeadline}</h2>
            <p style="font-size:15px;line-height:1.65;color:${BRAND.ink};margin:0 0 18px 0;">${o.julyRead}</p>
          </div>
          ${julyWeeks}
        </td></tr>

        <tr><td style="padding:14px 36px 8px 36px;" class="section keep-together">
          <div class="section-eyebrow" style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;margin-bottom:8px;">Mountain by mountain</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${mountainRows}
          </table>
        </td></tr>

        <tr><td style="padding:28px 36px 8px 36px;" class="section">
          <div class="lede keep-together">
            <div class="section-eyebrow" style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;margin-bottom:8px;">How we forecast</div>
            <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${BRAND.navy};margin:0 0 10px 0;line-height:1.25;">${o.methodologyHeadline}</h2>
            <p style="font-size:14px;line-height:1.65;color:${BRAND.ink};margin:0 0 14px 0;">${o.methodologyRead}</p>
          </div>
          <div class="keep-together" style="page-break-inside:avoid;break-inside:avoid;">
            <div class="section-eyebrow" style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;margin:6px 0 4px 0;">Sources</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              ${sourceRows}
            </table>
            <p style="font-size:11px;color:${BRAND.muted};line-height:1.5;margin:12px 0 0 0;font-style:italic;">Numbers in this preview are sample figures used to illustrate format. Production sends will carry the latest values from the sources above.</p>
          </div>
        </td></tr>

        <tr><td style="padding:28px 36px 8px 36px;" class="section keep-together">
          <div class="section-eyebrow" style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;margin-bottom:8px;">Plan ahead</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.paper};border-radius:10px;">
            <tr><td style="padding:10px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${planRows}
              </table>
            </td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 0 0;">
            <tr><td style="border-radius:6px;background:${BRAND.sky};">
              <a href="${o.ctaUrl}" style="display:inline-block;padding:12px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.02em;">${o.ctaLabel} &rarr;</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 36px 28px 36px;font-size:12px;color:${BRAND.muted};line-height:1.55;background:${BRAND.paper};margin-top:24px;">
          ${footerHtml}
        </td></tr>
      </table>
      <div style="font-size:11px;color:${BRAND.muted};margin-top:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        feelzlike &middot; Snowy Mountains, AU &middot; Yamanouchi, JP
      </div>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `feelzlike. ${o.regionLabel}. ${o.seasonLabel}.\n${o.headline}\n\n${o.intro}\n\n` +
    `THE SEASON AT A GLANCE\n` +
    o.months.map((m) => `  ${m.month} (${m.label}): ${m.body}`).join("\n") +
    `\n\nJULY SPOTLIGHT\n${o.julyHeadline}\n${o.julyRead}\n\n` +
    o.julyWeeks
      .map(
        (w) =>
          `  ${w.span}\n  ${w.headline}\n  ${w.read}\n` +
          w.bullets.map((b) => `    ${b.label}: ${b.value}`).join("\n"),
      )
      .join("\n\n") +
    `\n\nMOUNTAIN BY MOUNTAIN\n` +
    o.mountains
      .map((m) => `  ${m.name} (opens ${m.opens})\n    ${m.baseTarget}\n    ${m.note}`)
      .join("\n") +
    `\n\nHOW WE FORECAST\n${o.methodologyHeadline}\n${o.methodologyRead}\n\nSOURCES\n` +
    o.sources.map((s) => `  ${s.label}\n    ${s.informs}\n    ${s.url}`).join("\n") +
    `\n\nNote: numbers in this preview are sample figures used to illustrate format. Production sends will carry the latest values from the sources above.\n\nPLAN AHEAD\n` +
    o.planAhead.map((p) => `  ${p.label}: ${p.value}`).join("\n") +
    `\n\n${o.ctaLabel}: ${o.ctaUrl}\n\nUnsubscribe: ${opts.unsubscribeUrl}\n`;

  return {
    subject: `feelzlike: ${o.seasonLabel.toLowerCase()} for the snowies`,
    html,
    text,
  };
}

/**
 * Newsletter email templates. Re-uses the shared `brandedEmail` chrome
 * (navy header, sky-blue CTA, inline styles) so newsletter emails look
 * the same as alert emails — same brand, different cadence and content.
 */

export function newsletterVerificationEmail(verifyUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: "Confirm your feelzlike newsletter",
    html: brandedEmail({
      preheader: "One click to confirm. We won't email you until you do.",
      heading: "Confirm your subscription",
      bodyHtml: `<p>Thanks for signing up to the feelzlike newsletter.</p>
        <p>Click below to confirm. You'll get a short, plain-English read on what the next stretch of mountain weather will actually feel like. No hype, no daily noise.</p>
        <p style="font-size:13px;color:#64748b;">If you didn't sign up, just ignore this email. Nothing happens until you click.</p>`,
      ctaLabel: "Confirm subscription",
      ctaUrl: verifyUrl,
      footerHtml: `If the button doesn't work, paste this URL into your browser:<br><span style="word-break:break-all;color:#3b82f6;">${verifyUrl}</span>`,
    }),
    text: `Confirm your feelzlike newsletter\n\nClick to confirm:\n${verifyUrl}\n\nIf you didn't sign up, ignore this email.`,
  };
}
