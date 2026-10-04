import { writable } from "svelte/store";
import {
  getBookmarks,
  getLastRead,
  getNotes,
  toggleBookmark,
  saveNote,
  deleteNote
} from "../services/storage.js";

const isBrowser = typeof window !== "undefined";

export const bookmarks = writable(isBrowser ? getBookmarks() : []);
export const lastRead = writable(isBrowser ? getLastRead() : null);
export const notes = writable(isBrowser ? getNotes() : []);

/**
 * Toggle bookmark untuk ayat saat ini
 */
export function toggleAyahBookmark(ayahItem) {
  const result = toggleBookmark(ayahItem);
  bookmarks.set(result.bookmarks);
  return result.bookmarked;
}

/**
 * Menyimpan atau memperbarui Catatan Pribadi (Tadabbur)
 */
export function savePersonalNote({ id, surah, ayah, surahName, title, content }) {
  const result = saveNote({ id, surah, ayah, surahName, title, content });
  notes.set(result.notes);
  return result.note;
}

/**
 * Menghapus Catatan Pribadi
 */
export function removePersonalNote(noteId) {
  const updated = deleteNote(noteId);
  notes.set(updated);
}
