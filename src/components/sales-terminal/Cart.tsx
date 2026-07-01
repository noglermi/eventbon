import type { CartItem } from "./types";

type CartProps = {
  items: CartItem[];
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });

export function Cart({ items, onIncrease, onDecrease }: CartProps) {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Current order</p>
        <h2 className="mt-1 text-3xl font-black tracking-normal text-slate-950">Current sale</h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.productId} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-xl font-black text-slate-950">{item.quantity} {"\u00d7"} {item.name}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{currency.format(item.price)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDecrease(item.productId)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                aria-label={"Decrease " + item.name}
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onIncrease(item.productId)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                aria-label={"Increase " + item.name}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
