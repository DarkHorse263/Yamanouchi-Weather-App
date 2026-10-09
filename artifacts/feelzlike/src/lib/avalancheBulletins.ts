export interface AvalancheBulletinLink { label: string; url: string; area: string }
const alpine: AvalancheBulletinLink = {
  label: "avalanche.report", url: "https://avalanche.report/", area: "Tyrol, South Tyrol and Trentino",
};

/** Outbound authoritative advice only. No fetched, predicted or inferred risk. */
export function avalancheBulletinFor(country: string | undefined, province = ""): AvalancheBulletinLink | undefined {
  const area = province.toLowerCase();
  if ((country === "AT" && /tyrol|tirol/.test(area)) ||
      (country === "IT" && /south tyrol|südtirol|alto adige|trentino/.test(area))) return alpine;
  switch (country) {
    case "CH": return { label: "SLF avalanche bulletin", url: "https://www.slf.ch/en/avalanche-bulletin-and-snow-situation/", area: "Swiss bulletin regions" };
    case "FR": return { label: "Météo-France mountain bulletins", url: "https://meteofrance.com/meteo-montagne", area: "select your massif and avalanche bulletin" };
    case "IT": return { label: "AINEVA avalanche bulletins", url: "https://aineva.it/en/", area: "select the relevant regional bulletin" };
    case "DE": return /bavaria|bayern/.test(area)
      ? { label: "Bavarian avalanche service", url: "https://lawinenwarndienst.bayern.de/", area: "Bavarian Alps" } : undefined;
    case "NO": return { label: "Varsom", url: "https://www.varsom.no/en/", area: "select the relevant Norwegian forecast region" };
    case "SE": return { label: "Lavinprognoser", url: "https://www.lavinprognoser.se/", area: "select the relevant Swedish forecast area" };
    case "GB": return area === "scotland"
      ? { label: "Scottish Avalanche Information Service", url: "https://www.sais.gov.uk/", area: "published Scottish forecast areas only" } : undefined;
    case "PL": return { label: "TOPR avalanche bulletin", url: "https://lawiny.topr.pl/?language=en", area: "Polish Tatras only" };
    case "SK": return { label: "HZS avalanche bulletin", url: "https://www.laviny.sk/", area: "select the relevant Slovak forecast region" };
    default: return undefined;
  }
}
