import { useEffect, useState } from "preact/hooks";

export type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    return (stored as Theme) || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolvedTheme = () => {
      const resolved = theme === "system"
        ? (mediaQuery.matches ? "dark" : "light")
        : theme;

      setResolvedTheme(resolved);
      document.documentElement.setAttribute("data-bs-theme", resolved);
    };

    updateResolvedTheme();

    if (theme === "system") {
      mediaQuery.addEventListener("change", updateResolvedTheme);
      return () =>
        mediaQuery.removeEventListener("change", updateResolvedTheme);
    }
  }, [theme]);

  const setThemeAndStore = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const cycleTheme = () => {
    const nextTheme: Theme = theme === "system"
      ? "light"
      : theme === "light"
      ? "dark"
      : "system";
    setThemeAndStore(nextTheme);
  };

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeAndStore,
    cycleTheme,
  };
}
