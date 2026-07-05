import type { Language } from "./types";

export type ProductIconCategoryId =
  | "softDrinks"
  | "beer"
  | "wine"
  | "spiritsMixed"
  | "coffeeTea"
  | "food"
  | "desserts"
  | "other";

export type ProductIconCategory = {
  id: ProductIconCategoryId;
  label: Record<Language, string>;
};

export type ProductIconCatalogEntry = {
  id: string;
  icon: string;
  categoryId: ProductIconCategoryId;
  label: Record<Language, string>;
};

export const productIconCategories: ProductIconCategory[] = [
  { id: "softDrinks", label: { de: "🥤 Alkoholfreie Getränke", en: "🥤 Non-alcoholic drinks" } },
  { id: "beer", label: { de: "🍺 Bier", en: "🍺 Beer" } },
  { id: "wine", label: { de: "🍷 Wein", en: "🍷 Wine" } },
  { id: "spiritsMixed", label: { de: "🥂 Spirituosen & Mixgetränke", en: "🥂 Spirits & mixed drinks" } },
  { id: "coffeeTea", label: { de: "☕ Kaffee & Tee", en: "☕ Coffee & tea" } },
  { id: "food", label: { de: "🍟 Speisen", en: "🍟 Food" } },
  { id: "desserts", label: { de: "🍰 Desserts", en: "🍰 Desserts" } },
  { id: "other", label: { de: "📦 Sonstiges", en: "📦 Other" } },
];

