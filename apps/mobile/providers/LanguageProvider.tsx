import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  SOURCE_LANGUAGE,
  SUPPORTED_LANGUAGES,
  ensureLocaleLoaded,
  normalizeStoredLanguage,
  translateUiText,
  translate,
} from '@moxt/shared';

type Language = (typeof SUPPORTED_LANGUAGES)[number];

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  translateLabel: (label: string) => string;
};

/** Même clé que le web (localStorage 'moxt-language'). */
const STORAGE_KEY = 'moxt-language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(SOURCE_LANGUAGE as Language);
  // Incrémenté quand un catalogue (en/es/pt/ru, chargé à la demande) devient disponible.
  const [catalogVersion, setCatalogVersion] = useState(0);

  const applyLanguage = useCallback((next: string, persist: boolean) => {
    const normalized = normalizeStoredLanguage(next) as Language;
    setLanguageState(normalized);
    Promise.resolve(ensureLocaleLoaded(normalized))
      .then(() => setCatalogVersion((v) => v + 1))
      .catch(() => {});
    if (persist) AsyncStorage.setItem(STORAGE_KEY, normalized).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (mounted && stored) applyLanguage(stored, false);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [applyLanguage]);

  // Comme le web : <html lang> suit la langue, les formats (montants, dates) du shared s'y fient.
  useEffect(() => {
    const doc = (globalThis as { document?: { documentElement?: { lang: string } } }).document;
    if (doc?.documentElement) doc.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (next) => applyLanguage(next, true),
      t: (key, vars) => translate(language, key, vars),
      translateLabel: (label) => (language === SOURCE_LANGUAGE ? label : translateUiText(label, language)),
    }),
    // catalogVersion : force le recalcul de t() une fois la locale chargée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, applyLanguage, catalogVersion],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
