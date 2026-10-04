<script>
  import { bookmarks, notes, lastRead, removePersonalNote, toggleAyahBookmark } from "../../stores/userStore.js";
  import { loadAyah, isTafsirModalOpen } from "../../stores/quranStore.js";
  import { activeTab } from "../../stores/appStore.js";
  import NoteEditorModal from "../reader/NoteEditorModal.svelte";
  import WavyRibbons from "../common/WavyRibbons.svelte";
  import {
    Bookmark,
    FileText,
    Clock,
    Trash2,
    BookOpen,
    Edit3,
    ArrowRight,
    ExternalLink,
    Sparkles
  } from "lucide-svelte";

  let activeSubTab = "bookmarks"; // 'bookmarks' | 'notes' | 'history'
  let noteToEdit = null;
  let isEditModalOpen = false;

  async function openAyah(surah, ayah, openTafsir = false) {
    await loadAyah(surah, ayah);
    activeTab.set("reader");
    if (openTafsir) {
      isTafsirModalOpen.set(true);
    }
  }

  function handleEditNote(note) {
    noteToEdit = note;
    isEditModalOpen = true;
  }
</script>

<div class="saved-hub-container">
  <WavyRibbons position="top" />

  <div class="saved-hub-content">
    <div class="page-header">
      <h1 class="page-title">Koleksi Pribadi</h1>
      <p class="page-desc">Bookmark ayat pilihan, refleksi tadabbur, dan riwayat bacaan Anda</p>
    </div>

    <!-- Segmented Tab Bar -->
    <div class="segmented-tabs-bar">
      <button 
        class="segmented-tab-btn" 
        class:active={activeSubTab === "bookmarks"}
        on:click={() => activeSubTab = "bookmarks"}
      >
        <Bookmark size={15} />
        <span>Bookmark ({$bookmarks?.length || 0})</span>
      </button>

      <button 
        class="segmented-tab-btn" 
        class:active={activeSubTab === "notes"}
        on:click={() => activeSubTab = "notes"}
      >
        <FileText size={15} />
        <span>Catatan ({$notes?.length || 0})</span>
      </button>

      <button 
        class="segmented-tab-btn" 
        class:active={activeSubTab === "history"}
        on:click={() => activeSubTab = "history"}
      >
        <Clock size={15} />
        <span>Riwayat</span>
      </button>
    </div>

    <!-- TAB 1: BOOKMARK -->
    {#if activeSubTab === "bookmarks"}
      <div class="items-list">
        {#if !$bookmarks || $bookmarks.length === 0}
          <div class="empty-hub-state retro-card">
            <Bookmark size={36} class="text-dim" />
            <h3>Belum Ada Bookmark</h3>
            <p>Tandai ayat yang berkesan saat membaca agar tersimpan di sini.</p>
            <button class="pill-button pill-button-secondary" on:click={() => activeTab.set("surahs")}>
              Mulai Jelajahi Al-Qur'an
            </button>
          </div>
        {:else}
          {#each $bookmarks as item (item.id || `${item.surah}:${item.ayah}`)}
            <div class="saved-item-card retro-card">
              <div class="item-top-row">
                <span class="item-ref-tag">QS. {item.surahName} [{item.surah}:{item.ayah}]</span>
                <button 
                  class="delete-icon-btn" 
                  on:click={() => toggleAyahBookmark(item)}
                  title="Hapus Bookmark"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {#if item.text_arabic}
                <p class="arabic-text saved-arabic">{item.text_arabic}</p>
              {/if}

              {#if item.text_indonesian}
                <p class="saved-indo">"{item.text_indonesian}"</p>
              {/if}

              <div class="item-bottom-actions">
                <button class="action-btn" on:click={() => openAyah(item.surah, item.ayah, false)}>
                  <BookOpen size={14} />
                  <span>Buka Ayat</span>
                </button>
                <button class="action-btn action-btn-primary" on:click={() => openAyah(item.surah, item.ayah, true)}>
                  <Sparkles size={14} />
                  <span>Baca Tafsir</span>
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}

    <!-- TAB 2: CATATAN PRIBADI -->
    {#if activeSubTab === "notes"}
      <div class="items-list">
        {#if !$notes || $notes.length === 0}
          <div class="empty-hub-state retro-card">
            <FileText size={36} class="text-dim" />
            <h3>Belum Ada Catatan Tadabbur</h3>
            <p>Catat hikmah dan perenungan ayat untuk memperdalam pemahaman tafsir.</p>
            <button class="pill-button pill-button-secondary" on:click={() => activeTab.set("reader")}>
              Buka Reader & Tulis Catatan
            </button>
          </div>
        {:else}
          {#each $notes as note (note.id)}
            <div class="saved-item-card retro-card">
              <div class="item-top-row">
                <span class="item-ref-tag">QS. {note.surahName} [{note.surah}:{note.ayah}]</span>
                <span class="note-date">
                  {new Date(note.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>

              <h3 class="note-display-title">{note.title}</h3>
              <p class="note-display-content">{note.content}</p>

              <div class="item-bottom-actions">
                <button class="action-btn" on:click={() => handleEditNote(note)}>
                  <Edit3 size={14} />
                  <span>Edit Catatan</span>
                </button>
                <button class="action-btn" on:click={() => openAyah(note.surah, note.ayah, false)}>
                  <ExternalLink size={14} />
                  <span>Lihat Ayat</span>
                </button>
                <button 
                  class="delete-icon-btn ml-auto" 
                  on:click={() => removePersonalNote(note.id)}
                  title="Hapus Catatan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}

    <!-- TAB 3: RIWAYAT TERAKHIR DIBACA -->
    {#if activeSubTab === "history"}
      <div class="items-list">
        {#if $lastRead}
          <div class="saved-item-card retro-card">
            <div class="item-top-row">
              <span class="item-ref-tag">Posisi Terakhir Dibaca</span>
              <span class="note-date">
                {new Date($lastRead.updatedAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
              </span>
            </div>

            <h3 class="last-read-large-title">
              QS. {$lastRead.surahName} [ {$lastRead.surah} : {$lastRead.ayah} ]
            </h3>
            <p class="saved-indo">
              Tafsir Al-Qur'an terakhir dibuka pada surah {$lastRead.surahName} ayat ke-{$lastRead.ayah}.
            </p>

            <div class="item-bottom-actions mt-3">
              <button class="pill-button pill-button-primary" on:click={() => openAyah($lastRead.surah, $lastRead.ayah, true)}>
                <BookOpen size={16} />
                <span>Lanjutkan Baca Tafsir</span>
              </button>
            </div>
          </div>
        {:else}
          <div class="empty-hub-state retro-card">
            <Clock size={36} class="text-dim" />
            <p>Belum ada riwayat membaca tercatat.</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Modal Edit Catatan -->
  {#if noteToEdit}
    <NoteEditorModal 
      isOpen={isEditModalOpen}
      surah={noteToEdit.surah}
      ayah={noteToEdit.ayah}
      surahName={noteToEdit.surahName}
      {noteToEdit}
      onClose={() => { isEditModalOpen = false; noteToEdit = null; }}
    />
  {/if}
</div>

<style>
  .saved-hub-container {
    position: relative;
    padding-bottom: 6.5rem;
    min-height: 100vh;
  }

  .saved-hub-content {
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

  .segmented-tabs-bar {
    display: flex;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-soft);
    border-radius: 9999px;
    padding: 0.35rem;
    margin-bottom: 1.5rem;
  }

  .segmented-tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.55rem 0.65rem;
    border-radius: 9999px;
    background: transparent;
    border: none;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .segmented-tab-btn.active {
    background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-amber) 100%);
    color: #FFFFFF;
    box-shadow: 0 2px 8px rgba(216, 125, 54, 0.3);
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .saved-item-card {
    padding: 1.15rem 1.25rem;
  }

  .item-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.65rem;
  }

  .item-ref-tag {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--accent-amber);
    background-color: var(--accent-cream);
    padding: 0.2rem 0.65rem;
    border-radius: 9999px;
  }

  :global(.dark) .item-ref-tag {
    background-color: #38291A;
    color: var(--accent-gold);
  }

  .note-date {
    font-size: 0.72rem;
    color: var(--text-dim);
  }

  .saved-arabic {
    font-size: 1.35rem;
    color: var(--text-main);
    margin-bottom: 0.65rem;
    line-height: 2;
  }

  .saved-indo {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-style: italic;
    line-height: 1.55;
    margin-bottom: 0.85rem;
  }

  .note-display-title {
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--text-main);
    margin-bottom: 0.35rem;
  }

  .note-display-content {
    font-size: 0.88rem;
    color: var(--text-main);
    line-height: 1.6;
    margin-bottom: 0.85rem;
    white-space: pre-line;
  }

  .last-read-large-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-main);
    margin-bottom: 0.5rem;
  }

  .item-bottom-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    border-top: 1px solid var(--border-soft);
    padding-top: 0.75rem;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.85rem;
    border-radius: 9999px;
    background: var(--bg-surface-elevated);
    border: 1px solid var(--border-soft);
    color: var(--text-main);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    border-color: var(--accent-amber);
    color: var(--accent-amber);
  }

  .action-btn-primary {
    background-color: var(--accent-cream);
    color: var(--accent-amber);
    border-color: rgba(216, 125, 54, 0.3);
  }

  :global(.dark) .action-btn-primary {
    background-color: #38291A;
    color: var(--accent-gold);
  }

  .delete-icon-btn {
    background: transparent;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    padding: 0.35rem;
    transition: color 0.2s ease;
  }

  .delete-icon-btn:hover {
    color: #E53E3E;
  }

  .ml-auto {
    margin-left: auto;
  }

  .mt-3 {
    margin-top: 0.75rem;
  }

  .empty-hub-state {
    padding: 3rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    text-align: center;
    color: var(--text-muted);
  }

  .empty-hub-state h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .empty-hub-state p {
    font-size: 0.85rem;
    max-width: 320px;
  }
</style>
