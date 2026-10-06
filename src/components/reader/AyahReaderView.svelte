<script>
  import {
    currentSurahId,
    currentAyahNumber,
    currentAyahData,
    isLoadingAyah,
    quranError,
    loadAyah,
    nextAyah,
    prevAyah,
    loadRandomAyah,
    isTafsirModalOpen
  } from "../../stores/quranStore.js";
  import {
    isAudioPlaying,
    isAudioLoading,
    audioCurrentTime,
    audioDuration,
    audioFrequencyData,
    isAutoNext,
    toggleAudioPlayback,
    playCurrentAyahAudio,
    pauseAudio
  } from "../../stores/audioStore.js";
  import { activeTab, fontSettings } from "../../stores/appStore.js";
  import { bookmarks, notes, toggleAyahBookmark } from "../../stores/userStore.js";
  import { SURAH_LIST } from "../../data/surahList.js";
  import TafsirModal from "./TafsirModal.svelte";
  import NoteEditorModal from "./NoteEditorModal.svelte";
  import SurahPickerModal from "./SurahPickerModal.svelte";
  import WavyRibbons from "../common/WavyRibbons.svelte";
  import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    SkipBack,
    SkipForward,
    Shuffle,
    BookOpen,
    Bookmark,
    FileText,
    Copy,
    Check,
    Share2,
    SlidersHorizontal,
    Edit3,
    Play,
    Pause,
    Volume2,
    Loader2
  } from "lucide-svelte";

  let isNoteModalOpen = false;
  let isSurahPickerOpen = false;
  let copied = false;
  let scrubberValue = 1;

  $: currentSurahInfo = SURAH_LIST.find(s => s.id === $currentSurahId) || SURAH_LIST[1];
  $: scrubberValue = $currentAyahNumber;

  $: isBookmarked = ($bookmarks || []).some(
    b => b.surah === $currentSurahId && b.ayah === $currentAyahNumber
  );

  $: verseNotes = ($notes || []).filter(
    n => n.surah === $currentSurahId && n.ayah === $currentAyahNumber
  );

  // Jika data ayat belum termuat saat view dibuka, lakukan auto-load
  $: if (!$currentAyahData && !$isLoadingAyah) {
    loadAyah($currentSurahId, $currentAyahNumber).catch(console.error);
  }

  async function handleScrubberChange(e) {
    const targetAyah = Number(e.target.value);
    const wasPlaying = $isAudioPlaying;
    await loadAyah($currentSurahId, targetAyah);
    if (wasPlaying) {
      await playCurrentAyahAudio();
    }
  }

  async function switchSurah(targetSurahId) {
    if (targetSurahId < 1 || targetSurahId > 114) return;
    const wasPlaying = $isAudioPlaying;
    await loadAyah(targetSurahId, 1);
    if (wasPlaying) {
      await playCurrentAyahAudio();
    }
  }

  function prevSurah() {
    if ($currentSurahId > 1) {
      switchSurah($currentSurahId - 1);
    }
  }

  function nextSurah() {
    if ($currentSurahId < 114) {
      switchSurah($currentSurahId + 1);
    }
  }

  async function handlePrevAyah() {
    const wasPlaying = $isAudioPlaying;
    await prevAyah();
    if (wasPlaying) {
      await playCurrentAyahAudio();
    }
  }

  async function handleNextAyah() {
    const wasPlaying = $isAudioPlaying;
    await nextAyah();
    if (wasPlaying) {
      await playCurrentAyahAudio();
    }
  }

  async function handleRandomAyahWithAudio() {
    const wasPlaying = $isAudioPlaying;
    await loadRandomAyah();
    if (wasPlaying) {
      await playCurrentAyahAudio();
    }
  }

  function handleBookmarkToggle() {
    if ($currentAyahData) {
      toggleAyahBookmark({
        surah: $currentSurahId,
        ayah: $currentAyahNumber,
        surahName: currentSurahInfo.name,
        text_arabic: $currentAyahData.text_arabic,
        text_indonesian: $currentAyahData.text_indonesian
      });
    }
  }

  async function copyVerseText() {
    if (!$currentAyahData) return;
    const textToCopy = `${$currentAyahData.text_arabic}\n\n"${$currentAyahData.text_indonesian}"\n\n— QS. ${currentSurahInfo.name} [${$currentSurahId}:${$currentAyahNumber}]`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      copied = true;
      setTimeout(() => copied = false, 2500);
    } catch (e) {
      console.warn("Gagal menyalin ayat:", e);
    }
  }
