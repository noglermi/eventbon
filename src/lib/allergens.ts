import type { AllergenCode, Language } from "@/components/sales-terminal/types";

export const allergenCodes: AllergenCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "L", "M", "N", "O", "P", "R"];

export const allergenLabels: Record<AllergenCode, Record<Language, string>> = {
  A: { de: "Gluten", en: "Gluten" },
  B: { de: "Krebstiere", en: "Crustaceans" },
  C: { de: "Ei", en: "Egg" },
  D: { de: "Fisch", en: "Fish" },
  E: { de: "Erdn\u00fcsse", en: "Peanuts" },
  F: { de: "Soja", en: "Soy" },
  G: { de: "Milch", en: "Milk" },
  H: { de: "Schalenfr\u00fcchte", en: "Nuts" },
  L: { de: "Sellerie", en: "Celery" },
  M: { de: "Senf", en: "Mustard" },
  N: { de: "Sesam", en: "Sesame" },
  O: { de: "Sulfite", en: "Sulphites" },
  P: { de: "Lupine", en: "Lupin" },
  R: { de: "Weichtiere", en: "Molluscs" },
};

export function isAllergenCode(value: string): value is AllergenCode {
  return (allergenCodes as string[]).includes(value);
}

export function normalizeAllergenCodes(values: readonly string[] | null | undefined): AllergenCode[] {
  if (!values) {
    return [];
  }

  return values.filter(isAllergenCode);
}

export function formatAllergenCodes(values: readonly AllergenCode[] | null | undefined) {
  const normalized = normalizeAllergenCodes(values);
  return normalized.length > 0 ? "(" + normalized.join(",") + ")" : "";
}
