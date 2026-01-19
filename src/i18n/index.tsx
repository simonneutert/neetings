import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";
import type { Language, Translations } from "./types";
import { APP_CONFIG } from "../constants/index";

// Import translation files
import enTranslations from "./locales/en.json";
import deTranslations from "./locales/de.json";

// Translation context
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Translation data
const translations: Record<Language, Translations> = {
  en: enTranslations as Translations,
  de: deTranslations as Translations,
};

// Browser language detection
const getBrowserLanguage = (): Language => {
  if (typeof navigator === "undefined") return "en";
  const browserLang = navigator.language.slice(0, 2) as Language;
  return translations[browserLang] ? browserLang : "en";
};

// Get translation function
const getTranslation = (
  translations: Translations,
  key: string,
  options?: Record<string, string | number>,
): string => {
  let resolvedKey = key;
  if (options && typeof options.count === "number") {
    if (options.count === 1) {
      const singularKey = `${key}_one`;
      // Check if singularKey exists
      const singularKeys = singularKey.split(".");
      let tempCurrent: any = translations;
      let found = true;
      for (const k of singularKeys) {
        if (
          tempCurrent && typeof tempCurrent === "object" && k in tempCurrent
        ) {
          tempCurrent = tempCurrent[k];
        } else {
          found = false;
          break;
        }
      }
      if (found && typeof tempCurrent === "string") {
        resolvedKey = singularKey;
      }
    } else {
      const pluralKey = `${key}_other`;
      // Check if pluralKey exists
      const pluralKeys = pluralKey.split(".");
      let tempCurrent: any = translations;
      let found = true;
      for (const k of pluralKeys) {
        if (
          tempCurrent && typeof tempCurrent === "object" && k in tempCurrent
        ) {
          tempCurrent = tempCurrent[k];
        } else {
          found = false;
          break;
        }
      }
      if (found && typeof tempCurrent === "string") {
        resolvedKey = pluralKey;
      }
    }
  }

  const keys = resolvedKey.split(".");
  let current: any = translations;

  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = current[k];
    } else {
      // If after attempting pluralization, the key is still not found, return the original base key
      // This handles cases where _one or _other are not defined but the base key might be.
      // Or, if the original key itself was not found.
      return key;
    }
  }

  if (typeof current === "string") {
    if (options) {
      return Object.entries(options).reduce((str, [optionKey, optionValue]) => {
        return str.replace(
          new RegExp(`{{${optionKey}}}`, "g"),
          String(optionValue),
        );
      }, current);
    }
    return current;
  }
  // Fallback to original key if the resolved path does not end in a string
  return key;
};

// I18n Provider component
export const I18nProvider = ({ children }: { children: any }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage, fall back to browser language
    if (typeof localStorage === "undefined") return getBrowserLanguage();
    const saved = localStorage.getItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.LANGUAGE,
    ) as Language;
    return saved && translations[saved] ? saved : getBrowserLanguage();
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEYS.LANGUAGE, lang);
    }
  };

  const t = (
    key: string,
    options?: Record<string, string | number>,
  ): string => {
    return getTranslation(translations[language], key, options);
  };

  const contextValue: I18nContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook to use translations
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
};
