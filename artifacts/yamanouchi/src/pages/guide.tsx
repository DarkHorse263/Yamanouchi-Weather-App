import { useLanguage } from "@/hooks/use-language";
import { ExternalLink } from "lucide-react";

const GUIDE_URL = "https://www.info-yamanouchi.net/english/";

export default function Guide() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Slim header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/95 backdrop-blur shrink-0">
        <h1 className="text-base font-black text-mountain-dark">
          {t("Visitor Guide", "観光ガイド")}
        </h1>
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

      {/* Full-height iframe */}
      <iframe
        src={GUIDE_URL}
        title="Yamanouchi Visitor Guide"
        className="flex-1 w-full border-0"
        loading="lazy"
      />
    </div>
  );
}
