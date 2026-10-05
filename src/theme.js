const THEME_KEY = "scholarmind_theme";
let mediaQuery;
let mediaListener;

export function getTheme() {
  const value = localStorage.getItem(THEME_KEY);
  return ["light", "dark", "system"].includes(value) ? value : "system";
}

export function applyTheme(theme) {
  const selected = ["light", "dark", "system"].includes(theme) ? theme : "system";
  localStorage.setItem(THEME_KEY, selected);
  if (mediaQuery && mediaListener) mediaQuery.removeEventListener?.("change", mediaListener);
  mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
  const update = () => {
    const dark = selected === "dark" || (selected === "system" && Boolean(mediaQuery?.matches));
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.theme = selected;
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  };
  mediaListener = selected === "system" ? update : null;
  if (mediaListener) mediaQuery?.addEventListener?.("change", mediaListener);
  update();
  return selected;
}
