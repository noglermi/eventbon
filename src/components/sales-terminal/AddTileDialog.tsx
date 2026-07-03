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
const iconCategories = ["Drinks", "Food", "Desserts", "Coffee", "Wine", "Beer", "Soft drinks", "Other"] as const;

type IconCategory = (typeof iconCategories)[number];

type ProductIcon = {
  label: string;
  icon: string;
  category: IconCategory;
};

const iconLibrary: ProductIcon[] = [
  { label: "Cocktail", icon: "\u{1F379}", category: "Drinks" },
  { label: "Long Drink", icon: "\u{1F378}", category: "Drinks" },
  { label: "Shot", icon: "\u{1F943}", category: "Drinks" },
  { label: "Punch", icon: "\u{1F964}", category: "Drinks" },
  { label: "Bratwurst", icon: "\u{1F32D}", category: "Food" },
  { label: "Hot Dog", icon: "\u{1F32D}", category: "Food" },
  { label: "Fries", icon: "\u{1F35F}", category: "Food" },
  { label: "Pizza", icon: "\u{1F355}", category: "Food" },
  { label: "Pizza Salami", icon: "\u{1F355}", category: "Food" },
  { label: "Pizza Margherita", icon: "\u{1F355}", category: "Food" },
  { label: "Toast", icon: "\u{1F96A}", category: "Food" },
  { label: "Pretzel", icon: "\u{1F968}", category: "Food" },
  { label: "Soup", icon: "\u{1F372}", category: "Food" },
  { label: "Burger", icon: "\u{1F354}", category: "Food" },
  { label: "Salad", icon: "\u{1F957}", category: "Food" },
  { label: "Fish", icon: "\u{1F41F}", category: "Food" },
  { label: "Vegan", icon: "\u{1F331}", category: "Food" },
  { label: "Schnitzel", icon: "\u{1F37D}\uFE0F", category: "Food" },
  { label: "Kebab", icon: "\u{1F959}", category: "Food" },
  { label: "Taco", icon: "\u{1F32E}", category: "Food" },
  { label: "Cake", icon: "\u{1F370}", category: "Desserts" },
  { label: "Ice Cream", icon: "\u{1F366}", category: "Desserts" },
  { label: "Apple Strudel", icon: "\u{1F967}", category: "Desserts" },
  { label: "Chocolate", icon: "\u{1F36B}", category: "Desserts" },
  { label: "Muffin", icon: "\u{1F9C1}", category: "Desserts" },
  { label: "Donut", icon: "\u{1F369}", category: "Desserts" },
  { label: "Coffee", icon: "\u2615", category: "Coffee" },
  { label: "Espresso", icon: "\u2615", category: "Coffee" },
  { label: "Cappuccino", icon: "\u2615", category: "Coffee" },
  { label: "Tea", icon: "\u{1FAD6}", category: "Coffee" },
  { label: "Wine", icon: "\u{1F377}", category: "Wine" },
  { label: "Red Wine", icon: "\u{1F377}", category: "Wine" },
  { label: "White Wine", icon: "\u{1F942}", category: "Wine" },
  { label: "Spritzer", icon: "\u{1F37E}", category: "Wine" },
  { label: "Champagne", icon: "\u{1F942}", category: "Wine" },
  { label: "Beer", icon: "\u{1F37A}", category: "Beer" },
  { label: "Radler", icon: "\u{1F37B}", category: "Beer" },
  { label: "Pils", icon: "\u{1F37A}", category: "Beer" },
  { label: "Cola", icon: "\u{1F964}", category: "Soft drinks" },
  { label: "Fanta", icon: "\u{1F7E0}", category: "Soft drinks" },
  { label: "Sprite", icon: "\u{1F7E2}", category: "Soft drinks" },
  { label: "Water", icon: "\u{1F4A7}", category: "Soft drinks" },
  { label: "Lemonade", icon: "\u{1F34B}", category: "Soft drinks" },
  { label: "Juice", icon: "\u{1F9C3}", category: "Soft drinks" },
  { label: "Popcorn", icon: "\u{1F37F}", category: "Other" },
  { label: "Chips", icon: "\u{1F954}", category: "Other" },
  { label: "Token", icon: "\u{1F39F}\uFE0F", category: "Other" },
  { label: "Donation", icon: "\u2B50", category: "Other" },
  { label: "Merch", icon: "\u{1F6CD}\uFE0F", category: "Other" },
  { label: "Special", icon: "\u2728", category: "Other" },
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

function getIconCategoryLabel(category: IconCategory, language: Language) {
  const labels: Record<IconCategory, Record<Language, string>> = {
    Drinks: { de: "Getr\u00e4nke", en: "Drinks" },
    Food: { de: "Essen", en: "Food" },
    Desserts: { de: "Desserts", en: "Desserts" },
    Coffee: { de: "Kaffee", en: "Coffee" },
    Wine: { de: "Wein", en: "Wine" },
    Beer: { de: "Bier", en: "Beer" },
    "Soft drinks": { de: "Alkoholfrei", en: "Soft drinks" },
    Other: { de: "Sonstiges", en: "Other" },
  };

  return labels[category][language];
}

function IconPickerDialog({
  labels,
  language,
  selectedIcon,
  onClose,
  onSelect,
}: {
  labels: Translation;
  language: Language;
  selectedIcon: string;
  onClose: () => void;
  onSelect: (icon: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IconCategory | "all">("all");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredIconsByCategory = iconCategories.map((itemCategory) => {
    const icons = iconLibrary.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesQuery = !normalizedQuery || item.label.toLowerCase().includes(normalizedQuery);
      return item.category === itemCategory && matchesCategory && matchesQuery;
    });

    return { category: itemCategory, icons };
  }).filter((group) => group.icons.length > 0);

  function chooseIcon(icon: string) {
    onSelect(icon);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-7 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="icon-picker-title">
      <div className="flex h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
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
                  {getIconCategoryLabel(item, language)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-7">
          {filteredIconsByCategory.map((group) => (
            <section key={group.category} className="space-y-4" aria-label={getIconCategoryLabel(group.category, language)}>
              <h4 className="text-2xl font-black tracking-normal text-slate-950">{getIconCategoryLabel(group.category, language)}</h4>
              <div className="grid grid-cols-3 gap-4 md:grid-cols-4 xl:grid-cols-6">
                {group.icons.map((item) => (
                  <button
                    key={item.category + item.label}
                    type="button"
                    onClick={() => chooseIcon(item.icon)}
                    className={"flex min-h-32 flex-col items-center justify-center rounded-2xl p-4 text-center transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (selectedIcon === item.icon ? "bg-emerald-50 text-emerald-900 ring-4 ring-emerald-400" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200/75")}
                  >
                    <span className="text-6xl" aria-hidden="true">{item.icon}</span>
                    <span className="mt-3 text-sm font-black leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AddTileDialog({ tile, initialGroup, language, labels, onClose, onSave }: AddTileDialogProps) {
  const group = tile?.group ?? initialGroup;
  const tileColor = tile?.color ?? colors[0];
  const [selectedIcon, setSelectedIcon] = useState(tile?.icon ?? "\u2B50");
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

  function removeImage() {
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
            {imagePreview ? (
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleImageDrop}
                  className="flex min-h-44 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-5 transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="" className="max-h-36 max-w-full object-contain" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="min-h-14 rounded-2xl bg-slate-100 px-5 text-lg font-black text-slate-700 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
                    {labels.changeImage}
                  </button>
                  <button type="button" onClick={removeImage} className="min-h-14 rounded-2xl bg-rose-50 px-5 text-lg font-black text-rose-700 ring-1 ring-rose-100 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200">
                    {labels.removeImage}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleImageDrop}
                className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 text-center text-lg font-black text-slate-500 transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
              >
                <span>{labels.dragImageHereOrClick}</span>
                <span className="text-sm font-bold uppercase tracking-widest text-slate-400">jpg, png, webp</span>
              </button>
            )}
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
            language={language}
            selectedIcon={selectedIcon}
            onClose={() => setIsIconPickerOpen(false)}
            onSelect={(icon) => {
              setSelectedIcon(icon);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
