<script>
  import { fly } from "svelte/transition";
  import { activeTab } from "../../stores/appStore.js";
  import { currentSurahId, currentAyahNumber, nextAyah, prevAyah } from "../../stores/quranStore.js";
  import {
    isAudioPlaying,
    isAudioLoading,
    toggleAudioPlayback,
    pauseAudio,
    audioDuration,
    playCurrentAyahAudio
  } from "../../stores/audioStore.js";
  import { SURAH_LIST } from "../../data/surahList.js";
  import { Play, Pause, SkipForward, SkipBack, X, Volume2, Loader2 } from "lucide-svelte";

  $: currentSurah = SURAH_LIST.find(s => s.id === $currentSurahId) || SURAH_LIST[1];

  // Tampilkan hanya jika BUKAN di tab reader DAN audio sedang menyala atau ada durasi aktif
  $: shouldShow = $activeTab !== "reader" && ($isAudioPlaying || $isAudioLoading || $audioDuration > 0);

  function handleOpenReader() {
    activeTab.set("reader");
  }

  async function handleNext() {
    const wasPlaying = $isAudioPlaying;
    await nextAyah();
    if (wasPlaying) {
      await playCurrentAyahAudio();
    }
  }

  async function handlePrev() {
    const wasPlaying = $isAudioPlaying;
    await prevAyah();
    if (wasPlaying) {
      await playCurrentAyahAudio();
    }
  }

  function handleClose() {
    pauseAudio();
  }
</script>

