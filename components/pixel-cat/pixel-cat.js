/**
 * ===================================================
 * Pixel Art Cat Companion — Interactive Corner Widget
 * ===================================================
 * A self-contained state-machine driven pixel cat companion.
 * 
 * Frame mapping (4 cols x 3 rows = 12 frames):
 * 0: idle-01,  1: idle-02,  2: idle-03,  3: idle-04,
 * 4: idle-05,  5: notice-01, 6: notice-02, 7: notice-03,
 * 8: look-left, 9: look-right, 10: return-01, 11: return-02
 */

(function () {
  'use strict';

  // Constants
  const COLS = 4;
  const FRAMES = {
    IDLE_01: 0,
    IDLE_02: 1,
    IDLE_03: 2,
    IDLE_04: 3,
    IDLE_05: 4,
    NOTICE_01: 5,
    NOTICE_02: 6,
    NOTICE_03: 7,
    LOOK_LEFT: 8,
    LOOK_RIGHT: 9,
    RETURN_01: 10,
    RETURN_02: 11
  };

  // State Machine Timers & Sequence Definitions
  const IDLE_SEQUENCE = [
    { frame: FRAMES.IDLE_01, duration: 1200 },
    { frame: FRAMES.IDLE_02, duration: 180 },
    { frame: FRAMES.IDLE_03, duration: 160 },
    { frame: FRAMES.IDLE_04, duration: 160 },
    { frame: FRAMES.IDLE_03, duration: 160 },
    { frame: FRAMES.IDLE_04, duration: 160 },
    { frame: FRAMES.IDLE_05, duration: 250 }
  ];

  // Component state
  let catEl = null;
  let currentState = 'IDLE'; // 'IDLE' | 'NOTICE' | 'LOOK' | 'RETURN'
  let idleStepIndex = 0;
  let animationTimer = null;
  let returnTimeout = null;
  let lastThrottleTime = 0;
  let isTabHidden = false;

  // Media Query Checks
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let isReducedMotion = motionQuery.matches;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(hover: hover)').matches;

  /**
   * Set sprite sheet background-position based on frame index.
   */
  function setFrame(frameIndex) {
    if (!catEl) return;
    const col = frameIndex % COLS;
    const row = Math.floor(frameIndex / COLS);
    const width = catEl.offsetWidth || 96;
    const height = catEl.offsetHeight || 96;
    catEl.style.backgroundPosition = `-${col * width}px -${row * height}px`;
  }

  /**
   * Cancel all active animation and transition timers.
   */
  function cancelAllTimers() {
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
    if (returnTimeout) {
      clearTimeout(returnTimeout);
      returnTimeout = null;
    }
  }

  /**
   * State 1: IDLE (Ear Brushing Loop)
   */
  function enterIdle() {
    currentState = 'IDLE';
    cancelAllTimers();
    idleStepIndex = 0;

    if (isReducedMotion) {
      setFrame(FRAMES.IDLE_01);
      return;
    }

    function playIdleStep() {
      if (currentState !== 'IDLE' || isTabHidden || isReducedMotion) return;
      const step = IDLE_SEQUENCE[idleStepIndex];
      setFrame(step.frame);
      idleStepIndex = (idleStepIndex + 1) % IDLE_SEQUENCE.length;
      animationTimer = setTimeout(playIdleStep, step.duration);
    }

    playIdleStep();
  }

  /**
   * State 2: NOTICE (Plays once on first cursor movement from idle)
   */
  function enterNotice(clientX) {
    currentState = 'NOTICE';
    cancelAllTimers();

    setFrame(FRAMES.NOTICE_01);
    animationTimer = setTimeout(() => {
      if (currentState !== 'NOTICE') return;
      setFrame(FRAMES.NOTICE_02);

      animationTimer = setTimeout(() => {
        if (currentState !== 'NOTICE') return;
        setFrame(FRAMES.NOTICE_03);

        animationTimer = setTimeout(() => {
          if (currentState !== 'NOTICE') return;
          enterLook(clientX);
        }, 200);
      }, 150);
    }, 150);
  }

  /**
   * Update direction while in LOOK state.
   */
  function updateLookDirection(clientX) {
    if (!catEl) return;
    const rect = catEl.getBoundingClientRect();
    const catCenterX = rect.left + rect.width / 2;
    if (clientX < catCenterX) {
      setFrame(FRAMES.LOOK_LEFT);
    } else {
      setFrame(FRAMES.LOOK_RIGHT);
    }
  }

  /**
   * State 3: LOOK (Tracks cursor left/right while moving)
   */
  function enterLook(clientX) {
    currentState = 'LOOK';
    cancelAllTimers();
    updateLookDirection(clientX);
    resetReturnInactivityTimer();
  }

  /**
   * Reset the 1.5s stillness countdown.
   */
  function resetReturnInactivityTimer() {
    if (returnTimeout) {
      clearTimeout(returnTimeout);
    }
    returnTimeout = setTimeout(() => {
      if (currentState === 'LOOK' && !isTabHidden) {
        enterReturn();
      }
    }, 1500);
  }

  /**
   * State 4: RETURN (Transition back to idle after 1.5s stillness)
   */
  function enterReturn() {
    currentState = 'RETURN';
    cancelAllTimers();

    setFrame(FRAMES.RETURN_01);
    animationTimer = setTimeout(() => {
      if (currentState !== 'RETURN') return;
      setFrame(FRAMES.RETURN_02);

      animationTimer = setTimeout(() => {
        if (currentState !== 'RETURN') return;
        enterIdle();
      }, 250);
    }, 250);
  }

  /**
   * Global pointermove listener.
   */
  function handlePointerMove(e) {
    if (isReducedMotion || isTouchDevice || isTabHidden) return;

    const now = performance.now();
    const clientX = e.clientX;

    if (currentState === 'IDLE') {
      enterNotice(clientX);
      return;
    }

    if (currentState === 'RETURN') {
      // If cursor moves during RETURN, go straight back to LOOK
      enterLook(clientX);
      return;
    }

    if (currentState === 'NOTICE') {
      // Already reacting, will transition to LOOK with latest cursor position
      return;
    }

    if (currentState === 'LOOK') {
      // Throttle direction updates to ~50ms
      if (now - lastThrottleTime >= 45) {
        lastThrottleTime = now;
        updateLookDirection(clientX);
      }
      resetReturnInactivityTimer();
    }
  }

  /**
   * Initialize component once DOM is ready.
   */
  function init() {
    catEl = document.getElementById('pixel-cat-companion');
    if (!catEl) {
      catEl = document.createElement('div');
      catEl.id = 'pixel-cat-companion';
      catEl.className = 'pixel-cat-companion';
      catEl.setAttribute('aria-hidden', 'true');
      catEl.setAttribute('role', 'presentation');
      document.body.appendChild(catEl);
    } else {
      catEl.setAttribute('aria-hidden', 'true');
      catEl.setAttribute('role', 'presentation');
    }

    // Preload sprite sheet image to prevent initial flicker
    const spriteSheetUrl = getComputedStyle(catEl).getPropertyValue('--cat-sprite-url')
      .replace(/url\(['"]?(.*?)['"]?\)/, '$1').trim() || 'public/assets/cat_spritesheet_4x3.png';
    const preloader = new Image();
    preloader.src = spriteSheetUrl;

    // Listen for reduced motion preference changes
    motionQuery.addEventListener('change', (e) => {
      isReducedMotion = e.matches;
      if (isReducedMotion) {
        cancelAllTimers();
        setFrame(FRAMES.IDLE_01);
      } else {
        enterIdle();
      }
    });

    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isTabHidden = true;
        cancelAllTimers();
      } else {
        isTabHidden = false;
        if (!isReducedMotion) {
          enterIdle();
        }
      }
    });

    // Attach pointermove if not a pure touch device
    if (!isTouchDevice) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
    }

    // Start in IDLE state
    enterIdle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
