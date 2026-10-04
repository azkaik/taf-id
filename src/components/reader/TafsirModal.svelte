<script>
  import { onDestroy } from "svelte";
  import {
    currentSurahId,
    currentAyahNumber,
    currentAyahData,
    currentTafsirData,
    isLoadingTafsir,
    tafsirError,
    isTafsirModalOpen,
    loadCurrentTafsir
  } from "../../stores/quranStore.js";
  import { SURAH_LIST } from "../../data/surahList.js";
  import {
    X,
    BookOpen,
    Copy,
    Check,
    Bookmark,
    FileEdit,
    AlertCircle,
    RefreshCw,
    Clock,
    Quote,
    Layers,
    Sparkles,
    ScrollText
  } from "lucide-svelte";
  import { toggleAyahBookmark } from "../../stores/userStore.js";

  export let onOpenNote = () => {};

  let copied = false;
  let bookmarked = false;
  let lastLoadedKey = "";
  // Ukuran font teks tafsir: 'sm' (14px), 'md' (16px), 'lg' (18px)
  let tafsirFontSize = "md";

  $: currentSurahInfo = SURAH_LIST.find(s => s.id === $currentSurahId);
  $: currentAyahKey = `${$currentSurahId}:${$currentAyahNumber}`;

  // Kunci scroll body saat modal tafsir terbuka
  $: if (typeof document !== "undefined") {
    if ($isTafsirModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  }

  onDestroy(() => {
    if (typeof document !== "undefined") {
      document.body.classList.remove("modal-open");
    }
  });

  // Pemicu fetch otomatis saat modal terbuka atau ayat berganti
  $: if ($isTafsirModalOpen) {
    if (lastLoadedKey !== currentAyahKey || (!$currentTafsirData && !$isLoadingTafsir && !$tafsirError)) {
      lastLoadedKey = currentAyahKey;
      loadCurrentTafsir().catch(err => {
        console.warn("Gagal fetch tafsir:", err);
      });
    }
  }

  function closeModal() {
    isTafsirModalOpen.set(false);
  }

  function retryLoadTafsir() {
    loadCurrentTafsir(true).catch(console.error);
  }

  /**
   * Parser & Restrukturisasi Cerdas Tafsir Kemenag RI
   * Mengorganisasi teks ke dalam Sub-Bab tematik, memecah dinding teks menjadi paragraf teratur berjarak lega
   */
  function parseAndSectionTafsir(rawText) {
    if (!rawText || typeof rawText !== "string") return [];

    // 1. Bersihkan glitch karakter encoding warisan teks digital Kemenag (misal: "¦)
    const cleanText = rawText
      .replace(/\r/g, "")
      .replace(/["“]?¦["”]?/g, '"... ')
      .replace(/¦/g, "... ")
      .trim();

    const rawLines = cleanText.split(/\n+/).map(s => s.trim()).filter(Boolean);

    // 2. Pecah paragraf panjang menjadi unit-unit kalimat yang proporsional
    const atomicUnits = [];

    for (const line of rawLines) {
      // Butir bernomor (1. / 2.)
      const numMatch = line.match(/^(\d+)[\.\)]\s*(.*)/s);
      if (numMatch) {
        atomicUnits.push({ type: "numbered", num: numMatch[1], text: numMatch[2] });
        continue;
      }

      // Sub-judul bawaan dari naskah Kemenag
      const isExplicitHeading =
        (line.length <= 60 && !/[.!?]$/.test(line)) ||
        (/^(Hadis|Hadits|Makna kata|Hikmah|Hukum|Asbabun|Kandungan|Pokok|Surah [a-zA-Z\s-]+dimulai)\b/i.test(line) && line.length <= 75);

      if (isExplicitHeading && !line.startsWith('"') && !line.startsWith('“')) {
        atomicUnits.push({ type: "heading", text: line.replace(/:$/, "") });
        continue;
      }

      // Kutipan Hadits / Firman / Ayat Rujukan
      const isQuote =
        line.startsWith('"') ||
        line.startsWith('“') ||
        /\(Riwayat\s+[^\)]+\)/i.test(line) ||
        /\(HR\.?\s+[^\)]+\)/i.test(line) ||
        /\([a-zA-Z\s'-]+\/\d+:\d+\)/i.test(line) ||
        /^Dari\s+[A-Z][a-zA-Z\s'-]+,\s*(dia berkata|ia berkata|katanya)/i.test(line);

      if (isQuote) {
        atomicUnits.push({ type: "quote", text: line });
        continue;
      }

      // Paragraf panjang: pecah di batas kalimat & kata transisi agar tidak menumpuk pekat
      if (line.length > 260) {
        const sentences = line.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [line];
        let chunk = "";
        for (const s of sentences) {
          const sentence = s.trim();
          if (!sentence) continue;

          const isBreak = /^(Adapun|Sementara itu|Sedangkan|Oleh karena itu|Dengan demikian|Dalam hal ini|Hal ini mengisyaratkan|Biasanya dengan|Surah [A-Z]|Semuanya itu|Kisah ini|Hikmahnya)/i.test(sentence);

          if ((chunk.length >= 80 && isBreak) || chunk.length >= 360) {
            atomicUnits.push({ type: "paragraph", text: chunk.trim() });
            chunk = sentence;
          } else {
            chunk += (chunk ? " " : "") + sentence;
          }
        }
        if (chunk.trim()) {
          atomicUnits.push({ type: "paragraph", text: chunk.trim() });
        }
      } else {
        atomicUnits.push({ type: "paragraph", text: line });
      }
    }

    // 3. Klasifikasi unit ke dalam Sub-Bab Tematik
    function categorizeText(text) {
      if (/^(Hikmah|Keutamaan|Manfaat|Pelajaran)\b/i.test(text)) {
        return { title: "Hikmah & Pembelajaran Hidup", tag: "Hikmah" };
      }
      if (/^(Makna|Arti|Secara bahasa|al-[a-zA-Z]+ artinya|[A-Z][a-z]+ artinya)/i.test(text)) {
        return { title: "Makna Kosakata & Istilah Kunci", tag: "Kosakata" };
      }
      if (/^(Hadis|Hadits|Nabi Saw bersabda|Rasulullah|Riwayat)/i.test(text)) {
        return { title: "Hadits & Riwayat Pendukung", tag: "Hadits" };
      }
      if (/^(Asbabun|Sebab turunnya)/i.test(text)) {
        return { title: "Asbabun Nuzul (Latar Belakang Ayat)", tag: "Asbabun Nuzul" };
      }
      if (/^(Hukum|Fikih|Ulama berpendapat|Pendapat para)/i.test(text)) {
        return { title: "Tinjauan Hukum & Pendapat Ulama", tag: "Hukum" };
      }
      if (/(Kisah yang sangat menarik|Adapun surah Yusuf|suatu kisah|kehidupan seorang nabi|kisah teladan)/i.test(text)) {
        return { title: "Kisah, Ibrah & Teladan Mulia", tag: "Kisah" };
      }
      if (/(Surah Yunus yang ayat|Pokok-pokok isi|masalah hikmat dan filsafat|pokok kandungan|Sifat Allah)/i.test(text)) {
        return { title: "Pokok Kandungan & Bahasan Surah", tag: "Kandungan" };
      }
      if (/(syafaat|pertolongan)/i.test(text)) {
        return { title: "Hakikat Syafaat di Hari Kiamat", tag: "Akidah" };
      }
      return null;
    }

    const sections = [];
    let currentSection = {
      title: "Pengantar & Konteks Ayat",
      tag: "Konteks",
      items: []
    };

    for (const unit of atomicUnits) {
      if (unit.type === "heading") {
        if (currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          title: unit.text,
          tag: "Sub-Bab",
          items: []
        };
        continue;
      }

      // Deteksi tema baru jika section saat ini sudah terisi
      const cat = categorizeText(unit.text);
      if (cat && currentSection.items.length >= 1) {
        if (currentSection.title !== cat.title) {
          sections.push(currentSection);
          currentSection = {
            title: cat.title,
            tag: cat.tag,
            items: []
          };
        }
      }

      currentSection.items.push(unit);
    }

    if (currentSection.items.length > 0) {
      sections.push(currentSection);
    }

    if (sections.length === 1 && sections[0].title === "Pengantar & Konteks Ayat") {
      sections[0].title = "Ulasan & Penjelasan Lengkap Ayat";
      sections[0].tag = "Tafsir";
    }

    return sections;
  }

  $: structuredSections = parseAndSectionTafsir($currentTafsirData?.tafsir_indo);

  // Estimasi waktu baca (rata-rata 180 kata per menit)
  $: readingTimeMinutes = Math.max(
    1,
    Math.round((($currentTafsirData?.tafsir_indo || "").split(/\s+/).length || 0) / 180)
  );

  async function copyTafsirContent() {
    if (!$currentTafsirData?.tafsir_indo) return;

    const surahName = currentSurahInfo?.name || "Surah";
    let formattedText = `Tafsir Al-Qur'an (Kemenag RI)\nQS. ${surahName} [${$currentSurahId}:${$currentAyahNumber}]\n\n`;

    structuredSections.forEach((sec, idx) => {
      formattedText += `=== ${sec.title} ===\n`;
      sec.items.forEach(item => {
        if (item.type === "numbered") {
          formattedText += `${item.num}. ${item.text}\n\n`;
        } else {
          formattedText += `${item.text}\n\n`;
        }
      });
    });

    formattedText += `(Dikutip dari Aplikasi Tafsir Al-Qur'an - Taf.id)`;

    try {
      await navigator.clipboard.writeText(formattedText.trim());
      copied = true;
      setTimeout(() => (copied = false), 2500);
    } catch (e) {
      console.warn("Gagal menyalin tafsir:", e);
    }
  }

  function handleBookmark() {
    const arabic = $currentAyahData?.text_arabic || "";
    const indo = $currentAyahData?.text_indonesian || "";
    toggleAyahBookmark({
      surah: $currentSurahId,
      ayah: $currentAyahNumber,
      surahName: currentSurahInfo?.name,
      text_arabic: arabic,
      text_indonesian: indo
    });
    bookmarked = true;
    setTimeout(() => (bookmarked = false), 2000);
  }
</script>

{#if $isTafsirModalOpen}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-surah-title">
    <button type="button" class="backdrop-catcher" on:click={closeModal} aria-label="Tutup modal"></button>

    <div class="modal-card retro-card">
      <!-- Modal Header -->
      <header class="modal-header">
        <div class="modal-title-box">
          <div class="modal-badge-row">
            <span class="modal-pill">Tafsir Al-Qur'an</span>
            <span class="modal-source-pill">Kemenag RI</span>
          </div>
          <h2 id="modal-surah-title" class="modal-surah-title">
            {currentSurahInfo?.name || "Surah"} : Ayat {$currentAyahNumber}
          </h2>
        </div>

        <div class="header-action-group">
          <!-- Pengatur Ukuran Font Teks Tafsir -->
          <div class="font-size-toggle" title="Ukuran Font Teks">
            <button
              type="button"
              class="font-btn"
              class:active={tafsirFontSize === "sm"}
              on:click={() => (tafsirFontSize = "sm")}
              title="Font Kecil"
            >
              A-
            </button>
            <button
              type="button"
              class="font-btn"
              class:active={tafsirFontSize === "md"}
              on:click={() => (tafsirFontSize = "md")}
              title="Font Sedang"
            >
              A
            </button>
            <button
              type="button"
              class="font-btn"
              class:active={tafsirFontSize === "lg"}
              on:click={() => (tafsirFontSize = "lg")}
              title="Font Besar"
            >
              A+
            </button>
          </div>

          <button class="header-btn" on:click={handleBookmark} title="Simpan Bookmark">
            <Bookmark size={18} color={bookmarked ? "var(--accent-amber)" : "currentColor"} />
          </button>
          <button class="header-btn" on:click={copyTafsirContent} title="Salin Seluruh Tafsir">
            {#if copied}
              <Check size={18} color="#38A169" />
            {:else}
              <Copy size={18} />
            {/if}
          </button>
          <button class="header-btn close-btn" on:click={closeModal} title="Tutup">
            <X size={20} />
          </button>
        </div>
      </header>

      <!-- Modal Body (Scrollable) -->
      <div class="modal-body">
        <!-- Teks Ayat & Terjemahan Referensi Singkat -->
        <div class="ref-verse-card">
          <div class="ref-verse-header">
            <span class="ref-badge">Ayat Rujukan</span>
            <span class="ref-surah-label">{currentSurahInfo?.name} : Ayat {$currentAyahNumber}</span>
          </div>
          {#if $currentAyahData?.text_arabic}
            <p class="arabic-text ref-arabic">
              {$currentAyahData.text_arabic}
            </p>
          {/if}
          {#if $currentAyahData?.text_indonesian}
            <p class="ref-indo">
              "{$currentAyahData.text_indonesian}"
            </p>
          {/if}
        </div>

        <!-- Meta Banner Tafsir Kemenag -->
        <div class="tafsir-meta-banner">
          <div class="meta-source-info">
            <div class="meta-badge-line">
              <span class="meta-tag">Kemenag RI</span>
              <span class="meta-title">Tafsir Ringkas & Tahlili</span>
            </div>
            <span class="meta-subtitle">Kementerian Agama Republik Indonesia</span>
          </div>
          <div class="meta-stat-group">
            <div class="meta-reading-pill" title="Perkiraan waktu baca">
              <Clock size={13} />
              <span>~{readingTimeMinutes} mnt</span>
            </div>
            {#if structuredSections.length > 1}
              <div class="meta-sections-pill" title="Jumlah sub-bab pembahasan">
                <Layers size={13} />
                <span>{structuredSections.length} Bagian</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Status Loading -->
        {#if $isLoadingTafsir}
          <div class="loading-state">
            <div class="spinner"></div>
            <p class="loading-title">Menyiapkan Tafsir Ayat...</p>
            <span class="loading-sub">Mengambil penjelasan resmi Kemenag RI</span>
          </div>

        <!-- Status Error -->
        {:else if $tafsirError}
          <div class="error-state retro-card">
            <AlertCircle size={36} color="var(--accent-terracotta)" />
            <h3 class="error-title">Gagal Memuat Tafsir</h3>
            <p class="error-desc">{$tafsirError}</p>
            <button class="pill-button pill-button-primary retry-btn" on:click={retryLoadTafsir}>
              <RefreshCw size={15} />
              <span>Coba Muat Ulang</span>
            </button>
          </div>

        <!-- TAMPILAN TAFSIR BERSTRUKTUR SUB-BAB RAPI -->
        {:else if structuredSections.length > 0}
          <div class="tafsir-sections-wrapper size-{tafsirFontSize}">
            {#each structuredSections as section, sIdx}
              <section class="subbab-card">
                <!-- Header Sub-Bab -->
                <div class="subbab-header">
                  <div class="subbab-tag-box">
                    <span class="subbab-num-pill">{sIdx + 1}</span>
                    <span class="subbab-tag-label">{section.tag}</span>
                  </div>
                  <h3 class="subbab-title">{section.title}</h3>
                </div>

                <!-- Isi Paragraf Sub-Bab Berjarak Rapi -->
                <div class="subbab-body">
                  {#each section.items as item}
                    {#if item.type === "numbered"}
                      <div class="numbered-item-card">
                        <span class="item-num-badge">{item.num}</span>
                        <div class="item-content">
                          <p class="tafsir-p">{item.text}</p>
                        </div>
                      </div>

                    {:else if item.type === "quote"}
                      <blockquote class="tafsir-quote-callout">
                        <div class="quote-header">
                          <Quote size={15} class="quote-icon" />
                          <span class="quote-label">Dalil / Sabda / Riwayat</span>
                        </div>
                        <p class="quote-text">{item.text}</p>
                      </blockquote>

                    {:else}
                      <p class="tafsir-p narrative-p">
                        {item.text}
                      </p>
                    {/if}
                  {/each}
                </div>
              </section>
            {/each}
          </div>

        {:else}
          <div class="empty-state">
            <BookOpen size={36} color="var(--text-dim)" />
            <p>Tafsir bahasa Indonesia sedang tidak tersedia untuk ayat ini.</p>
            <button class="pill-button pill-button-secondary" on:click={retryLoadTafsir}>
              <RefreshCw size={15} />
              <span>Muat Ulang</span>
            </button>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <footer class="modal-footer">
        <button class="pill-button pill-button-secondary footer-note-btn" on:click={() => { closeModal(); onOpenNote(); }}>
          <FileEdit size={16} />
          <span>Tulis Catatan / Tadabbur</span>
        </button>
        <button class="pill-button pill-button-primary footer-close-btn" on:click={closeModal}>
          Selesai Membaca
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background-color: rgba(20, 16, 12, 0.72);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
    overscroll-behavior: contain;
  }

  @media (min-width: 640px) {
    .modal-backdrop {
      align-items: center;
      padding: 1.5rem;
    }
  }

  .backdrop-catcher {
    position: absolute;
    inset: 0;
    background: transparent;
    border: none;
    cursor: default;
  }

  .modal-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 660px;
    height: 90vh;
    max-height: 90vh;
    background-color: var(--bg-surface);
    display: flex;
    flex-direction: column;
    border-radius: 2rem 2rem 0 0;
    overflow: hidden;
    box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.38);
    animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    overscroll-behavior: contain;
    border: 1px solid var(--border-soft);
  }

  @media (min-width: 640px) {
    .modal-card {
      border-radius: 2rem;
      height: 86vh;
      max-height: 86vh;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(40px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* Modal Header */
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.5rem;
    border-bottom: 1px solid var(--border-soft);
    background-color: var(--bg-surface-elevated);
    flex-shrink: 0;
    gap: 0.75rem;
  }

  .modal-title-box {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .modal-badge-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .modal-pill {
    font-size: 0.68rem;
    font-weight: 800;
    color: var(--accent-amber);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .modal-source-pill {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--accent-terracotta);
    background: rgba(200, 90, 50, 0.12);
    padding: 0.1rem 0.45rem;
    border-radius: 9999px;
  }

  .modal-surah-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-action-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  /* Toggle Ukuran Huruf */
  .font-size-toggle {
    display: flex;
    align-items: center;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-soft);
    border-radius: 9999px;
    padding: 0.15rem;
    margin-right: 0.2rem;
  }

  .font-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: transparent;
    border: none;
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .font-btn.active {
    background: var(--accent-amber);
    color: #FFFFFF;
    box-shadow: 0 1px 4px rgba(216, 125, 54, 0.3);
  }

  .header-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-soft);
    color: var(--text-main);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .header-btn:hover {
    border-color: var(--accent-amber);
    color: var(--accent-amber);
  }

  /* Modal Body */
  .modal-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 1.25rem 1.5rem;
  }

  /* Kartu Rujukan Ayat */
  .ref-verse-card {
    padding: 1.15rem 1.25rem;
    border-radius: 1.25rem;
    background-color: var(--bg-surface-elevated);
    border: 1px solid var(--border-soft);
    margin-bottom: 1.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .ref-verse-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px dashed var(--border-soft);
  }

  .ref-badge {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--accent-gold);
    letter-spacing: 0.05em;
  }

  .ref-surah-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .ref-arabic {
    font-family: var(--font-arabic);
    font-size: 1.55rem;
    line-height: 2.1;
    color: var(--text-main);
    text-align: right;
    direction: rtl;
    margin-bottom: 0.75rem;
  }

  .ref-indo {
    font-size: 0.88rem;
    color: var(--text-muted);
    font-style: italic;
    line-height: 1.6;
    padding-top: 0.25rem;
  }

  /* Meta Banner */
  .tafsir-meta-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.1rem;
    border-radius: 1.15rem;
    background: linear-gradient(135deg, rgba(216, 125, 54, 0.08) 0%, rgba(232, 158, 56, 0.04) 100%);
    border: 1px solid rgba(216, 125, 54, 0.2);
    margin-bottom: 1.5rem;
    gap: 0.75rem;
  }

  .meta-source-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .meta-badge-line {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .meta-tag {
    font-size: 0.68rem;
    font-weight: 800;
    color: #FFFFFF;
    background: var(--accent-amber);
    padding: 0.1rem 0.45rem;
    border-radius: 9999px;
  }

  .meta-title {
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--text-main);
  }

  .meta-subtitle {
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  .meta-stat-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .meta-reading-pill,
  .meta-sections-pill {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--text-muted);
    background-color: var(--bg-surface);
    padding: 0.35rem 0.65rem;
    border-radius: 9999px;
    border: 1px solid var(--border-soft);
  }

  /* Sub-Bab Wrapper */
  .tafsir-sections-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.35rem;
  }

  /* Skala Ukuran Font */
  .size-sm {
    --tafsir-font-size: 0.92rem;
    --tafsir-lh: 1.82;
    --heading-font-size: 1.05rem;
  }

  .size-md {
    --tafsir-font-size: 1.02rem;
    --tafsir-lh: 1.9;
    --heading-font-size: 1.15rem;
  }

  .size-lg {
    --tafsir-font-size: 1.15rem;
    --tafsir-lh: 2.0;
    --heading-font-size: 1.25rem;
  }

  /* Kartu Sub-Bab Tematik */
  .subbab-card {
    background-color: var(--bg-surface-elevated);
    border: 1px solid var(--border-soft);
    border-radius: 1.35rem;
    padding: 1.25rem 1.35rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    transition: border-color 0.2s ease;
  }

  .subbab-card:hover {
    border-color: rgba(216, 125, 54, 0.35);
  }

  .subbab-header {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1.15rem;
    padding-bottom: 0.75rem;
    border-bottom: 1.5px solid var(--border-soft);
  }

  .subbab-tag-box {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .subbab-num-pill {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent-gold);
    color: #FFFFFF;
    font-size: 0.7rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .subbab-tag-label {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent-amber);
  }

  .subbab-title {
    font-size: var(--heading-font-size, 1.15rem);
    font-weight: 800;
    color: var(--text-main);
    margin: 0;
    line-height: 1.35;
  }

  .subbab-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Paragraf Narasi Berjarak & Berformat Rapi */
  .tafsir-p {
    font-size: var(--tafsir-font-size, 1.02rem);
    line-height: var(--tafsir-lh, 1.9);
    color: var(--text-main);
    text-align: justify;
    margin: 0;
    letter-spacing: 0.012em;
  }

  /* Butir Bernomor */
  .numbered-item-card {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    padding: 0.9rem 1.1rem;
    background-color: var(--bg-surface);
    border-radius: 1.1rem;
    border: 1px solid var(--border-soft);
  }

  .item-num-badge {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-amber) 100%);
    color: #FFFFFF;
    font-size: 0.8rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(216, 125, 54, 0.28);
    margin-top: 0.2rem;
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  /* Callout Kutipan Hadis / Dalil */
  .tafsir-quote-callout {
    position: relative;
    padding: 1.1rem 1.3rem;
    margin: 0.35rem 0;
    border-radius: 1.15rem;
    background: linear-gradient(135deg, rgba(232, 158, 56, 0.09) 0%, rgba(200, 90, 50, 0.05) 100%);
    border-left: 4.5px solid var(--accent-amber);
    border-top: 1px solid var(--border-soft);
    border-right: 1px solid var(--border-soft);
    border-bottom: 1px solid var(--border-soft);
  }

  .quote-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.55rem;
  }

  :global(.quote-icon) {
    color: var(--accent-amber);
    flex-shrink: 0;
  }

  .quote-label {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent-amber);
  }

  .quote-text {
    font-size: var(--tafsir-font-size, 1.02rem);
    line-height: var(--tafsir-lh, 1.9);
    color: var(--text-main);
    font-style: italic;
    margin: 0;
  }

  /* Status Loading */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3.5rem 1rem;
    gap: 0.85rem;
    color: var(--text-muted);
    text-align: center;
  }

  .loading-title {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text-main);
  }

  .loading-sub {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-soft);
    border-top-color: var(--accent-amber);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Status Error */
  .error-state {
    padding: 2.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
    background-color: var(--bg-surface-elevated);
    border: 1.5px solid rgba(200, 90, 50, 0.3);
    border-radius: 1.5rem;
    margin: 1.5rem 0;
  }

  .error-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-main);
  }

  .error-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
    max-width: 380px;
    line-height: 1.5;
  }

  .retry-btn {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    padding: 0.55rem 1.25rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3.5rem 1rem;
    gap: 1rem;
    color: var(--text-muted);
    font-size: 0.92rem;
    text-align: center;
  }

  /* Modal Footer */
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-soft);
    background-color: var(--bg-surface-elevated);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .modal-footer .pill-button {
    font-size: 0.85rem;
    padding: 0.6rem 1.2rem;
  }

  .footer-note-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
</style>
