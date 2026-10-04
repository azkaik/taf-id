<script>
  import { SURAH_LIST } from "../../data/surahList.js";
  import { DAILY_VERSES } from "../../data/dailyVerses.js";
  import { loadAyah, isTafsirModalOpen } from "../../stores/quranStore.js";
  import { activeTab } from "../../stores/appStore.js";
  import WavyRibbons from "../common/WavyRibbons.svelte";
  import { Search, BookOpen, Sparkles, ArrowRight, CornerDownLeft } from "lucide-svelte";

  let searchQuery = "";
  let isSearchingAyah = false;
  let parsedAyahTarget = null;

  // Deteksi pencarian format cepat "2:255" atau "2 255"
  $: {
    parsedAyahTarget = null;
    const clean = searchQuery.trim();
    const match = clean.match(/^(\d{1,3})[:\s](\d{1,3})$/);
    if (match) {
      const sNum = Number(match[1]);
      const aNum = Number(match[2]);
      const sInfo = SURAH_LIST.find(s => s.id === sNum);
      if (sInfo && aNum >= 1 && aNum <= sInfo.totalAyah) {
        parsedAyahTarget = { surah: sNum, ayah: aNum, surahName: sInfo.name };
      }
    }
  }

  // Hasil filter Surah
  $: matchedSurahs = searchQuery.trim() ? SURAH_LIST.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    return (
      s.id.toString() === q ||
      s.name.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q) ||
      s.nameAr.includes(q)
    );
  }) : [];

  // Hasil filter Ayat Tematik / Kata Kunci
  $: matchedThematicVerses = searchQuery.trim() ? DAILY_VERSES.filter(v => {
    const q = searchQuery.toLowerCase().trim();
    return (
      v.text_indonesian.toLowerCase().includes(q) ||
      v.title.toLowerCase().includes(q) ||
      v.theme.toLowerCase().includes(q) ||
      v.surahName.toLowerCase().includes(q)
    );
  }) : [];

  const QUICK_SEARCH_CHIPS = [
    { label: "2:255 (Ayat Kursi)", surah: 2, ayah: 255 },
    { label: "36:1 (Ya-Sin)", surah: 36, ayah: 1 },
    { label: "18:10 (Ashabul Kahfi)", surah: 18, ayah: 10 },
    { label: "94:6 (Kemudahan)", surah: 94, ayah: 6 },
    { label: "67:1 (Al-Mulk)", surah: 67, ayah: 1 },
    { label: "55:1 (Ar-Rahman)", surah: 55, ayah: 1 },
    { label: "112:1 (Al-Ikhlas)", surah: 112, ayah: 1 }
  ];

  async function jumpToAyah(surah, ayah, openTafsir = false) {
    isSearchingAyah = true;
    try {
      await loadAyah(surah, ayah);
      activeTab.set("reader");
      if (openTafsir) {
        isTafsirModalOpen.set(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      isSearchingAyah = false;
    }
  }

  function handleKeydown(e) {
    if (e.key === "Enter" && parsedAyahTarget) {
      jumpToAyah(parsedAyahTarget.surah, parsedAyahTarget.ayah);
    }
  }
</script>

<div class="search-container">
  <WavyRibbons position="top" />

  <div class="search-content">
    <div class="page-header">
      <h1 class="page-title">Pencarian Pintar</h1>
      <p class="page-desc">Cari surah, nomor ayat (misal: <code>2:255</code>), atau kata kunci terjemahan</p>
    </div>

    <!-- Search Input Form -->
    <div class="search-box retro-card">
      <Search size={20} class="search-icon" />
      <input 
        type="text" 
        bind:value={searchQuery}
        on:keydown={handleKeydown}
        placeholder="Ketik '2:255', nama surah, atau kata kunci..." 
        class="search-input"
      />
      {#if searchQuery}
        <button class="clear-btn" on:click={() => searchQuery = ""}>✕</button>
      {/if}
    </div>

    <!-- Hasil Cepat Format Ayat Spesifik (e.g., 2:255) -->
    {#if parsedAyahTarget}
      <div class="quick-jump-banner retro-card">
        <div class="jump-info">
          <span class="jump-pill">Lompat Cepat ke Ayat</span>
          <h3>QS. {parsedAyahTarget.surahName} [ {parsedAyahTarget.surah} : {parsedAyahTarget.ayah} ]</h3>
          <p>Buka langsung teks ayat & tafsir lengkap</p>
        </div>
        <div class="jump-actions">
          <button 
            class="pill-button pill-button-secondary" 
            on:click={() => jumpToAyah(parsedAyahTarget.surah, parsedAyahTarget.ayah, true)}
          >
            Baca Tafsir
          </button>
          <button 
            class="pill-button pill-button-primary" 
            on:click={() => jumpToAyah(parsedAyahTarget.surah, parsedAyahTarget.ayah, false)}
          >
            Buka Ayat <ArrowRight size={14} />
          </button>
        </div>
      </div>
    {/if}

    <!-- Quick Search Chips -->
    <div class="quick-chips-section">
      <span class="section-label">Pencarian Populer:</span>
      <div class="chips-row">
        {#each QUICK_SEARCH_CHIPS as chip}
          <button class="chip-btn" on:click={() => jumpToAyah(chip.surah, chip.ayah)}>
            {chip.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Hasil Filter Surah -->
    {#if matchedSurahs.length > 0}
      <div class="results-group">
        <h3 class="group-title">Surah Ditemukan ({matchedSurahs.length})</h3>
        <div class="surah-results-list">
          {#each matchedSurahs.slice(0, 8) as s}
            <div class="surah-result-card retro-card">
              <div class="result-left">
                <span class="num-box">{s.id}</span>
                <div>
                  <h4 class="surah-title">{s.name}</h4>
                  <p class="surah-desc">{s.meaning} • {s.totalAyah} Ayat</p>
                </div>
              </div>

              <div class="result-actions">
                <button 
                  class="action-mini-btn" 
                  on:click={() => jumpToAyah(s.id, 1)}
                  title="Baca dari Ayat 1"
                >
                  <BookOpen size={16} />
                  <span>Ayat 1</span>
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Hasil Filter Ayat Tematik / Kata Kunci -->
    {#if matchedThematicVerses.length > 0}
      <div class="results-group">
        <h3 class="group-title">Ayat Terkait Kata Kunci ({matchedThematicVerses.length})</h3>
        <div class="verse-results-list">
          {#each matchedThematicVerses as v}
            <button type="button" class="thematic-card retro-card" on:click={() => jumpToAyah(v.surah, v.ayah, true)}>
              <div class="thematic-meta">
                <span class="thematic-surah">QS. {v.surahName} : {v.ayah}</span>
                <span class="thematic-theme">{v.theme}</span>
              </div>
              <p class="thematic-indo">"{v.text_indonesian}"</p>
              <div class="thematic-cta">
                <span>Buka Tafsir Lengkap</span>
                <ArrowRight size={14} />
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    {#if searchQuery.trim() && !parsedAyahTarget && matchedSurahs.length === 0 && matchedThematicVerses.length === 0}
      <div class="empty-search-state retro-card">
        <Search size={36} class="text-dim" />
        <p>Tidak ada hasil untuk "{searchQuery}".</p>
        <span class="empty-hint">Tips: Masukkan nomor seperti "2:255" untuk membuka ayat langsung.</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .search-container {
    position: relative;
    padding-bottom: 6.5rem;
    min-height: 100vh;
  }

  .search-content {
    position: relative;
    z-index: 10;
    max-width: 580px;
    margin: 0 auto;
    padding: 4.5rem 1.25rem 1.5rem 1.25rem;
  }

  .page-header {
    margin-bottom: 1.25rem;
  }

  .page-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--text-main);
    line-height: 1.2;
    margin-bottom: 0.25rem;
  }

  .page-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .page-desc code {
    background: var(--bg-surface-elevated);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    color: var(--accent-amber);
    font-weight: 700;
  }

  .search-box {
    display: flex;
    align-items: center;
    padding: 0.4rem 1rem;
    margin-bottom: 1.25rem;
    background-color: var(--bg-surface);
    gap: 0.75rem;
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--font-sans);
    font-size: 0.95rem;
    color: var(--text-main);
    padding: 0.5rem 0;
  }

  .clear-btn {
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-size: 1rem;
    cursor: pointer;
  }

  .quick-jump-banner {
    padding: 1.15rem 1.25rem;
    background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-elevated) 100%);
    border: 1.5px solid var(--accent-amber);
    margin-bottom: 1.25rem;
    animation: fadeIn 0.2s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .jump-pill {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--accent-amber);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .jump-info h3 {
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--text-main);
    margin: 0.25rem 0;
  }

  .jump-info p {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 0.85rem;
  }

  .jump-actions {
    display: flex;
    gap: 0.65rem;
  }

  .jump-actions .pill-button {
    font-size: 0.82rem;
    padding: 0.55rem 1.15rem;
  }

  .quick-chips-section {
    margin-bottom: 1.5rem;
  }

  .section-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .chip-btn {
    padding: 0.4rem 0.85rem;
    border-radius: 9999px;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-soft);
    color: var(--text-main);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .chip-btn:hover {
    border-color: var(--accent-amber);
    color: var(--accent-amber);
    transform: translateY(-1px);
  }

  .results-group {
    margin-bottom: 1.5rem;
  }

  .group-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }

  .surah-results-list, .verse-results-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .surah-result-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1rem;
  }

  .result-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .num-box {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--bg-surface-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.8rem;
    color: var(--accent-amber);
  }

  .surah-title {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .surah-desc {
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  .action-mini-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.85rem;
    border-radius: 9999px;
    background: var(--bg-surface-elevated);
    border: 1px solid var(--border-soft);
    color: var(--accent-amber);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-mini-btn:hover {
    background-color: var(--accent-amber);
    color: #FFFFFF;
  }

  .thematic-card {
    padding: 1rem 1.15rem;
    cursor: pointer;
  }

  .thematic-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.35rem;
  }

  .thematic-surah {
    font-weight: 700;
    font-size: 0.88rem;
    color: var(--accent-amber);
  }

  .thematic-theme {
    font-size: 0.7rem;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    background: var(--bg-surface-elevated);
    color: var(--text-muted);
  }

  .thematic-indo {
    font-size: 0.82rem;
    color: var(--text-muted);
    font-style: italic;
    line-height: 1.55;
    margin-bottom: 0.65rem;
  }

  .thematic-cta {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--accent-amber);
  }

  .empty-search-state {
    padding: 3rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    text-align: center;
    color: var(--text-muted);
  }

  .empty-hint {
    font-size: 0.78rem;
    color: var(--text-dim);
  }
</style>
