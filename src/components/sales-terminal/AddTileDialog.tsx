import type { Translation } from "./i18n";
import { groupLabels } from "./i18n";
import type { Language, ProductTileData, TileGroupName } from "./types";

type AddTileDialogProps = {
  tile: ProductTileData | null;
  initialGroup: TileGroupName | null;
  language: Language;
  labels: Translation;
  onClose: () => void;
  onSave: (tile: ProductTileData) => void;
};

const colors = ["#f8c755", "#81d4f7", "#83c57c", "#f5a8c7", "#b49af4"];
const textColorByColor: Record<string, string> = {
  "#f8c755": "#3a2500",
  "#81d4f7": "#073447",
  "#83c57c": "#0d3213",
  "#f5a8c7": "#431022",
  "#b49af4": "#221046",
};

function parsePrice(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function AddTileDialog({ tile, initialGroup, language, labels, onClose, onSave }: AddTileDialogProps) {
  const group = tile?.group ?? initialGroup;

  if (!group) {
    return null;
  }

  const tileName = tile?.name[language] ?? labels.newVoucher;
  const tilePrice = tile ? String(tile.price) : "5.00";
  const tileIcon = tile?.icon ?? "\u2605";
  const tileImage = tile?.image ?? "";
  const tileColor = tile?.color ?? colors[0];

  function saveTile(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim() || labels.newVoucher;
    const selectedGroup = String(formData.get("group") ?? group) as TileGroupName;
    const selectedColor = String(formData.get("color") ?? tileColor);
    const image = String(formData.get("image") ?? "").trim();
    const icon = String(formData.get("icon") ?? "").trim() || "\u2605";

    onSave({
      id: tile?.id ?? "tile-" + Date.now(),
      name: tile ? { ...tile.name, [language]: name } : { de: name, en: name },
      price: parsePrice(String(formData.get("price") ?? "0")),
      group: selectedGroup,
      icon,
      image: image || undefined,
      color: selectedColor,
      textColor: textColorByColor[selectedColor] ?? tile?.textColor ?? "#0f172a",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-tile-title">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{groupLabels[group][language]}</p>
            <h2 id="add-tile-title" className="mt-1 text-3xl font-black tracking-normal text-slate-950">{tile ? labels.editTile : labels.addTile}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={labels.closeAddTileDialog}>
            x
          </button>
        </div>

        <form action={saveTile} className="mt-7 grid gap-5">
          <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            {labels.name}
            <input name="name" className="min-h-14 rounded-2xl border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue={tileName} />
          </label>
          <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            {labels.price}
            <input name="price" type="number" min="0" step="0.01" className="min-h-14 rounded-2xl border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue={tilePrice} />
          </label>
          <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            {labels.group}
            <select name="group" className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue={group}>
              {(Object.keys(groupLabels) as TileGroupName[]).map((groupName) => (
                <option key={groupName} value={groupName}>{groupLabels[groupName][language]}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            {labels.icon}
            <input name="icon" maxLength={4} className="min-h-14 rounded-2xl border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue={tileIcon} />
          </label>
          <div className="grid gap-2">
            <span className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.color}</span>
            <div className="flex gap-3">
              {colors.map((color) => (
                <label key={color} className="relative">
                  <input name="color" type="radio" value={color} defaultChecked={color === tileColor} className="peer sr-only" />
                  <span className="block h-12 w-12 rounded-full ring-2 ring-white shadow-md outline outline-1 outline-slate-200 transition peer-checked:outline-4 peer-checked:outline-emerald-600" style={{ backgroundColor: color }} aria-label={labels.chooseColor + " " + color} />
                </label>
              ))}
            </div>
          </div>
          <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            {labels.imageUrl}
            <input name="image" className="min-h-14 rounded-2xl border border-slate-200 px-4 text-base font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue={tileImage} placeholder="/window.svg" />
          </label>
          {tileImage ? (
            <div className="grid gap-2">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.imagePreview}</span>
              <div className="flex min-h-24 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tileImage} alt="" className="max-h-16 max-w-28 object-contain" />
              </div>
            </div>
          ) : null}

          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="min-h-14 rounded-2xl bg-slate-100 px-6 text-lg font-black text-slate-700 transition hover:bg-slate-200">{labels.cancel}</button>
            <button type="submit" className="min-h-14 rounded-2xl bg-slate-950 px-6 text-lg font-black text-white transition hover:bg-slate-800">{labels.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
