import { h } from "preact";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n/index";

export function ThemeToggle() {
  const { theme, resolvedTheme, cycleTheme } = useTheme();
  const { t } = useTranslation();

  const getIcon = () => {
    if (theme === "system") {
      return "🌓";
    }
    return resolvedTheme === "dark" ? "🌙" : "☀️";
  };

  const getLabel = () => {
    switch (theme) {
      case "system":
        return t("theme.system");
      case "light":
        return t("theme.light");
      case "dark":
        return t("theme.dark");
      default:
        return t("theme.system");
    }
  };

  return (
    <button
      class="btn btn-outline-secondary"
      onClick={cycleTheme}
      title={getLabel()}
      aria-label={getLabel()}
    >
      {getIcon()}
    </button>
  );
}
