<script>
  import { activeTab } from "../../stores/appStore.js";
  import { lastRead, bookmarks, notes } from "../../stores/userStore.js";
  import { loadAyah, loadRandomAyah } from "../../stores/quranStore.js";
  import { SURAH_LIST } from "../../data/surahList.js";
  import DailyVerseWidget from "./DailyVerseWidget.svelte";
  import WavyRibbons from "../common/WavyRibbons.svelte";
  import { BookOpen, Clock, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-svelte";

  // Surah Populer / Sering Dibaca untuk Carousel Mini-Album (12 Surah)
  const POPULAR_SURAHS = [
    { id: 1, name: "Al-Fatihah", ar: "الفاتحة", ayat: 7, color: "#D87D36" },
    { id: 2, name: "Al-Baqarah", ar: "البقرة", ayat: 286, color: "#C85A32" },
    { id: 3, name: "Ali 'Imran", ar: "آل عمران", ayat: 200, color: "#B87333" },
    { id: 12, name: "Yusuf", ar: "يوسف", ayat: 111, color: "#D97706" },
    { id: 18, name: "Al-Kahf", ar: "الكهف", ayat: 110, color: "#8C5A20" },
    { id: 19, name: "Maryam", ar: "مريم", ayat: 98, color: "#B45309" },
    { id: 36, name: "Ya-Sin", ar: "يس", ayat: 83, color: "#C85A32" },
    { id: 55, name: "Ar-Rahman", ar: "الرحمن", ayat: 78, color: "#D87D36" },
    { id: 56, name: "Al-Waqi'ah", ar: "الواقعة", ayat: 96, color: "#A0522D" },
    { id: 67, name: "Al-Mulk", ar: "الملك", ayat: 30, color: "#E89E38" },
    { id: 76, name: "Al-Insan", ar: "الانسان", ayat: 31, color: "#C25E2E" },
    { id: 112, name: "Al-Ikhlas", ar: "الإخلاص", ayat: 4, color: "#E89E38" }
  ];

  let carouselRef;
  let isDragging = false;
  let startX = 0;
  let scrollLeftStart = 0;
  let hasDragged = false;

  function handleCarouselWheel(e) {
    if (!carouselRef) return;
    if (Math.abs(e.deltaY) > 0) {
      carouselRef.scrollLeft += e.deltaY;
    }
  }

  function scrollCarousel(direction) {
    if (!carouselRef) return;
    carouselRef.scrollBy({ left: direction * 240, behavior: "smooth" });
  }

  function onPointerDown(e) {
    if (!carouselRef) return;
    isDragging = true;
    hasDragged = false;
    startX = e.pageX - carouselRef.offsetLeft;
    scrollLeftStart = carouselRef.scrollLeft;
  }

  function onPointerMove(e) {
    if (!isDragging || !carouselRef) return;
    const x = e.pageX - carouselRef.offsetLeft;
    const walk = (x - startX);
    if (Math.abs(walk) > 5) {
      hasDragged = true;
    }
    carouselRef.scrollLeft = scrollLeftStart - walk;
  }

  function onPointerUp() {
    isDragging = false;
    setTimeout(() => {
      hasDragged = false;
    }, 50);
  }

  function handleCardClick(surahId) {
    if (hasDragged) return;
    openSurahFirstAyah(surahId);
  }

  async function resumeReading() {
    if ($lastRead) {
      await loadAyah($lastRead.surah, $lastRead.ayah);
      activeTab.set("reader");
    } else {
      await loadAyah(2, 255);
      activeTab.set("reader");
    }
  }

  async function openSurahFirstAyah(surahId) {
    await loadAyah(surahId, 1);
    activeTab.set("reader");
  }

  async function handleRandomAyah() {
    await loadRandomAyah();
    activeTab.set("reader");
  }
</script>

<div class="home-container">
  <WavyRibbons position="top" />

  <div class="home-content">
    <!-- Greeting Section (Sesuai Olá screen di mockup) -->
    <div class="greeting-section">
      <p class="greeting-sub">Assalamu'alaikum warahmatullahi wabarakatuh</p>
      <h1 class="greeting-title">Tadabbur Al-Qur'an</h1>
      <p class="greeting-desc">Pahami makna firman Allah SWT melalui Tafsir Al-Qur'an Kemenag RI yang mendalam.</p>
    </div>

    <!-- Card Riwayat Terakhir Dibaca (Last Read) -->
    <div class="last-read-card retro-card">
      <div class="last-read-left">
        <div class="history-pill">
          <Clock size={12} />
          <span>Terakhir Dibaca</span>
        </div>
        <h3 class="last-read-surah">
          {$lastRead?.surahName || "Al-Baqarah"} : {$lastRead?.ayah || 255}
        </h3>
        <p class="last-read-time">
          Lanjutkan membaca dari posisi terakhir Anda
        </p>
      </div>

      <button class="pill-button pill-button-primary resume-btn" on:click={resumeReading}>
        <span>Lanjut</span>
        <ArrowRight size={15} />
      </button>
    </div>

    <!-- Widget Kutipan Harian / Ayat Hari Ini -->
    <div class="section-block">
      <DailyVerseWidget />
    </div>

    <!-- Carousel Album / Mini Vinyl Surah Pilihan (Sesuai mockup Álbuns) -->
    <div class="section-block">
      <div class="section-header">
        <div class="section-title-wrap">
          <h2 class="section-title">Surah Pilihan</h2>
          <span class="section-subtitle-tag">{POPULAR_SURAHS.length} Surah</span>
        </div>

        <div class="carousel-actions">
          <div class="carousel-nav-arrows">
            <button 
              type="button" 
              class="carousel-arrow-btn" 
              on:click={() => scrollCarousel(-1)} 
              title="Geser ke kiri"
              aria-label="Geser ke kiri"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              type="button" 
              class="carousel-arrow-btn" 
              on:click={() => scrollCarousel(1)} 
              title="Geser ke kanan"
              aria-label="Geser ke kanan"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button class="section-link" on:click={() => activeTab.set("surahs")}>
            Lihat Semua 114
          </button>
        </div>
      </div>

      <div 
        class="surah-carousel"
        class:is-dragging={isDragging}
        role="region"
        aria-label="Daftar Surah Pilihan"
        bind:this={carouselRef}
        on:wheel|passive={handleCarouselWheel}
        on:pointerdown={onPointerDown}
        on:pointermove={onPointerMove}
        on:pointerup={onPointerUp}
        on:pointerleave={onPointerUp}
      >
        {#each POPULAR_SURAHS as s}
          <button 
            type="button"
            class="surah-disk-card" 
            on:click={() => handleCardClick(s.id)}
          >
            <div class="mini-disk">
              <div class="mini-disk-grooves"></div>
              <div class="mini-disk-label" style="background-color: {s.color};">
                <span 
                  class="mini-disk-ar" 
                  class:is-short={s.ar.length <= 3}
                  class:is-medium={s.ar.length >= 6 && s.ar.length < 8 && !s.ar.includes(" ")}
                  class:is-long={s.ar.length >= 8 || s.ar.includes(" ")}
                >
                  {s.ar}
                </span>
              </div>
            </div>
            <span class="surah-disk-name">{s.name}</span>
            <span class="surah-disk-meta">{s.ayat} Ayat</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Quick Action Banner (Jelajahi & Acak Ayat) -->
    <div class="quick-tools-grid">
      <button class="quick-tool-card retro-card" on:click={() => activeTab.set("surahs")}>
        <div class="tool-icon-wrapper">
          <BookOpen size={20} color="var(--accent-amber)" />
        </div>
        <div class="tool-info">
          <h4>Daftar Surah</h4>
          <p>114 Surah Makkiyyah & Madaniyyah</p>
        </div>
      </button>

      <button class="quick-tool-card retro-card" on:click={handleRandomAyah}>
        <div class="tool-icon-wrapper">
          <Sparkles size={20} color="var(--accent-amber)" />
        </div>
        <div class="tool-info">
          <h4>Ayat Acak</h4>
          <p>Refleksi ayat baru penuh hikmah</p>
        </div>
      </button>
    </div>

    <!-- Stat Ringkasan Bookmark & Catatan -->
    <button type="button" class="saved-summary-card retro-card" on:click={() => activeTab.set("notes")}>
      <div class="summary-item">
        <div class="summary-text">
          <span class="summary-count">{$bookmarks?.length || 0}</span>
          <span class="summary-label">Bookmark Tersimpan</span>
        </div>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <div class="summary-text">
          <span class="summary-count">{$notes?.length || 0}</span>
          <span class="summary-label">Catatan Pribadi</span>
        </div>
      </div>
    </button>
  </div>
</div>

<style>
  .home-container {
    position: relative;
    padding-bottom: 6.5rem;
    min-height: 100vh;
  }

  .home-content {
    position: relative;
    z-index: 10;
    max-width: 580px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 2rem 1.25rem;
  }

  .greeting-section {
    margin-bottom: 1.35rem;
  }

  .greeting-sub {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--accent-amber);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .greeting-title {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text-main);
    line-height: 1.2;
    margin-bottom: 0.35rem;
  }

  .greeting-desc {
    font-size: 0.88rem;
    color: var(--text-muted);
  }

  .last-read-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.15rem 1.25rem;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-elevated) 100%);
    border: 1.5px solid var(--border-soft);
  }

  .history-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.55rem;
    border-radius: 9999px;
    background-color: var(--accent-cream);
    color: var(--accent-amber);
    font-size: 0.7rem;
    font-weight: 700;
    margin-bottom: 0.35rem;
  }

  :global(.dark) .history-pill {
    background-color: #38291A;
    color: var(--accent-gold);
  }

  .last-read-surah {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 0.15rem;
  }

  .last-read-time {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .resume-btn {
    padding: 0.65rem 1.25rem;
    font-size: 0.88rem;
  }

  .section-block {
    margin-bottom: 2rem;
    position: relative;
    scroll-margin-top: 80px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.95rem;
    padding-top: 0.25rem;
  }

  .section-title-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .section-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.3;
  }

  .section-subtitle-tag {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    background-color: var(--accent-cream);
    color: var(--accent-amber);
  }

  :global(.dark) .section-subtitle-tag {
    background-color: #38291A;
    color: var(--accent-gold);
  }

  .carousel-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .carousel-nav-arrows {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .carousel-arrow-btn {
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

  .carousel-arrow-btn:hover {
    background: var(--bg-surface-elevated);
    color: var(--accent-amber);
    border-color: var(--accent-amber);
    transform: scale(1.05);
  }

  .section-link {
    background: transparent;
    border: none;
    color: var(--accent-amber);
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .section-link:hover {
    color: var(--accent-gold);
    text-decoration: underline;
  }

  .surah-carousel {
    display: flex;
    gap: 0.85rem;
    overflow-x: auto;
    padding: 0.6rem 0.25rem 0.75rem 0.25rem;
    margin: -0.3rem -0.25rem 0 -0.25rem;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    cursor: grab;
    user-select: none;
    -webkit-overflow-scrolling: touch;
  }

  .surah-carousel.is-dragging {
    cursor: grabbing;
    scroll-behavior: auto;
    scroll-snap-type: none;
  }

  .surah-carousel::-webkit-scrollbar {
    height: 5px;
  }

  .surah-carousel::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.04);
    border-radius: 9999px;
  }

  :global(.dark) .surah-carousel::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .surah-carousel::-webkit-scrollbar-thumb {
    background: rgba(216, 125, 54, 0.35);
    border-radius: 9999px;
  }

  .surah-carousel::-webkit-scrollbar-thumb:hover {
    background: var(--accent-amber);
  }

  .surah-disk-card {
    flex: 0 0 100px;
    background: var(--bg-surface);
    border: 1px solid var(--border-soft);
    border-radius: 1.25rem;
    padding: 0.85rem 0.65rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .surah-disk-card:hover {
    transform: translateY(-3px);
    border-color: var(--accent-amber);
  }

  .mini-disk {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: radial-gradient(circle, #FDE8C7 0%, #F7D8B2 60%, #EAC496 100%);
    border: 2px solid rgba(216, 125, 54, 0.35);
    box-shadow: 0 4px 10px rgba(184, 115, 51, 0.18), inset 0 0 6px rgba(255, 255, 255, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
    position: relative;
    transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }

  :global(.dark) .mini-disk {
    background: radial-gradient(circle, #2E251E 0%, #1A1512 60%, #0E0C0A 100%);
    border: 2px solid rgba(240, 168, 78, 0.35);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6), inset 0 0 8px rgba(0, 0, 0, 0.8);
  }

  .mini-disk-grooves {
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    border: 1px dashed rgba(184, 115, 51, 0.35);
    transition: border-color 0.3s ease;
  }

  :global(.dark) .mini-disk-grooves {
    border: 1px dashed rgba(255, 255, 255, 0.15);
  }

  .mini-disk-label {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    padding: 1px;
    flex-shrink: 0;
  }

  .mini-disk-ar {
    font-family: var(--font-arabic);
    color: #FFFFFF;
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    text-align: center;
    pointer-events: none;
    max-width: 100%;
  }

  .mini-disk-ar.is-short {
    font-size: 0.82rem;
  }

  .mini-disk-ar.is-medium {
    font-size: 0.65rem;
  }

  .mini-disk-ar.is-long {
    font-size: 0.55rem;
    letter-spacing: -0.01em;
  }

  .surah-disk-name {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-main);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 90px;
  }

  .surah-disk-meta {
    font-size: 0.68rem;
    color: var(--text-muted);
  }

  .quick-tools-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
    margin-bottom: 1.5rem;
  }

  .quick-tool-card {
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-align: left;
    cursor: pointer;
  }

  .tool-icon-wrapper {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background-color: var(--bg-surface-elevated);
    border: 1px solid var(--border-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tool-info h4 {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .tool-info p {
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .saved-summary-card {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 1.15rem 1rem;
    cursor: pointer;
    background: var(--bg-surface);
  }

  .summary-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .summary-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.25rem;
  }

  .summary-count {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--accent-amber);
    line-height: 1;
  }

  .summary-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .summary-divider {
    width: 1px;
    height: 32px;
    background-color: var(--border-soft);
  }
</style>
