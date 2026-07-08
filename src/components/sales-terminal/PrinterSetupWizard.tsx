import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { formatDateTime } from "@/lib/date-format";
import type { Translation } from "./i18n";
import type { Language } from "./types";
import { getPrinterProfile, printerProfiles } from "./printer-settings-storage";
import type { PrinterCutMode, PrinterLayoutDensity, PrinterProfileId, PrinterSettings } from "./printer-settings-storage";

type PrinterSetupWizardProps = {
  labels: Translation;
  language: Language;
  printerSettings: PrinterSettings;
  onPrinterSettingsChange: (settings: PrinterSettings) => void;
};

function formatPaperWidth(width: number) {
  return width + " mm";
}

export function getPrinterCssVariables(settings: PrinterSettings) {
  const printableWidthMm = Math.max(40, settings.paperWidthMm - (settings.profileId === "generic_a4" ? 20 : 6));
  const paddingMm = settings.density === "compact" ? 2 : 3;
  const ticketGapMm = settings.cutMode === "cutter" ? 6 : 4;
  const fontSizePt = settings.density === "compact" ? 10 : 11;
  const lineGapMm = settings.density === "compact" ? 1 : 1.5;

  return {
    "--printer-paper-width": settings.paperWidthMm + "mm",
    "--printer-printable-width": printableWidthMm + "mm",
    "--printer-ticket-padding": paddingMm + "mm",
    "--printer-ticket-gap": ticketGapMm + "mm",
    "--printer-font-size": fontSizePt + "pt",
    "--printer-line-gap": lineGapMm + "mm",
  } as CSSProperties;
}

function TestVoucher({ labels, language, printerSettings, printedAt }: { labels: Translation; language: Language; printerSettings: PrinterSettings; printedAt: Date }) {
  const selectedProfile = getPrinterProfile(printerSettings.profileId);
  const cutModeLabel = printerSettings.cutMode === "cutter" ? labels.cutterMode : labels.tearMode;

  return (
    <article className="voucher-ticket bg-white px-4 py-3 font-mono text-slate-950 shadow-sm ring-1 ring-slate-300">
      <div className="text-center">
        <p className="text-base font-black tracking-wide">eventBon</p>
        <p className="mt-1 text-sm font-black uppercase tracking-wide">{labels.testPrint}</p>
      </div>
      <div className="my-2 border-t border-dashed border-slate-500" />
      <div className="space-y-1 text-sm font-black leading-tight">
        <p>{labels.testPrintDateTime}: {formatDateTime(printedAt, language)}</p>
        <p>{labels.printerProfile}: {selectedProfile.label[language]}</p>
        <p>{labels.paperWidth}: {formatPaperWidth(printerSettings.paperWidthMm)}</p>
        <p>{labels.cutTearMode}: {cutModeLabel}</p>
      </div>
      <div className="voucher-cut-line mt-3 border-t border-dashed border-slate-700" />
    </article>
  );
}

export function PrinterSetupWizard({ labels, language, printerSettings, onPrinterSettingsChange }: PrinterSetupWizardProps) {
  const selectedProfile = getPrinterProfile(printerSettings.profileId);
  const pendingPrintRef = useRef(false);
  const [testPrintDate, setTestPrintDate] = useState<Date | null>(null);
  const previewDate = testPrintDate ?? new Date();

  useEffect(() => {
    if (!testPrintDate || !pendingPrintRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      pendingPrintRef.current = false;
      window.print();
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [testPrintDate]);

  function selectProfile(profileId: PrinterProfileId) {
    const profile = getPrinterProfile(profileId);
    onPrinterSettingsChange({
      profileId: profile.profileId,
      paperWidthMm: profile.paperWidthMm,
      density: profile.density,
      cutMode: profile.cutMode,
    });
  }

  function updatePaperWidth(value: string) {
    const paperWidthMm = Number(value);
    if (Number.isFinite(paperWidthMm)) {
      onPrinterSettingsChange({ ...printerSettings, paperWidthMm });
    }
  }

  return (
    <section className="rounded-[2.25rem] bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/75">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">{labels.terminalSetup}</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{selectedProfile.label[language]}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{labels.printerBrowserDialogNote}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
          {labels.printerProfile}
          <select
            value={printerSettings.profileId}
            onChange={(event) => selectProfile(event.target.value as PrinterProfileId)}
            className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-black normal-case tracking-normal text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          >
            {printerProfiles.map((profile) => (
              <option key={profile.profileId} value={profile.profileId}>{profile.label[language]}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            {labels.paperWidth}
            <input
              type="number"
              min="40"
              max="220"
              step="1"
              value={printerSettings.paperWidthMm}
              onChange={(event) => updatePaperWidth(event.target.value)}
              className="min-h-12 rounded-2xl border border-slate-200 px-4 text-base font-black normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            {labels.layoutDensity}
            <select
              value={printerSettings.density}
              onChange={(event) => onPrinterSettingsChange({ ...printerSettings, density: event.target.value as PrinterLayoutDensity })}
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-black normal-case tracking-normal text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="compact">{labels.layoutDensityCompact}</option>
              <option value="comfortable">{labels.layoutDensityComfortable}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            {labels.cutTearMode}
            <select
              value={printerSettings.cutMode}
              onChange={(event) => onPrinterSettingsChange({ ...printerSettings, cutMode: event.target.value as PrinterCutMode })}
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-black normal-case tracking-normal text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="tear">{labels.tearMode}</option>
              <option value="cutter">{labels.cutterMode}</option>
            </select>
          </label>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/75">
          <p className="text-sm font-black text-slate-700">{labels.testPrintPreview}</p>
          <div className="mt-3 max-w-[var(--printer-printable-width)]" style={getPrinterCssVariables(printerSettings)}>
            <TestVoucher labels={labels} language={language} printerSettings={printerSettings} printedAt={previewDate} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            pendingPrintRef.current = true;
            setTestPrintDate(new Date());
          }}
          className="min-h-14 rounded-2xl bg-slate-950 px-5 text-lg font-black text-white transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
        >
          {labels.testPrintButton}
        </button>
      </div>

      {testPrintDate ? (
        <div className="fixed inset-0 z-[420] flex items-center justify-center bg-slate-950/60 p-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={labels.testPrintPreview}>
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="print-preview-chrome shrink-0 border-b border-slate-200 px-7 py-5">
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{labels.terminalSetup}</p>
              <h2 className="mt-1 text-3xl font-black tracking-normal text-slate-950">{labels.testPrint}</h2>
            </div>
            <div className="print-preview-scroll min-h-0 flex-1 overflow-y-auto bg-slate-100 p-6">
              <div className="print-area mx-auto grid max-w-[var(--printer-printable-width)]" style={getPrinterCssVariables(printerSettings)}>
                <TestVoucher labels={labels} language={language} printerSettings={printerSettings} printedAt={testPrintDate} />
              </div>
            </div>
            <div className="print-preview-actions z-10 shrink-0 flex justify-end border-t border-slate-200 bg-white/95 px-7 py-5 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
              <button type="button" onClick={() => setTestPrintDate(null)} className="min-h-12 rounded-2xl bg-slate-100 px-5 text-lg font-black text-slate-700 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
                {labels.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
