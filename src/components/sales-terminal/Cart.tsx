import type { Translation } from "./i18n";
import type { CartItem, Language, ProductTileData } from "./types";

type CartProps = {
  items: CartItem[];
  language: Language;
  labels: Translation;
  productsById: Map<string, ProductTileData>;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
const controlButtonClass = "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 active:scale-95";

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function Cart({ items, language, labels, productsById, onIncrease, onDecrease, onRemove }: CartProps) {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{labels.currentOrder}</p>
        <h2 className="mt-1 text-3xl font-black tracking-normal text-slate-950">{labels.currentSale}</h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const product = productsById.get(item.productId);
          if (!product) {
            return null;
          }

          const productName = product.name[language];

          return (
            <div key={item.productId} className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl bg-slate-50 p-4">
              <div className="min-w-0">
                <p className="truncate text-2xl font-black leading-tight text-slate-950">{productName}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{currency.format(product.price)} {labels.unitPriceSuffix}</p>
              </div>
              <div className="grid grid-cols-[3rem_2.5rem_3rem_3rem] items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDecrease(item.productId)}
                  className={controlButtonClass}
                  aria-label={labels.decrease + " " + productName}
                >
                  -
                </button>
                <span className="text-center text-2xl font-black tabular-nums text-slate-950">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => onIncrease(item.productId)}
                  className={controlButtonClass}
                  aria-label={labels.increase + " " + productName}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.productId)}
                  className={controlButtonClass + " text-rose-700 hover:bg-rose-50 focus-visible:ring-rose-200"}
                  aria-label={labels.remove + " " + productName}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
