<script>
  import { onMount } from "svelte";
  import { spring } from "svelte/motion";
  import { activeTab } from "../../stores/appStore.js";
  import { bookmarks, notes } from "../../stores/userStore.js";
  import { Home, BookOpen, Search, Bookmark } from "lucide-svelte";

  $: totalSaved = ($bookmarks?.length || 0) + ($notes?.length || 0);

  const tabs = [
    { id: "home", label: "Beranda", icon: Home },
    { id: "surahs", label: "Surah", icon: BookOpen },
    { id: "search", label: "Cari", icon: Search },
    { id: "reader", label: "Tafsir", isArabic: true },
    { id: "notes", label: "Simpanan", icon: Bookmark, hasBadge: true },
  ];

  $: activeIndex = tabs.findIndex((t) => t.id === $activeTab);
  $: safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // Lebar navbar dinamis (responsif)
  let dockWidth = 400;

  // Spring physics untuk pergerakan mulus lekukan & buletan
  const notchSpring = spring(safeActiveIndex, {
    stiffness: 0.14,
    damping: 0.68,
  });

  $: {
    notchSpring.set(safeActiveIndex);
  }

  // Hitung posisi X pusat lekukan & buletan secara presisi
  $: tabWidth = dockWidth / tabs.length;
  $: currentNotchX = ($notchSpring + 0.5) * tabWidth;

  // Fungsi pembuat path SVG utuh satu kesatuan (100% menyambung tanpa potongan terpisah)
  function buildDockPath(w, h, r, notchX, nw, nd) {
    if (!w || w <= 0) return "";
    
    // Titik awal dan akhir lekukan pada garis atas
    const startX = Math.max(r, notchX - nw);
    const endX = Math.min(w - r, notchX + nw);

    // Bahu lekukan kiri melengkung turun secara halus
    const s1 = `C ${notchX - nw + 15} 0, ${notchX - 22} 12, ${notchX - 16} 20`;
    // Palung dasar lekukan yang memeluk bagian bawah buletan
    const s2 = `C ${notchX - 10} ${nd + 3}, ${notchX + 10} ${nd + 3}, ${notchX + 16} 20`;
    // Bahu lekukan kanan melengkung naik secara halus
    const s3 = `C ${notchX + 22} 12, ${notchX + nw - 15} 0, ${notchX + nw} 0`;

    return [
      `M 0 ${r}`,
      `A ${r} ${r} 0 0 1 ${r} 0`,
      `L ${startX} 0`,
      s1,
      s2,
      s3,
      `L ${w - r} 0`,
      `A ${r} ${r} 0 0 1 ${w} ${r}`,
      `L ${w} ${h - r}`,
      `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
      `L ${r} ${h}`,
      `A ${r} ${r} 0 0 1 0 ${h - r}`,
      `Z`,
    ].join(" ");
  }

  $: dockPath = buildDockPath(dockWidth, 64, 26, currentNotchX, 38, 27);
</script>

<nav class="bottom-dock" bind:clientWidth={dockWidth} aria-label="Navigasi Utama">
  <!-- Backdrop SVG Navbar Utuh (Satu Kesatuan Siluet Padat, Tanpa Tempelan Terpisah) -->
  <svg
    class="dock-backdrop-svg"
    width={dockWidth}
    height="64"
    viewBox="0 0 {dockWidth} 64"
    aria-hidden="true"
  >
    <path class="dock-backdrop-path" d={dockPath} />
  </svg>

  <!-- Buletan Melayang (Floating Circle) yang Terkunci Presisi di Posisi Lekukan -->
  <div
    class="floating-circle"
    style="left: {currentNotchX}px;"
  >
    {#key $activeTab}
      <div class="floating-circle-content">
        {#if $activeTab === "home"}
          <Home size={22} strokeWidth={2.4} />
        {:else if $activeTab === "surahs"}
          <BookOpen size={22} strokeWidth={2.4} />
        {:else if $activeTab === "search"}
          <Search size={22} strokeWidth={2.4} />
        {:else if $activeTab === "reader"}
          <span class="arabic-circle-text">آية</span>
        {:else if $activeTab === "notes"}
          <div class="relative-box">
            <Bookmark size={22} strokeWidth={2.4} />
            {#if totalSaved > 0}
              <span class="circle-badge-dot"></span>
            {/if}
          </div>
        {/if}
      </div>
    {/key}
  </div>

  <!-- Interactive Navigation Tab Buttons -->
  <div class="nav-tabs-grid">
    {#each tabs as tab}
      <button
        class="nav-tab-btn"
        class:active={$activeTab === tab.id}
        on:click={() => activeTab.set(tab.id)}
        aria-label={tab.label}
        title={tab.label}
      >
        <!-- Resting icon (sembunyi dengan smooth saat aktif karena posisinya diisi oleh buletan melayang) -->
        <div class="resting-icon-container">
          {#if tab.isArabic}
            <span class="arabic-resting-text">آية</span>
          {:else}
            <div class="relative-box">
              <svelte:component this={tab.icon} size={22} strokeWidth={2.1} />
              {#if tab.hasBadge && totalSaved > 0}
                <span class="resting-badge-dot"></span>
              {/if}
            </div>
          {/if}
        </div>
      </button>
    {/each}
  </div>
</nav>

<style>
  :root {
    --dock-bg-light: #FFFDF8;
    --dock-bg-dark: #1E1A16;
  }

  .bottom-dock {
    position: fixed;
    bottom: 1.25rem;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 2rem);
    max-width: 420px;
    height: 64px;
    background: transparent; /* Siluet digambar 100% oleh SVG dock-backdrop-svg */
    border: none;
    z-index: 50;
    overflow: visible;
    user-select: none;
  }

  /* SVG Siluet Navbar Utuh */
  .dock-backdrop-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 64px;
    pointer-events: none;
    z-index: 1;
    overflow: visible;
    filter: drop-shadow(0 14px 32px rgba(120, 80, 40, 0.16)) drop-shadow(0 3px 8px rgba(120, 80, 40, 0.08));
    transition: filter 0.3s ease;
  }

  .dock-backdrop-path {
    fill: #FFFDF8;
    stroke: var(--border-soft, #EBDDC6);
    stroke-width: 1;
    transition: fill 0.3s ease, stroke 0.3s ease;
  }

  :global(.dark) .dock-backdrop-svg {
    filter: drop-shadow(0 18px 45px rgba(0, 0, 0, 0.85));
  }

  :global(.dark) .dock-backdrop-path {
    fill: #1E1A16;
    stroke: rgba(240, 168, 78, 0.18);
  }

  /* Buletan Melayang (Floating Elevated Circle) */
  .floating-circle {
    position: absolute;
    top: -21px;
    transform: translateX(-50%);
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background-color: #FFFDF8;
    border: 2px solid var(--accent-gold, #E89E38);
    box-shadow: 
      0 10px 22px rgba(216, 125, 54, 0.25),
      0 3px 8px rgba(120, 80, 40, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    pointer-events: none;
    transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }

  :global(.dark) .floating-circle {
    background-color: #1E1A16;
    border: 1.5px solid rgba(240, 168, 78, 0.4);
    box-shadow: 
      0 12px 26px rgba(0, 0, 0, 0.8),
      0 2px 10px rgba(240, 168, 78, 0.35);
  }

  /* Animasi pop & glow icon saat mendarat di tab aktif */
  .floating-circle-content {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-amber, #D87D36);
    filter: drop-shadow(0 2px 6px rgba(216, 125, 54, 0.35));
    animation: circleIconPop 0.38s cubic-bezier(0.34, 1.4, 0.64, 1);
    transition: color 0.3s ease, filter 0.3s ease;
  }

  :global(.dark) .floating-circle-content {
    color: var(--accent-gold, #F0A84E);
    filter: drop-shadow(0 2px 8px rgba(232, 158, 56, 0.5));
  }

  @keyframes circleIconPop {
    0% {
      transform: scale(0.4) translateY(6px);
      opacity: 0;
    }
    100% {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  .arabic-circle-text {
    font-family: var(--font-arabic);
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1;
  }

  /* Grid 5 Tab Navigasi */
  .nav-tabs-grid {
    position: relative;
    z-index: 3;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    width: 100%;
    height: 100%;
  }

  .nav-tab-btn {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    position: relative;
    outline: none;
  }

  /* Icon saat resting (tidak aktif) */
  .resting-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted, #826B55);
    transform: translateY(0);
    opacity: 1;
    transition: 
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.25s ease,
      color 0.25s ease;
  }

  .nav-tab-btn:hover .resting-icon-container {
    color: var(--accent-amber, #D87D36);
    transform: translateY(-2px);
  }

  :global(.dark) .resting-icon-container {
    color: rgba(255, 245, 230, 0.65);
  }

  :global(.dark) .nav-tab-btn:hover .resting-icon-container {
    color: rgba(255, 255, 255, 0.95);
  }

  /* Saat aktif: icon resting menghilang dengan smooth karena posisinya diisi oleh buletan melayang */
  .nav-tab-btn.active .resting-icon-container {
    transform: translateY(-16px) scale(0.5);
    opacity: 0;
    pointer-events: none;
  }

  .arabic-resting-text {
    font-family: var(--font-arabic);
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1;
  }

  /* Badge Dot Simpanan */
  .relative-box {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .resting-badge-dot {
    position: absolute;
    top: -2px;
    right: -3px;
    width: 6.5px;
    height: 6.5px;
    border-radius: 50%;
    background-color: var(--accent-terracotta, #C85A32);
    border: 1.5px solid #FFFDF8;
    transition: border-color 0.3s ease;
  }

  :global(.dark) .resting-badge-dot {
    border: 1.5px solid #1E1A16;
  }

  .circle-badge-dot {
    position: absolute;
    top: -2px;
    right: -4px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: var(--accent-terracotta, #C85A32);
    box-shadow: 0 0 6px rgba(200, 90, 50, 0.8);
  }
</style>
