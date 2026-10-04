<script>
  import { onMount } from "svelte";
  import { activeTab } from "./stores/appStore.js";
  import Navbar from "./components/common/Navbar.svelte";
  import BottomNav from "./components/common/BottomNav.svelte";
  import MiniAudioPlayer from "./components/common/MiniAudioPlayer.svelte";
  import HomeView from "./components/home/HomeView.svelte";
  import SurahListView from "./components/surah/SurahListView.svelte";
  import AyahReaderView from "./components/reader/AyahReaderView.svelte";
  import SearchView from "./components/search/SearchView.svelte";
  import NotesAndBookmarksView from "./components/notes/NotesAndBookmarksView.svelte";
  import { loadAyah } from "./stores/quranStore.js";
  import { getLastRead } from "./services/storage.js";

  onMount(() => {
    // Muat posisi baca terakhir secara otomatis saat aplikasi dibuka
    const last = getLastRead();
    if (last) {
      loadAyah(last.surah || 2, last.ayah || 255).catch(console.error);
    }
  });
</script>

<div class="app-layout">
  <!-- Top App Bar Navigation -->
  <Navbar />

  <!-- Main Content Body (Berdasarkan Tab Aktif) -->
  <main class="main-viewport">
    {#if $activeTab === "home"}
      <HomeView />
    {:else if $activeTab === "surahs"}
      <SurahListView />
    {:else if $activeTab === "reader"}
      <AyahReaderView />
    {:else if $activeTab === "search"}
      <SearchView />
    {:else if $activeTab === "notes"}
      <NotesAndBookmarksView />
    {/if}
  </main>

  <!-- Mini Audio Player (Tampil saat memutar murottal di luar tab reader) -->
  <MiniAudioPlayer />

  <!-- Floating Bottom Pill Dock Navigation (Sesuai mockup) -->
  <BottomNav />
</div>

<style>
  .app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    background-color: var(--bg-primary);
  }

  .main-viewport {
    flex: 1;
    width: 100%;
  }
</style>
