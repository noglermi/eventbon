import type { Translation } from "./i18n";
import type { Language, PaymentMethod } from "./types";

type PaymentPanelProps = {
  labels: Translation;
  language: Language;
  totalCents: number;
  receivedCents: number;
  receivedEntry: string;
  paymentMethod: PaymentMethod | null;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onReceivedEntryChange: (value: string) => void;
  onClearSale: () => void;
  onOpenPrintPreview: () => void;
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
const numpadButtonClass = "flex min-h-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 active:scale-95";

function formatCents(cents: number) {
  return currency.format(cents / 100);
}

export function PaymentPanel({ labels, language, totalCents, receivedCents, receivedEntry, paymentMethod, onPaymentMethodChange, onReceivedEntryChange, onClearSale, onOpenPrintPreview }: PaymentPanelProps) {
  const changeCents = Math.max(receivedCents - totalCents, 0);
  const activeClass = "bg-slate-950 text-white shadow-lg";
  const inactiveClass = "bg-slate-100 text-slate-700 hover:bg-slate-200";
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
    <section className="space-y-5 border-t border-dashed border-slate-300 pt-6">
      <div className="flex items-end justify-between gap-4">
        <span className="text-lg font-black text-slate-500">{labels.total}</span>
        <span className="text-5xl font-black tracking-normal text-slate-950">{formatCents(totalCents)}</span>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{labels.payment}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPaymentMethodChange("cash")}
            className={"min-h-14 rounded-2xl text-xl font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (paymentMethod === "cash" ? activeClass : inactiveClass)}
          >
            {labels.cash}
          </button>
          <button
            type="button"
            onClick={() => onPaymentMethodChange("card")}
            className={"min-h-14 rounded-2xl text-xl font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (paymentMethod === "card" ? activeClass : inactiveClass)}
          >
            {labels.card}
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">{labels.received}</p>
            <div className="mt-2 rounded-2xl bg-white px-4 py-3 text-4xl font-black tabular-nums text-slate-950 ring-1 ring-emerald-200">
              {displayedReceived} <span className="text-3xl text-emerald-900">{"\u20ac"}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">{labels.change}</p>
            <p className="mt-3 text-4xl font-black tracking-normal text-emerald-950">{formatCents(changeCents)}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button key={digit} type="button" onClick={() => appendDigit(digit)} className={numpadButtonClass}>
              {digit}
            </button>
          ))}
          <button type="button" onClick={() => onReceivedEntryChange("")} className={numpadButtonClass + " text-rose-700 hover:bg-rose-50 focus-visible:ring-rose-200"}>
            C
          </button>
          <button type="button" onClick={() => appendDigit("0")} className={numpadButtonClass}>
            0
          </button>
          <button type="button" onClick={appendSeparator} className={numpadButtonClass}>
            {decimalSeparator}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onClearSale}
        className="min-h-14 w-full rounded-2xl bg-rose-50 px-5 text-lg font-black text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
      >
        {labels.clearSale}
      </button>

      <button type="button" onClick={onOpenPrintPreview} className="min-h-20 w-full rounded-[1.75rem] bg-emerald-500 px-6 text-2xl font-black tracking-normal text-white shadow-xl shadow-emerald-500/25 transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 active:scale-[0.99]">
        {labels.printVouchers}
      </button>
    </section>
  );
}
