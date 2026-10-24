/**
 * Interactive Hero Banner Swan & Pond Physics Engine
 * Backup Module
 */

export function initSwanBanner(heroBannerElement) {
    const heroBanner = heroBannerElement || document.getElementById('heroBanner');
    if (!heroBanner) return;

    const layerRightSwan = heroBanner.querySelector('.layer-swan-right');
    const layerLeftSwan = heroBanner.querySelector('.layer-swan-left');
    const layerPond = heroBanner.querySelector('.layer-pond');

    if (!layerRightSwan || !layerLeftSwan) return;

    let isVisible = true;
    let isHovered = false;
    let targetCursorX = 0;
    let targetCursorY = 0;
    let currentCursorX = 0;
    let currentCursorY = 0;

    let prevRightX = 0;
    let prevRightY = 0;
    let lastWakeTime = 0;
    let lastRippleTime = 0;

    // Dynamic water ripple spawner
    function spawnRipple(xPercent, yPercent, isStrong = false) {
        const ripple = document.createElement('span');
        ripple.className = `interactive-ripple ${isStrong ? 'ripple-strong' : ''}`;
        ripple.style.left = `${xPercent}%`;
        ripple.style.top = `${yPercent}%`;
        ripple.setAttribute('aria-hidden', 'true');
        heroBanner.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, isStrong ? 3000 : 2400);
    }

    // Pointer move handler (mouse & touch)
    function handlePointerMove(e) {
        const rect = heroBanner.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const relX = clientX - rect.left;
        const relY = clientY - rect.top;

        const normX = (relX / rect.width) * 2 - 1;
        const normY = (relY / rect.height) * 2 - 1;

        targetCursorX = Math.max(-1.1, Math.min(1.1, normX));
        targetCursorY = Math.max(-1.1, Math.min(1.1, normY));
        isHovered = true;

        // Spawn gentle interactive water ripple under cursor (throttled)
        const now = performance.now();
        if (now - lastRippleTime > 280) {
            lastRippleTime = now;
            const xPercent = (relX / rect.width) * 100;
            const yPercent = (relY / rect.height) * 100;
            if (yPercent > 18 && yPercent < 85) {
                spawnRipple(xPercent, yPercent, false);
            }
        }
    }

    function handlePointerLeave() {
        isHovered = false;
        targetCursorX = 0;
        targetCursorY = 0;
    }

    function handlePointerClick(e) {
        const rect = heroBanner.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        const xPercent = (relX / rect.width) * 100;
        const yPercent = (relY / rect.height) * 100;
        spawnRipple(xPercent, yPercent, true);
    }

    heroBanner.addEventListener('mousemove', handlePointerMove, { passive: true });
    heroBanner.addEventListener('touchmove', handlePointerMove, { passive: true });
    heroBanner.addEventListener('touchstart', handlePointerMove, { passive: true });
    heroBanner.addEventListener('mouseleave', handlePointerLeave);
    heroBanner.addEventListener('touchend', handlePointerLeave);
    heroBanner.addEventListener('click', handlePointerClick);

    // Continuous 60fps/120fps Animation Loop
    function animateBanner(time) {
        if (!isVisible) {
            requestAnimationFrame(animateBanner);
            return;
        }

        const t = time * 0.001; // elapsed time in seconds

        // Smooth spring lerp for cursor tracking
        const lerpFactor = isHovered ? 0.055 : 0.03;
        currentCursorX += (targetCursorX - currentCursorX) * lerpFactor;
        currentCursorY += (targetCursorY - currentCursorY) * lerpFactor;

        // --- 1. Right Swan (The Active Swimmer) ---
        const strokePhase = t * 2.6;
        const strokeSurge = Math.pow(Math.sin(strokePhase), 2) * 3.5;
        const ambientGlideX = Math.sin(t * 0.45) * 20 + Math.cos(t * 0.2) * 8 + strokeSurge;
        const ambientGlideY = Math.cos(t * 0.55) * 6 + Math.sin(t * 1.3) * 2;
        const ambientBob = Math.sin(t * 2.6) * 2.5;
        const ambientBank = Math.cos(t * 0.45) * 2.2;

        const cursorRightX = currentCursorX * 36;
        const cursorRightY = currentCursorY * 18;

        const totalRightX = ambientGlideX + cursorRightX;
        const totalRightY = ambientGlideY + ambientBob + cursorRightY;

        const vx = totalRightX - prevRightX;
        prevRightX = totalRightX;
        prevRightY = totalRightY;
        const velocityBank = Math.max(-5.5, Math.min(5.5, vx * 1.5));
        const totalRightRot = ambientBank + velocityBank + (currentCursorX * 1.8);

        layerRightSwan.style.transform = `translate3d(${totalRightX.toFixed(2)}px, ${totalRightY.toFixed(2)}px, 0) rotate(${totalRightRot.toFixed(2)}deg)`;

        // Trailing wake ripple behind swimming swan
        if (time - lastWakeTime > 1350) {
            lastWakeTime = time;
            const rect = heroBanner.getBoundingClientRect();
            if (rect.width > 0) {
                const swanBaseX = 72 + (totalRightX / rect.width) * 100;
                const swanBaseY = 42 + (totalRightY / rect.height) * 100;
                spawnRipple(swanBaseX, swanBaseY, false);
            }
        }

        // --- 2. Left Swan (The Grazing Swan) ---
        const dipCycle = Math.sin(t * 0.3);
        const isDipping = dipCycle > 0.65;
        const dipAmount = isDipping ? Math.sin((dipCycle - 0.65) * Math.PI / 0.35) * 5 : 0;
        const dipRot = isDipping ? Math.sin((dipCycle - 0.65) * Math.PI / 0.35) * 3.2 : 0;

        const ambientLeftX = Math.sin(t * 0.38) * 6;
        const ambientLeftY = Math.cos(t * 0.65) * 4 + dipAmount;
        const ambientLeftRot = Math.sin(t * 0.38) * 1.4 + dipRot;

        const cursorLeftX = currentCursorX * 12;
        const cursorLeftY = currentCursorY * 6;
        const cursorLeftRot = currentCursorX * 2.2;

        const totalLeftX = ambientLeftX + cursorLeftX;
        const totalLeftY = ambientLeftY + cursorLeftY;
        const totalLeftRot = ambientLeftRot + cursorLeftRot;

        layerLeftSwan.style.transform = `translate3d(${totalLeftX.toFixed(2)}px, ${totalLeftY.toFixed(2)}px, 0) rotate(${totalLeftRot.toFixed(2)}deg)`;

        // --- 3. Pond Parallax ---
        if (layerPond) {
            const pondParallaxX = -currentCursorX * 6;
            const pondParallaxY = -currentCursorY * 3.5;
            layerPond.style.transform = `translate3d(${pondParallaxX.toFixed(2)}px, ${pondParallaxY.toFixed(2)}px, 0) scale(1.02)`;
        }

        requestAnimationFrame(animateBanner);
    }

    requestAnimationFrame(animateBanner);

    // Pause animation when banner is scrolled offscreen
    if ('IntersectionObserver' in window) {
        const bannerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (entry.isIntersecting) {
                    heroBanner.classList.remove('banner-paused');
                } else {
                    heroBanner.classList.add('banner-paused');
                }
            });
        }, { threshold: 0.05 });

        bannerObserver.observe(heroBanner);
    }
}
