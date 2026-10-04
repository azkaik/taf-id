<script>
  import { onMount, tick } from "svelte";
  import { SURAH_LIST } from "../../data/surahList.js";
  import { X, Search, Check, Sparkles } from "lucide-svelte";

  export let isOpen = false;
  export let currentSurahId = 1;
  export let onSelect = (surahId) => {};
  export let onClose = () => {};

  let searchQuery = "";
  let searchInputRef;

  function scrollIfActive(node, isActive) {
    if (isActive) {
      setTimeout(() => {
        node.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 60);
    }
  }

  $: filteredSurahs = SURAH_LIST.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q) ||
      String(s.id) === q ||
      String(s.id).startsWith(q) ||
      s.nameAr.includes(q)
    );
  });

  $: if (isOpen) {
    searchQuery = "";
    tick().then(() => {
      if (searchInputRef) searchInputRef.focus();
    });
  }

  function handlePick(surahId) {
    onSelect(surahId);
    onClose();
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" role="dialog" aria-modal="true">
    <button type="button" class="backdrop-catcher" on:click={onClose} aria-label="Tutup dialog"></button>

    <div class="surah-picker-card retro-card">
      <!-- Header -->
      <div class="picker-header">
        <div class="header-left">
          <Sparkles size={18} color="var(--accent-amber)" />
          <h3 class="header-title">Pilih Surah Al-Qur'an</h3>
          <span class="surah-count-pill">114 Surah</span>
        </div>
        <button type="button" class="close-btn" on:click={onClose} aria-label="Tutup">
          <X size={18} />
        </button>
      </div>

      <!-- Search Input -->
      <div class="search-box-row">
        <div class="search-input-wrapper">
          <Search size={16} class="search-icon" />
          <input 
            type="text" 
            bind:this={searchInputRef}
            bind:value={searchQuery}
            placeholder="Cari surah (misal: Al-Kahf, Yusuf, 18, Sapi)..." 
            class="picker-search-input"
          />
          {#if searchQuery}
            <button type="button" class="clear-query-btn" on:click={() => searchQuery = ""}>
              <X size={14} />
            </button>
          {/if}
        </div>
      </div>

      <!-- Surah List -->
      <div class="surah-list-scroll">
        {#if filteredSurahs.length === 0}
          <div class="empty-results">
            <p>Tidak ada surah yang cocok dengan "{searchQuery}"</p>
          </div>
        {:else}
          <div class="surah-items-grid">
            {#each filteredSurahs as s (s.id)}
              <button 
                type="button" 
                class="surah-item-btn" 
                class:active={s.id === currentSurahId}
                use:scrollIfActive={s.id === currentSurahId}
                on:click={() => handlePick(s.id)}
              >
                <div class="surah-num-box">
                  <span>{s.id}</span>
                </div>

                <div class="surah-info-col">
                  <div class="surah-name-row">
                    <span class="surah-name-latin">{s.name}</span>
                    <span class="surah-type-pill">{s.type}</span>
                  </div>
                  <span class="surah-meaning">{s.meaning} • {s.totalAyah} Ayat</span>
                </div>

                <div class="surah-ar-col">
                  <span class="surah-name-ar">{s.nameAr}</span>
                  {#if s.id === currentSurahId}
                    <span class="active-check"><Check size={14} /></span>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 120;
    background-color: rgba(14, 11, 8, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .backdrop-catcher {
    position: absolute;
    inset: 0;
    background: transparent;
    border: none;
    cursor: default;
    z-index: 1;
  }

  .surah-picker-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 520px;
    height: 82vh;
    max-height: 640px;
    background-color: var(--bg-surface);
    display: flex;
    flex-direction: column;
    border-radius: 1.5rem;
    border: 1px solid var(--border-soft);
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    animation: popIn 0.2s ease-out;
  }

  @keyframes popIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.15rem 1.35rem 0.85rem 1.35rem;
    border-bottom: 1px solid var(--border-soft);
    background-color: var(--bg-surface-elevated);
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .surah-count-pill {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    background-color: var(--accent-cream);
    color: var(--accent-amber);
  }

  :global(.dark) .surah-count-pill {
    background-color: #38291A;
    color: var(--accent-gold);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    color: var(--accent-amber);
  }

  .search-box-row {
    padding: 0.85rem 1.25rem;
    background-color: var(--bg-surface-elevated);
    border-bottom: 1px solid var(--border-soft);
    flex-shrink: 0;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  :global(.search-icon) {
    position: absolute;
    left: 0.85rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  .picker-search-input {
    width: 100%;
    background-color: var(--bg-surface);
    border: 1.5px solid var(--border-soft);
    color: var(--text-main);
    border-radius: 0.85rem;
    padding: 0.65rem 2.2rem 0.65rem 2.4rem;
    font-family: var(--font-sans);
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s ease;
  }

  .picker-search-input:focus {
    border-color: var(--accent-amber);
    box-shadow: 0 0 0 3px rgba(216, 125, 54, 0.2);
  }

  .clear-query-btn {
    position: absolute;
    right: 0.75rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
  }

  .surah-list-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0.65rem;
    overscroll-behavior: contain;
  }

  .empty-results {
    padding: 2.5rem 1rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .surah-items-grid {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .surah-item-btn {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.75rem 0.95rem;
    border-radius: 0.85rem;
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
  }

  .surah-item-btn:hover {
    background-color: var(--bg-surface-elevated);
    border-color: var(--border-soft);
  }

  .surah-item-btn.active {
    background-color: var(--accent-cream);
    border-color: var(--accent-gold);
  }

  :global(.dark) .surah-item-btn.active {
    background-color: #382819;
    border-color: rgba(240, 168, 78, 0.45);
  }

  .surah-num-box {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--bg-surface-elevated);
    border: 1px solid var(--border-soft);
    color: var(--accent-amber);
    font-weight: 700;
    font-size: 0.82rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .surah-item-btn.active .surah-num-box {
    background-color: var(--accent-amber);
    color: #FFFFFF;
    border-color: var(--accent-amber);
  }

  .surah-info-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .surah-name-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .surah-name-latin {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text-main);
  }

  .surah-type-pill {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-muted);
    padding: 0.1rem 0.35rem;
    background-color: var(--bg-surface-elevated);
    border-radius: 4px;
  }

  .surah-meaning {
    font-size: 0.75rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .surah-ar-col {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-align: right;
  }

  .surah-name-ar {
    font-family: var(--font-arabic);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--accent-amber);
  }

  .active-check {
    color: #38A169;
    display: flex;
    align-items: center;
  }
</style>
