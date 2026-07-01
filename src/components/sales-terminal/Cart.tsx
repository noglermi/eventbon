import type { Translation } from "./i18n";
import type { CartItem, Language, ProductTileData } from "./types";

type CartProps = {
  items: CartItem[];
  language: Language;
  labels: Translation;
  productsById: Map<string, ProductTileData>;
  totalCents: number;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
const controlButtonClass = "flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.95rem] bg-white text-2xl font-black text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200";

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

function ProductMark({ product }: { product: ProductTileData }) {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 text-3xl ring-1 ring-slate-200/75">
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt="" className="h-8 w-8 object-contain" />
      ) : (
        <span aria-hidden="true">{product.icon}</span>
      )}
    </span>
  );
}

export function Cart({ items, language, labels, productsById, totalCents, onIncrease, onDecrease, onRemove }: CartProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[2.25rem] bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/75">
      <div className="shrink-0 border-b border-slate-100 px-7 py-6">
        <h2 className="text-3xl font-black tracking-tight text-slate-950">{labels.cart}</h2>
      </div>

      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-5">
        {items.map((item) => {
          const product = productsById.get(item.productId);
          if (!product) {
            return null;
          }

          const productName = product.name[language];

          return (
            <div key={item.productId} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-[1.35rem] bg-white p-3.5 shadow-sm ring-1 ring-slate-200/70">
              <ProductMark product={product} />
              <div className="min-w-0">
                <p className="truncate text-[1.35rem] font-black leading-tight tracking-tight text-slate-950">{productName}</p>
                <p className="mt-1 text-sm font-bold tabular-nums text-slate-500">{currency.format(product.price)}</p>
              </div>
              <div className="grid grid-cols-[3rem_2.25rem_3rem_3rem] items-center gap-2">
                <button type="button" onClick={() => onDecrease(item.productId)} className={controlButtonClass} aria-label={labels.decrease + " " + productName}>-</button>
                <span className="text-center text-xl font-black tabular-nums text-slate-950">{item.quantity}</span>
                <button type="button" onClick={() => onIncrease(item.productId)} className={controlButtonClass} aria-label={labels.increase + " " + productName}>+</button>
                <button type="button" onClick={() => onRemove(item.productId)} className={controlButtonClass + " text-rose-700 focus-visible:ring-rose-200"} aria-label={labels.remove + " " + productName}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-slate-100 p-5">
        <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)]">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-300">{labels.sum}</p>
          <p className="mt-2 text-4xl font-black tracking-tight tabular-nums">{currency.format(totalCents / 100)}</p>
        </div>
      </div>
    </section>
  );
}
