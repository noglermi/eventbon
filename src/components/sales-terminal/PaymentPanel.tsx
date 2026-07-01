type PaymentMethod = "cash" | "card";

type PaymentPanelProps = {
  total: number;
  received: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onReceivedChange: (value: number) => void;
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });

export function PaymentPanel({ total, received, paymentMethod, onPaymentMethodChange, onReceivedChange }: PaymentPanelProps) {
  const change = Math.max(received - total, 0);
  const activeClass = "bg-slate-950 text-white shadow-lg";
  const inactiveClass = "bg-slate-100 text-slate-700 hover:bg-slate-200";

  return (
    <section className="space-y-6 border-t border-dashed border-slate-300 pt-6">
      <div className="flex items-end justify-between gap-4">
        <span className="text-lg font-black text-slate-500">Total</span>
        <span className="text-5xl font-black tracking-normal text-slate-950">{currency.format(total)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onPaymentMethodChange("cash")}
          className={"min-h-16 rounded-2xl text-xl font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (paymentMethod === "cash" ? activeClass : inactiveClass)}
        >
          Cash
        </button>
        <button
          type="button"
          onClick={() => onPaymentMethodChange("card")}
          className={"min-h-16 rounded-2xl text-xl font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (paymentMethod === "card" ? activeClass : inactiveClass)}
        >
          Card
        </button>
      </div>

      <div className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
        <label htmlFor="received" className="text-sm font-bold uppercase tracking-widest text-emerald-700">Received</label>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="received"
            type="number"
            min={0}
            step="0.5"
            value={received}
            onChange={(event) => onReceivedChange(Number(event.target.value))}
            className="min-h-16 w-full rounded-2xl border border-emerald-200 bg-white px-4 text-3xl font-black text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200"
          />
          <span className="text-3xl font-black text-emerald-900">{"\u20ac"}</span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <span className="text-lg font-black text-emerald-800">Change</span>
          <span className="text-4xl font-black tracking-normal text-emerald-950">{currency.format(change)}</span>
        </div>
      </div>

      <button type="button" className="min-h-20 w-full rounded-[1.75rem] bg-emerald-500 px-6 text-2xl font-black tracking-normal text-white shadow-xl shadow-emerald-500/25 transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 active:scale-[0.99]">
        PRINT VOUCHERS
      </button>
    </section>
  );
}
