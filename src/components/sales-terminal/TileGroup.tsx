import { groupLabels, type Translation } from "./i18n";
import { ProductTile } from "./ProductTile";
import type { Language, ProductTileData, TileGroupName } from "./types";

type TileGroupProps = {
  group: TileGroupName;
  language: Language;
  products: ProductTileData[];
  isOpen: boolean;
  labels: Translation;
  onToggle: () => void;
  onSelectProduct: (product: ProductTileData) => void;
  onAddTile: (group: TileGroupName) => void;
};

export function TileGroup({ group, language, products, isOpen, labels, onToggle, onSelectProduct, onAddTile }: TileGroupProps) {
  const groupLabel = groupLabels[group][language];

  return (
    <section className="space-y-4" aria-label={groupLabel}>
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 text-left text-lg font-black text-slate-950 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
        aria-expanded={isOpen}
      >
        <span>{groupLabel}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-700">{isOpen ? "-" : "+"}</span>
      </button>

      {isOpen ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((product) => (
            <ProductTile key={product.id} language={language} product={product} onSelect={onSelectProduct} />
          ))}
          <button
            type="button"
            onClick={() => onAddTile(group)}
            className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-slate-300 bg-white/80 p-5 text-center text-slate-500 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-4xl font-light leading-none">+</span>
            <span className="text-xl font-black">{labels.addTile}</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
