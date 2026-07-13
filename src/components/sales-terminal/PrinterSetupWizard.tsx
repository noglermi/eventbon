import { useMemo, useState } from "react";
import { formatDateTime } from "@/lib/date-format";
import type { Translation } from "./i18n";
import type { Language } from "./types";
import { getPrinterProfile, printerProfiles } from "./printer-settings-storage";
import type { PrinterProfile, PrinterProfileId, PrinterSettings } from "./printer-settings-storage";

type PrinterSetupWizardProps = {
  labels: Translation;
  language: Language;
  printerSettings: PrinterSettings;
  onPrinterSettingsChange: (settings: PrinterSettings) => void;
};

type WizardStep = 0 | 1 | 2 | 3;
type QzStatus = "idle" | "checking" | "connected" | "missing";

type QzTrayApi = {
  configs: {
    create: (printerName: string, options?: Record<string, unknown>) => unknown;
  };
  printers: {
    find: () => Promise<string[] | string>;
  };
  print: (config: unknown, data: unknown[]) => Promise<void>;
  websocket: {
    connect: () => Promise<void>;
    isActive: () => boolean;
  };
};

const qzDownloadUrl = "https://qz.io/download/";

const statusLabels: Record<PrinterProfile["status"], Record<Language, string>> = {
  supported: { de: "Unterstützt", en: "Supported" },
  tested: { de: "Getestet", en: "Tested" },
  testing_pending: { de: "Test ausstehend", en: "Testing pending" },
  legacy: { de: "Getestetes Bestandsgerät", en: "Tested existing device" },
  not_recommended: { de: "Nicht empfohlen", en: "Not recommended" },
};

const stepLabels: Record<Language, string[]> = {
  de: ["Modell", "QZ Tray", "Bondrucker", "Testbon"],
  en: ["Model", "QZ Tray", "Receipt printer", "Test voucher"],
};

function formatProfilePaper(profile: PrinterProfile) {
  return profile.paperHeightMm ? `${profile.paperWidthMm} x ${profile.paperHeightMm} mm` : `${profile.paperWidthMm} mm`;
}

