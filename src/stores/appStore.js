import { writable } from "svelte/store";
import { getSavedTheme, saveTheme, getFontSettings, saveFontSettings } from "../services/storage.js";

// Mode tema (light = Retro Cream Pastel, dark = Eye-Comfort Warm Dark)
const initialTheme = typeof window !== "undefined" ? getSavedTheme() : "light";
export const theme = writable(initialTheme);

// Sinkronisasi kelas HTML saat tema berubah
theme.subscribe((val) => {
  if (typeof document !== "undefined") {
    if (val === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    saveTheme(val);
  }
});

export function toggleTheme() {
  theme.update(current => (current === "dark" ? "light" : "dark"));
}

// Navigasi Tab Aktif: 'home' | 'surahs' | 'reader' | 'search' | 'notes'
export const activeTab = writable("home");

// Pengaturan ukuran font
const initialFonts = typeof window !== "undefined" ? getFontSettings() : { arabicSize: 28, indonesianSize: 15 };
export const fontSettings = writable(initialFonts);

export function updateFontSize(arabicDelta, indoDelta) {
  fontSettings.update(curr => {
    const updated = {
      arabicSize: Math.min(42, Math.max(22, curr.arabicSize + arabicDelta)),
      indonesianSize: Math.min(22, Math.max(13, curr.indonesianSize + indoDelta))
    };
    saveFontSettings(updated);
    return updated;
  });
}