</script>

<div class="reader-container">
  <WavyRibbons position="top" />

  <div class="reader-content">
    <!-- Top Action Bar with Surah Switcher -->
    <div class="reader-top-nav">
      <button class="top-nav-btn" on:click={() => activeTab.set("surahs")} title="Kembali ke Daftar Surah">
        <ChevronLeft size={22} />
      </button>

      <!-- Pengganti Surat (Quick Switcher with Prev, Current Pill Modal, Next) -->
      <div class="top-surah-switcher">
        <button 
          type="button" 
          class="surah-step-btn" 
          on:click={prevSurah} 
          disabled={$currentSurahId <= 1}
          title="Surah Sebelumnya"
          aria-label="Surah Sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        <button 
          type="button" 
          class="surah-picker-trigger" 
          on:click={() => isSurahPickerOpen = true}
          title="Ganti Surah (Buka Daftar 114 Surah)"
        >
          <span class="surah-trigger-num">{$currentSurahId}.</span>
          <span class="surah-trigger-name">{currentSurahInfo.name}</span>
          <span class="surah-trigger-meta">({currentSurahInfo.totalAyah} Ayat)</span>
          <ChevronDown size={14} class="trigger-chevron" />
        </button>

        <button 
          type="button" 
          class="surah-step-btn" 
          on:click={nextSurah} 
          disabled={$currentSurahId >= 114}
          title="Surah Selanjutnya"
          aria-label="Surah Selanjutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <button class="top-nav-btn" on:click={copyVerseText} title="Salin Teks Ayat">
        {#if copied}
          <Check size={18} class="text-green" />
        {:else}
          <Share2 size={18} />
        {/if}
      </button>
    </div>

    <!-- Piringan Medallion / Vinyl Focal Element with Equalizer Ring -->
    <div class="disk-section">
      <div class="equalizer-disk-wrapper">
        <!-- SVG Radial Equalizer Ring -->
        <svg class="radial-equalizer-svg" viewBox="0 0 280 280" role="img" aria-label="Equalizer Murottal">
          <defs>
            <linearGradient id="eqGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--accent-gold, #F0A84E)" />
              <stop offset="100%" stop-color="var(--accent-amber, #DF843F)" />
            </linearGradient>
            <filter id="eqGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Outer decorative dashed guide ring -->
          <circle 
            cx="140" 
            cy="140" 
            r="114" 
            fill="none" 
            stroke="rgba(216, 125, 54, 0.2)" 
            stroke-dasharray="3 4" 
            stroke-width="1" 
          />

          <!-- 40 Radial Equalizer Bars responding in real-time -->
          {#each $audioFrequencyData as freq, i}
            {@const angle = (i / 40) * Math.PI * 2 - Math.PI / 2}
            {@const rInner = 110}
            {@const barHeight = $isAudioPlaying ? Math.max(4, (freq / 100) * 22) : 3.5}
            {@const rOuter = rInner + barHeight}
            {@const x1 = 140 + Math.cos(angle) * rInner}
            {@const y1 = 140 + Math.sin(angle) * rInner}
            {@const x2 = 140 + Math.cos(angle) * rOuter}
            {@const y2 = 140 + Math.sin(angle) * rOuter}
            <line 
              x1={x1} 
              y1={y1} 
              x2={x2} 
              y2={y2} 
              stroke="url(#eqGlowGrad)" 
              stroke-width={$isAudioPlaying ? 3 : 2}
              stroke-linecap="round"
              opacity={$isAudioPlaying ? Math.min(1, 0.45 + (freq / 100) * 0.55) : 0.35}
              filter={$isAudioPlaying && freq > 25 ? "url(#eqGlow)" : "none"}
            />
          {/each}
        </svg>

        <!-- Medallion Disk (Click to play/pause, rotates when playing) -->
        <button 
          type="button" 
          class="medallion-disk-btn" 
          on:click={toggleAudioPlayback}
          title={$isAudioPlaying ? "Jeda Murottal" : "Putar Murottal (Syaikh Misyari Rasyid Al-Afasy)"}
          aria-label={$isAudioPlaying ? "Jeda Murottal" : "Putar Murottal"}
        >
          <div class="medallion-disk" class:is-playing={$isAudioPlaying}>
            <div class="medallion-rings"></div>
            <div class="medallion-center">
              <span class="medallion-surah-num">{$currentSurahId}:{$currentAyahNumber}</span>
              <span class="medallion-ar-text">{currentSurahInfo.nameAr}</span>
            </div>
            <!-- Overlay Play/Pause Hint Icon on Disk -->
            <div class="disk-play-overlay" class:is-playing={$isAudioPlaying}>
              {#if $isAudioLoading}
                <Loader2 size={32} class="spinner-icon" />
              {:else if $isAudioPlaying}
                <Pause size={28} />
              {:else}
                <Play size={28} style="margin-left: 3px;" />
              {/if}
            </div>
          </div>
        </button>
      </div>

      <!-- Murottal Reciter & Status Indicator -->
      <div class="murottal-status-badge">
        <button 
          type="button" 
          class="audio-pill-toggle" 
          on:click={toggleAudioPlayback}
          class:is-active={$isAudioPlaying}
        >
          {#if $isAudioLoading}
            <Loader2 size={13} class="spinner-icon" />
            <span>Memuat Murottal...</span>
          {:else if $isAudioPlaying}
            <span class="pulse-indicator"></span>
            <span>Murottal: Syaikh Misyari Rasyid Al-Afasy</span>
          {:else}
            <Volume2 size={13} />
            <span>Putar Murottal Ayat {$currentAyahNumber}</span>
          {/if}
        </button>

        <button 
          type="button" 
          class="auto-next-btn" 
          class:active={$isAutoNext}
          on:click={() => isAutoNext.update(v => !v)}
          title={$isAutoNext ? "Auto-Lanjut Ayat: Aktif" : "Auto-Lanjut Ayat: Nonaktif"}
        >
          <span>Auto-Lanjut</span>
          <span class="auto-switch-dot"></span>
        </button>
      </div>
    </div>

    <!-- Metadata Ayat (Sesuai teks Dancing in the Arcade di mockup) -->
    <div class="verse-title-section">
      <div class="title-details">
        <h2 class="reader-surah-title">{currentSurahInfo.name}</h2>
        <p class="reader-surah-sub">
          Ayat {$currentAyahNumber} dari {currentSurahInfo.totalAyah} • {currentSurahInfo.type}
        </p>
      </div>

      <button 
        class="heart-bookmark-btn" 
        class:bookmarked={isBookmarked}
        on:click={handleBookmarkToggle}
        title={isBookmarked ? "Hapus dari Bookmark" : "Simpan ke Bookmark"}
      >
        <Bookmark size={24} fill={isBookmarked ? "var(--accent-amber)" : "none"} />
      </button>
    </div>

    <!-- Scrubber Wavy Progress Bar (Sesuai mockup garis timeline bergelombang) -->
    <div class="scrubber-container">
      <div class="scrubber-bar-wrapper">
        <input 
          type="range" 
          min="1" 
          max={currentSurahInfo.totalAyah} 
          value={scrubberValue}
          on:change={handleScrubberChange}
          class="retro-range-slider"
        />
      </div>
      <div class="scrubber-time-row">
        <span>Ayat 1</span>
        <span class="current-ayah-tag">Ayat {$currentAyahNumber}</span>
        <span>Ayat {currentSurahInfo.totalAyah}</span>
      </div>
    </div>

    <!-- Retro Player Controller Bar with Play / Pause Buttons -->
    <div class="player-controls-bar">
      <!-- Tombol Acak Ayat -->
      <button class="ctrl-btn" on:click={handleRandomAyahWithAudio} title="Buka Ayat Acak">
        <Shuffle size={20} />
      </button>

      <!-- Tombol Ayat Sebelumnya -->
      <button 
        class="ctrl-btn" 
        on:click={handlePrevAyah} 
        disabled={$currentSurahId === 1 && $currentAyahNumber === 1}
        title="Ayat Sebelumnya"
      >
        <SkipBack size={24} />
      </button>

      <!-- Tombol Utama: Play / Pause Murottal -->
      <button 
        class="main-play-btn" 
        on:click={toggleAudioPlayback}
        title={$isAudioPlaying ? "Jeda Murottal (Pause)" : "Putar Murottal (Play)"}
        aria-label={$isAudioPlaying ? "Pause" : "Play"}
      >
        {#if $isAudioLoading}
          <Loader2 size={24} class="spinner-icon" />
        {:else if $isAudioPlaying}
          <Pause size={24} />
        {:else}
          <Play size={24} style="margin-left: 2px;" />
        {/if}
      </button>

      <!-- Tombol Ayat Selanjutnya -->
      <button 
        class="ctrl-btn" 
        on:click={handleNextAyah} 
        disabled={$currentSurahId === 114 && $currentAyahNumber === currentSurahInfo.totalAyah}
        title="Ayat Selanjutnya"
      >
        <SkipForward size={24} />
      </button>

      <!-- Tombol Catatan Pribadi -->
      <button class="ctrl-btn" on:click={() => isNoteModalOpen = true} title="Tulis Catatan / Tadabbur">
        <FileText size={20} />
      </button>
    </div>

    <!-- Teks Ayat Al-Qur'an & Terjemahan -->
    <div class="verse-display-card retro-card">
      {#if $isLoadingAyah}
        <div class="reader-loading">
          <div class="spinner"></div>
          <p>Memuat ayat Al-Qur'an...</p>
        </div>
      {:else if $quranError}
        <div class="reader-error">
          <p>{$quranError}</p>
          <button class="pill-button pill-button-secondary" on:click={() => loadAyah($currentSurahId, $currentAyahNumber)}>
            Coba Lagi
          </button>
        </div>
      {:else if $currentAyahData}
        <!-- Teks Kaligrafi Arab -->
        <div class="arabic-block">
          <p 
            class="arabic-text main-arabic-verse" 
            style="font-size: {$fontSettings.arabicSize}px;"
          >
            {$currentAyahData.text_arabic}
          </p>
        </div>

        <div class="divider-line"></div>

        <!-- Terjemahan Bahasa Indonesia -->
        <div class="indo-block">
          <p 
            class="indo-translation-text" 
            style="font-size: {$fontSettings.indonesianSize}px;"
          >
            {$currentAyahData.text_indonesian}
          </p>
        </div>

        <!-- Tombol Aksi Langsung Tafsir -->
        <div class="reader-actions-row">
          <button class="pill-button pill-button-primary full-tafsir-btn" on:click={() => isTafsirModalOpen.set(true)}>
            <BookOpen size={16} />
            <span>Baca Tafsir Lengkap</span>
          </button>
          <button class="pill-button pill-button-secondary add-note-btn" on:click={() => isNoteModalOpen = true}>
            <Edit3 size={16} />
            <span>Catatan</span>
          </button>
        </div>
      {/if}
    </div>

    <!-- Daftar Catatan Pribadi yang Melekat pada Ayat Ini -->
    {#if verseNotes.length > 0}
      <div class="attached-notes-box">
        <div class="attached-notes-header">
          <FileText size={16} class="text-amber" />
          <h4>Catatan Pribadi Anda ({verseNotes.length})</h4>
        </div>
        {#each verseNotes as note}
          <button type="button" class="attached-note-card retro-card" on:click={() => isNoteModalOpen = true}>
            <h5 class="attached-note-title">{note.title}</h5>
            <p class="attached-note-content">{note.content}</p>
            <span class="attached-note-date">
              {new Date(note.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Modal Tafsir Al-Qur'an (Kemenag RI) -->
  <TafsirModal onOpenNote={() => isNoteModalOpen = true} />

  <!-- Modal Catatan Pribadi -->
  <NoteEditorModal 
    isOpen={isNoteModalOpen}
    surah={$currentSurahId}
    ayah={$currentAyahNumber}
    surahName={currentSurahInfo.name}
    noteToEdit={verseNotes[0] || null}
    onClose={() => isNoteModalOpen = false}
  />

  <!-- Modal Pengganti Surah Cepat -->
  <SurahPickerModal 
    isOpen={isSurahPickerOpen}
    currentSurahId={$currentSurahId}
    onSelect={(id) => switchSurah(id)}
    onClose={() => isSurahPickerOpen = false}
  />
</div>

<style>
  .reader-container {
    position: relative;
    padding-bottom: 6.5rem;
    min-height: 100vh;
  }

  .reader-content {
    position: relative;
    z-index: 10;
    max-width: 580px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 2rem 1.25rem;
  }

  .reader-top-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .top-nav-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-soft);
    color: var(--text-main);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .top-nav-btn:hover {
    border-color: var(--accent-amber);
    color: var(--accent-amber);
  }

  /* Surah Switcher Controls */
  .top-surah-switcher {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex: 1;
    max-width: 320px;
    margin: 0 0.5rem;
    justify-content: center;
  }

  .surah-step-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-soft);
    color: var(--text-main);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .surah-step-btn:hover:not(:disabled) {
    border-color: var(--accent-amber);
    color: var(--accent-amber);
    transform: scale(1.08);
  }

  .surah-step-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .surah-picker-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background-color: var(--bg-surface);
    border: 1.5px solid var(--border-soft);
    color: var(--text-main);
    border-radius: 9999px;
    padding: 0.45rem 0.85rem;
    font-size: 0.85rem;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all 0.2s ease;
    max-width: 220px;
  }

  .surah-picker-trigger:hover {
    border-color: var(--accent-amber);
    background-color: var(--bg-surface-elevated);
  }

  .surah-trigger-num {
    font-weight: 800;
    color: var(--accent-amber);
  }

  .surah-trigger-name {
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .surah-trigger-meta {
    font-size: 0.72rem;
    color: var(--text-muted);
    white-space: nowrap;
  }

  :global(.trigger-chevron) {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  /* Radial Equalizer & Vinyl Disk Player */
  .disk-section {
    padding: 0.5rem 0 1rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .equalizer-disk-wrapper {
    position: relative;
    width: 280px;
    height: 280px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .radial-equalizer-svg {
    position: absolute;
    inset: 0;
    width: 280px;
    height: 280px;
    pointer-events: none;
    z-index: 1;
  }

  .medallion-disk-btn {
    position: relative;
    z-index: 3;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 50%;
    outline: none;
  }

  .medallion-disk-btn:focus-visible :global(.medallion-disk) {
    box-shadow: 0 0 0 4px var(--accent-amber);
  }

  :global(.medallion-disk.is-playing) {
    animation: spinVinyl 32s linear infinite;
  }

  @keyframes spinVinyl {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .disk-play-overlay {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 5;
    pointer-events: none;
  }

  .medallion-disk-btn:hover .disk-play-overlay {
    opacity: 1;
  }

  .disk-play-overlay.is-playing {
    opacity: 0;
  }

  .medallion-disk-btn:hover .disk-play-overlay.is-playing {
    opacity: 1;
  }

  :global(.spinner-icon) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Murottal Status Badge */
  .murottal-status-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .audio-pill-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.85rem;
    border-radius: 9999px;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-soft);
    color: var(--text-main);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .audio-pill-toggle:hover {
    border-color: var(--accent-amber);
    color: var(--accent-amber);
  }

  .audio-pill-toggle.is-active {
    background-color: var(--accent-cream);
    border-color: var(--accent-amber);
    color: var(--accent-amber);
  }

  :global(.dark) .audio-pill-toggle.is-active {
    background-color: #382819;
    color: var(--accent-gold);
  }

  .pulse-indicator {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: #38A169;
    animation: livePulse 1.2s infinite ease-in-out;
  }

  @keyframes livePulse {
    0%, 100% { transform: scale(0.9); opacity: 0.6; }
    50% { transform: scale(1.3); opacity: 1; }
  }

  .auto-next-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.65rem;
    border-radius: 9999px;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-soft);
    color: var(--text-muted);
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .auto-switch-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--border-soft);
    transition: background-color 0.2s ease;
  }

  .auto-next-btn.active {
    border-color: var(--accent-gold);
    color: var(--text-main);
  }

  .auto-next-btn.active .auto-switch-dot {
    background-color: #38A169;
  }

  .medallion-surah-num {
    font-size: 0.95rem;
    font-weight: 800;
    line-height: 1.1;
  }

  .medallion-ar-text {
    font-family: var(--font-arabic);
    font-size: 0.85rem;
    font-weight: 700;
  }

  .verse-title-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .reader-surah-title {
    font-size: 1.45rem;
    font-weight: 800;
    color: var(--text-main);
    line-height: 1.2;
  }

  .reader-surah-sub {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .heart-bookmark-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.35rem;
    transition: transform 0.2s ease;
  }

  .heart-bookmark-btn:hover {
    transform: scale(1.15);
  }

  .heart-bookmark-btn.bookmarked {
    color: var(--accent-amber);
  }

  /* Scrubber Range Bar */
  .scrubber-container {
    margin-bottom: 1.35rem;
  }

  .scrubber-bar-wrapper {
    position: relative;
    padding: 0.5rem 0;
  }

  .retro-range-slider {
    width: 100%;
    appearance: none;
    -webkit-appearance: none;
    height: 6px;
    border-radius: 9999px;
    background: linear-gradient(to right, var(--accent-amber), var(--accent-gold));
    outline: none;
    cursor: pointer;
  }

  .retro-range-slider::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #FFFFFF;
    border: 3px solid var(--accent-amber);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .retro-range-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .scrubber-time-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  .current-ayah-tag {
    color: var(--accent-amber);
    font-weight: 700;
  }

  /* Player Controls Bar */
  .player-controls-bar {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0.65rem 0.5rem;
    margin-bottom: 1.5rem;
  }

  .ctrl-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: var(--text-main);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ctrl-btn:hover:not(:disabled) {
    color: var(--accent-amber);
    transform: scale(1.1);
  }

  .ctrl-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .main-play-btn {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-amber) 100%);
    border: none;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 18px rgba(216, 125, 54, 0.4);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .main-play-btn:hover {
    transform: scale(1.06);
    box-shadow: 0 8px 24px rgba(216, 125, 54, 0.5);
  }

  .main-play-btn:active {
    transform: scale(0.96);
  }

  /* Verse Display Card */
  .verse-display-card {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .arabic-block {
    margin-bottom: 1.25rem;
    padding: 0.5rem 0;
  }

  .main-arabic-verse {
    color: var(--text-main);
  }

  .divider-line {
    height: 1px;
    background: var(--border-soft);
    margin-bottom: 1.25rem;
  }

  .indo-translation-text {
    color: var(--text-muted);
    line-height: 1.7;
    margin-bottom: 1.5rem;
  }

  .reader-actions-row {
    display: flex;
    gap: 0.75rem;
  }

  .full-tafsir-btn {
    flex: 1;
  }

  .add-note-btn {
    padding: 0.75rem 1.25rem;
  }

  .reader-loading, .reader-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1rem;
    gap: 1rem;
    color: var(--text-muted);
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border-soft);
    border-top-color: var(--accent-amber);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .attached-notes-box {
    margin-top: 1.25rem;
  }

  .attached-notes-header {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: 0.75rem;
  }

  .attached-notes-header h4 {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .attached-note-card {
    width: 100%;
    text-align: left;
    padding: 1rem;
    margin-bottom: 0.65rem;
    cursor: pointer;
  }

  .attached-note-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--accent-amber);
    margin-bottom: 0.25rem;
  }

  .attached-note-content {
    font-size: 0.82rem;
    color: var(--text-main);
    margin-bottom: 0.35rem;
  }

  .attached-note-date {
    font-size: 0.68rem;
    color: var(--text-muted);
  }
</style>
