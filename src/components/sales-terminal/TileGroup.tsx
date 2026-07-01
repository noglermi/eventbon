import type { ProductTileData, TileGroupName } from "./types";
import { ProductTile } from "./ProductTile";

type TileGroupProps = {
  group: TileGroupName;
  products: ProductTileData[];
  isOpen: boolean;
  onToggle: () => void;
  onSelectProduct: (product: ProductTileData) => void;
  onAddTile: (group: TileGroupName) => void;
};

export function TileGroup({ group, products, isOpen, onToggle, onSelectProduct, onAddTile }: TileGroupProps) {
  return (
    <section className="space-y-4" aria-label={group}>
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 text-left text-lg font-black text-slate-950 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
        aria-expanded={isOpen}
      >
        <span>{group}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-700">{isOpen ? "-" : "+"}</span>
      </button>

      {isOpen ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((product) => (
            <ProductTile key={product.id} product={product} onSelect={onSelectProduct} />
          ))}
          <button
            type="button"
            onClick={() => onAddTile(group)}
            className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-slate-300 bg-white/80 p-5 text-center text-slate-500 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-4xl font-light leading-none">+</span>
            <span className="text-xl font-black">Add tile</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
