"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { translateText, type Locale } from "./translations";

const STORAGE_KEY = "fire-house-language";
const CHANGE_EVENT = "fire-house-language-change";
const TRANSLATABLE_ATTRIBUTES = ["aria-label", "alt", "placeholder", "title"] as const;
const originalText = new WeakMap<Text, string>();
const appliedText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const appliedAttributes = new WeakMap<Element, Map<string, string>>();

function shouldIgnore(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement;
  return Boolean(element?.closest("script, style, [data-i18n-ignore], [translate='no']"));
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
  const leading = current.match(/^\s*/)?.[0] ?? "";
  const trailing = current.match(/\s*$/)?.[0] ?? "";
  const next = `${leading}${translated}${trailing}`;
  appliedText.set(node, next);
  node.data = next;
}

function translateElementAttributes(element: Element): void {
  if (shouldIgnore(element)) return;
  const originals = originalAttributes.get(element) ?? new Map<string, string>();
  const applied = appliedAttributes.get(element) ?? new Map<string, string>();
  originalAttributes.set(element, originals);
  appliedAttributes.set(element, applied);
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

function walkText(root: Node, callback: (node: Text) => void): void {
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
  walkText(root, translateTextNode);
  if (root instanceof Element) translateElementAttributes(root);
  if (root instanceof Element || root instanceof Document) {
    root
      .querySelectorAll("[aria-label], [alt], [placeholder], [title]")
      .forEach(translateElementAttributes);
  }
}

function restoreRoot(root: Node): void {
  walkText(root, (node) => {
    const original = originalText.get(node);
    if (original === undefined) return;
    node.data = original;
    appliedText.delete(node);
  });
  const elements =
    root instanceof Element || root instanceof Document
      ? [
          ...(root instanceof Element ? [root] : []),
          ...root.querySelectorAll("[aria-label], [alt], [placeholder], [title]"),
        ]
      : [];
  for (const element of elements) {
    originalAttributes
      .get(element)
      ?.forEach((value, attribute) => element.setAttribute(attribute, value));
    appliedAttributes.delete(element);
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}
let memoryLocale: Locale = "en";
function getLocale(): Locale {
  try { return localStorage.getItem(STORAGE_KEY) === "ar" ? "ar" : "en"; }
  catch { return memoryLocale; }
}
interface LanguageContextValue {
  locale: Locale;
  isArabic: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (value: string) => string;
}
const LanguageContext = createContext<LanguageContextValue | null>(null);
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getLocale, () => "en" as Locale);
  const setLocale = useCallback((next: Locale) => {
    memoryLocale = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* In-memory fallback. */ }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === "ar" ? "rtl" : "ltr";
    if (locale === "en") {
      restoreRoot(root);
      return;
    }

    translateRoot(root);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target as Text);
        } else if (mutation.type === "attributes") {
          translateElementAttributes(mutation.target as Element);
        } else {
          mutation.addedNodes.forEach(translateRoot);
        }
      }
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    });
    return () => observer.disconnect();
  }, [locale]);
  const toggleLocale = useCallback(() => setLocale(locale === "en" ? "ar" : "en"), [locale, setLocale]);
  const t = useCallback((value: string) => translateText(value, locale), [locale]);
  const value = useMemo(() => ({ locale, isArabic: locale === "ar", setLocale, toggleLocale, t }), [locale, setLocale, toggleLocale, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
/** Explicit translation boundary; also usable as a leaf in Server Components. */
export function T({ children }: { children: React.ReactNode }) {
  const { t, locale } = useLanguage();
  if (typeof children === "string") {
    const leading = children.match(/^\s*/)?.[0] ?? "";
    const trailing = children.match(/\s*$/)?.[0] ?? "";
    const value = children.trim().replace(/\s+/g, " ");
    if (locale === "ar" && /^EGP\s+[\d,.]+$/.test(value)) {
      return <bdi>{value.replace(/^EGP\s+/, "")} ج.م.</bdi>;
    }
    return <>{leading}{t(value)}{trailing}</>;
  }
  return <>{children}</>;
}
