import { useLanguage } from "@workspace/feelzlike-shell";
import { ExternalLink, BedDouble } from "lucide-react";
import { useYamanouchiBooking } from "../lib/booking";
import { useState } from "react";
import { useDataSaver } from "@/hooks/useDataSaver";
import { useMediaActivity } from "@/hooks/useMediaActivity";

const GUIDE_URL = "https://www.info-yamanouchi.net/english/";

export default function Guide() {
  const { t } = useLanguage();
  const booking = useYamanouchiBooking();
  const { dataSaver } = useDataSaver();
  const { ref: activityRef, active } = useMediaActivity();
  const [mediaRequested, setMediaRequested] = useState(false);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/95 backdrop-blur shrink-0">
        <h1 className="text-base font-black text-foreground">
          {t("Visitor Guide", "観光ガイド")}
        </h1>
        <div className="flex items-center gap-3">
          <a
            href={booking.generalUrl()}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
          >
            <BedDouble className="w-3.5 h-3.5" />
            {t("Book a Stay", "宿泊予約")}
          </a>
          <a
            href={GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t("Open in browser", "ブラウザで開く")}
          </a>
        </div>
      </div>

      <div ref={activityRef} className="flex-1 min-h-0 relative bg-slate-100">
        {active && (!dataSaver || mediaRequested) ? (
          <iframe
            src={GUIDE_URL}
            title="Yamanouchi Visitor Guide"
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            {dataSaver && !mediaRequested ? (
              <div className="rounded-2xl bg-white/95 border border-slate-200 shadow-lg px-5 py-4 max-w-xs">
                <p className="text-sm font-bold text-slate-800">
                  {t("Load the visitor guide", "観光ガイドを読み込む")}
                </p>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  {t("The guide stays off until you choose to load it.", "読み込むまでガイドを停止します。")}
                </p>
                <button
                  type="button"
                  onClick={() => setMediaRequested(true)}
                  className="rounded-lg bg-primary text-white px-4 py-2 text-xs font-bold"
                >
                  {t("Load guide", "ガイドを読み込む")}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
