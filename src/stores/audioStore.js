import { writable, get } from "svelte/store";
import { currentSurahId, currentAyahNumber, nextAyah, loadAyah } from "./quranStore.js";
import { SURAH_LIST } from "../data/surahList.js";

// Stores
export const isAudioPlaying = writable(false);
export const isAudioLoading = writable(false);
export const audioCurrentTime = writable(0);
export const audioDuration = writable(0);
export const audioError = writable(null);
export const isAutoNext = writable(true); // Otomatis lanjut ke ayat berikutnya
export const audioFrequencyData = writable(new Array(40).fill(4)); // Nilai equalizer bar (0 - 100)

// Singleton Audio & Web Audio API
let audioElement = null;
let audioContext = null;
let analyserNode = null;
let sourceNode = null;
let animFrameId = null;
let frequencyArray = null;

/**
 * Generate URL file audio MP3 murottal per ayat dari EveryAyah CDN (Mishary Rashid Alafasy 128kbps)
 */
export function getAyahAudioUrl(surah, ayah) {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
}

/**
 * Inisialisasi Audio Element & Web Audio API Analyser
 */
function getOrCreateAudio() {
  if (typeof window === "undefined") return null;

  if (!audioElement) {
    audioElement = new Audio();
    audioElement.crossOrigin = "anonymous";
    audioElement.preload = "auto";

    audioElement.addEventListener("play", () => {
      isAudioPlaying.set(true);
      isAudioLoading.set(false);
      startVisualizerLoop();
    });

    audioElement.addEventListener("pause", () => {
      isAudioPlaying.set(false);
      stopVisualizerLoop();
    });

    audioElement.addEventListener("waiting", () => {
      isAudioLoading.set(true);
    });

    audioElement.addEventListener("canplay", () => {
      isAudioLoading.set(false);
    });

    audioElement.addEventListener("timeupdate", () => {
      audioCurrentTime.set(audioElement.currentTime);
      if (audioElement.duration && !isNaN(audioElement.duration)) {
        audioDuration.set(audioElement.duration);
      }
    });

    audioElement.addEventListener("loadedmetadata", () => {
      if (audioElement.duration && !isNaN(audioElement.duration)) {
        audioDuration.set(audioElement.duration);
      }
    });

    audioElement.addEventListener("ended", () => {
      isAudioPlaying.set(false);
      stopVisualizerLoop();

      // Jika auto-next aktif, lompat ke ayat selanjutnya dan mainkan murottalnya
      if (get(isAutoNext)) {
        handleAudioEndedAutoNext();
      }
    });

    audioElement.addEventListener("error", (e) => {
      console.warn("Audio error:", e);
      isAudioLoading.set(false);
      isAudioPlaying.set(false);
      audioError.set("Gagal memuat murottal. Periksa koneksi internet.");
      stopVisualizerLoop();
    });
  }

  return audioElement;
}

/**
 * Hubungkan Web Audio API Analyser untuk Equalizer
 */
function setupWebAudioAnalyser(audio) {
  if (audioContext || typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    audioContext = new AudioCtx();
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 128; // 64 frequency bins
    analyserNode.smoothingTimeConstant = 0.82;

    sourceNode = audioContext.createMediaElementSource(audio);
    sourceNode.connect(analyserNode);
    analyserNode.connect(audioContext.destination);

    frequencyArray = new Uint8Array(analyserNode.frequencyBinCount);
  } catch (err) {
    console.warn("Gagal inisialisasi Web Audio Analyser (mungkin CORS atau restrict):", err);
  }
}

/**
 * Loop Animasi Equalizer Berbasis Frekuensi Realtime
 */
