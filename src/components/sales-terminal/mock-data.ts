import type { CartItem, EventSettings, ProductTileData, TileGroupName } from "./types";

export const tileGroups: TileGroupName[] = ["Drinks", "Food", "Desserts", "Other"];

export const mockEventSettings: EventSettings = {
  printMode: "single_vouchers",
};

export const productTiles: ProductTileData[] = [
  { id: "beer", name: { de: "Bier", en: "Beer" }, price: 5, group: "Drinks", icon: "\u{1F37A}", color: "#f8c755", textColor: "#3a2500" },
  { id: "wine", name: { de: "Wein", en: "Wine" }, price: 6, group: "Drinks", icon: "\u{1F377}", color: "#c64b6b", textColor: "#fff7fa" },
  { id: "water", name: { de: "Wasser", en: "Water" }, price: 3, group: "Drinks", icon: "\u{1F4A7}", color: "#81d4f7", textColor: "#073447" },
  { id: "fries", name: { de: "Pommes", en: "Fries" }, price: 4, group: "Food", icon: "\u{1F35F}", color: "#f59f63", textColor: "#3b1700" },
  { id: "burger", name: { de: "Burger", en: "Burger" }, price: 8, group: "Food", icon: "\u{1F354}", color: "#83c57c", textColor: "#0d3213" },
  { id: "pretzel", name: { de: "Brezel", en: "Pretzel" }, price: 4.5, group: "Food", icon: "\u{1F968}", color: "#d89b67", textColor: "#351b08" },
  { id: "cake", name: { de: "Kuchen", en: "Cake" }, price: 4, group: "Desserts", icon: "\u{1F370}", color: "#f5a8c7", textColor: "#431022" },
  { id: "ice-cream", name: { de: "Eis", en: "Ice Cream" }, price: 3.5, group: "Desserts", icon: "\u{1F366}", color: "#b49af4", textColor: "#221046" },
  { id: "voucher", name: { de: "Event-Bon", en: "Event Token" }, price: 10, group: "Other", image: "/window.svg", color: "#2f4858", textColor: "#f7fbff" },
  { id: "donation", name: { de: "Spende", en: "Donation" }, price: 2, group: "Other", icon: "\u2605", color: "#f4e8a4", textColor: "#2d2810" },
];

export const initialCart: CartItem[] = [
  { productId: "beer", quantity: 2 },
  { productId: "fries", quantity: 1 },
];
