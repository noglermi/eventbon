import type { Translation } from "./i18n";
import type { Language } from "./types";

type PaymentPanelProps = {
  labels: Translation;
  language: Language;
  receivedCents: number;
  receivedEntry: string;
  totalCents: number;
  onReceivedEntryChange: (value: string) => void;
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
const numpadButtonClass = "flex min-h-16 items-center justify-center rounded-2xl bg-white text-2xl font-black text-slate-800 shadow-sm ring-1 ring-slate-200 transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200";

function formatCents(cents: number) {
  return currency.format(cents / 100);
}

export function PaymentPanel({ labels, language, receivedCents, receivedEntry, totalCents, onReceivedEntryChange }: PaymentPanelProps) {
  const changeCents = Math.max(receivedCents - totalCents, 0);
  const decimalSeparator = language === "de" ? "," : ".";
  const displayedReceived = (receivedEntry || "0").replace(/[,.]/, decimalSeparator);

  function appendDigit(digit: string) {
    if (receivedEntry === "0") {
      onReceivedEntryChange(digit);
      return;
    }

    const separator = receivedEntry.includes(",") ? "," : receivedEntry.includes(".") ? "." : null;
    if (separator) {
      const [, decimals = ""] = receivedEntry.split(separator);
      if (decimals.length >= 2) {
        return;
      }
    }

    onReceivedEntryChange(receivedEntry + digit);
  }

  function appendSeparator() {
    if (receivedEntry.includes(",") || receivedEntry.includes(".")) {
      return;
    }

    onReceivedEntryChange((receivedEntry || "0") + decimalSeparator);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200/70">
      <div className="shrink-0 border-b border-slate-100 px-6 py-5">
        <h2 className="text-3xl font-black tracking-normal text-slate-950">{labels.payment}</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">{labels.received} (EUR)</p>
          <div className="mt-3 rounded-2xl bg-white px-4 py-4 text-5xl font-black tabular-nums text-slate-950 ring-1 ring-emerald-200">
            {displayedReceived}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button key={digit} type="button" onClick={() => appendDigit(digit)} className={numpadButtonClass}>{digit}</button>
          ))}
          <button type="button" onClick={() => onReceivedEntryChange("")} className={numpadButtonClass + " text-rose-700 focus-visible:ring-rose-200"}>C</button>
          <button type="button" onClick={() => appendDigit("0")} className={numpadButtonClass}>0</button>
          <button type="button" onClick={appendSeparator} className={numpadButtonClass}>{decimalSeparator}</button>
        </div>

        <div className="mt-5 rounded-3xl bg-emerald-500 p-5 text-white shadow-lg shadow-emerald-500/20">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-100">{labels.change}</p>
          <p className="mt-2 text-5xl font-black tracking-normal">{formatCents(changeCents)}</p>
        </div>
      </div>
    </section>
  );
}
