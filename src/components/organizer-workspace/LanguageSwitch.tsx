import type { Translation } from "@/components/sales-terminal/i18n";
import type { Language } from "@/components/sales-terminal/types";

type LanguageSwitchProps = {
  language: Language;
  labels: Translation;
  onLanguageChange: (language: Language) => void;
};

export function LanguageSwitch({ language, labels, onLanguageChange }: LanguageSwitchProps) {
  return (
    <div className="flex min-h-12 items-center rounded-lg bg-slate-100 px-1 ring-1 ring-slate-200" aria-label={labels.language}>
      {(["de", "en"] as Language[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onLanguageChange(option)}
          className={"rounded-md px-4 py-2 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (language === option ? "bg-white text-slate-950 shadow-sm" : "text-slate-500")}
          aria-pressed={language === option}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
