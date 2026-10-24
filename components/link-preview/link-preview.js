/**
 * Link Preview Component (Vanilla JavaScript)
 * Inspired by Aceternity UI & Planes (@useplanes/link-preview)
 *
 * Works with any HTML markup using:
 *   - data-preview-image="path/to/image.jpg"
 *   - data-preview-url="https://example.com" (auto-fetches screenshot via Microlink)
 *   - data-preview-title="Card Title"
 *   - data-preview-width="260"
 *   - data-preview-height="160"
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LinkPreview = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let cardEl = null;
  let imgWrapperEl = null;
  let imgEl = null;
  let skeletonEl = null;
  let metaEl = null;
  let titleEl = null;
  let badgeEl = null;

  let activeTrigger = null;
  let hideTimeout = null;
  let showTimeout = null;
  const imageCache = new Set();

  const DEFAULTS = {
    width: 260,
    height: 160,
    gap: 12,
    margin: 16,
    enterDelay: 50,
    leaveDelay: 130
  };

  function createCardDOM() {
    if (cardEl) return;

    cardEl = document.createElement('div');
    cardEl.className = 'link-preview-card';
    cardEl.setAttribute('role', 'tooltip');
    cardEl.setAttribute('aria-hidden', 'true');

    imgWrapperEl = document.createElement('div');
    imgWrapperEl.className = 'link-preview-img-wrapper';

    skeletonEl = document.createElement('div');
    skeletonEl.className = 'link-preview-skeleton';

    imgEl = document.createElement('img');
    imgEl.className = 'link-preview-img';
    imgEl.alt = 'Link preview';

    imgWrapperEl.appendChild(skeletonEl);
    imgWrapperEl.appendChild(imgEl);

    metaEl = document.createElement('div');
    metaEl.className = 'link-preview-meta';

    titleEl = document.createElement('span');
    titleEl.className = 'link-preview-title';

    badgeEl = document.createElement('span');
    badgeEl.className = 'link-preview-badge';

    metaEl.appendChild(titleEl);
    metaEl.appendChild(badgeEl);

    cardEl.appendChild(imgWrapperEl);
    cardEl.appendChild(metaEl);

    document.body.appendChild(cardEl);

    // Keep open when hovering card directly
    cardEl.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
    });

    cardEl.addEventListener('mouseleave', () => {
      hide();
    });

    // Clicking card opens target url if trigger was a link
    cardEl.addEventListener('click', (e) => {
      if (!activeTrigger) return;
      const url = activeTrigger.getAttribute('data-preview-url') || activeTrigger.getAttribute('href');
      if (url && url !== '#') {
        const target = activeTrigger.getAttribute('target') || '_self';
        window.open(url, target, 'noopener,noreferrer');
      }
    });
  }

  function resolveImageSrc(trigger) {
    const staticImg = trigger.getAttribute('data-preview-image');
    if (staticImg) return staticImg;

    const url = trigger.getAttribute('data-preview-url') || trigger.getAttribute('href');
    if (url && url !== '#' && !url.startsWith('javascript:')) {
      // Dynamic screenshot generation via Microlink API (free tier, CORS friendly)
      return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
    }
    return '';
  }

  function positionCard(trigger) {
    if (!cardEl || !trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = parseInt(trigger.getAttribute('data-preview-width'), 10) || DEFAULTS.width;
    const height = parseInt(trigger.getAttribute('data-preview-height'), 10) || DEFAULTS.height;
    const hasMeta = !!(trigger.getAttribute('data-preview-title') || trigger.getAttribute('data-preview-badge'));
    const metaHeight = hasMeta ? 34 : 0;
    const totalCardHeight = height + metaHeight + 12; // padding + borders

    imgWrapperEl.style.width = `${width}px`;
    imgWrapperEl.style.height = `${height}px`;

    // Horizontal positioning: center over trigger, clamped to viewport
    const triggerCenter = rect.left + rect.width / 2;
    let cardLeft = triggerCenter - (width + 12) / 2;

    const minLeft = DEFAULTS.margin;
    const maxLeft = window.innerWidth - (width + 12) - DEFAULTS.margin;
    cardLeft = Math.max(minLeft, Math.min(cardLeft, maxLeft));

    // Vertical positioning: above trigger if space allows, otherwise flip below
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    let cardTop;
    let isFlipped = false;

    if (spaceAbove >= totalCardHeight + DEFAULTS.gap) {
      // Place above
      cardTop = rect.top - totalCardHeight - DEFAULTS.gap;
      isFlipped = false;
    } else if (spaceBelow >= totalCardHeight + DEFAULTS.gap) {
      // Place below
      cardTop = rect.bottom + DEFAULTS.gap;
      isFlipped = true;
    } else {
      // Best fit
      cardTop = spaceAbove > spaceBelow ? rect.top - totalCardHeight - DEFAULTS.gap : rect.bottom + DEFAULTS.gap;
      isFlipped = spaceAbove <= spaceBelow;
    }

    cardEl.style.left = `${Math.round(cardLeft)}px`;
    cardEl.style.top = `${Math.round(cardTop)}px`;

    if (isFlipped) {
      cardEl.classList.add('flipped');
    } else {
      cardEl.classList.remove('flipped');
    }
  }

  function show(trigger) {
    clearTimeout(hideTimeout);
    createCardDOM();

    activeTrigger = trigger;
    const imageSrc = resolveImageSrc(trigger);
    const title = trigger.getAttribute('data-preview-title') || '';
    const badge = trigger.getAttribute('data-preview-badge') || '';

    // Set meta
    if (title || badge) {
      metaEl.style.display = 'flex';
      titleEl.textContent = title;
      titleEl.style.display = title ? 'inline-block' : 'none';
      badgeEl.textContent = badge;
      badgeEl.style.display = badge ? 'inline-block' : 'none';
    } else {
      metaEl.style.display = 'none';
    }

    positionCard(trigger);

    // Image loading with cache check
    if (imageSrc) {
      if (imageCache.has(imageSrc)) {
        imgEl.src = imageSrc;
        imgEl.classList.add('loaded');
        skeletonEl.style.display = 'none';
      } else {
        imgEl.classList.remove('loaded');
        skeletonEl.style.display = 'block';
        imgEl.onload = () => {
          imageCache.add(imageSrc);
          imgEl.classList.add('loaded');
          skeletonEl.style.display = 'none';
        };
        imgEl.onerror = () => {
          skeletonEl.style.display = 'none';
        };
        imgEl.src = imageSrc;
      }
    }

    cardEl.setAttribute('aria-hidden', 'false');
    cardEl.classList.add('is-visible');
  }

  function hide() {
    clearTimeout(showTimeout);
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (cardEl) {
        cardEl.classList.remove('is-visible');
        cardEl.setAttribute('aria-hidden', 'true');
      }
      activeTrigger = null;
    }, DEFAULTS.leaveDelay);
  }

  function bindTrigger(trigger) {
    if (trigger._lpBound) return;
    trigger._lpBound = true;

    // Optional preloading on hover start or immediate
    const imgSrc = resolveImageSrc(trigger);
    if (imgSrc && !imageCache.has(imgSrc)) {
      const preloadImg = new Image();
      preloadImg.src = imgSrc;
      preloadImg.onload = () => imageCache.add(imgSrc);
    }

    trigger.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
      clearTimeout(showTimeout);
      showTimeout = setTimeout(() => show(trigger), DEFAULTS.enterDelay);
    });

    trigger.addEventListener('mouseleave', () => {
      clearTimeout(showTimeout);
      hide();
    });

    trigger.addEventListener('focus', () => {
      show(trigger);
    });

    trigger.addEventListener('blur', () => {
      hide();
    });
  }

  function init(selector) {
    if (typeof document === 'undefined') return;

    const query = selector || [
      '.link-preview-trigger',
      '.link-preview',
      '[data-link-preview]',
      '[data-preview-image]',
      '[data-preview-url]'
    ].join(',');

    const triggers = document.querySelectorAll(query);
    triggers.forEach(bindTrigger);

    // Watch for dynamically added DOM elements
    if (window.MutationObserver && !window._lpObserverInit) {
      window._lpObserverInit = true;
      const observer = new MutationObserver(() => {
        const freshTriggers = document.querySelectorAll(query);
        freshTriggers.forEach(bindTrigger);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Auto-init on DOMContentLoaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init());
    } else {
      init();
    }
  }

  return {
    init,
    show,
    hide,
    bind: bindTrigger
  };
});