export const productIconCatalog: ProductIconCatalogEntry[] = [
  { id: "cola", icon: "🥤", categoryId: "softDrinks", label: { de: "Cola", en: "Cola" } },
  { id: "fanta", icon: "🟠", categoryId: "softDrinks", label: { de: "Fanta", en: "Fanta" } },
  { id: "sprite", icon: "🟢", categoryId: "softDrinks", label: { de: "Sprite", en: "Sprite" } },
  { id: "mineral-water", icon: "💧", categoryId: "softDrinks", label: { de: "Mineralwasser", en: "Mineral water" } },
  { id: "still-water", icon: "🚰", categoryId: "softDrinks", label: { de: "Stilles Wasser", en: "Still water" } },
  { id: "lemonade", icon: "🍋", categoryId: "softDrinks", label: { de: "Limonade", en: "Lemonade" } },
  { id: "apple-juice", icon: "🧃", categoryId: "softDrinks", label: { de: "Apfelsaft", en: "Apple juice" } },
  { id: "orange-juice", icon: "🍊", categoryId: "softDrinks", label: { de: "Orangensaft", en: "Orange juice" } },
  { id: "iced-tea", icon: "🧊", categoryId: "softDrinks", label: { de: "Eistee", en: "Iced tea" } },

  { id: "beer", icon: "🍺", categoryId: "beer", label: { de: "Bier", en: "Beer" } },
  { id: "radler", icon: "🍻", categoryId: "beer", label: { de: "Radler", en: "Shandy" } },
  { id: "wheat-beer", icon: "🍺", categoryId: "beer", label: { de: "Weißbier", en: "Wheat beer" } },
  { id: "pils", icon: "🍺", categoryId: "beer", label: { de: "Pils", en: "Pilsner" } },
  { id: "non-alcoholic-beer", icon: "🍺", categoryId: "beer", label: { de: "Alkoholfreies Bier", en: "Non-alcoholic beer" } },

  { id: "wine", icon: "🍷", categoryId: "wine", label: { de: "Wein", en: "Wine" } },
  { id: "red-wine", icon: "🍷", categoryId: "wine", label: { de: "Rotwein", en: "Red wine" } },
  { id: "white-wine", icon: "🥂", categoryId: "wine", label: { de: "Weißwein", en: "White wine" } },
  { id: "spritzer", icon: "🍾", categoryId: "wine", label: { de: "Spritzer", en: "Wine spritzer" } },
  { id: "sparkling-wine", icon: "🥂", categoryId: "wine", label: { de: "Sekt", en: "Sparkling wine" } },

  { id: "cocktail", icon: "🍹", categoryId: "spiritsMixed", label: { de: "Cocktail", en: "Cocktail" } },
  { id: "long-drink", icon: "🍸", categoryId: "spiritsMixed", label: { de: "Longdrink", en: "Long drink" } },
  { id: "shot", icon: "🥃", categoryId: "spiritsMixed", label: { de: "Schnaps", en: "Shot" } },
  { id: "punch", icon: "🥤", categoryId: "spiritsMixed", label: { de: "Punsch", en: "Punch" } },
  { id: "aperol-spritz", icon: "🍹", categoryId: "spiritsMixed", label: { de: "Aperol Spritz", en: "Aperol spritz" } },

  { id: "coffee", icon: "☕", categoryId: "coffeeTea", label: { de: "Kaffee", en: "Coffee" } },
  { id: "espresso", icon: "☕", categoryId: "coffeeTea", label: { de: "Espresso", en: "Espresso" } },
  { id: "cappuccino", icon: "☕", categoryId: "coffeeTea", label: { de: "Cappuccino", en: "Cappuccino" } },
  { id: "tea", icon: "🫖", categoryId: "coffeeTea", label: { de: "Tee", en: "Tea" } },
  { id: "hot-chocolate", icon: "☕", categoryId: "coffeeTea", label: { de: "Heiße Schokolade", en: "Hot chocolate" } },

  { id: "bratwurst", icon: "🌭", categoryId: "food", label: { de: "Bratwurst", en: "Bratwurst" } },
  { id: "sausages", icon: "🌭", categoryId: "food", label: { de: "Würstel", en: "Sausage" } },
  { id: "leberkaese-roll", icon: "🥪", categoryId: "food", label: { de: "Leberkässemmel", en: "Leberkäse roll" } },
  { id: "wiener-schnitzel", icon: "🍽️", categoryId: "food", label: { de: "Wienerschnitzel", en: "Wiener schnitzel" } },
  { id: "cordon-bleu", icon: "🍽️", categoryId: "food", label: { de: "Cordon bleu", en: "Cordon bleu" } },
  { id: "hot-dog", icon: "🌭", categoryId: "food", label: { de: "Hotdog", en: "Hot dog" } },
  { id: "fries", icon: "🍟", categoryId: "food", label: { de: "Pommes", en: "Fries" } },
  { id: "pizza", icon: "🍕", categoryId: "food", label: { de: "Pizza", en: "Pizza" } },
  { id: "pizza-salami", icon: "🍕", categoryId: "food", label: { de: "Pizza Salami", en: "Pizza salami" } },
  { id: "pizza-margherita", icon: "🍕", categoryId: "food", label: { de: "Pizza Margherita", en: "Pizza margherita" } },
  { id: "toast", icon: "🥪", categoryId: "food", label: { de: "Toast", en: "Toast" } },
  { id: "pretzel", icon: "🥨", categoryId: "food", label: { de: "Brezel", en: "Pretzel" } },
  { id: "soup", icon: "🍲", categoryId: "food", label: { de: "Suppe", en: "Soup" } },
  { id: "burger", icon: "🍔", categoryId: "food", label: { de: "Burger", en: "Burger" } },
  { id: "salad", icon: "🥗", categoryId: "food", label: { de: "Salat", en: "Salad" } },
  { id: "fish", icon: "🐟", categoryId: "food", label: { de: "Fisch", en: "Fish" } },
  { id: "vegan", icon: "🌱", categoryId: "food", label: { de: "Vegan", en: "Vegan" } },
  { id: "schnitzel", icon: "🍽️", categoryId: "food", label: { de: "Schnitzel", en: "Schnitzel" } },
  { id: "kebab", icon: "🥙", categoryId: "food", label: { de: "Kebab", en: "Kebab" } },
  { id: "taco", icon: "🌮", categoryId: "food", label: { de: "Taco", en: "Taco" } },

  { id: "cake", icon: "🍰", categoryId: "desserts", label: { de: "Kuchen", en: "Cake" } },
  { id: "ice-cream", icon: "🍦", categoryId: "desserts", label: { de: "Eis", en: "Ice cream" } },
  { id: "apple-strudel", icon: "🥧", categoryId: "desserts", label: { de: "Apfelstrudel", en: "Apple strudel" } },
  { id: "chocolate", icon: "🍫", categoryId: "desserts", label: { de: "Schokolade", en: "Chocolate" } },
  { id: "muffin", icon: "🧁", categoryId: "desserts", label: { de: "Muffin", en: "Muffin" } },
  { id: "donut", icon: "🍩", categoryId: "desserts", label: { de: "Donut", en: "Donut" } },

  { id: "popcorn", icon: "🍿", categoryId: "other", label: { de: "Popcorn", en: "Popcorn" } },
  { id: "chips", icon: "🥔", categoryId: "other", label: { de: "Chips", en: "Chips" } },
  { id: "token", icon: "🎟️", categoryId: "other", label: { de: "Wertmarke", en: "Token" } },
  { id: "donation", icon: "⭐", categoryId: "other", label: { de: "Spende", en: "Donation" } },
  { id: "merch", icon: "🛍️", categoryId: "other", label: { de: "Merch", en: "Merch" } },
  { id: "special", icon: "✨", categoryId: "other", label: { de: "Spezial", en: "Special" } },
];

export function getProductIconCategoryLabel(category: ProductIconCategory, language: Language) {
  return category.label[language];
}

export function getProductIconLabel(item: ProductIconCatalogEntry, language: Language) {
  return item.label[language];
}

export function getProductIconSearchText(item: ProductIconCatalogEntry) {
  return Object.values(item.label).join(" ").toLowerCase();
}
