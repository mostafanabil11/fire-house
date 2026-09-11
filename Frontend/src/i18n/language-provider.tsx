"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { translateText, type Locale } from "@/i18n/translations";

const STORAGE_KEY = "fire-house-language";
const TRANSLATABLE_ATTRIBUTES = ["aria-label", "alt", "placeholder", "title"] as const;
const originalText = new WeakMap<Text, string>();
const appliedText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const appliedAttributes = new WeakMap<Element, Map<string, string>>();

interface LanguageContextValue {
  locale: Locale;
  isArabic: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (value: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function shouldIgnore(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement;
  return Boolean(
    element?.closest("script, style, [data-i18n-ignore], [translate='no']"),
  );
}

function withOriginalWhitespace(source: string, translated: string): string {
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function translateTextNode(node: Text): void {
  if (shouldIgnore(node)) return;
  const current = node.data;
  if (current === appliedText.get(node)) return;

  const normalized = current.replace(/\s+/g, " ").trim();
  if (!normalized) return;
  const translated = translateText(normalized, "ar");
  if (translated === normalized) return;

  originalText.set(node, current);
  const next = withOriginalWhitespace(current, translated);
  appliedText.set(node, next);
  node.data = next;
}

function translateElementAttributes(element: Element): void {
  if (shouldIgnore(element)) return;

  let originals = originalAttributes.get(element);
  let applied = appliedAttributes.get(element);
  if (!originals) {
    originals = new Map();
    originalAttributes.set(element, originals);
  }
  if (!applied) {
    applied = new Map();
    appliedAttributes.set(element, applied);
  }

  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    const current = element.getAttribute(attribute);
    if (!current || current === applied.get(attribute)) continue;
    const translated = translateText(current.replace(/\s+/g, " ").trim(), "ar");
    if (translated === current) continue;
    originals.set(attribute, current);
    applied.set(attribute, translated);
    element.setAttribute(attribute, translated);
  }
}

function walk(root: Node, callback: (node: Text) => void): void {
  if (root instanceof Text) {
    callback(root);
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    callback(node as Text);
    node = walker.nextNode();
  }
}

function translateRoot(root: Node): void {
  walk(root, translateTextNode);
  if (root instanceof Element) translateElementAttributes(root);
  if (root instanceof Element || root instanceof Document) {
    root.querySelectorAll("[aria-label], [alt], [placeholder], [title]").forEach(
      translateElementAttributes,
    );
  }
}

function restoreRoot(root: Node): void {
  walk(root, (node) => {
    const original = originalText.get(node);
    if (original === undefined) return;
    node.data = original;
    appliedText.delete(node);
  });

  const elements = root instanceof Element || root instanceof Document
    ? [
        ...(root instanceof Element ? [root] : []),
        ...root.querySelectorAll("[aria-label], [alt], [placeholder], [title]"),
      ]
    : [];

  for (const element of elements) {
    const originals = originalAttributes.get(element);
    if (!originals) continue;
    originals.forEach((value, attribute) => element.setAttribute(attribute, value));
    appliedAttributes.delete(element);
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") setLocale(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem(STORAGE_KEY, locale);

    if (locale === "en") {
      restoreRoot(root);
      return;
    }

    translateRoot(root);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target as Text);
          continue;
        }
        if (mutation.type === "attributes") {
          translateElementAttributes(mutation.target as Element);
          continue;
        }
        mutation.addedNodes.forEach(translateRoot);
      }
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    });

    const nativeConfirm = window.confirm.bind(window);
    const nativeAlert = window.alert.bind(window);
    window.confirm = (message?: string) => nativeConfirm(translateText(String(message ?? ""), "ar"));
    window.alert = (message?: string) => nativeAlert(translateText(String(message ?? ""), "ar"));

    return () => {
      observer.disconnect();
      window.confirm = nativeConfirm;
      window.alert = nativeAlert;
    };
  }, [locale, ready]);

  const toggleLocale = useCallback(() => {
    setLocale((current) => (current === "en" ? "ar" : "en"));
  }, []);
  const t = useCallback((value: string) => translateText(value, locale), [locale]);
  const value = useMemo(
    () => ({ locale, isArabic: locale === "ar", setLocale, toggleLocale, t }),
    [locale, toggleLocale, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

