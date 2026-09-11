"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/i18n/language-provider";

export function LanguageToggle() {
  const { isArabic, toggleLocale } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      data-i18n-ignore
      aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}
      className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border border-background/25 px-3 text-xs font-black transition-colors hover:bg-background/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
    >
      <Languages className="size-3.5" aria-hidden />
      <span>{isArabic ? "English" : "العربية"}</span>
    </button>
  );
}

