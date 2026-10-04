<script>
  import { theme, toggleTheme, activeTab, fontSettings, updateFontSize } from "../../stores/appStore.js";
  import { Sun, Moon, BookOpen, Search, ZoomIn, ZoomOut } from "lucide-svelte";

  let showFontMenu = false;
  let fontWrapperEl;

  function handleClickOutside(event) {
    if (showFontMenu && fontWrapperEl && !fontWrapperEl.contains(event.target)) {
      showFontMenu = false;
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && showFontMenu) {
      showFontMenu = false;
    }
  }
</script>

<svelte:window on:pointerdown={handleClickOutside} on:keydown={handleKeydown} />

<header class="app-header">
  <div class="header-inner">
    <!-- Brand Logo dengan Tipografi Retro Vintage -->
    <button class="brand-container" on:click={() => activeTab.set("home")}>
      <div class="brand-badge">
        <span class="arabic-mark">ت</span>
      </div>
      <div class="brand-text">
        <span class="brand-title">Taf.id</span>
        <span class="brand-subtitle">tafsir & al-qur'an</span>
      </div>
    </button>

    <!-- Header Actions -->
    <div class="header-actions">
      <!-- Font Adjuster Button -->
      <div class="font-dropdown-wrapper" bind:this={fontWrapperEl}>
        <button 
          class="icon-btn" 
          title="Atur Ukuran Teks"
          on:click={() => showFontMenu = !showFontMenu}
        >
          <span style="font-weight: 700; font-size: 0.9rem;">aA</span>
        </button>

        {#if showFontMenu}
          <div class="font-dropdown retro-card">
            <div class="font-dropdown-header">Ukuran Font</div>
            <div class="font-control-row">
              <span class="control-label">Arab:</span>
              <button class="font-btn" on:click={() => updateFontSize(-2, 0)} title="Kecilkan Arab">
                <ZoomOut size={16} />
              </button>
              <span class="font-size-val">{$fontSettings.arabicSize}px</span>
              <button class="font-btn" on:click={() => updateFontSize(2, 0)} title="Besarkan Arab">
                <ZoomIn size={16} />
              </button>
            </div>
            <div class="font-control-row">
              <span class="control-label">Terjemah:</span>
              <button class="font-btn" on:click={() => updateFontSize(0, -1)} title="Kecilkan Terjemah">
                <ZoomOut size={16} />
              </button>
              <span class="font-size-val">{$fontSettings.indonesianSize}px</span>
              <button class="font-btn" on:click={() => updateFontSize(0, 1)} title="Besarkan Terjemah">
                <ZoomIn size={16} />
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Quick Search Shortcut -->
      <button 
        class="icon-btn" 
        title="Cari Surah atau Kata Kunci"
        on:click={() => activeTab.set("search")}
      >
        <Search size={19} />
      </button>

      <!-- Dark Mode Switch -->
      <button 
        class="icon-btn theme-btn" 
        title={$theme === "dark" ? "Ganti ke Mode Siang" : "Ganti ke Mode Malam (Ramah Mata)"}
        on:click={toggleTheme}
      >
        {#if $theme === "dark"}
          <Sun size={19} color="var(--accent-gold)" />
        {:else}
          <Moon size={19} color="var(--accent-amber)" />
        {/if}
      </button>
    </div>
  </div>
</header>

<style>
  .app-header {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    background: rgba(250, 243, 224, 0.88);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-soft);
    padding: 0.65rem 1.25rem;
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .app-header {
    background: rgba(18, 16, 14, 0.9);
    border-bottom: 1px solid var(--border-soft);
  }

  .header-inner {
    max-width: 580px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand-container {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 0;
  }

  .brand-badge {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-amber) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(216, 125, 54, 0.35);
  }

  .arabic-mark {
    font-family: var(--font-arabic);
    color: #FFFFFF;
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-title {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: var(--accent-amber);
    line-height: 1.1;
  }

  .brand-subtitle {
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    text-transform: lowercase;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .icon-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: var(--bg-surface-elevated);
    border: 1px solid var(--border-soft);
    color: var(--text-main);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .font-dropdown-wrapper {
    position: relative;
  }

  .font-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 220px;
    padding: 0.85rem;
    z-index: 50;
    background-color: var(--bg-surface);
  }

  .font-dropdown-header {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.65rem;
    border-bottom: 1px solid var(--border-soft);
    padding-bottom: 0.4rem;
  }

  .font-control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
  }

  .control-label {
    color: var(--text-main);
    font-weight: 600;
  }

  .font-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--bg-surface-elevated);
    border: 1px solid var(--border-soft);
    color: var(--text-main);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .font-btn:hover {
    border-color: var(--accent-amber);
    color: var(--accent-amber);
  }

  .font-size-val {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--accent-amber);
    min-width: 38px;
    text-align: center;
  }
</style>
