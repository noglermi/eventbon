import Link from "next/link";
import type { Language } from "@/components/sales-terminal/types";

type PilotFooterProps = {
  language: Language;
};

export function PilotFooter({ language }: PilotFooterProps) {
  const isGerman = language === "de";

  return (
    <footer className="rounded-lg bg-white/80 p-4 text-sm font-bold leading-6 text-slate-600 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black text-slate-900">eventBon Windows Pilot</p>
          <p>{isGerman ? "Unterstützt: Windows 10/11, Chrome oder Edge, QZ Tray, Brother TD-4000." : "Supported: Windows 10/11, Chrome or Edge, QZ Tray, Brother TD-4000."}</p>
          <p>{isGerman ? "iPad, Android und weitere Drucker folgen später." : "iPad, Android, and additional printers will follow later."}</p>
          <p>{isGerman ? "Support über Problem melden." : "Support through Report a problem."}</p>
        </div>
        <nav className="flex flex-wrap gap-3" aria-label={isGerman ? "Pilot-Hilfe" : "Pilot help"}>
          <Link href="/support" className="text-emerald-700 hover:text-emerald-900">{isGerman ? "Problem melden" : "Report a problem"}</Link>
          <Link href="/impressum" className="text-emerald-700 hover:text-emerald-900">Impressum</Link>
          <Link href="/datenschutz" className="text-emerald-700 hover:text-emerald-900">{isGerman ? "Datenschutz" : "Privacy"}</Link>
          <Link href="/nutzungsbedingungen" className="text-emerald-700 hover:text-emerald-900">{isGerman ? "Nutzungsbedingungen" : "Terms"}</Link>
        </nav>
      </div>
    </footer>
  );
}
