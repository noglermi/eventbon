"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import type { Translation } from "./i18n";
import { groupLabels } from "./i18n";
import {
  getProductIconCategoryLabel,
  getProductIconLabel,
  getProductIconSearchText,
  productIconCatalog,
  productIconCategories,
} from "./product-icon-catalog";
import type { ProductIconCategoryId } from "./product-icon-catalog";
import type { ImageCrop, Language, ProductTileData, TileGroupName } from "./types";

type AddTileDialogProps = {
  tile: ProductTileData | null;
  initialGroup: TileGroupName | null;
  language: Language;
  labels: Translation;
  onClose: () => void;
  onSave: (tile: ProductTileData) => Promise<ProductSaveResult>;
};

type ProductSaveResult = {
  diagnostic?: string;
  message?: string;
  ok: boolean;
};

const colors = ["#f8c755", "#81d4f7", "#83c57c", "#f5a8c7", "#b49af4"];
const defaultImageCrop: ImageCrop = { zoom: 1, x: 50, y: 50 };

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

function getImageCropStyle(imageCrop: ImageCrop) {
  return {
    objectPosition: imageCrop.x + "% " + imageCrop.y + "%",
    transform: "scale(" + imageCrop.zoom + ")",
    transformOrigin: imageCrop.x + "% " + imageCrop.y + "%",
  };
}

function isDefaultCrop(imageCrop: ImageCrop) {
  return imageCrop.zoom === defaultImageCrop.zoom && imageCrop.x === defaultImageCrop.x && imageCrop.y === defaultImageCrop.y;
}