{#if shouldShow}
  <aside 
    class="mini-player-dock"
    transition:fly={{ y: 24, duration: 240 }}
    aria-label="Pemutar Audio Mini"
  >
    <div class="mini-player-card">
      <!-- Vinyl Disc / Sound Wave Icon (Klik untuk buka Reader) -->
      <button 
        type="button"
        class="mini-disc-btn"
        class:is-spinning={$isAudioPlaying}
        on:click={handleOpenReader}
        title="Buka Halaman Pembaca"
        aria-label="Buka Tampilan Ayat Penuh"
      >
        <div class="mini-disc-vinyl">
          <div class="disc-groove"></div>
          <div class="disc-center"></div>
        </div>
        {#if $isAudioPlaying}
          <div class="equalizer-bars" aria-hidden="true">
            <span class="eq-bar eq-bar-1"></span>
            <span class="eq-bar eq-bar-2"></span>
            <span class="eq-bar eq-bar-3"></span>
          </div>
        {/if}
      </button>

      <!-- Info Surah & Ayat (Klik untuk buka Reader) -->
      <button 
        type="button" 
        class="mini-info-box" 
        on:click={handleOpenReader}
        title="Klik untuk membuka ayat di tab Tafsir"
      >
        <div class="mini-title-row">
          <span class="mini-surah-title">{currentSurah?.name || "Surah"}</span>
          <span class="mini-ayah-pill">: {$currentAyahNumber}</span>
        </div>
        <span class="mini-reciter-sub">
          {#if $isAudioLoading}
            Memuat audio...
          {:else if $isAudioPlaying}
            Murottal aktif • Ketuk untuk lihat ayat
          {:else}
            Murottal dijeda
          {/if}
        </span>
      </button>

      <!-- Kontrol Pemutar Mini -->
      <div class="mini-controls">
        <button 
          type="button" 
          class="mini-ctrl-btn" 
          on:click={handlePrev}
          title="Ayat Sebelumnya"
          aria-label="Ayat Sebelumnya"
        >
          <SkipBack size={15} />
        </button>

        <button 
          type="button" 
          class="mini-play-btn" 
          on:click={toggleAudioPlayback}
          title={$isAudioPlaying ? "Jeda Murottal" : "Lanjutkan Murottal"}
          aria-label={$isAudioPlaying ? "Jeda" : "Putar"}
        >
          {#if $isAudioLoading}
            <Loader2 size={16} class="mini-spin" />
          {:else if $isAudioPlaying}
            <Pause size={16} />
          {:else}
            <Play size={16} class="mini-play-icon" />
          {/if}
        </button>

        <button 
          type="button" 
          class="mini-ctrl-btn" 
          on:click={handleNext}
          title="Ayat Selanjutnya"
          aria-label="Ayat Selanjutnya"
        >
          <SkipForward size={15} />
        </button>

        <button 
          type="button" 
          class="mini-close-btn" 
          on:click={handleClose}
          title="Hentikan & Tutup"
          aria-label="Tutup Pemutar"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  </aside>
{/if}

<style>
  .mini-player-dock {
    position: fixed;
    bottom: calc(1.25rem + 64px + 0.65rem); /* Tepat di atas floating bottom dock */
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 2rem);
    max-width: 420px;
    z-index: 45;
    pointer-events: auto;
  }

  .mini-player-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.85rem;
    background-color: var(--bg-surface-elevated, #FFFDF8);
    border: 1.5px solid var(--border-soft, #EBDDC6);
    border-radius: 9999px;
    box-shadow: 
      0 12px 28px rgba(120, 80, 40, 0.16),
      0 3px 8px rgba(120, 80, 40, 0.08);
    backdrop-filter: blur(12px);
    transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }

  :global(.dark) .mini-player-card {
    background-color: #241F1A;
    border-color: rgba(240, 168, 78, 0.25);
    box-shadow: 
      0 14px 32px rgba(0, 0, 0, 0.75),
      0 2px 10px rgba(240, 168, 78, 0.2);
  }

  /* Disc Vinyl Mini */
  .mini-disc-btn {
    position: relative;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 50%;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mini-disc-vinyl {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, #2a2520 20%, #15120f 85%);
    border: 1.5px solid var(--accent-gold, #E89E38);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
  }

  .is-spinning .mini-disc-vinyl {
    animation: discSpin 4s linear infinite;
  }

  @keyframes discSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .disc-groove {
    position: absolute;
    width: 65%;
    height: 65%;
    border-radius: 50%;
    border: 1px dashed rgba(240, 168, 78, 0.35);
  }

  .disc-center {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent-amber, #D87D36);
    border: 1.5px solid #FFFFFF;
    z-index: 1;
  }

  /* Mini Equalizer overlay */
  .equalizer-bars {
    position: absolute;
    bottom: -2px;
    right: -2px;
    display: flex;
    align-items: flex-end;
    gap: 1.5px;
    height: 14px;
    background: rgba(20, 16, 12, 0.85);
    padding: 2px 3px;
    border-radius: 4px;
    border: 0.5px solid var(--accent-gold);
  }

  .eq-bar {
    width: 2.5px;
    background: var(--accent-gold);
    border-radius: 1px;
  }

  .eq-bar-1 { height: 60%; animation: eqJump 0.8s ease-in-out infinite alternate; }
  .eq-bar-2 { height: 95%; animation: eqJump 0.6s ease-in-out infinite alternate 0.2s; }
  .eq-bar-3 { height: 45%; animation: eqJump 0.9s ease-in-out infinite alternate 0.4s; }

  @keyframes eqJump {
    0% { height: 25%; }
    100% { height: 100%; }
  }

  /* Info Surah & Ayat */
  .mini-info-box {
    flex: 1;
    min-width: 0;
    text-align: left;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .mini-title-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .mini-surah-title {
    font-size: 0.86rem;
    font-weight: 800;
    color: var(--text-main, #3D2C1E);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.dark) .mini-surah-title {
    color: #F8F4EE;
  }

  .mini-ayah-pill {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--accent-amber, #D87D36);
  }

  .mini-reciter-sub {
    font-size: 0.68rem;
    color: var(--text-muted, #826B55);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.dark) .mini-reciter-sub {
    color: #BAA995;
  }

  /* Kontrol Buttons */
  .mini-controls {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .mini-ctrl-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: var(--text-muted, #826B55);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mini-ctrl-btn:hover {
    color: var(--accent-amber, #D87D36);
    background: rgba(216, 125, 54, 0.12);
  }

  :global(.dark) .mini-ctrl-btn {
    color: #BAA995;
  }

  .mini-play-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-gold, #E89E38) 0%, var(--accent-amber, #D87D36) 100%);
    border: none;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(216, 125, 54, 0.35);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .mini-play-btn:hover {
    transform: scale(1.06);
    box-shadow: 0 6px 14px rgba(216, 125, 54, 0.45);
  }

  :global(.mini-play-icon) {
    margin-left: 1.5px;
  }

  :global(.mini-spin) {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .mini-close-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: var(--text-muted, #826B55);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-left: 0.1rem;
    opacity: 0.7;
    transition: opacity 0.2s ease, color 0.2s ease;
  }

  .mini-close-btn:hover {
    opacity: 1;
    color: var(--accent-terracotta, #C85A32);
    background: rgba(200, 90, 50, 0.1);
  }
</style>
