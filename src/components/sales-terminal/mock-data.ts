import type { CartItem, EventSettings, ProductTileData, TileGroupName } from "./types";

export const tileGroups: TileGroupName[] = ["Drinks", "Food", "Desserts", "Other"];

export const mockEventSettings: EventSettings = {
  name: { de: "Demo Sommerfest", en: "Demo Summer Fest" },
  dateFrom: "2026-07-18",
  dateTo: "2026-07-18",
  printMode: "single_vouchers",
};

export const productTiles: ProductTileData[] = [
  { id: "beer", name: { de: "Bier", en: "Beer" }, price: 5, group: "Drinks", icon: "\u{1F37A}", imageCrop: { zoom: 1, x: 50, y: 50 }, allergens: ["A"], color: "#f8c755", textColor: "#3a2500" },
  { id: "fries", name: { de: "Pommes", en: "Fries" }, price: 4, group: "Food", icon: "\u{1F35F}", imageCrop: { zoom: 1, x: 50, y: 50 }, allergens: [], color: "#f59f63", textColor: "#3b1700" },
];

export const initialCart: CartItem[] = [];
