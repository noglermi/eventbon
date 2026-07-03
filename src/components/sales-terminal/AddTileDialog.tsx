"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
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
const iconCategories = ["Drinks", "Food", "Desserts", "Snacks", "Coffee", "Wine", "Beer", "Soft drinks", "Miscellaneous"] as const;

type IconCategory = (typeof iconCategories)[number];

type ProductIcon = {
  label: string;
  icon: string;
  category: IconCategory;
};

const iconLibrary: ProductIcon[] = [
  { label: "Beer", icon: "🍺", category: "Beer" },
  { label: "Radler", icon: "🍻", category: "Beer" },
  { label: "Pils", icon: "🍺", category: "Beer" },
  { label: "Cola", icon: "🥤", category: "Soft drinks" },
  { label: "Fanta", icon: "🟠", category: "Soft drinks" },
  { label: "Sprite", icon: "🟢", category: "Soft drinks" },
  { label: "Water", icon: "💧", category: "Soft drinks" },
  { label: "Lemonade", icon: "🍋", category: "Soft drinks" },
  { label: "Juice", icon: "🧃", category: "Soft drinks" },
  { label: "Wine", icon: "🍷", category: "Wine" },
  { label: "Red Wine", icon: "🍷", category: "Wine" },
  { label: "White Wine", icon: "🥂", category: "Wine" },
  { label: "Spritzer", icon: "🍾", category: "Wine" },
  { label: "Champagne", icon: "🥂", category: "Wine" },
  { label: "Coffee", icon: "☕", category: "Coffee" },
  { label: "Espresso", icon: "☕", category: "Coffee" },
  { label: "Cappuccino", icon: "☕", category: "Coffee" },
  { label: "Tea", icon: "🫖", category: "Coffee" },
  { label: "Fries", icon: "🍟", category: "Snacks" },
  { label: "Bratwurst", icon: "🌭", category: "Food" },
  { label: "Hot Dog", icon: "🌭", category: "Food" },
  { label: "Pizza", icon: "🍕", category: "Food" },
  { label: "Pizza Salami", icon: "🍕", category: "Food" },
  { label: "Pizza Margherita", icon: "🍕", category: "Food" },
  { label: "Toast", icon: "🥪", category: "Snacks" },
  { label: "Pretzel", icon: "🥨", category: "Snacks" },
  { label: "Cake", icon: "🍰", category: "Desserts" },
  { label: "Ice Cream", icon: "🍦", category: "Desserts" },
  { label: "Apple Strudel", icon: "🥧", category: "Desserts" },
  { label: "Soup", icon: "🍲", category: "Food" },
  { label: "Burger", icon: "🍔", category: "Food" },
  { label: "Salad", icon: "🥗", category: "Food" },
  { label: "Fish", icon: "🐟", category: "Food" },
  { label: "Vegan", icon: "🌱", category: "Food" },
  { label: "Schnitzel", icon: "🍽️", category: "Food" },
  { label: "Kebab", icon: "🥙", category: "Food" },
  { label: "Taco", icon: "🌮", category: "Food" },
  { label: "Popcorn", icon: "🍿", category: "Snacks" },
  { label: "Chips", icon: "🥔", category: "Snacks" },
  { label: "Chocolate", icon: "🍫", category: "Desserts" },
  { label: "Muffin", icon: "🧁", category: "Desserts" },
  { label: "Donut", icon: "🍩", category: "Desserts" },
  { label: "Token", icon: "🎟️", category: "Miscellaneous" },
  { label: "Donation", icon: "⭐", category: "Miscellaneous" },
  { label: "Merch", icon: "🛍️", category: "Miscellaneous" },
  { label: "Special", icon: "✨", category: "Miscellaneous" },
  { label: "Cocktail", icon: "🍹", category: "Drinks" },
  { label: "Long Drink", icon: "🍸", category: "Drinks" },
  { label: "Shot", icon: "🥃", category: "Drinks" },
];

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

function isAcceptedImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

