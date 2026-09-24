export const BILLING_PLANS = {
  monthly: { amount: 599, interval: "month" },
  annual: { amount: 6000, interval: "year" },
} as const;
export type BillingPlan = keyof typeof BILLING_PLANS;

export const BILLING_CURRENCIES = {
  AUD: { currency: "aud", taxBehavior: "inclusive", monthlyEnv: "STRIPE_AUD_MONTHLY_PRICE_ID", annualEnv: "STRIPE_AUD_ANNUAL_PRICE_ID" },
  USD: { currency: "usd", taxBehavior: "exclusive", monthlyEnv: "STRIPE_USD_MONTHLY_PRICE_ID", annualEnv: "STRIPE_USD_ANNUAL_PRICE_ID" },
  EUR: { currency: "eur", taxBehavior: "inclusive", monthlyEnv: "STRIPE_EUR_MONTHLY_PRICE_ID", annualEnv: "STRIPE_EUR_ANNUAL_PRICE_ID" },
} as const;
export type BillingCurrency = keyof typeof BILLING_CURRENCIES;

const EURO_COUNTRIES = new Set("AT BE BG HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES".split(" "));
const ISO_COUNTRIES = new Set(("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW").split(" "));

export function isBillingCountry(value: unknown): value is string {
  return typeof value === "string" && ISO_COUNTRIES.has(value);
}

export function currencyForCountry(country: string): BillingCurrency {
  if (country === "US") return "USD";
  if (EURO_COUNTRIES.has(country)) return "EUR";
  return "AUD";
}

export function parseBillingSelection(body: unknown): { plan: BillingPlan; billingCountry: string } {
  if (!body || typeof body !== "object" || Object.keys(body).length !== 2 ||
      !("plan" in body) || !("billingCountry" in body) ||
      (body.plan !== "monthly" && body.plan !== "annual") || !isBillingCountry(body.billingCountry)) {
    throw new Error("INVALID_BILLING_SELECTION");
  }
  return { plan: body.plan, billingCountry: body.billingCountry };
}

function coreBillingConfig(env: NodeJS.ProcessEnv = process.env) {
  const origin = env.BILLING_ORIGIN;
  if (!origin || !/^https:\/\/[^/]+$/.test(origin) ||
      !["test", "live"].includes(env.STRIPE_MODE ?? "") ||
      !env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")) {
    throw new Error("BILLING_NOT_CONFIGURED");
  }
  return { origin, live: env.STRIPE_MODE === "live", webhookSecret: env.STRIPE_WEBHOOK_SECRET };
}

export function priceEnv(currency: BillingCurrency, plan: BillingPlan): string {
  return BILLING_CURRENCIES[currency][plan === "monthly" ? "monthlyEnv" : "annualEnv"];
}

export function regionalPriceIds(env: NodeJS.ProcessEnv = process.env): string[] {
  return (Object.keys(BILLING_CURRENCIES) as BillingCurrency[])
    .flatMap(currency => (Object.keys(BILLING_PLANS) as BillingPlan[]).map(plan => env[priceEnv(currency, plan)]))
    .filter((id): id is string => !!id);
}

export function legacyPriceIds(env: NodeJS.ProcessEnv = process.env): string[] {
  return [env.STRIPE_MONTHLY_PRICE_ID, env.STRIPE_ANNUAL_PRICE_ID]
    .filter((id): id is string => typeof id === "string" && /^price_[a-zA-Z0-9]+$/.test(id));
}

export function approvedPriceIds(env: NodeJS.ProcessEnv = process.env): string[] {
  return [...new Set([...regionalPriceIds(env).filter(id => /^price_[a-zA-Z0-9]+$/.test(id)), ...legacyPriceIds(env)])];
}

export function billingConfig(env: NodeJS.ProcessEnv = process.env) {
  const core = coreBillingConfig(env);
  const regional = regionalPriceIds(env);
  const legacy = new Set(legacyPriceIds(env));
  if (regional.length !== 6 || regional.some(id => !/^price_[a-zA-Z0-9]+$/.test(id)) ||
      new Set(regional).size !== 6 || regional.some(id => legacy.has(id))) {
    throw new Error("BILLING_NOT_CONFIGURED");
  }
  return core;
}

export function entitlementBillingConfig(env: NodeJS.ProcessEnv = process.env) {
  return coreBillingConfig(env);
}

export function validatePrice(price: any, plan: BillingPlan, currency: BillingCurrency, live: boolean) {
  const expected = BILLING_PLANS[plan];
  const currencyPolicy = BILLING_CURRENCIES[currency];
  if (!price?.active || price.livemode !== live || price.currency !== currencyPolicy.currency ||
      price.unit_amount !== expected.amount || price.tax_behavior !== currencyPolicy.taxBehavior ||
      price.type !== "recurring" || price.recurring?.interval !== expected.interval ||
      price.recurring.interval_count !== 1 || price.recurring.usage_type !== "licensed") {
    throw new Error("BILLING_PRICE_MISMATCH");
  }
}

export function subscriptionMatchesRegionalPolicy(sub: any, userId: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const priceId = sub?.items?.data?.[0]?.price?.id;
  if (!priceId) return false;
  if (legacyPriceIds(env).includes(priceId)) return true;
  let configuredCurrency: BillingCurrency | undefined;
  for (const currency of Object.keys(BILLING_CURRENCIES) as BillingCurrency[]) {
    if ((Object.keys(BILLING_PLANS) as BillingPlan[]).some(plan => env[priceEnv(currency, plan)] === priceId)) {
      configuredCurrency = currency;
      break;
    }
  }
  const selected = sub?.metadata?.feelzlike_billing_country;
  const selectedCurrency = sub?.metadata?.feelzlike_billing_currency;
  return !!configuredCurrency && sub?.metadata?.feelzlike_user_id === userId && isBillingCountry(selected) &&
    selectedCurrency === configuredCurrency && currencyForCountry(selected) === configuredCurrency;
}

export function assertCustomerOwner(customer: any, userId: string, live: boolean) {
  if (customer?.deleted || customer?.livemode !== live || customer?.metadata?.feelzlike_user_id !== userId)
    throw new Error("BILLING_CUSTOMER_OWNERSHIP");
}

export function paidSubscription(sub: any, priceIds: string[], live: boolean) {
  const items = sub?.items?.data;
  const end = items?.[0]?.current_period_end ?? sub?.current_period_end;
  return sub?.livemode === live && sub.status === "active" && items?.length === 1 &&
    items[0].quantity === 1 && priceIds.includes(items[0].price?.id) &&
    Number.isFinite(end) && end * 1000 > Date.now();
}