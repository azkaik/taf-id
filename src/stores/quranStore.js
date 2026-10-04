import { writable, get } from "svelte/store";
import { fetchAyah, fetchTafsirIndo } from "../services/api.js";
import { SURAH_LIST } from "../data/surahList.js";
import { saveLastRead, getLastRead } from "../services/storage.js";
import { lastRead } from "./userStore.js";

// Ambil posisi terakhir dibaca sebagai default
const initialLast = typeof window !== "undefined" ? getLastRead() : { surah: 2, ayah: 255 };

export const currentSurahId = writable(initialLast.surah || 2);
export const currentAyahNumber = writable(initialLast.ayah || 255);
export const currentAyahData = writable(null);
export const currentTafsirData = writable(null);
export const isLoadingAyah = writable(false);
export const isLoadingTafsir = writable(false);
export const quranError = writable(null);
export const tafsirError = writable(null);
export const isTafsirModalOpen = writable(false);

// Tracker untuk mencegah pemanggilan ganda/konkuren pada tafsir yang sama
let inFlightTafsirPromise = null;
let inFlightTafsirKey = null;

/**
 * Memuat ayat spesifik dan menyimpannya ke Riwayat Terakhir Dibaca
 */
export async function loadAyah(surahNum, ayahNum) {
  const surah = Number(surahNum);
  const ayah = Number(ayahNum);
  const targetKey = `${surah}:${ayah}`;

  currentSurahId.set(surah);
  currentAyahNumber.set(ayah);
  isLoadingAyah.set(true);
  quranError.set(null);

  // Jika data tafsir yang sedang ada bukan untuk ayat ini, bersihkan
  const currentTafsir = get(currentTafsirData);
  if (currentTafsir && currentTafsir.ayah_key !== targetKey) {
    currentTafsirData.set(null);
  }
  tafsirError.set(null);

  try {
    const data = await fetchAyah(surah, ayah);
    currentAyahData.set(data);

    // Dapatkan nama surah dari data atau fallback ke SURAH_LIST
    const surahInfo = SURAH_LIST.find(s => s.id === surah);
    const surahName = data.surah_name_en || (surahInfo ? surahInfo.name : `Surah ${surah}`);

    // Simpan otomatis ke riwayat terakhir dibaca
    const saved = saveLastRead(surah, ayah, surahName);
    lastRead.set(saved);

    return data;
  } catch (err) {
    quranError.set(err.message || "Gagal memuat data ayat.");
    throw err;
  } finally {
    isLoadingAyah.set(false);
  }
}

/**
 * Memuat Tafsir Bahasa Indonesia (Kemenag RI) untuk ayat yang sedang aktif
 */
export async function loadCurrentTafsir(force = false) {
  const surah = get(currentSurahId);
  const ayah = get(currentAyahNumber);
  const targetKey = `${surah}:${ayah}`;

  // 1. Cek apakah tafsir untuk ayat ini sudah tersedia di state
  const existing = get(currentTafsirData);
  if (!force && existing && existing.ayah_key === targetKey && existing.tafsir_indo) {
    return existing;
  }

  // 2. Cek apakah ada request in-flight yang sedang berjalan untuk target yang sama
  if (inFlightTafsirPromise && inFlightTafsirKey === targetKey) {
    return inFlightTafsirPromise;
  }

  isLoadingTafsir.set(true);
  tafsirError.set(null);
  inFlightTafsirKey = targetKey;

  inFlightTafsirPromise = (async () => {
    try {
      // Muat Tafsir Bahasa Indonesia Kemenag RI
      const indoTafsir = await fetchTafsirIndo(surah, ayah);

      const data = {
        ayah_key: targetKey,
        surah_number: surah,
        ayah_number: ayah,
        tafsir_indo: indoTafsir
      };

      currentTafsirData.set(data);
      return data;
    } catch (err) {
      console.error(`Gagal memuat tafsir untuk ${targetKey}:`, err);
      tafsirError.set(err.message || "Gagal memuat tafsir.");
      throw err;
    } finally {
      isLoadingTafsir.set(false);
      inFlightTafsirPromise = null;
      inFlightTafsirKey = null;
    }
  })();

  return inFlightTafsirPromise;
}

/**
 * Melompat ke Ayat Selanjutnya
 */
export async function nextAyah() {
  const surah = get(currentSurahId);
  const ayah = get(currentAyahNumber);
  const surahInfo = SURAH_LIST.find(s => s.id === surah);

  if (surahInfo && ayah < surahInfo.totalAyah) {
    return loadAyah(surah, ayah + 1);
  } else if (surah < 114) {
    return loadAyah(surah + 1, 1);
  }
}

/**
 * Melompat ke Ayat Sebelumnya
 */
export async function prevAyah() {
  const surah = get(currentSurahId);
  const ayah = get(currentAyahNumber);

  if (ayah > 1) {
    return loadAyah(surah, ayah - 1);
  } else if (surah > 1) {
    const prevSurahInfo = SURAH_LIST.find(s => s.id === surah - 1);
    const lastAyah = prevSurahInfo ? prevSurahInfo.totalAyah : 1;
    return loadAyah(surah - 1, lastAyah);
  }
}

/**
 * Membuka Ayat Acak
 */
export async function loadRandomAyah() {
  const randomSurah = SURAH_LIST[Math.floor(Math.random() * SURAH_LIST.length)];
  const randomAyahNum = Math.floor(Math.random() * randomSurah.totalAyah) + 1;
  return loadAyah(randomSurah.id, randomAyahNum);
}