function IconPickerDialog({
  labels,
  selectedIcon,
  onClose,
  onSelect,
}: {
  labels: Translation;
  selectedIcon: string;
  onClose: () => void;
  onSelect: (icon: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IconCategory | "all">("all");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredIcons = iconLibrary.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const matchesQuery = !normalizedQuery || item.label.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-7 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="icon-picker-title">
      <div className="flex h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="shrink-0 border-b border-slate-100 p-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{labels.icon}</p>
              <h3 id="icon-picker-title" className="mt-1 text-3xl font-black tracking-normal text-slate-950">{labels.chooseIcon}</h3>
            </div>
            <button type="button" onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={labels.closeAddTileDialog}>
              x
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
              {labels.search}
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-14 rounded-2xl border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </label>
            <div className="flex gap-2.5 overflow-x-auto pb-1" aria-label={labels.category}>
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={"min-h-12 shrink-0 rounded-2xl px-5 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (category === "all" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200/75")}
              >
                {labels.all}
              </button>
              {iconCategories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={"min-h-12 shrink-0 rounded-2xl px-5 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (category === item ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200/75")}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-7">
          <div className="grid grid-cols-3 gap-4 md:grid-cols-4 xl:grid-cols-6">
            {filteredIcons.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onSelect(item.icon)}
                className={"flex min-h-28 flex-col items-center justify-center rounded-2xl p-4 text-center transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (selectedIcon === item.icon ? "bg-emerald-50 text-emerald-900 ring-4 ring-emerald-300" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200/75")}
              >
                <span className="text-5xl" aria-hidden="true">{item.icon}</span>
                <span className="mt-3 text-sm font-black leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddTileDialog({ tile, initialGroup, language, labels, onClose, onSave }: AddTileDialogProps) {
  const group = tile?.group ?? initialGroup;
  const tileColor = tile?.color ?? colors[0];
  const [selectedIcon, setSelectedIcon] = useState(tile?.icon ?? "⭐");
  const [imagePreview, setImagePreview] = useState(tile?.image ?? "");
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!group) {
    return null;
  }

  const tileName = tile?.name[language] ?? labels.newProduct;
  const tilePrice = tile ? String(tile.price) : "5.00";

  function applyImageFile(file: File) {
    if (!isAcceptedImage(file)) {
      return;
    }

    setImagePreview(URL.createObjectURL(file));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      applyImageFile(file);
    }
  }

  function handleImageDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      applyImageFile(file);
    }
  }

  function saveTile(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim() || labels.newProduct;
    const selectedGroup = String(formData.get("group") ?? group) as TileGroupName;
    const selectedColor = String(formData.get("color") ?? tileColor);

    onSave({
      id: tile?.id ?? "tile-" + Date.now(),
      name: tile ? { ...tile.name, [language]: name } : { de: name, en: name },
      price: parsePrice(String(formData.get("price") ?? "0")),
      group: selectedGroup,
      icon: selectedIcon,
      image: imagePreview || undefined,
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
            <h2 id="add-tile-title" className="mt-1 text-3xl font-black tracking-normal text-slate-950">{tile ? labels.editProduct : labels.newProduct}</h2>
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

          <div className="grid gap-2">
            <span className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.icon}</span>
            <button type="button" onClick={() => setIsIconPickerOpen(true)} className="flex min-h-20 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 text-left transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
              <span className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-4xl ring-1 ring-slate-200/75" aria-hidden="true">{selectedIcon}</span>
                <span className="text-xl font-black normal-case tracking-normal text-slate-950">{labels.chooseIcon}</span>
              </span>
              <span className="text-lg font-black text-emerald-700">{labels.edit}</span>
            </button>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.image}</span>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="sr-only" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleImageDrop}
              className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 text-center text-lg font-black text-slate-500 transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              <span>{labels.dragImageHereOrClick}</span>
              <span className="text-sm font-bold uppercase tracking-widest text-slate-400">jpg, png, webp</span>
            </button>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.preview}</span>
            <div className="flex min-h-32 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-4">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="" className="max-h-24 max-w-40 object-contain" />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-5xl ring-1 ring-slate-200/75" aria-hidden="true">{selectedIcon}</span>
              )}
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="min-h-14 rounded-2xl bg-slate-100 px-6 text-lg font-black text-slate-700 transition hover:bg-slate-200">{labels.cancel}</button>
            <button type="submit" className="min-h-14 rounded-2xl bg-slate-950 px-6 text-lg font-black text-white transition hover:bg-slate-800">{labels.save}</button>
          </div>
        </form>

        {isIconPickerOpen ? (
          <IconPickerDialog
            labels={labels}
            selectedIcon={selectedIcon}
            onClose={() => setIsIconPickerOpen(false)}
            onSelect={(icon) => {
              setSelectedIcon(icon);
              setIsIconPickerOpen(false);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
