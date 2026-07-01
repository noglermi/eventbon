import type { Translation } from "./i18n";
import { groupLabels } from "./i18n";
import type { Language, TileGroupName } from "./types";

type AddTileDialogProps = {
  group: TileGroupName | null;
  language: Language;
  labels: Translation;
  onClose: () => void;
};

const colors = ["#f8c755", "#81d4f7", "#83c57c", "#f5a8c7", "#b49af4"];

export function AddTileDialog({ group, language, labels, onClose }: AddTileDialogProps) {
  if (!group) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-tile-title">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{groupLabels[group][language]}</p>
            <h2 id="add-tile-title" className="mt-1 text-3xl font-black tracking-normal text-slate-950">{labels.addTile}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={labels.closeAddTileDialog}>
            x
          </button>
        </div>

        <div className="mt-7 grid gap-5">
          <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            {labels.name}
            <input className="min-h-14 rounded-2xl border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue={labels.newVoucher} />
          </label>
          <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            {labels.price}
            <input type="number" className="min-h-14 rounded-2xl border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue="5.00" />
          </label>
          <div className="grid gap-2">
            <span className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.color}</span>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button key={color} type="button" className="h-12 w-12 rounded-full ring-2 ring-white shadow-md outline outline-1 outline-slate-200 transition hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" style={{ backgroundColor: color }} aria-label={labels.chooseColor + " " + color} />
              ))}
            </div>
          </div>
          <div className="flex min-h-24 items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center text-lg font-bold text-slate-500">{labels.dropImageHere}</div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-14 rounded-2xl bg-slate-100 px-6 text-lg font-black text-slate-700 transition hover:bg-slate-200">{labels.cancel}</button>
          <button type="button" onClick={onClose} className="min-h-14 rounded-2xl bg-slate-950 px-6 text-lg font-black text-white transition hover:bg-slate-800">{labels.save}</button>
        </div>
      </div>
    </div>
  );
}
