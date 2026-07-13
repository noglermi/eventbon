import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDateTime } from "@/lib/date-format";
import { printService } from "@/lib/printing/print-service";
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

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;
type QzStatus = "idle" | "checking" | "connected" | "missing" | "error";

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

const statusLabels: Record<PrinterProfile["status"], Record<Language, string>> = {
  supported: { de: "Unterst\u00fctzt", en: "Supported" },
  tested: { de: "Getestet", en: "Tested" },
  testing_pending: { de: "Test ausstehend", en: "Testing pending" },
  legacy: { de: "Bestandsger\u00e4t", en: "Existing tested device" },
  not_recommended: { de: "Nicht empfohlen", en: "Not recommended" },
};

const stepLabels: Record<Language, string[]> = {
  de: ["Drucker", "Voraussetzungen", "Installation", "Windows-Drucker", "Testbon", "Abschluss"],
  en: ["Printer", "Requirements", "Installation", "Windows printer", "Test voucher", "Finish"],
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
  const cut = language === "de" ? "Cutter-Test am Job-Ende" : "Cutter test at job end";

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
        <div class="brand">eventBon</div>
        <div class="title">${title}</div>
      </div>
      <div class="line"></div>
      <div class="row large">${profile.testPrintName}</div>
      <div class="row">${paper}: ${formatProfilePaper(profile)}</div>
      <div class="row">${dateLabel}: ${formatDateTime(printedAt, language)}</div>
      <div class="line"></div>
      <div class="row">Sonderzeichen: &auml; &ouml; &uuml; &Auml; &Ouml; &Uuml; &szlig; &euro;</div>
      <div class="row large">Grosse Schrift 123,45 &euro;</div>
      <div class="row">Mittlere Schrift 123,45 &euro;</div>
      <div class="row small">Kleine Schrift: Bon, Station, Helfer, Artikel</div>
      <div class="line"></div>
      <div class="row center">${cut}</div>
    </article>
  </body>
</html>`;
}

function TestVoucher({ labels, language, printerSettings, printedAt }: { labels: Translation; language: Language; printerSettings: PrinterSettings; printedAt: Date }) {
  const selectedProfile = getPrinterProfile(printerSettings.profileId);

  return (
    <article className="voucher-ticket bg-white px-4 py-3 font-mono text-slate-950 shadow-sm ring-1 ring-slate-300">
      <div className="text-center">
        <p className="text-base font-black tracking-wide">eventBon</p>
        <p className="mt-1 text-sm font-black uppercase tracking-wide">{labels.testPrint}</p>
      </div>
      <div className="my-2 border-t border-dashed border-slate-500" />
      <div className="space-y-1 text-sm font-black leading-tight">
        <p>{selectedProfile.testPrintName}</p>
        <p>
          {labels.paper}: {formatProfilePaper(selectedProfile)}
        </p>
        <p>
          {labels.testPrintDateTime}: {formatDateTime(printedAt, language)}
        </p>
        <p>Sonderzeichen: &auml; &ouml; &uuml; &Auml; &Ouml; &Uuml; &szlig; &euro;</p>
        <p className="text-base">123,45 &euro;</p>
      </div>
      <div className="voucher-cut-line mt-3 border-t border-dashed border-slate-700" />
    </article>
  );
}

export function PrinterSetupWizard({ labels, language, printerSettings, onPrinterSettingsChange }: PrinterSetupWizardProps) {
  const selectedProfile = getPrinterProfile(printerSettings.profileId);
  const activeProfiles = useMemo(() => printerProfiles.filter((profile) => profile.active), []);
  const pendingPrintRef = useRef(false);
  const [step, setStep] = useState<WizardStep>(0);
  const [testPrintDate, setTestPrintDate] = useState<Date | null>(null);
  const [testResult, setTestResult] = useState<"success" | "problem" | null>(null);
  const [qzStatus, setQzStatus] = useState<QzStatus>("idle");
  const [qzPrinters, setQzPrinters] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [technicalDetails, setTechnicalDetails] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const previewDate = testPrintDate ?? new Date();
  const testPrintJob = printService.createBonPrintJob({
    flow: "setupPrintPreview",
    printerSettings,
    printMode: "combined_voucher",
    lines: [{ id: "printer-test", name: selectedProfile.testPrintName, quantity: 1 }],
  });

  useEffect(() => {
    if (!testPrintDate || !pendingPrintRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      pendingPrintRef.current = false;
      printService.requestBrowserPrint();
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [testPrintDate]);

  function updateSettings(nextSettings: Partial<PrinterSettings>) {
    onPrinterSettingsChange({ ...printerSettings, ...nextSettings });
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
        updateSettings({ qzPrinterName: suggestedPrinter, outputMode: "qz_tray" });
      }
    } catch (error) {
      setQzStatus("missing");
      setQzPrinters([]);
      setErrorMessage(language === "de" ? "QZ Tray ist auf diesem Ger\u00e4t nicht installiert oder nicht erreichbar." : "QZ Tray is not installed on this device or is not reachable.");
      setTechnicalDetails(getErrorMessage(error));
    }
  }

  async function printQzTestVoucher() {
    if (!printerSettings.qzPrinterName.trim()) {
      setErrorMessage(language === "de" ? "Bitte zuerst den Windows-Drucker ausw\u00e4hlen oder eintragen." : "Please select or enter the Windows printer first.");
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
      updateSettings({ lastTestPrintedAt: printedAt.toISOString(), outputMode: "qz_tray" });
      setTestResult("success");
    } catch (error) {
      setTestResult("problem");
      setErrorMessage(language === "de" ? "Testbon konnte nicht \u00fcber QZ Tray gedruckt werden." : "The test voucher could not be printed via QZ Tray.");
      setTechnicalDetails(getErrorMessage(error));
    } finally {
      setIsPrinting(false);
    }
  }

  function printBrowserTestVoucher() {
    pendingPrintRef.current = true;
    const printedAt = new Date();
    setTestResult(null);
    setTestPrintDate(printedAt);
    updateSettings({ lastTestPrintedAt: printedAt.toISOString(), outputMode: "browser" });
  }

  function confirmSuccessfulSetup() {
    const confirmedAt = new Date().toISOString();
    updateSettings({
      setupCompleted: true,
      testConfirmed: true,
      testConfirmedAt: confirmedAt,
      lastTestPrintedAt: printerSettings.lastTestPrintedAt ?? confirmedAt,
    });
    setTestResult("success");
  }

  const t = {
    setupPrinter: language === "de" ? "Drucker einrichten" : "Set up printer",
    changePrinter: language === "de" ? "Drucker wechseln" : "Change printer",
    selectedPrinter: language === "de" ? "Ausgew\u00e4hlter Drucker" : "Selected printer",
    status: language === "de" ? "Status" : "Status",
    qzName: language === "de" ? "Windows/QZ-Druckername" : "Windows/QZ printer name",
    requirements: language === "de" ? "Voraussetzungen pr\u00fcfen" : "Check requirements",
    connectQz: language === "de" ? "Mit QZ Tray verbinden" : "Connect QZ Tray",
    chooseWindowsPrinter: language === "de" ? "Windows-Drucker auswaehlen" : "Select Windows printer",
    manualPrinterName: language === "de" ? "Druckername manuell eintragen" : "Enter printer name manually",
    next: language === "de" ? "Weiter" : "Next",
    back: language === "de" ? "Zur\u00fcck" : "Back",
    finish: language === "de" ? "Einrichtung abschlie\u00dfen" : "Finish setup",
    retest: language === "de" ? "Erneut testen" : "Retest",
    confirmed: language === "de" ? "Test korrekt gedruckt" : "Test printed correctly",
    browserTest: language === "de" ? "Browser-Testdruck" : "Browser test print",
    qzTest: language === "de" ? "QZ-Testbon drucken" : "Print QZ test voucher",
    qzConnected: language === "de" ? "QZ Tray verbunden." : "QZ Tray connected.",
    qzMissing: language === "de" ? "QZ Tray ist nicht erreichbar." : "QZ Tray is not reachable.",
    pendingWarning: language === "de" ? "Test ausstehend - dieses Modell wurde noch nicht vollst\u00e4ndig mit EventBon gepr\u00fcft." : "Testing pending - this model has not yet been fully verified with eventBon.",
    legacyHint: language === "de" ? "Getestetes Bestandsger\u00e4t." : "Tested existing device.",
    setupDone: language === "de" ? "Drucker ist f\u00fcr dieses Ger\u00e4t eingerichtet." : "Printer is configured for this device.",
  };

  const canGoBack = step > 0;
  const canGoNext = step < 5;

  return (
    <section className="rounded-[2.25rem] bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/75">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">{labels.receiptPrinter}</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{selectedProfile.label[language]}</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">{labels.receiptPrinterSetupSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setStep(0)} className="min-h-12 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition active:scale-[0.98]">
            {t.setupPrinter}
          </button>
          <button type="button" onClick={() => setStep(4)} className="min-h-12 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white transition active:scale-[0.98]">
            {labels.testPrintButton}
          </button>
          <button type="button" onClick={() => setStep(0)} className="min-h-12 rounded-2xl bg-white px-4 text-sm font-black text-slate-800 ring-1 ring-slate-300 transition active:scale-[0.98]">
            {t.changePrinter}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200/80 md:grid-cols-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t.selectedPrinter}</p>
          <p className="mt-1 text-base font-black text-slate-950">{selectedProfile.displayName}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t.status}</p>
          <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">{statusLabels[selectedProfile.status][language]}</span>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">{labels.paper}</p>
          <p className="mt-1 text-base font-black text-slate-950">{formatProfilePaper(selectedProfile)}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t.qzName}</p>
          <p className="mt-1 break-words text-base font-black text-slate-950">{printerSettings.qzPrinterName || "-"}</p>
        </div>
      </div>

      {selectedProfile.status === "testing_pending" ? (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black leading-6 text-amber-950 ring-1 ring-amber-200">{t.pendingWarning}</p>
      ) : null}
      {selectedProfile.status === "legacy" ? (
        <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black leading-6 text-blue-950 ring-1 ring-blue-200">{t.legacyHint}</p>
      ) : null}
      {printerSettings.setupCompleted ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black leading-6 text-emerald-950 ring-1 ring-emerald-100">{t.setupDone}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {stepLabels[language].map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index as WizardStep)}
            className={`min-h-10 rounded-2xl px-3 text-sm font-black transition active:scale-[0.98] ${
              step === index ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-3xl bg-white p-4 ring-1 ring-slate-200/80">
        {step === 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeProfiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => selectProfile(profile.id)}
                className={`min-h-44 rounded-3xl p-4 text-left transition active:scale-[0.99] ${
                  printerSettings.profileId === profile.id ? "bg-emerald-50 ring-2 ring-emerald-500" : "bg-white ring-1 ring-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-950">{profile.label[language]}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">{profile.manufacturer} {profile.model}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{statusLabels[profile.status][language]}</span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{profile.description[language]}</p>
                <div className="mt-3 grid gap-1 text-sm font-black text-slate-800">
                  <p>{labels.paper}: {formatProfilePaper(profile)}</p>
                  <p>{language === "de" ? "Anschluss" : "Connection"}: {profile.connectionOptions.join(", ")}</p>
                  <p>{language === "de" ? "Cutter" : "Cutter"}: {profile.hasCutter ? labels.cutterMode : labels.tearMode}</p>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
              <p className="text-lg font-black text-emerald-950">{t.requirements}</p>
              <ul className="mt-4 grid gap-3 text-base font-bold leading-7 text-slate-800">
                <li>Windows 10 / Windows 11</li>
                <li>Chrome oder Edge</li>
                <li>QZ Tray gestartet</li>
                <li>{language === "de" ? "Windows-Druckertreiber installiert" : "Windows printer driver installed"}</li>
                <li>{language === "de" ? "Drucker verbunden, eingeschaltet und Papier eingelegt" : "Printer connected, powered on, and paper loaded"}</li>
              </ul>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-lg font-black text-slate-950">QZ Tray</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{labels.qzTrayDirectPrint}</p>
              <button type="button" onClick={checkQzTray} className="mt-4 min-h-12 rounded-2xl bg-slate-950 px-5 text-base font-black text-white transition active:scale-[0.98]">
                {qzStatus === "checking" ? labels.loadingProducts : t.connectQz}
              </button>
              {qzStatus === "connected" ? <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-950 ring-1 ring-emerald-100">{t.qzConnected}</p> : null}
              {qzStatus === "missing" || qzStatus === "error" ? <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-950 ring-1 ring-amber-200">{t.qzMissing}</p> : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-lg font-black text-slate-950">{selectedProfile.displayName}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selectedProfile.driverHint[language]}</p>
              <ol className="mt-4 grid gap-3 text-base font-bold leading-7 text-slate-800">
                {selectedProfile.installationGuide[language].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
            <div className="rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-200">
              <p className="text-lg font-black text-amber-950">{language === "de" ? "Hinweise" : "Notes"}</p>
              <ul className="mt-4 grid gap-3 text-base font-bold leading-7 text-amber-950">
                {selectedProfile.knownNotes[language].map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <div className="mt-5 rounded-2xl bg-white/80 p-4 text-sm font-bold leading-6 text-slate-700 ring-1 ring-amber-100">
                {selectedProfile.recommendedSettings[language].map((setting) => (
                  <p key={setting}>{setting}</p>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-black text-slate-950">{t.chooseWindowsPrinter}</p>
                <button type="button" onClick={checkQzTray} className="min-h-11 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition active:scale-[0.98]">
                  {t.connectQz}
                </button>
              </div>
              <div className="mt-4 grid gap-2">
                {qzPrinters.length ? (
                  qzPrinters.map((printer) => (
                    <button
                      key={printer}
                      type="button"
                      onClick={() => updateSettings({ qzPrinterName: printer, outputMode: "qz_tray" })}
                      className={`min-h-12 rounded-2xl px-4 text-left text-sm font-black transition active:scale-[0.98] ${
                        printerSettings.qzPrinterName === printer ? "bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500" : "bg-white text-slate-800 ring-1 ring-slate-200"
                      }`}
                    >
                      {printer}
                    </button>
                  ))
                ) : (
                  <p className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-600 ring-1 ring-slate-200">
                    {language === "de" ? "Noch keine QZ-Druckerliste geladen. Du kannst den Windows-Druckernamen auch manuell eintragen." : "No QZ printer list has been loaded yet. You can also enter the Windows printer name manually."}
                  </p>
                )}
              </div>
            </div>
            <label className="grid content-start gap-2 rounded-3xl bg-white p-5 text-sm font-bold uppercase tracking-widest text-slate-500 ring-1 ring-slate-200">
              {t.manualPrinterName}
              <input
                type="text"
                value={printerSettings.qzPrinterName}
                onChange={(event) => updateSettings({ qzPrinterName: event.target.value, outputMode: "qz_tray" })}
                placeholder={selectedProfile.qzPrinterHints[0] ?? "Brother TD-4000"}
                className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base font-black normal-case tracking-normal text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
              <p className="mt-2 normal-case tracking-normal text-slate-600">{language === "de" ? "Der Name muss exakt dem Windows-Druckernamen entsprechen." : "The name must exactly match the Windows printer name."}</p>
            </label>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1fr]">
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-lg font-black text-slate-950">{labels.testPrint}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {language === "de" ? "Der Testbon prueft Modell, Papierbreite, Sonderzeichen, Schriftgroessen und Schnitt am Job-Ende." : "The test voucher checks model, paper width, special characters, font sizes, and cutting at job end."}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={printQzTestVoucher} disabled={isPrinting} className="min-h-14 rounded-2xl bg-emerald-600 px-5 text-base font-black text-white transition active:scale-[0.98] disabled:opacity-60">
                  {isPrinting ? labels.saving : t.qzTest}
                </button>
                <button type="button" onClick={printBrowserTestVoucher} className="min-h-14 rounded-2xl bg-slate-950 px-5 text-base font-black text-white transition active:scale-[0.98]">
                  {t.browserTest}
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/75">
              <p className="text-sm font-black text-slate-700">{labels.testPrintPreview}</p>
              <div className={`print-flow-${testPrintJob.flow} mt-3 max-w-[var(--printer-printable-width)]`} style={testPrintJob.printerStyle}>
                <TestVoucher labels={labels} language={language} printerSettings={printerSettings} printedAt={previewDate} />
              </div>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
              <p className="text-xl font-black text-emerald-950">{language === "de" ? "Einrichtung abschliessen" : "Finish printer setup"}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
                {language === "de" ? "Wenn der Testbon korrekt gedruckt wurde, speichert EventBon dieses Profil lokal auf diesem Geraet." : "If the test voucher printed correctly, eventBon saves this profile locally on this device."}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={confirmSuccessfulSetup} className="min-h-14 rounded-2xl bg-emerald-600 px-5 text-base font-black text-white transition active:scale-[0.98]">
                  {t.confirmed}
                </button>
                <button type="button" onClick={() => setStep(4)} className="min-h-14 rounded-2xl bg-white px-5 text-base font-black text-slate-800 ring-1 ring-emerald-200 transition active:scale-[0.98]">
                  {t.retest}
                </button>
              </div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm font-black uppercase tracking-widest text-slate-500">{language === "de" ? "Gespeicherte Auswahl" : "Saved selection"}</p>
              <p className="mt-2 text-base font-black text-slate-950">{selectedProfile.displayName}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">{printerSettings.qzPrinterName || labels.browserPrintFallback}</p>
              {printerSettings.testConfirmedAt ? <p className="mt-3 text-sm font-bold text-slate-600">{formatDateTime(new Date(printerSettings.testConfirmedAt), language)}</p> : null}
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

        {testResult ? (
          <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-black leading-6 ${testResult === "success" ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100" : "bg-amber-50 text-amber-950 ring-1 ring-amber-200"}`}>
            {testResult === "success" ? labels.printerTestSuccessMessage : labels.printerTestProblemMessage}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => (canGoBack ? setStep((step - 1) as WizardStep) : setStep(0))} className="min-h-12 rounded-2xl bg-white px-5 text-base font-black text-slate-800 ring-1 ring-slate-300 transition active:scale-[0.98]">
            {t.back}
          </button>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/printer-test-lab"
              className="inline-flex min-h-12 items-center rounded-2xl bg-slate-100 px-5 text-base font-black text-slate-800 ring-1 ring-slate-200 transition active:scale-[0.98]"
            >
              Drucker Testlabor
            </Link>
            <button type="button" onClick={() => (canGoNext ? setStep((step + 1) as WizardStep) : confirmSuccessfulSetup())} className="min-h-12 rounded-2xl bg-slate-950 px-5 text-base font-black text-white transition active:scale-[0.98]">
              {canGoNext ? t.next : t.finish}
            </button>
          </div>
        </div>
      </div>

      {testPrintDate ? (
        <div className="print-preview-overlay fixed inset-0 z-[420] flex items-center justify-center bg-slate-950/60 p-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={labels.testPrintPreview}>
          <style>{testPrintJob.pageStyle}</style>
          <div className="print-preview-frame flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="print-preview-chrome shrink-0 border-b border-slate-200 px-7 py-5">
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{labels.terminalSetup}</p>
              <h2 className="mt-1 text-3xl font-black tracking-normal text-slate-950">{labels.testPrint}</h2>
            </div>
            <div className="print-preview-scroll min-h-0 flex-1 overflow-y-auto bg-slate-100 p-6">
              <div className={`print-area print-flow-${testPrintJob.flow} mx-auto grid max-w-[var(--printer-printable-width)]`} style={testPrintJob.printerStyle}>
                <TestVoucher labels={labels} language={language} printerSettings={printerSettings} printedAt={testPrintDate} />
              </div>
            </div>
            <div className="print-preview-actions z-10 flex shrink-0 justify-end border-t border-slate-200 bg-white/95 px-7 py-5 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
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
