<script>
  import { SURAH_LIST } from "../../data/surahList.js";
  import { loadAyah } from "../../stores/quranStore.js";
  import { activeTab } from "../../stores/appStore.js";
  import WavyRibbons from "../common/WavyRibbons.svelte";
  import { Search, Filter, BookOpen } from "lucide-svelte";

  let searchQuery = "";
  let selectedFilter = "all"; // 'all' | 'Makkiyyah' | 'Madaniyyah'

  $: filteredSurahs = SURAH_LIST.filter(s => {
    // Filter kategori
    if (selectedFilter !== "all" && s.type !== selectedFilter) {
      return false;
    }
    // Filter pencarian
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      s.id.toString() === query ||
      s.name.toLowerCase().includes(query) ||
      s.meaning.toLowerCase().includes(query) ||
      s.nameAr.includes(query)
    );
  });

  async function selectSurah(surah) {
    await loadAyah(surah.id, 1);
    activeTab.set("reader");
  }
</script>

<div class="surah-list-container">
  <WavyRibbons position="top" />

  <div class="surah-list-content">
    <div class="page-header">
      <h1 class="page-title">Daftar Surah</h1>
      <p class="page-desc">Pilih dari 114 surat Al-Qur'an untuk membaca ayat dan tafsirnya</p>
    </div>

    <!-- Search Bar -->
    <div class="search-input-wrapper">
      <Search size={18} class="search-icon" />
      <input 
        type="text" 
        bind:value={searchQuery}
        placeholder="Cari nama surat (misal: Al-Baqarah, Yasin, 18)..." 
        class="retro-input search-input"
      />
      {#if searchQuery}
        <button class="clear-btn" on:click={() => searchQuery = ""}>✕</button>
      {/if}
    </div>

    <!-- Filter Tabs (Semua / Makkiyyah / Madaniyyah) -->
    <div class="filter-pills-bar">
      <button 
        class="filter-pill" 
        class:active={selectedFilter === "all"}
        on:click={() => selectedFilter = "all"}
      >
        Semua (114)
      </button>
      <button 
        class="filter-pill" 
        class:active={selectedFilter === "Makkiyyah"}
        on:click={() => selectedFilter = "Makkiyyah"}
      >
        Makkiyyah (86)
      </button>
      <button 
        class="filter-pill" 
        class:active={selectedFilter === "Madaniyyah"}
        on:click={() => selectedFilter = "Madaniyyah"}
      >
        Madaniyyah (28)
      </button>
    </div>

    <!-- Surah Cards List -->
    <div class="surahs-grid">
      {#if filteredSurahs.length === 0}
        <div class="empty-state retro-card">
          <BookOpen size={36} class="text-dim" />
          <p>Surah tidak ditemukan untuk "{searchQuery}"</p>
        </div>
      {:else}
        {#each filteredSurahs as surah (surah.id)}
          <button class="surah-card retro-card" on:click={() => selectSurah(surah)}>
            <!-- Nomor Surah Badge -->
            <div class="surah-number-badge">
              <span>{surah.id}</span>
            </div>

            <!-- Detail Surah (Nama Latin & Arti) -->
            <div class="surah-info">
              <div class="surah-name-row">
                <h3 class="surah-latin">{surah.name}</h3>
                <span class="surah-type-badge" class:madani={surah.type === "Madaniyyah"}>
                  {surah.type}
                </span>
              </div>
              <p class="surah-meaning">{surah.meaning} • {surah.totalAyah} Ayat</p>
            </div>

            <!-- Kaligrafi Nama Arab -->
            <div class="surah-arabic-container">
              <span class="arabic-text surah-arabic">{surah.nameAr}</span>
            </div>
          </button>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .surah-list-container {
    position: relative;
    padding-bottom: 6.5rem;
    min-height: 100vh;
  }

  .surah-list-content {
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

  .search-input-wrapper {
    position: relative;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
  }

  .search-input {
    padding-left: 2.75rem;
    padding-right: 2.5rem;
  }

  .clear-btn {
    position: absolute;
    right: 0.85rem;
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-size: 0.9rem;
    cursor: pointer;
  }

  .filter-pills-bar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .filter-pills-bar::-webkit-scrollbar {
    display: none;
  }

  .filter-pill {
    padding: 0.45rem 1rem;
    border-radius: 9999px;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-soft);
    color: var(--text-muted);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .filter-pill.active {
    background-color: var(--accent-amber);
    color: #FFFFFF;
    border-color: var(--accent-amber);
    box-shadow: 0 2px 8px rgba(216, 125, 54, 0.3);
  }

  .surahs-grid {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .surah-card {
    display: flex;
    align-items: center;
    padding: 0.95rem 1.15rem;
    text-align: left;
    cursor: pointer;
    gap: 0.95rem;
  }

  .surah-card:hover {
    transform: translateX(3px);
  }

  .surah-number-badge {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background-color: var(--bg-surface-elevated);
    border: 1.5px solid var(--border-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.88rem;
    color: var(--accent-amber);
    flex-shrink: 0;
  }

  .surah-info {
    flex: 1;
    min-width: 0;
  }

  .surah-name-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: 0.15rem;
  }

  .surah-latin {
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .surah-type-badge {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.1rem 0.45rem;
    border-radius: 6px;
    background-color: var(--bg-surface-elevated);
    color: var(--text-muted);
  }

  .surah-type-badge.madani {
    background-color: var(--accent-cream);
    color: var(--accent-amber);
  }

  :global(.dark) .surah-type-badge.madani {
    background-color: #38291A;
    color: var(--accent-gold);
  }

  .surah-meaning {
    font-size: 0.76rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .surah-arabic-container {
    text-align: right;
    flex-shrink: 0;
  }

  .surah-arabic {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--accent-amber);
    line-height: 1.2;
  }

  .empty-state {
    padding: 2.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: var(--text-muted);
    font-size: 0.9rem;
  }
</style>
