"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type QzTray = typeof import("qz-tray").default;

type ConnectionState = "not_checked" | "library_loaded" | "connected" | "unavailable" | "error";
type PrintState = "idle" | "printing" | "success" | "error";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unbekannter Fehler";
}

function normalizePrinters(result: string[] | string) {
  return Array.isArray(result) ? result : [result];
}

function isBrotherTdPrinter(printerName: string) {
  const normalized = printerName.toLowerCase();
  return normalized.includes("brother") && normalized.includes("td");
}

function buildTestPrintHtml(now: Date) {
  return `
    <html>
      <body style="margin:0;padding:12px;font-family:Arial,sans-serif;color:#000;">
        <main style="width:58mm;min-height:60mm;box-sizing:border-box;padding:3mm;text-align:center;">
          <h1 style="margin:0 0 8px;font-size:18px;font-weight:900;">eventBon</h1>
          <p style="margin:0 0 8px;font-size:14px;font-weight:900;">QZ Tray Testdruck</p>
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;">Brother TD-4000</p>
          <p style="margin:0;font-size:10px;font-weight:700;">${now.toLocaleString("de-AT")}</p>
        </main>
      </body>
    </html>
  `;
}

export function QzTrayTestLab() {
  const [qz, setQz] = useState<QzTray | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("not_checked");
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [printState, setPrintState] = useState<PrintState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);

  const detectedBrotherPrinter = useMemo(() => printers.find(isBrotherTdPrinter) ?? "", [printers]);
  const isConnected = connectionState === "connected";

  async function loadQzTray() {
    if (qz) {
      return qz;
    }

    const qzModule = (await import("qz-tray")).default;
    setQz(qzModule);
    setConnectionState(qzModule.websocket.isActive() ? "connected" : "library_loaded");
    return qzModule;
  }

  async function connectToQzTray() {
    setIsConnecting(true);
    setMessage(null);
    setTechnicalDetails(null);

    try {
      const qzApi = await loadQzTray();

      if (!qzApi.websocket.isActive()) {
        await qzApi.websocket.connect();
      }

      setConnectionState("connected");
      setMessage("QZ Tray ist verbunden.");
      await loadPrinters(qzApi);
    } catch (error) {
      setConnectionState("unavailable");
      setMessage("QZ Tray ist auf diesem Gerät nicht installiert.");
      setTechnicalDetails(getErrorMessage(error));
    } finally {
      setIsConnecting(false);
    }
  }

  async function loadPrinters(existingQz?: QzTray) {
    setIsLoadingPrinters(true);
    setMessage(null);
    setTechnicalDetails(null);

    try {
      const qzApi = existingQz ?? await loadQzTray();

      if (!qzApi.websocket.isActive()) {
        setMessage("Bitte zuerst mit QZ Tray verbinden.");
        return;
      }

      const printerResult = await qzApi.printers.find();
      const availablePrinters = normalizePrinters(printerResult);
      const brotherPrinter = availablePrinters.find(isBrotherTdPrinter) ?? "";

      setPrinters(availablePrinters);
      setSelectedPrinter((current) => current || brotherPrinter || availablePrinters[0] || "");
      setConnectionState("connected");
      setMessage(availablePrinters.length > 0 ? "Druckerliste geladen." : "Keine Drucker gefunden.");
    } catch (error) {
      setConnectionState("error");
      setMessage("Druckerliste konnte nicht geladen werden.");
      setTechnicalDetails(getErrorMessage(error));
    } finally {
      setIsLoadingPrinters(false);
    }
  }

  async function printTestBon() {
    if (!selectedPrinter) {
      setMessage("Bitte zuerst einen Drucker auswählen.");
      return;
    }

    setPrintState("printing");
    setMessage(null);
    setTechnicalDetails(null);

    try {
      const qzApi = qz ?? await loadQzTray();

      if (!qzApi.websocket.isActive()) {
        await qzApi.websocket.connect();
        setConnectionState("connected");
      }

      const config = qzApi.configs.create(selectedPrinter, {
        copies: 1,
        density: 203,
        units: "mm",
        size: { width: 58, height: 60 },
        margins: 0,
      });

      await qzApi.print(config, [{
        type: "pixel",
        format: "html",
        flavor: "plain",
        data: buildTestPrintHtml(new Date()),
      }]);

      setPrintState("success");
      setMessage("Testdruck wurde an QZ Tray gesendet.");
    } catch (error) {
      setPrintState("error");
      setMessage("Testdruck konnte nicht gesendet werden.");
      setTechnicalDetails(getErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f4ef] p-6 text-slate-950">
      <div className="mx-auto grid max-w-5xl gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-black tracking-normal text-emerald-600">eventBon</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Drucker Testlabor</h1>
            <p className="mt-2 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              Entwickler-Test für QZ Tray. Dieses Labor ersetzt den bestehenden Bondruck nicht und verändert keine Verkaufsabläufe.
            </p>
          </div>
          <Link
            href="/"
            className="min-h-12 rounded-lg bg-white px-5 py-3 text-base font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            Zurück zu eventBon
          </Link>
        </header>

        <section className="grid gap-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">QZ Tray</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Verbindung</h2>
            </div>
            <span className={"rounded-full px-4 py-2 text-sm font-black " + (isConnected ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "bg-amber-50 text-amber-900 ring-1 ring-amber-200")}>
              {isConnected ? "Verbunden" : connectionState === "unavailable" ? "Nicht installiert" : "Nicht verbunden"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={connectToQzTray}
              disabled={isConnecting}
              className="min-h-14 rounded-lg bg-emerald-600 px-6 text-lg font-black text-white shadow-sm shadow-emerald-700/20 transition active:scale-[0.98] disabled:cursor-wait disabled:bg-emerald-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              {isConnecting ? "Verbindung wird aufgebaut..." : "Mit QZ Tray verbinden"}
            </button>
            <button
              type="button"
              onClick={() => loadPrinters()}
              disabled={!isConnected || isLoadingPrinters}
              className="min-h-14 rounded-lg bg-slate-950 px-6 text-lg font-black text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
            >
              {isLoadingPrinters ? "Drucker werden geladen..." : "Drucker suchen"}
            </button>
          </div>

          {message ? (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900 ring-1 ring-amber-200">
              {message}
            </p>
          ) : null}

          {technicalDetails ? (
            <details className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
              <summary className="cursor-pointer font-black text-slate-900">Technische Details</summary>
              <pre className="mt-3 whitespace-pre-wrap break-words text-xs leading-5">{technicalDetails}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Drucker</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Brother TD-4000 auswählen</h2>
            <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
              QZ Tray liefert die lokal installierten Drucker. Für den aktuellen Test bitte den Brother TD-4000 auswählen.
            </p>
          </div>

          {detectedBrotherPrinter ? (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 ring-1 ring-emerald-100">
              Brother TD-Drucker erkannt: {detectedBrotherPrinter}
            </p>
          ) : null}

          <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            Verfügbare Drucker
            <select
              value={selectedPrinter}
              onChange={(event) => setSelectedPrinter(event.target.value)}
              disabled={printers.length === 0}
              className="min-h-14 rounded-lg border border-slate-200 bg-white px-4 text-base font-black normal-case tracking-normal text-slate-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              {printers.length === 0 ? (
                <option value="">Noch keine Drucker geladen</option>
              ) : printers.map((printer) => (
                <option key={printer} value={printer}>{printer}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={printTestBon}
            disabled={!selectedPrinter || printState === "printing"}
            className="min-h-14 rounded-lg bg-slate-950 px-6 text-lg font-black text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
          >
            {printState === "printing" ? "Testdruck wird gesendet..." : "QZ Testbon drucken"}
          </button>

          <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-sm font-black uppercase tracking-widest text-slate-500">Testbon Inhalt</p>
            <div className="mt-3 max-w-xs rounded bg-white p-4 font-mono text-sm font-bold leading-6 ring-1 ring-slate-200">
              <p>eventBon</p>
              <p>QZ Tray Testdruck</p>
              <p>Brother TD-4000</p>
              <p>Datum/Uhrzeit</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