let simPhase = 0;
function startVisualizerLoop() {
  if (animFrameId) cancelAnimationFrame(animFrameId);

  const numBars = 40;

  function update() {
    if (!get(isAudioPlaying)) {
      // Resting state saat audio tidak bermain
      audioFrequencyData.set(new Array(numBars).fill(3));
      return;
    }

    let hasRealData = false;
    const output = new Array(numBars);

    if (analyserNode && frequencyArray) {
      analyserNode.getByteFrequencyData(frequencyArray);
      let sum = 0;
      for (let i = 0; i < frequencyArray.length; i++) {
        sum += frequencyArray[i];
      }

      if (sum > 0) {
        hasRealData = true;
        // Petakan 64 bins ke 40 radial bars secara merata dan simetris
        for (let i = 0; i < numBars; i++) {
          const binIdx = Math.floor((i / numBars) * (frequencyArray.length * 0.75));
          const val = frequencyArray[binIdx] || 0;
          // Normalisasi ke rentang 4 - 95
          output[i] = Math.max(4, Math.min(95, Math.round((val / 255) * 90) + 4));
        }
      }
    }

    // Jika Web Audio API belum menghasilkan data (atau mode fallback)
    if (!hasRealData) {
      simPhase += 0.08;
      for (let i = 0; i < numBars; i++) {
        const angle = (i / numBars) * Math.PI * 2;
        const wave1 = Math.sin(angle * 3 + simPhase) * 22;
        const wave2 = Math.cos(angle * 5 - simPhase * 1.5) * 15;
        const wave3 = Math.sin(simPhase * 2 + i * 0.3) * 18;
        const height = Math.max(5, Math.min(85, Math.round(35 + wave1 + wave2 + wave3)));
        output[i] = height;
      }
    }

    audioFrequencyData.set(output);
    animFrameId = requestAnimationFrame(update);
  }

  animFrameId = requestAnimationFrame(update);
}

function stopVisualizerLoop() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  // Reset ke tinggi resting bar (halus)
  audioFrequencyData.set(new Array(40).fill(3));
}

/**
 * Handle auto-next ketika audio ayat selesai
 */
async function handleAudioEndedAutoNext() {
  const currentSurah = get(currentSurahId);
  const currentAyah = get(currentAyahNumber);
  const surahInfo = SURAH_LIST.find(s => s.id === currentSurah);
  const totalAyat = surahInfo ? surahInfo.totalAyah : 286;

  if (currentAyah < totalAyat) {
    await nextAyah();
    await playCurrentAyahAudio();
  } else if (currentSurah < 114) {
    // Pindah ke surah berikutnya ayat 1
    await loadAyah(currentSurah + 1, 1);
    await playCurrentAyahAudio();
  }
}

/**
 * Putar audio murottal untuk ayat yang sedang aktif
 */
export async function playCurrentAyahAudio() {
  const audio = getOrCreateAudio();
  if (!audio) return;

  const surah = get(currentSurahId);
  const ayah = get(currentAyahNumber);
  const targetUrl = getAyahAudioUrl(surah, ayah);

  audioError.set(null);
  isAudioLoading.set(true);

  if (audioContext && audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch (e) {}
  }

  if (audio.src !== targetUrl) {
    audio.src = targetUrl;
    audio.load();
    setupWebAudioAnalyser(audio);
  }

  try {
    await audio.play();
    isAudioPlaying.set(true);
    isAudioLoading.set(false);
  } catch (err) {
    console.warn("Gagal autoplay audio:", err);
    isAudioPlaying.set(false);
    isAudioLoading.set(false);
    audioError.set("Klik tombol Play untuk memulai Murottal.");
  }
}

/**
 * Toggle Play / Pause Murottal
 */
export async function toggleAudioPlayback() {
  const audio = getOrCreateAudio();
  if (!audio) return;

  if (audioContext && audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch (e) {}
  }

  const surah = get(currentSurahId);
  const ayah = get(currentAyahNumber);
  const targetUrl = getAyahAudioUrl(surah, ayah);

  if (audio.src !== targetUrl || !audio.src) {
    await playCurrentAyahAudio();
    return;
  }

  if (audio.paused) {
    try {
      isAudioLoading.set(true);
      await audio.play();
      isAudioPlaying.set(true);
      isAudioLoading.set(false);
    } catch (err) {
      console.warn("Gagal play audio:", err);
      isAudioPlaying.set(false);
      isAudioLoading.set(false);
    }
  } else {
    audio.pause();
    isAudioPlaying.set(false);
  }
}

/**
 * Pause Audio
 */
export function pauseAudio() {
  if (audioElement && !audioElement.paused) {
    audioElement.pause();
    isAudioPlaying.set(false);
  }
}

/**
 * Seek posisi audio
 */
export function seekAudio(seconds) {
  if (audioElement && !isNaN(seconds)) {
    audioElement.currentTime = seconds;
  }
}
