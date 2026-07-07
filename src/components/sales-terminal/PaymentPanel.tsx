import type { RefObject } from "react";
import type { Translation } from "./i18n";
import type { Language, PaymentMethod } from "./types";

type PaymentPanelProps = {
  labels: Translation;
  language: Language;
  paymentMethod: PaymentMethod;
  receivedCents: number;
  receivedEntry: string;
  receivedInputRef?: RefObject<HTMLInputElement | null>;
  totalCents: number;
  onPaymentMethodChange: (paymentMethod: PaymentMethod) => void;
  onReceivedEntryChange: (value: string) => void;
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
const numpadButtonBaseClass = "flex min-h-16 items-center justify-center rounded-2xl text-4xl font-black tracking-normal shadow-[inset_0_-3px_0_rgba(15,23,42,0.22),0_10px_20px_rgba(15,23,42,0.12)] ring-1 transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200";
const numpadButtonClass = numpadButtonBaseClass + " bg-slate-900 text-white ring-slate-700/70 hover:bg-slate-800 active:bg-slate-950";

function formatCents(cents: number) {
  return currency.format(cents / 100);
}

export function PaymentPanel({ labels, language, paymentMethod, receivedCents, receivedEntry, receivedInputRef, totalCents, onPaymentMethodChange, onReceivedEntryChange }: PaymentPanelProps) {
  const changeCents = Math.max(receivedCents - totalCents, 0);
  const decimalSeparator = language === "de" ? "," : ".";
  const displayedReceived = receivedEntry.replace(/[,.]/, decimalSeparator);
  const clearLabel = language === "de" ? "L\u00d6SCHEN" : "CLEAR";

  function focusReceivedInput() {
    requestAnimationFrame(() => receivedInputRef?.current?.focus());
  }

  function updateReceivedEntry(value: string) {
    onReceivedEntryChange(value);
    focusReceivedInput();
  }

  function normalizeEntry(value: string) {
    const input = value.replace(/[^\d,.]/g, "").replace(/[,.]/g, decimalSeparator);
    const [euros = "", ...centParts] = input.split(decimalSeparator);

    if (centParts.length === 0) {
      return euros;
    }

    return euros + decimalSeparator + centParts.join("").slice(0, 2);
  }

  function handleKeyboardEntry(value: string) {
    onReceivedEntryChange(normalizeEntry(value));
  }

  function appendDigit(digit: string) {
    if (receivedEntry === "0") {
      updateReceivedEntry(digit);
      return;
    }

    const separator = receivedEntry.includes(",") ? "," : receivedEntry.includes(".") ? "." : null;
    if (separator) {
      const [, decimals = ""] = receivedEntry.split(separator);
      if (decimals.length >= 2) {
        return;
      }
    }

    updateReceivedEntry(receivedEntry + digit);
  }

  function appendSeparator() {
    if (receivedEntry.includes(",") || receivedEntry.includes(".")) {
      return;
    }

    updateReceivedEntry((receivedEntry || "0") + decimalSeparator);
  }

  function removeLastDigit() {
    const shortenedEntry = receivedEntry.slice(0, -1);
    updateReceivedEntry(shortenedEntry.replace(/[,.]$/, ""));
  }

  function clearAmount() {
    updateReceivedEntry("");
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[2.25rem] bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/75">
      <div className="shrink-0 border-b border-slate-100 px-7 py-6">
        <h2 className="text-3xl font-black tracking-tight text-slate-950">{labels.payment}</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mb-5 grid grid-cols-2 gap-3">
          {([
            ["cash", labels.cash],
            ["card_manual", labels.card],
          ] as Array<[PaymentMethod, string]>).map(([method, label]) => (
            <button
              key={method}
              type="button"
              onClick={() => onPaymentMethodChange(method)}
              className={"min-h-14 rounded-2xl px-5 text-lg font-black transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (paymentMethod === method ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" : "bg-white text-slate-700 ring-1 ring-slate-200/80")}
              aria-pressed={paymentMethod === method}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-slate-300/90">
          <p className="text-sm font-black uppercase tracking-widest text-slate-700">{labels.received} (EUR)</p>
          <input
            ref={receivedInputRef}
            type="text"
            inputMode="decimal"
            value={displayedReceived}
            onChange={(event) => handleKeyboardEntry(event.target.value)}
            className="mt-3 h-20 w-full rounded-2xl bg-white px-4 py-0 text-6xl font-black leading-none tabular-nums text-slate-950 shadow-inner outline-none ring-2 ring-slate-300 transition placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-200"
            aria-label={labels.received}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button key={digit} type="button" onClick={() => appendDigit(digit)} className={numpadButtonClass}>{digit}</button>
          ))}
          <button type="button" onClick={removeLastDigit} className={numpadButtonClass + " text-5xl"} aria-label={language === "de" ? "Letzte Ziffer l\u00f6schen" : "Delete last digit"}>{"\u232b"}</button>
          <button type="button" onClick={() => appendDigit("0")} className={numpadButtonClass}>0</button>
          <button type="button" onClick={appendSeparator} className={numpadButtonClass}>{decimalSeparator}</button>
          <button type="button" onClick={clearAmount} className={numpadButtonBaseClass + " col-span-3 bg-rose-50 text-xl font-black text-rose-800 ring-rose-200 hover:bg-rose-100 active:bg-rose-100 focus-visible:ring-rose-200"} aria-label={language === "de" ? "Betrag l\u00f6schen" : "Clear amount"}>{clearLabel}</button>
        </div>

        <div className="mt-5 rounded-[1.75rem] bg-emerald-700 p-5 text-white shadow-[0_16px_32px_rgba(5,150,105,0.26)] ring-1 ring-emerald-800/20">
          <p className="text-sm font-black uppercase tracking-widest text-emerald-50">{labels.change}</p>
          <p className="mt-2 text-5xl font-black tracking-normal tabular-nums drop-shadow-sm">{formatCents(changeCents)}</p>
        </div>
      </div>
    </section>
  );
}
