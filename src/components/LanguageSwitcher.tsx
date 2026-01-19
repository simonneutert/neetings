import { useTranslation } from "../i18n/index";
import type { Language } from "../i18n/types";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslation();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <div class="dropdown">
      <button
        class="btn btn-outline-secondary btn-sm dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        style={{ minWidth: "60px" }}
      >
        {language.toUpperCase()}
      </button>
      <ul class="dropdown-menu dropdown-menu-end">
        <li>
          <button
            class={`dropdown-item ${language === "en" ? "active" : ""}`}
            onClick={() => handleLanguageChange("en")}
          >
            🇺🇸 English
          </button>
        </li>
        <li>
          <button
            class={`dropdown-item ${language === "de" ? "active" : ""}`}
            onClick={() => handleLanguageChange("de")}
          >
            🇩🇪 Deutsch
          </button>
        </li>
      </ul>
    </div>
  );
};
