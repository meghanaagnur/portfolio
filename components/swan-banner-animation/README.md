# Swan & Pond Physics Engine Animation (Backup)

This directory preserves the complete, handcrafted multi-layered Swan & Pond interactive physics animation originally built for the hero banner of the portfolio.

## Structure
- `index.html`: Standalone, zero-dependency interactive demo page with day/night toggle, mouse tracking physics, dynamic ripple spawning, and ambient water kinematics.
- `swan-banner.css`: Complete CSS styling, keyframes, depth layering, and theme crossfading rules.
- `swan-banner.js`: Complete 60fps/120fps physics engine loop with spring lerp, paddle surge impulses, banking, grazing dips, trailing wakes, and cursor parallax.

---

## Assets Used
The animation relies on the WebP assets in `/banner`:
- `banner/pond-day.webp` & `banner/pond-night.webp`: Water background base and shimmer layers
- `banner/swan-left-day.webp` & `banner/swan-left-night.webp`: Grazing left swan cutout
- `banner/swan-right-day.webp` & `banner/swan-right-night.webp`: Active swimming right swan cutout

---

## How to Restore to `index.html`

### 1. Replace Hero Banner HTML
In `index.html`, inside `.banner`:
```html
<div class="hero-banner" id="heroBanner">
    <!-- Layer 1: Water Background (Bottom) -->
    <div class="banner-layer-group layer-pond pond-drift">
        <img src="banner/pond-day.webp" alt="" aria-hidden="true" class="banner-layer banner-layer-day" loading="lazy">
        <img src="banner/pond-night.webp" alt="" aria-hidden="true" class="banner-layer banner-layer-night" loading="eager" fetchpriority="high">
    </div>

    <!-- Water Ripples -->
    <!-- Left Swan Beak Ripples (3 rings at left: 58%, top: 63%) -->
    <span class="ripple-ring ripple-beak ripple-delay-1" aria-hidden="true"></span>
    <span class="ripple-ring ripple-beak ripple-delay-2" aria-hidden="true"></span>
    <span class="ripple-ring ripple-beak ripple-delay-3" aria-hidden="true"></span>

    <!-- Right Swan Chest Ripple (Single ring at left: 70%, top: 45%) -->
    <span class="ripple-ring ripple-chest" aria-hidden="true"></span>

    <!-- Layer 2: Left Swan (Middle) -->
    <div class="banner-layer-group layer-swan-left swan-left-dip">
        <div class="swan-left-bob">
            <img src="banner/swan-left-day.webp" alt="" aria-hidden="true" class="banner-layer banner-layer-day" loading="lazy">
            <img src="banner/swan-left-night.webp" alt="" aria-hidden="true" class="banner-layer banner-layer-night" loading="eager">
        </div>
    </div>

    <!-- Layer 3: Right Swan (Top) -->
    <div class="banner-layer-group layer-swan-right swan-right-glide">
        <div class="swan-right-bob">
            <img src="banner/swan-right-day.webp" alt="" aria-hidden="true" class="banner-layer banner-layer-day" loading="lazy">
            <img src="banner/swan-right-night.webp" alt="" aria-hidden="true" class="banner-layer banner-layer-night" loading="eager">
        </div>
    </div>

    <!-- Layer 4: Light Shimmer Overlay (Copy of pond image with soft-light) -->
    <div class="banner-shimmer" aria-hidden="true">
        <img src="banner/pond-day.webp" alt="" aria-hidden="true" class="banner-layer banner-layer-day" loading="lazy">
        <img src="banner/pond-night.webp" alt="" aria-hidden="true" class="banner-layer banner-layer-night" loading="eager">
    </div>

    <!-- Layer 5: Floating Petals (CSS Only) -->
    <div class="banner-petals" aria-hidden="true">
        <span class="petal petal-1"></span>
        <span class="petal petal-2"></span>
        <span class="petal petal-3"></span>
        <span class="petal petal-4"></span>
    </div>

    <!-- Layer 6: Tactile Grain Texture Overlay -->
    <div class="grain-overlay" aria-hidden="true"></div>
</div>
```

### 2. Include JS Logic
The physics engine logic is contained in `swan-banner.js` and can be pasted back into `script.js`.
