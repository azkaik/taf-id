<script>
  // Komponen Pita Gelombang Retro (Wavy Ribbons) yang terinspirasi dari mockup
  export let position = "top"; // 'top' | 'bottom'
</script>

{#if position === "top"}
  <div class="wavy-container top-waves">
    <svg viewBox="0 0 500 120" preserveAspectRatio="none" class="wavy-svg">
      <!-- Layer 1: Terracotta Gelombang -->
      <path d="M0,30 C120,95 240,5 370,55 C440,85 480,45 500,30 L500,0 L0,0 Z" 
            fill="var(--accent-terracotta)" opacity="0.35" />
      <!-- Layer 2: Amber Gelombang -->
      <path d="M0,15 C140,80 260,10 390,70 C450,100 485,60 500,45 L500,0 L0,0 Z" 
            fill="var(--accent-amber)" opacity="0.65" />
      <!-- Layer 3: Golden Warm Gelombang -->
      <path d="M0,5 C150,60 280,0 410,50 C465,75 490,40 500,25 L500,0 L0,0 Z" 
            fill="var(--accent-gold)" opacity="0.9" />
    </svg>
  </div>
{:else}
  <div class="wavy-container bottom-waves">
    <svg viewBox="0 0 500 100" preserveAspectRatio="none" class="wavy-svg">
      <path d="M0,70 C130,20 250,90 380,40 C445,15 480,55 500,70 L500,100 L0,100 Z" 
            fill="var(--accent-gold)" opacity="0.65" />
      <path d="M0,85 C140,40 270,105 390,65 C450,45 485,75 500,85 L500,100 L0,100 Z" 
            fill="var(--accent-amber)" opacity="0.85" />
    </svg>
  </div>
{/if}

<style>
  .wavy-container {
    width: 100%;
    position: absolute;
    left: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .top-waves {
    top: 0;
    height: 65px;
    opacity: 0.6;
  }

  .bottom-waves {
    bottom: 0;
    height: 70px;
  }

  .wavy-svg {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
