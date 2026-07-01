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
      className="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
    >
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 text-4xl ring-1 ring-slate-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt="" className="h-9 w-9 object-contain" />
        ) : (
          <span aria-hidden="true">{product.icon}</span>
        )}
      </span>
      <span className="mt-4 block text-xl font-black leading-tight text-slate-950">{product.name[language]}</span>
      <span className="mt-1 block text-base font-bold text-slate-500">{currency.format(product.price)}</span>
    </button>
  );
}
