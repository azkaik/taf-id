<script>
  import { onDestroy } from "svelte";
  import { savePersonalNote, removePersonalNote } from "../../stores/userStore.js";
  import { X, Save, Trash2, FileText } from "lucide-svelte";

  export let isOpen = false;
  export let surah = 2;
  export let ayah = 255;
  export let surahName = "Al-Baqarah";
  export let noteToEdit = null; // jika mengedit catatan yang sudah ada
  export let onClose = () => {};

  let title = "";
  let content = "";
  let isSaved = false;

  $: if (typeof document !== "undefined") {
    if (isOpen) {
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

  $: if (isOpen) {
    if (noteToEdit) {
      title = noteToEdit.title || "";
      content = noteToEdit.content || "";
    } else {
      title = `Tadabbur QS. ${surahName} [${surah}:${ayah}]`;
      content = "";
    }
    isSaved = false;
  }

  function handleSave() {
    if (!content.trim()) return;
    savePersonalNote({
      id: noteToEdit ? noteToEdit.id : undefined,
      surah,
      ayah,
      surahName,
      title,
      content
    });
    isSaved = true;
    setTimeout(() => {
      onClose();
    }, 600);
  }

  function handleDelete() {
    if (noteToEdit?.id) {
      removePersonalNote(noteToEdit.id);
      onClose();
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" role="dialog" aria-modal="true">
    <button type="button" class="backdrop-catcher" on:click={onClose} aria-label="Tutup dialog"></button>
    <div class="note-modal-card retro-card">
      <!-- Header -->
      <div class="note-modal-header">
        <div class="header-left">
          <FileText size={18} color="var(--accent-amber)" />
          <h3 class="header-title">
            {noteToEdit ? "Edit Catatan Pribadi" : "Catatan Tadabbur Baru"}
          </h3>
        </div>
        <button class="close-icon-btn" on:click={onClose} aria-label="Tutup">
          <X size={18} />
        </button>
      </div>

      <!-- Form Body -->
      <div class="note-modal-body">
        <div class="verse-reference-badge">
          QS. {surahName} : Ayat {ayah}
        </div>

        <div class="input-group">
          <label class="input-label" for="note-title">Judul / Topik Catatan</label>
          <input 
            id="note-title"
            type="text" 
            bind:value={title} 
            class="note-input" 
            placeholder="Misal: Faedah Tauhid, Doa Perlindungan..." 
          />
        </div>

        <div class="input-group">
          <div class="input-label-row">
            <label class="input-label" for="note-content">Isi Refleksi / Catatan Pribadi</label>
            <span class="char-count">{content.length} karakter</span>
          </div>
          <textarea 
            id="note-content"
            bind:value={content} 
            rows="6" 
            class="note-textarea" 
            placeholder="Tuliskan hikmah, pelajaran berharga, atau pengingat untuk diri sendiri dari ayat ini..."
          ></textarea>
          <span class="input-hint">
            {#if !content.trim()}
              * Tuliskan catatan Anda di kolom di atas untuk mengaktifkan tombol Simpan
            {:else}
              Catatan siap disimpan ke memori pribadi Anda
            {/if}
          </span>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="note-modal-footer">
        <div>
          {#if noteToEdit}
            <button class="delete-btn" on:click={handleDelete} title="Hapus Catatan">
              <Trash2 size={16} />
              <span>Hapus</span>
            </button>
          {/if}
        </div>

        <div class="footer-right-buttons">
          <button class="pill-button pill-button-secondary cancel-btn" on:click={onClose}>
            Batal
          </button>
          <button 
            class="pill-button pill-button-primary save-btn" 
            on:click={handleSave}
            disabled={!content.trim()}
          >
            <Save size={16} />
            <span>{isSaved ? "Tersimpan!" : "Simpan Catatan"}</span>
          </button>
        </div>
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

  .note-modal-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    background-color: var(--bg-surface);
    display: flex;
    flex-direction: column;
    border-radius: 1.5rem;
    border: 1px solid var(--border-soft);
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    animation: popIn 0.2s ease-out;
    overscroll-behavior: contain;
  }

  @keyframes popIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .note-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.15rem 1.35rem;
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

  .close-icon-btn {
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

  .close-icon-btn:hover {
    color: var(--accent-amber);
  }

  .note-modal-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
  }

  .verse-reference-badge {
    align-self: flex-start;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    background-color: var(--accent-cream);
    color: var(--accent-amber);
    font-size: 0.75rem;
    font-weight: 700;
  }

  :global(.dark) .verse-reference-badge {
    background-color: #38291A;
    color: var(--accent-gold);
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .input-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .input-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .char-count {
    font-size: 0.72rem;
    color: var(--text-dim);
    font-weight: 500;
  }

  .input-hint {
    font-size: 0.75rem;
    color: var(--text-dim);
    margin-top: 0.15rem;
    font-style: italic;
  }

  .note-input,
  .note-textarea {
    width: 100%;
    background-color: #F8F1DF;
    border: 1.5px solid rgba(216, 125, 54, 0.35);
    color: var(--text-main);
    border-radius: 0.85rem;
    padding: 0.85rem 1rem;
    font-family: var(--font-sans);
    font-size: 0.95rem;
    transition: all 0.2s ease;
    outline: none;
    box-shadow: inset 0 2px 4px rgba(184, 115, 51, 0.08);
  }

  :global(.dark) .note-input,
  :global(.dark) .note-textarea {
    background-color: #241D17;
    border: 1.5px solid rgba(240, 168, 78, 0.28);
    color: #F8EFE4;
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.45);
  }

  .note-input:focus,
  .note-textarea:focus {
    border-color: var(--accent-amber);
    box-shadow: 0 0 0 3px rgba(216, 125, 54, 0.25), inset 0 1px 3px rgba(0, 0, 0, 0.15);
    background-color: #FFFDF8;
  }

  :global(.dark) .note-input:focus,
  :global(.dark) .note-textarea:focus {
    background-color: #2A211B;
    border-color: var(--accent-gold);
    box-shadow: 0 0 0 3px rgba(240, 168, 78, 0.25), inset 0 2px 5px rgba(0, 0, 0, 0.35);
  }

  .note-textarea {
    resize: vertical;
    min-height: 135px;
    line-height: 1.6;
    cursor: text;
  }

  .note-input::placeholder,
  .note-textarea::placeholder {
    color: var(--text-dim);
    opacity: 0.8;
  }

  .note-modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.35rem;
    border-top: 1px solid var(--border-soft);
    background-color: var(--bg-surface-elevated);
  }

  .delete-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: transparent;
    border: none;
    color: #E53E3E;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
  }

  .delete-btn:hover {
    background-color: rgba(229, 62, 62, 0.1);
  }

  .footer-right-buttons {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .cancel-btn {
    padding: 0.55rem 1.1rem;
    font-size: 0.85rem;
  }

  .save-btn {
    padding: 0.55rem 1.25rem;
    font-size: 0.85rem;
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
