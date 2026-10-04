// Layanan API Al-Qur'an dan Tafsir Kemenag RI
const BASE_URL = "https://sunnah.amanahagent.cloud/api/v1";
const API_KEY = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_KEY) || "sk_sunnah_5296c18cdb99e17130b29785a53c8571dc522cbeb2a83c24";

// In-memory cache untuk mencegah request duplikat
const memoryCache = new Map();
const equranSurahCache = new Map();

/**
 * Helper untuk parsing response dengan pembersihan UTF-8 BOM
 */
async function parseResponseSafe(response) {
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Batas permintaan API tercapai (Rate Limit / Overload).");
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
 * Fallback resmi ke equran.id jika server utama mengalami gangguan/rate limit
 */
async function fetchAyahFromEquran(surahNum, ayahNum) {
  let surahData = equranSurahCache.get(surahNum);
  if (!surahData) {
    const res = await fetch(`https://equran.id/api/v2/surat/${surahNum}`);
    if (!res.ok) throw new Error(`Gagal memuat surah ${surahNum} dari equran.id`);
    const json = await res.json();
    surahData = json.data;
    equranSurahCache.set(surahNum, surahData);
  }

  const ayahItem = surahData?.ayat?.find(a => a.nomorAyat === ayahNum);
  if (!ayahItem) {
    throw new Error(`Ayat ${ayahNum} tidak ditemukan pada surah ${surahNum}`);
  }

  return {
    surah_number: surahNum,
    ayah_number: ayahNum,
    ayah_key: `${surahNum}:${ayahNum}`,
    surah_name_en: surahData.namaLatin || `Surah ${surahNum}`,
    surah_name_ar: surahData.nama || "",
    text_arabic: ayahItem.teksArab,
    text_indonesian: ayahItem.teksIndonesia,
    text_latin: ayahItem.teksLatin
  };
}

/**
 * Fetch data ayat Al-Qur'an (Arab + Terjemahan Indonesia)
 * Dilengkapi failover otomatis ke equran.id jika terjadi kendala jaringan/rate limit
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
  const timeoutId = setTimeout(() => controller.abort(), 12000);

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
    console.warn(`Gagal mengambil ayat ${surahNum}:${ayahNum} dari server utama (${error.message}). Memuat dari cadangan equran.id...`);
    try {
      const fallbackData = await fetchAyahFromEquran(surahNum, ayahNum);
      memoryCache.set(cacheKey, fallbackData);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(fallbackData));
      } catch (e) {}
      return fallbackData;
    } catch (fallbackErr) {
      console.error(`Gagal memuat ayat dari server cadangan:`, fallbackErr);
      throw error;
    }
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
