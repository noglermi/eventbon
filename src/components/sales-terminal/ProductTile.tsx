import type { ProductTileData } from "./types";

type ProductTileProps = {
  product: ProductTileData;
  onSelect: (product: ProductTileData) => void;
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });

export function ProductTile({ product, onSelect }: ProductTileProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group flex min-h-40 flex-col justify-between rounded-[2rem] p-5 text-left shadow-sm ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 active:translate-y-0"
      style={{ backgroundColor: product.color, color: product.textColor ?? "#111827" }}
    >
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white/45 text-4xl shadow-inner ring-1 ring-white/50 backdrop-blur">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt="" className="h-9 w-9 object-contain" />
        ) : (
          <span aria-hidden="true">{product.icon}</span>
        )}
      </span>
      <span className="space-y-1">
        <span className="block text-2xl font-black leading-tight tracking-normal">{product.name}</span>
        <span className="block text-xl font-bold opacity-85">{currency.format(product.price)}</span>
      </span>
    </button>
  );
}