function CropSlider({
  label,
  max,
  min,
  step,
  value,
  onChange,
}: {
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[7rem_minmax(0,1fr)_4rem] items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-500">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full accent-emerald-600"
      />
      <span className="rounded-xl bg-white px-2 py-1 text-center text-base font-black normal-case tracking-normal text-slate-700 ring-1 ring-slate-200/75">{value}</span>
    </label>
  );
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
  const [category, setCategory] = useState<ProductIconCategoryId | "all">("all");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredIconsByCategory = productIconCategories.map((itemCategory) => {
    const icons = productIconCatalog.filter((item) => {
      const matchesCategory = normalizedQuery ? true : category === "all" || item.categoryId === category;
      const matchesQuery = !normalizedQuery || getProductIconSearchText(item).includes(normalizedQuery);
      return item.categoryId === itemCategory.id && matchesCategory && matchesQuery;
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
              {productIconCategories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={"min-h-12 shrink-0 rounded-2xl px-5 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (category === item.id ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200/75")}
                >
                  {getProductIconCategoryLabel(item, language)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-7">
          {filteredIconsByCategory.map((group) => (
            <section key={group.category.id} className="space-y-4" aria-label={getProductIconCategoryLabel(group.category, language)}>
              <h4 className="text-2xl font-black tracking-normal text-slate-950">{getProductIconCategoryLabel(group.category, language)}</h4>
              <div className="grid grid-cols-3 gap-4 md:grid-cols-4 xl:grid-cols-6">
                {group.icons.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => chooseIcon(item.icon)}
                    className={"flex min-h-32 flex-col items-center justify-center rounded-2xl p-4 text-center transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (selectedIcon === item.icon ? "bg-emerald-50 text-emerald-900 ring-4 ring-emerald-400" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200/75")}
                  >
                    <span className="text-6xl" aria-hidden="true">{item.icon}</span>
                    <span className="mt-3 text-sm font-black leading-tight">{getProductIconLabel(item, language)}</span>
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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageCrop, setImageCrop] = useState<ImageCrop>(tile?.imageCrop ?? defaultImageCrop);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<ProductSaveResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!group) {
    return null;
  }

  const tileName = tile?.name[language] ?? labels.newProduct;
  const tilePrice = tile ? String(tile.price) : "5.00";
  const hasCustomCrop = !isDefaultCrop(imageCrop);

  function applyImageFile(file: File) {
    console.info("Product image selected", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!isAcceptedImage(file)) {
      console.error("Product image rejected because the file type is not supported", {
        name: file.name,
        type: file.type,
      });
      setSaveError({
        diagnostic: "Unsupported image type: " + file.type,
        message: labels.imageUploadError,
        ok: false,
      });
      return;
    }

    setSaveError(null);
    setImagePreview(URL.createObjectURL(file));
    setSelectedImageFile(file);
    setImageCrop(defaultImageCrop);
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
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function saveTile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim() || labels.newProduct;
    const selectedGroup = String(formData.get("group") ?? group) as TileGroupName;
    const selectedColor = String(formData.get("color") ?? tileColor);

    try {
      const result = await onSave({
        id: tile?.id ?? "tile-" + Date.now(),
        name: tile ? { ...tile.name, [language]: name } : { de: name, en: name },
        price: parsePrice(String(formData.get("price") ?? "0")),
        group: selectedGroup,
        icon: selectedIcon,
        image: imagePreview || undefined,
        imageFile: selectedImageFile ?? undefined,
        imageCrop,
        color: selectedColor,
        textColor: textColorByColor[selectedColor] ?? tile?.textColor ?? "#0f172a",
      });

      if (!result.ok) {
        setSaveError(result);
        setIsSaving(false);
      }
    } catch (error) {
      const diagnostic = error instanceof Error ? error.message : String(error);
      console.error("Product save failed before the result could be handled", error);
      setSaveError({
        diagnostic,
        message: selectedImageFile ? labels.imageUploadError : labels.saveError,
        ok: false,
      });
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-tile-title">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="shrink-0 border-b border-slate-100 p-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{groupLabels[group][language]}</p>
              <h2 id="add-tile-title" className="mt-1 text-3xl font-black tracking-normal text-slate-950">{tile ? labels.editProduct : labels.newProduct}</h2>
            </div>
            <button type="button" onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={labels.closeAddTileDialog}>
              x
            </button>
          </div>
        </div>

        <form onSubmit={saveTile} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="grid content-start gap-5">
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
                  <div className="flex flex-wrap gap-3">
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
              </div>

              <div className="grid content-start gap-5">
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
                        className="flex h-52 max-h-60 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt=""
                          className={"max-h-full w-full " + (hasCustomCrop ? "h-full object-cover" : "object-contain")}
                          style={hasCustomCrop ? getImageCropStyle(imageCrop) : undefined}
                        />
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

                {imagePreview ? (
                  <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200/75">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-base font-black tracking-normal text-slate-950">{labels.imageCrop}</span>
                      <button type="button" onClick={() => setImageCrop(defaultImageCrop)} className="min-h-11 rounded-2xl bg-white px-4 text-sm font-black text-slate-700 ring-1 ring-slate-200/75 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
                        {labels.resetImageCrop}
                      </button>
                    </div>
                    <CropSlider label={labels.zoom} min={1} max={2.5} step={0.05} value={imageCrop.zoom} onChange={(zoom) => setImageCrop((current) => ({ ...current, zoom }))} />
                    <CropSlider label={labels.horizontal} min={0} max={100} step={1} value={imageCrop.x} onChange={(x) => setImageCrop((current) => ({ ...current, x }))} />
                    <CropSlider label={labels.vertical} min={0} max={100} step={1} value={imageCrop.y} onChange={(y) => setImageCrop((current) => ({ ...current, y }))} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-white p-5">
            {saveError ? (
              <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900 ring-1 ring-rose-200">
                <p>{saveError.message ?? labels.saveError}</p>
                {saveError.diagnostic ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-rose-800">{labels.technicalDetails}</summary>
                    <p className="mt-2 break-words font-mono text-xs font-semibold text-rose-950">{saveError.diagnostic}</p>
                  </details>
                ) : null}
              </div>
            ) : null}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} disabled={isSaving} className="min-h-14 rounded-2xl bg-slate-100 px-6 text-lg font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60">{labels.cancel}</button>
              <button type="submit" disabled={isSaving} className="min-h-14 rounded-2xl bg-slate-950 px-6 text-lg font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">{isSaving ? labels.saving : labels.save}</button>
            </div>
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
