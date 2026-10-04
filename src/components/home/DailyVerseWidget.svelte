<script>
  import { DAILY_VERSES } from "../../data/dailyVerses.js";
  import { loadAyah, isTafsirModalOpen } from "../../stores/quranStore.js";
  import { activeTab } from "../../stores/appStore.js";
  import { toggleAyahBookmark } from "../../stores/userStore.js";
  import { BookOpen, RefreshCw, Copy, Check, Sparkles, Bookmark } from "lucide-svelte";

  let currentIndex = 0;
  let copied = false;
  let bookmarked = false;

  $: currentVerse = DAILY_VERSES[currentIndex] || DAILY_VERSES[0];

  function nextDaily() {
    currentIndex = (currentIndex + 1) % DAILY_VERSES.length;
    copied = false;
  }

  async function openFullTafsir() {
    await loadAyah(currentVerse.surah, currentVerse.ayah);
    activeTab.set("reader");
    isTafsirModalOpen.set(true);
  }

  async function copyVerseText() {
    const textToCopy = `"${currentVerse.text_indonesian}"\n\n— QS. ${currentVerse.surahName} [${currentVerse.surah}:${currentVerse.ayah}]\n(Tafsir — Taf.id)`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      copied = true;
      setTimeout(() => copied = false, 2500);
    } catch (e) {
      console.warn("Gagal menyalin:", e);
    }
  }

  function handleBookmark() {
    toggleAyahBookmark({
      surah: currentVerse.surah,
      ayah: currentVerse.ayah,
      surahName: currentVerse.surahName,
      text_arabic: currentVerse.text_arabic,
      text_indonesian: currentVerse.text_indonesian
    });
    bookmarked = !bookmarked;
    setTimeout(() => bookmarked = false, 2000);
  }
</script>

<div class="daily-widget-card retro-card">
  <!-- Header Bar Widget -->
  <div class="widget-header">
    <div class="header-badge">
      <Sparkles size={14} color="var(--accent-gold)" />
      <span>Ayat Hari Ini</span>
    </div>
    <div class="header-actions">
      <button class="mini-btn" on:click={nextDaily} title="Ganti Ayat Pilihan Lainnya">
        <RefreshCw size={14} />
      </button>
      <button class="mini-btn" on:click={handleBookmark} title="Simpan ke Bookmark">
        <Bookmark size={14} />
      </button>
      <button class="mini-btn" on:click={copyVerseText} title="Salin Kutipan Ayat">
        {#if copied}
          <Check size={14} color="#38A169" />
        {:else}
          <Copy size={14} />
        {/if}
      </button>
    </div>
  </div>

  <!-- Surah & Tema -->
  <div class="verse-meta">
    <span class="surah-tag">QS. {currentVerse.surahName} : {currentVerse.ayah}</span>
    <span class="theme-tag">{currentVerse.theme}</span>
  </div>

  <!-- Teks Arab -->
  <div class="verse-arabic-box">
    <p class="arabic-text verse-arabic">
      {currentVerse.text_arabic}
    </p>
  </div>

  <!-- Teks Terjemahan -->
  <p class="verse-translation">
    "{currentVerse.text_indonesian}"
  </p>

  <!-- Action CTA -->
  <div class="widget-footer">
    <button class="pill-button pill-button-primary tafsir-cta-btn" on:click={openFullTafsir}>
      <BookOpen size={16} />
      <span>Pelajari Tafsir Kemenag RI</span>
    </button>
  </div>
</div>

<style>
  .daily-widget-card {
    position: relative;
    padding: 1.25rem;
    background: linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-surface-elevated) 100%);
    border: 1.5px solid var(--border-soft);
    overflow: hidden;
  }

  .daily-widget-card::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 90px;
    height: 90px;
    background: radial-gradient(circle, rgba(232, 158, 56, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.85rem;
  }

  .header-badge {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    background-color: var(--accent-cream);
    color: var(--accent-amber);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  :global(.dark) .header-badge {
    background-color: #38291A;
    color: var(--accent-gold);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .mini-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--bg-surface);
    border: 1px solid var(--border-soft);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mini-btn:hover {
    color: var(--accent-amber);
    border-color: var(--accent-amber);
  }

  .verse-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.85rem;
  }

  .surah-tag {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--accent-amber);
  }

  .theme-tag {
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    background-color: var(--bg-surface-elevated);
    color: var(--text-muted);
    border: 1px solid var(--border-soft);
  }

  .verse-arabic-box {
    margin-bottom: 0.75rem;
    padding: 0.5rem 0.25rem;
  }

  .verse-arabic {
    font-size: 1.55rem;
    color: var(--text-main);
    line-height: 2;
  }

  .verse-translation {
    font-size: 0.88rem;
    color: var(--text-muted);
    line-height: 1.6;
    margin-bottom: 1.15rem;
    font-style: italic;
  }

  .widget-footer {
    display: flex;
    justify-content: flex-end;
  }

  .tafsir-cta-btn {
    font-size: 0.85rem;
    padding: 0.6rem 1.25rem;
    width: 100%;
  }
</style>
