import Link from "next/link";
import type { Language } from "@/components/sales-terminal/types";

type ProductFooterProps = {
  language: Language;
};

export function ProductFooter({ language }: ProductFooterProps) {
  const isGerman = language === "de";

  return (
    <footer className="rounded-lg bg-white/80 p-4 text-sm font-bold leading-6 text-slate-600 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black text-slate-900">EventBon</p>
          <p>{isGerman ? "Unterstützt: Windows 10/11, Chrome oder Microsoft Edge, QZ Tray sowie Brother TD-4000." : "Supported: Windows 10/11, Chrome or Microsoft Edge, QZ Tray, and Brother TD-4000."}</p>
          <p>{isGerman ? "Weitere Druckermodelle werden laufend ergänzt." : "Additional printer models are added continuously."}</p>
          <p>{isGerman ? "Support über „Problem melden“." : "Support through “Report a problem”."}</p>
        </div>
        <nav className="flex flex-wrap gap-3" aria-label={isGerman ? "Hilfe" : "Help"}>
          <Link href="/problem-melden" className="text-emerald-700 hover:text-emerald-900">{isGerman ? "Problem melden" : "Report a problem"}</Link>
          <Link href="/impressum" className="text-emerald-700 hover:text-emerald-900">Impressum</Link>
          <Link href="/datenschutz" className="text-emerald-700 hover:text-emerald-900">{isGerman ? "Datenschutz" : "Privacy"}</Link>
          <Link href="/nutzungsbedingungen" className="text-emerald-700 hover:text-emerald-900">{isGerman ? "Nutzungsbedingungen" : "Terms"}</Link>
        </nav>
      </div>
    </footer>
  );
}
