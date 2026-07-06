import type { Language, ProductTileData } from "./types";

type ProductTileProps = {
  language: Language;
  product: ProductTileData;
  editLabel?: string;
  onSelect: (product: ProductTileData) => void;
  onEdit?: (product: ProductTileData) => void;
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
const defaultImageCrop = { zoom: 1, x: 50, y: 50 };

function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function ProductTile({ language, product, editLabel, onSelect, onEdit }: ProductTileProps) {
  const productName = product.name[language];
  const imageCrop = product.imageCrop ?? defaultImageCrop;

  return (
    <article
      className="grid min-h-52 grid-rows-[1fr_auto] overflow-hidden rounded-[1.75rem] border border-slate-200/75 bg-white text-center shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
      style={{ backgroundColor: product.color, color: product.textColor ?? "#0f172a" }}
    >
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="flex min-h-40 flex-col items-center justify-center p-4 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
      >
        <span className={"flex items-center justify-center overflow-hidden rounded-[1.5rem] bg-white/85 ring-1 ring-black/5 " + (product.image ? "h-28 w-full" : "h-20 w-20 text-5xl")}>
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt=""
              className="h-full w-full object-cover"
              style={{
                objectPosition: imageCrop.x + "% " + imageCrop.y + "%",
                transform: "scale(" + imageCrop.zoom + ")",
                transformOrigin: imageCrop.x + "% " + imageCrop.y + "%",
              }}
            />
          ) : (
            <span aria-hidden="true">{product.icon}</span>
          )}
        </span>
        <span className="mt-4 block text-xl font-black leading-tight tracking-tight">{productName}</span>
        <span className="mt-1.5 block text-base font-bold tabular-nums opacity-80">{currency.format(product.price)}</span>
      </button>
      {onEdit && editLabel ? (
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="flex min-h-12 items-center justify-center gap-2 border-t border-black/10 bg-white/80 px-4 text-base font-black text-slate-800 transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          aria-label={editLabel + " " + productName}
        >
          <EditIcon />
          {editLabel}
        </button>
      ) : null}
    </article>
  );
}
