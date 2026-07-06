import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  SOURCE_LANGUAGE,
  SUPPORTED_LANGUAGES,
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

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(SOURCE_LANGUAGE);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (next) => setLanguageState(normalizeStoredLanguage(next) as Language),
      t: (key, vars) => translate(language, key, vars),
      translateLabel: (label) =>
        language === SOURCE_LANGUAGE ? label : translateUiText(label, language),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
