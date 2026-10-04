// Layanan API Al-Qur'an dan Tafsir Kemenag RI
const BASE_URL = "https://sunnah.amanahagent.cloud/api/v1";
const API_KEY = "sk_sunnah_5296c18cdb99e17130b29785a53c8571dc522cbeb2a83c24";

// In-memory cache untuk mencegah request duplikat
const memoryCache = new Map();

/**
 * Helper untuk parsing response dengan pembersihan UTF-8 BOM
 */
async function parseResponseSafe(response) {
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Batas permintaan API tercapai (Rate Limit / Overload). Mohon tunggu beberapa detik lalu coba lagi.");
    }
    if (response.status === 404) {
      throw new Error("Data ayat atau tafsir tidak ditemukan di server.");
    }
    throw new Error(`Gagal memuat data (${response.status}: ${response.statusText})`);
  }

  const rawText = await response.text();
  // Bersihkan karakter UTF-8 BOM (\uFEFF) di awal respons JSON
  const cleanText = rawText.replace(/^\uFEFF/, "").trim();
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    console.error("Gagal parse JSON API response:", err, cleanText.slice(0, 100));
    throw new Error("Format respons API tidak valid.");
  }
}

/**
 * Fetch data ayat Al-Qur'an (Arab + Terjemahan Indonesia)
 * @param {number|string} surah - Nomor surah (1-114)
 * @param {number|string} ayah - Nomor ayat
 * @returns {Promise<object>}
 */
export async function fetchAyah(surah, ayah) {
  const surahNum = Number(surah);
  const ayahNum = Number(ayah);
  const cacheKey = `ayah_${surahNum}:${ayahNum}`;

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  // Cek sessionStorage
  try {
    const sessionData = sessionStorage.getItem(cacheKey);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      memoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch (e) {}

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${BASE_URL}/quran/${surahNum}:${ayahNum}`, {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
        "Accept": "application/json"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await parseResponseSafe(response);

    // Normalisasi struktur data
    data.surah_number = surahNum;
    data.ayah_number = ayahNum;
    data.ayah_key = `${surahNum}:${ayahNum}`;

    memoryCache.set(cacheKey, data);
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {}

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Waktu tunggu permintaan habis (Timeout). Mohon periksa koneksi internet Anda.");
    }
    console.error(`Error fetching ayah ${surahNum}:${ayahNum}:`, error);
    throw error;
  }
}

// Cache khusus untuk data tafsir surah bahasa Indonesia
const indoTafsirCache = new Map();

/**
 * Fetch Tafsir Bahasa Indonesia (Kemenag RI) untuk ayat tertentu
 * @param {number|string} surah - Nomor surah (1-114)
 * @param {number|string} ayah - Nomor ayat
 * @returns {Promise<string|null>}
 */
export async function fetchTafsirIndo(surah, ayah) {
  const surahNum = Number(surah);
  const ayahNum = Number(ayah);
  const cacheKey = `tafsir_indo_surah_${surahNum}`;

  let surahTafsir = indoTafsirCache.get(cacheKey);

  if (!surahTafsir) {
    try {
      const sessionData = sessionStorage.getItem(cacheKey);
      if (sessionData) {
        surahTafsir = JSON.parse(sessionData);
        indoTafsirCache.set(cacheKey, surahTafsir);
      }
    } catch (e) {}
  }

  if (!surahTafsir) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`https://equran.id/api/v2/tafsir/${surahNum}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gagal memuat tafsir Indonesia (${response.status})`);
      }

      const rawText = await response.text();
      const clean = rawText.replace(/^\uFEFF/, "").trim();
      const parsed = JSON.parse(clean);

      surahTafsir = parsed.data?.tafsir || [];
      indoTafsirCache.set(cacheKey, surahTafsir);

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(surahTafsir));
      } catch (e) {}
    } catch (err) {
      console.warn("Gagal mengambil tafsir Kemenag Indonesia:", err);
      return null;
    }
  }

  const found = surahTafsir.find(item => item.ayat === ayahNum);
  return found ? found.teks : null;
}