function normalizePrinterList(value: string[] | string) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function isQzLike(value: unknown): value is QzTrayApi {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<QzTrayApi>;
  return Boolean(candidate.websocket && candidate.printers && candidate.configs && candidate.print);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function loadQzTray() {
  const qzTrayModule = await import("qz-tray");
  const qzApi = qzTrayModule.default as unknown;
  if (!isQzLike(qzApi)) {
    throw new Error("QZ Tray API konnte nicht geladen werden.");
  }
  return qzApi;
}

async function connectQzTray() {
  const qzApi = await loadQzTray();
  if (!qzApi.websocket.isActive()) {
    await qzApi.websocket.connect();
  }
  return qzApi;
}

function findSuggestedPrinter(printers: string[], profile: PrinterProfile) {
  const hints = profile.qzPrinterHints.map((hint) => hint.toLowerCase());
  return printers.find((printer) => hints.some((hint) => printer.toLowerCase().includes(hint))) ?? "";
}

function buildQzTestHtml(profile: PrinterProfile, language: Language, printedAt: Date) {
  const paperStyle = profile.paperHeightMm
    ? `width:${profile.paperWidthMm}mm;height:${profile.paperHeightMm}mm;`
    : `width:${profile.paperWidthMm}mm;min-height:90mm;`;
  const fontSize = profile.paperWidthMm <= 58 ? "10px" : "12px";
  const padding = profile.paperWidthMm <= 58 ? "3mm 3mm 4mm" : "4mm";
  const title = language === "de" ? "Testdruck" : "Test print";
  const paper = language === "de" ? "Papier" : "Paper";
  const dateLabel = language === "de" ? "Datum/Uhrzeit" : "Date/time";
  const cut = language === "de" ? "Schnitt am Ende" : "Cut at job end";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: ${profile.paperWidthMm}mm ${profile.paperHeightMm ?? 90}mm; margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #fff; color: #000; font-family: Arial, sans-serif; }
      .ticket { ${paperStyle} padding: ${padding}; overflow: hidden; }
      .center { text-align: center; }
      .brand { font-size: ${profile.paperWidthMm <= 58 ? "14px" : "18px"}; font-weight: 900; }
      .title { margin-top: 2mm; font-size: ${profile.paperWidthMm <= 58 ? "12px" : "15px"}; font-weight: 900; text-transform: uppercase; }
      .line { margin: 2mm 0; border-top: 1px dashed #000; }
      .row { font-size: ${fontSize}; font-weight: 700; line-height: 1.25; }
      .large { font-size: ${profile.paperWidthMm <= 58 ? "13px" : "17px"}; font-weight: 900; }
      .small { font-size: ${profile.paperWidthMm <= 58 ? "8px" : "10px"}; font-weight: 700; }
    </style>
  </head>
  <body>
    <article class="ticket">
      <div class="center">
        <div class="brand">EventBon</div>
        <div class="title">${title}</div>
      </div>
      <div class="line"></div>
      <div class="row large">${profile.testPrintName}</div>
      <div class="row">${paper}: ${formatProfilePaper(profile)}</div>
      <div class="row">${dateLabel}: ${formatDateTime(printedAt, language)}</div>
      <div class="line"></div>
      <div class="row">Sonderzeichen: &auml; &ouml; &uuml; &Auml; &Ouml; &Uuml; &szlig; &euro;</div>
      <div class="row large">123,45 &euro;</div>
      <div class="row small">${cut}</div>
    </article>
  </body>
</html>`;
}

function getModelLabel(profile: PrinterProfile, language: Language) {
  if (profile.id === "generic_58" || profile.id === "generic_80") {
    return language === "de" ? `Weitere (${profile.paperWidthMm} mm)` : `Other (${profile.paperWidthMm} mm)`;
  }

  if (profile.id === "munbyn_80_pending") {
    return "MUNBYN";
  }

  return profile.label[language];
}

export function PrinterSetupWizard({ labels, language, printerSettings, onPrinterSettingsChange }: PrinterSetupWizardProps) {
  const selectedProfile = getPrinterProfile(printerSettings.profileId);
  const activeProfiles = useMemo(() => printerProfiles.filter((profile) => profile.active), []);
  const [step, setStep] = useState<WizardStep>(0);
  const [qzStatus, setQzStatus] = useState<QzStatus>("idle");
  const [qzPrinters, setQzPrinters] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<"success" | "problem" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [technicalDetails, setTechnicalDetails] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  const t = {
    title: language === "de" ? "Bondrucker einrichten" : "Set up receipt printer",
    intro: language === "de"
      ? "EventBon verwendet QZ Tray für den sicheren und schnellen Bondruck."
      : "EventBon uses QZ Tray for secure and fast voucher printing.",
    chooseModel: language === "de" ? "Bondruckermodell auswählen" : "Select receipt printer model",
    qzQuestion: language === "de" ? "QZ Tray installiert?" : "Is QZ Tray installed?",
    qzYes: language === "de" ? "Ja, prüfen" : "Yes, check",
    qzNo: language === "de" ? "Nein" : "No",
    qzDownload: language === "de" ? "QZ Tray herunterladen" : "Download QZ Tray",
    qzHelp: language === "de"
      ? "Installiere QZ Tray, starte es und kehre dann zu EventBon zurück."
      : "Install QZ Tray, start it, then return to EventBon.",
    qzConnected: language === "de" ? "QZ Tray ist bereit." : "QZ Tray is ready.",
    qzMissing: language === "de" ? "QZ Tray ist noch nicht erreichbar." : "QZ Tray is not reachable yet.",
    choosePrinter: language === "de" ? "Bondrucker auswählen" : "Select receipt printer",
    searchPrinter: language === "de" ? "Bondrucker suchen" : "Find receipt printers",
    noPrinter: language === "de" ? "Noch kein Bondrucker gefunden. Bitte prüfe, ob der Drucker eingeschaltet ist." : "No receipt printer found yet. Please check whether the printer is powered on.",
    testPrint: language === "de" ? "Testbon drucken" : "Print test voucher",
    done: language === "de" ? "Einrichtung abgeschlossen." : "Setup complete.",
    retry: language === "de" ? "Erneut testen" : "Test again",
    back: language === "de" ? "Zurück" : "Back",
    next: language === "de" ? "Weiter" : "Next",
    pendingWarning: language === "de" ? "Test ausstehend - dieses Modell wurde noch nicht vollständig mit EventBon geprüft." : "Testing pending - this model has not yet been fully verified with EventBon.",
    legacyHint: language === "de" ? "Getestetes Bestandsgerät." : "Tested existing device.",
  };

  function updateSettings(nextSettings: Partial<PrinterSettings>) {
    onPrinterSettingsChange({ ...printerSettings, ...nextSettings, outputMode: "qz_tray" });
  }

  function selectProfile(profileId: PrinterProfileId) {
    const profile = getPrinterProfile(profileId);
    setTestResult(null);
    setErrorMessage("");
    setTechnicalDetails("");
    updateSettings({
      profileId: profile.id,
      paperWidthMm: profile.paperWidthMm,
      density: profile.density,
      cutMode: profile.cutMode,
      setupCompleted: false,
      testConfirmed: false,
      testConfirmedAt: null,
      lastTestPrintedAt: null,
    });
  }

  async function checkQzTray() {
    setQzStatus("checking");
    setErrorMessage("");
    setTechnicalDetails("");

    try {
      const qzApi = await connectQzTray();
      const printers = normalizePrinterList(await qzApi.printers.find());
      setQzPrinters(printers);
      setQzStatus("connected");
      const suggestedPrinter = printerSettings.qzPrinterName || findSuggestedPrinter(printers, selectedProfile);
      if (suggestedPrinter && !printerSettings.qzPrinterName) {
        updateSettings({ qzPrinterName: suggestedPrinter });
      }
    } catch (error) {
      setQzStatus("missing");
      setQzPrinters([]);
      setErrorMessage(t.qzMissing);
      setTechnicalDetails(getErrorMessage(error));
    }
  }

  async function printQzTestVoucher() {
    if (!printerSettings.qzPrinterName.trim()) {
      setErrorMessage(language === "de" ? "Bitte zuerst einen Bondrucker auswählen." : "Please select a receipt printer first.");
      setStep(2);
      return;
    }

    setIsPrinting(true);
    setErrorMessage("");
    setTechnicalDetails("");

    try {
      const qzApi = await connectQzTray();
      const printedAt = new Date();
      const config = qzApi.configs.create(printerSettings.qzPrinterName.trim(), {
        copies: 1,
        margins: 0,
        units: "mm",
      });
      await qzApi.print(config, [{ type: "pixel", format: "html", flavor: "plain", data: buildQzTestHtml(selectedProfile, language, printedAt) }]);
      const confirmedAt = printedAt.toISOString();
      updateSettings({
        lastTestPrintedAt: confirmedAt,
        setupCompleted: true,
        testConfirmed: true,
        testConfirmedAt: confirmedAt,
      });
      setTestResult("success");
    } catch (error) {
      setTestResult("problem");
      setErrorMessage(language === "de" ? "Testbon konnte nicht gedruckt werden." : "The test voucher could not be printed.");
      setTechnicalDetails(getErrorMessage(error));
    } finally {
      setIsPrinting(false);
    }
  }

  const canGoBack = step > 0;
  const canGoNext = step < 3;

  return (
    <section className="rounded-[2.25rem] bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/75">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">{labels.receiptPrinter}</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{t.title}</h2>
          <p className="mt-2 max-w-3xl text-base font-bold leading-7 text-slate-600">{t.intro}</p>
        </div>
        {printerSettings.setupCompleted ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black leading-6 text-emerald-950 ring-1 ring-emerald-100">✓ {t.done}</p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {stepLabels[language].map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index as WizardStep)}
            className={`min-h-11 rounded-2xl px-4 text-sm font-black transition active:scale-[0.98] ${
              step === index ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-3xl bg-white p-4 ring-1 ring-slate-200/80">
        {step === 0 ? (
          <div>
            <h3 className="text-xl font-black text-slate-950">{t.chooseModel}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => selectProfile(profile.id)}
                  className={`min-h-32 rounded-3xl p-4 text-left transition active:scale-[0.99] ${
                    printerSettings.profileId === profile.id ? "bg-emerald-50 ring-2 ring-emerald-500" : "bg-white ring-1 ring-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-slate-950">{getModelLabel(profile, language)}</p>
                      <p className="mt-1 text-sm font-bold text-slate-500">{profile.manufacturer} {profile.model}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{statusLabels[profile.status][language]}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-700">{formatProfilePaper(profile)}</p>
                </button>
              ))}
            </div>
            {selectedProfile.status === "testing_pending" ? (
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black leading-6 text-amber-950 ring-1 ring-amber-200">{t.pendingWarning}</p>
            ) : null}
            {selectedProfile.status === "legacy" ? (
              <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black leading-6 text-blue-950 ring-1 ring-blue-200">{t.legacyHint}</p>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
              <h3 className="text-xl font-black text-emerald-950">{t.qzQuestion}</h3>
              <p className="mt-2 text-base font-bold leading-7 text-emerald-900">{t.intro}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={checkQzTray} className="min-h-14 rounded-2xl bg-emerald-600 px-5 text-base font-black text-white transition active:scale-[0.98]">
                  {qzStatus === "checking" ? labels.loadingProducts : t.qzYes}
                </button>
                <a href={qzDownloadUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-14 items-center rounded-2xl bg-white px-5 text-base font-black text-emerald-900 ring-1 ring-emerald-200 transition active:scale-[0.98]">
                  {t.qzDownload}
                </a>
              </div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              {qzStatus === "connected" ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-950 ring-1 ring-emerald-100">✓ {t.qzConnected}</p> : null}
              {qzStatus === "missing" ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-950 ring-1 ring-amber-200">{t.qzMissing}</p> : null}
              <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{t.qzHelp}</p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr]">
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <h3 className="text-xl font-black text-slate-950">{t.choosePrinter}</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{selectedProfile.label[language]}</p>
              <button type="button" onClick={checkQzTray} className="mt-4 min-h-14 rounded-2xl bg-slate-950 px-5 text-base font-black text-white transition active:scale-[0.98]">
                {qzStatus === "checking" ? labels.loadingProducts : t.searchPrinter}
              </button>
            </div>
            <div className="grid gap-2">
              {qzPrinters.length ? (
                qzPrinters.map((printer) => (
                  <button
                    key={printer}
                    type="button"
                    onClick={() => updateSettings({ qzPrinterName: printer })}
                    className={`min-h-14 rounded-2xl px-4 text-left text-base font-black transition active:scale-[0.98] ${
                      printerSettings.qzPrinterName === printer ? "bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500" : "bg-white text-slate-800 ring-1 ring-slate-200"
                    }`}
                  >
                    {printer}
                  </button>
                ))
              ) : (
                <p className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-600 ring-1 ring-slate-200">{t.noPrinter}</p>
              )}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr]">
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <h3 className="text-xl font-black text-slate-950">{t.testPrint}</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                {printerSettings.qzPrinterName || (language === "de" ? "Noch kein Bondrucker ausgewählt." : "No receipt printer selected yet.")}
              </p>
              <button type="button" onClick={printQzTestVoucher} disabled={isPrinting} className="mt-4 min-h-14 rounded-2xl bg-emerald-600 px-5 text-base font-black text-white transition active:scale-[0.98] disabled:opacity-60">
                {isPrinting ? labels.saving : t.testPrint}
              </button>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
              {testResult === "success" ? (
                <p className="text-xl font-black text-emerald-950">✓ {t.done}</p>
              ) : (
                <p className="text-base font-bold leading-7 text-emerald-950">
                  {language === "de" ? "Wenn der Testbon korrekt gedruckt wird, ist der Bondrucker bereit." : "When the test voucher prints correctly, the receipt printer is ready."}
                </p>
              )}
              {testResult === "problem" ? (
                <button type="button" onClick={printQzTestVoucher} className="mt-4 min-h-12 rounded-2xl bg-white px-5 text-base font-black text-emerald-900 ring-1 ring-emerald-200 transition active:scale-[0.98]">
                  {t.retry}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black leading-6 text-amber-950 ring-1 ring-amber-200">
            <p>{errorMessage}</p>
            {technicalDetails ? (
              <details className="mt-2 text-xs font-bold text-amber-900">
                <summary className="cursor-pointer">{labels.technicalDetails}</summary>
                <p className="mt-2 break-words">{technicalDetails}</p>
              </details>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => (canGoBack ? setStep((step - 1) as WizardStep) : setStep(0))} className="min-h-12 rounded-2xl bg-white px-5 text-base font-black text-slate-800 ring-1 ring-slate-300 transition active:scale-[0.98]">
            {t.back}
          </button>
          <button type="button" onClick={() => (canGoNext ? setStep((step + 1) as WizardStep) : printQzTestVoucher())} className="min-h-12 rounded-2xl bg-slate-950 px-5 text-base font-black text-white transition active:scale-[0.98]">
            {canGoNext ? t.next : t.testPrint}
          </button>
        </div>
      </div>
    </section>
  );
}
