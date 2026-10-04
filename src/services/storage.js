// Layanan Manajemen Penyimpanan Lokal (LocalStorage)
// Mengelola Bookmark, Riwayat Terakhir Dibaca, Catatan Pribadi, dan Pengaturan Pengguna

const STORAGE_KEYS = {
  BOOKMARKS: "tafsir_app_bookmarks",
  LAST_READ: "tafsir_app_last_read",
  NOTES: "tafsir_app_notes",
  THEME: "tafsir_app_theme",
  FONT_SETTINGS: "tafsir_app_font_settings"
};

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Gagal membaca ${key} dari localStorage:`, e);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Gagal menyimpan ${key} ke localStorage:`, e);
  }
}

/* ==================== RIWAYAT TERAKHIR DIBACA (LAST READ) ==================== */

export function getLastRead() {
  return safeGet(STORAGE_KEYS.LAST_READ, {
    surah: 2,
    ayah: 255,
    surahName: "Al-Baqarah",
    updatedAt: new Date().toISOString()
  });
}

export function saveLastRead(surah, ayah, surahName = "") {
  const data = {
    surah: Number(surah),
    ayah: Number(ayah),
    surahName,
    updatedAt: new Date().toISOString()
  };
  safeSet(STORAGE_KEYS.LAST_READ, data);
  return data;
}

/* ==================== BOOKMARKS / FAVORIT ==================== */

export function getBookmarks() {
  return safeGet(STORAGE_KEYS.BOOKMARKS, []);
}

export function isAyahBookmarked(surah, ayah) {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.surah === Number(surah) && b.ayah === Number(ayah));
}

export function toggleBookmark(ayahItem) {
  const bookmarks = getBookmarks();
  const surah = Number(ayahItem.surah);
  const ayah = Number(ayahItem.ayah);
  const index = bookmarks.findIndex(b => b.surah === surah && b.ayah === ayah);

  if (index >= 0) {
    bookmarks.splice(index, 1);
    safeSet(STORAGE_KEYS.BOOKMARKS, bookmarks);
    return { bookmarked: false, bookmarks };
  } else {
    const newEntry = {
      id: `${surah}:${ayah}`,
      surah,
      ayah,
      surahName: ayahItem.surahName || `Surah ${surah}`,
      text_arabic: ayahItem.text_arabic || "",
      text_indonesian: ayahItem.text_indonesian || "",
      createdAt: new Date().toISOString()
    };
    bookmarks.unshift(newEntry);
    safeSet(STORAGE_KEYS.BOOKMARKS, bookmarks);
    return { bookmarked: true, bookmarks };
  }
}

export function removeBookmark(surah, ayah) {
  const bookmarks = getBookmarks().filter(
    b => !(b.surah === Number(surah) && b.ayah === Number(ayah))
  );
  safeSet(STORAGE_KEYS.BOOKMARKS, bookmarks);
  return bookmarks;
}

/* ==================== CATATAN PRIBADI (PERSONAL NOTES) ==================== */

export function getNotes() {
  return safeGet(STORAGE_KEYS.NOTES, []);
}

export function getNotesForAyah(surah, ayah) {
  const notes = getNotes();
  return notes.filter(n => n.surah === Number(surah) && n.ayah === Number(ayah));
}

export function saveNote({ id, surah, ayah, surahName, title, content }) {
  const notes = getNotes();
  const noteId = id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const existingIndex = notes.findIndex(n => n.id === noteId);

  const noteData = {
    id: noteId,
    surah: Number(surah),
    ayah: Number(ayah),
    surahName: surahName || `Surah ${surah}`,
    title: title?.trim() || "Catatan Tadabbur",
    content: content?.trim() || "",
    updatedAt: new Date().toISOString(),
    createdAt: existingIndex >= 0 ? notes[existingIndex].createdAt : new Date().toISOString()
  };

  if (existingIndex >= 0) {
    notes[existingIndex] = noteData;
  } else {
    notes.unshift(noteData);
  }

  safeSet(STORAGE_KEYS.NOTES, notes);
  return { note: noteData, notes };
}

export function deleteNote(noteId) {
  const notes = getNotes().filter(n => n.id !== noteId);
  safeSet(STORAGE_KEYS.NOTES, notes);
  return notes;
}

/* ==================== PENGATURAN TEMA & TAMPILAN ==================== */

export function getSavedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEME) || "light";
  } catch (e) {
    return "light";
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {}
}

export function getFontSettings() {
  return safeGet(STORAGE_KEYS.FONT_SETTINGS, {
    arabicSize: 28, // px
    indonesianSize: 15 // px
  });
}

export function saveFontSettings(settings) {
  safeSet(STORAGE_KEYS.FONT_SETTINGS, settings);
}
