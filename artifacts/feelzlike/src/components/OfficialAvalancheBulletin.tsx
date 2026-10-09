import { avalancheBulletinFor } from "@/lib/avalancheBulletins";

export function OfficialAvalancheBulletin({ country, province }: { country?: string; province?: string }) {
  const source = avalancheBulletinFor(country, province);
  if (!source) return null;
  return (
    <aside className="rounded-xl border border-white/30 px-4 py-3 text-sm text-white">
      <h2 className="font-bold">official avalanche advice</h2>
      <p className="mt-1">check the bulletin’s date and coverage before travelling · {source.area}</p>
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold underline underline-offset-2">
        open {source.label}
      </a>
      <p className="mt-2 text-xs">feelzlike does not assess avalanche danger. A snow forecast is not a safety assessment.</p>
    </aside>
  );
}
