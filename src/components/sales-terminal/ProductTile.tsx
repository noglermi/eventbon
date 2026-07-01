import type { Language, ProductTileData } from "./types";

type ProductTileProps = {
  language: Language;
  product: ProductTileData;
  onSelect: (product: ProductTileData) => void;
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });

export function ProductTile({ language, product, onSelect }: ProductTileProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="flex min-h-40 flex-col items-center justify-center rounded-[1.75rem] border border-slate-200/75 bg-white p-5 text-center shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
    >
      <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] bg-slate-50 text-5xl ring-1 ring-slate-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt="" className="h-12 w-12 object-contain" />
        ) : (
          <span aria-hidden="true">{product.icon}</span>
        )}
      </span>
      <span className="mt-5 block text-xl font-black leading-tight tracking-tight text-slate-950">{product.name[language]}</span>
      <span className="mt-1.5 block text-base font-bold tabular-nums text-slate-500">{currency.format(product.price)}</span>
    </button>
  );
}
