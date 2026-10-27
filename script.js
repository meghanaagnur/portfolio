document.addEventListener('DOMContentLoaded', () => {
    // === Github Graph Generation ===
    const graphContainer = document.getElementById('githubGraph');
    const monthsContainer = document.getElementById('githubMonths');
    const contribCountEl = document.getElementById('githubContributionCount');

    if (graphContainer) {
        const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        function formatTooltip(dateStr, count) {
            const parts = dateStr.split('-');
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            const dateText = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            if (count === 0) return `No contributions on ${dateText}`;
            return `${count} contribution${count === 1 ? '' : 's'} on ${dateText}`;
        }

        function renderCalendar(contributions, totalCount) {
            graphContainer.innerHTML = '';
            if (monthsContainer) monthsContainer.innerHTML = '';

            if (contribCountEl && typeof totalCount !== 'undefined') {
                contribCountEl.textContent = `${totalCount} contributions in the last year`;
            }

            const seenMonths = new Set();

            contributions.forEach((day, index) => {
                const col = Math.floor(index / 7);
                const monthKey = day.date.substring(0, 7); // e.g. "2025-10"

                // Position each month label precisely over its starting week column
                if (!seenMonths.has(monthKey) && monthsContainer) {
                    seenMonths.add(monthKey);
                    const monthNum = parseInt(day.date.substring(5, 7), 10);
                    const label = document.createElement('span');
                    label.textContent = monthShortNames[monthNum - 1];
                    label.style.gridColumnStart = (col + 1).toString();
                    monthsContainer.appendChild(label);
                }

                const cell = document.createElement('div');
                cell.className = 'graph-cell';

                const level = day.level || 0;
                cell.classList.add(`level-${level}`);
                cell.style.backgroundColor = `var(--level-${level})`;
                cell.title = formatTooltip(day.date, day.count);

                graphContainer.appendChild(cell);
            });
        }

        // Render clean baseline placeholder while data is loading
        const placeholderDays = Array.from({ length: 370 }, (_, i) => ({
            date: '2026-01-01',
            count: 0,
            level: 0
        }));
        renderCalendar(placeholderDays, 301);

        // Fetch authentic live GitHub contributions (370 days from starting Sunday)
        fetch('https://github-contributions-api.jogruber.de/v4/meghanaagnur?y=last')
            .then(response => {
                if (!response.ok) throw new Error('GitHub API request failed');
                return response.json();
            })
            .then(data => {
                if (!data || !data.contributions || data.contributions.length === 0) {
                    throw new Error('No contribution data returned');
                }
                const total = data.total && typeof data.total.lastYear !== 'undefined' ? data.total.lastYear : 301;
                renderCalendar(data.contributions, total);
            })
            .catch(err => {
                console.warn('Real GitHub fetch fallback:', err);
            });
    }



    // === Navigation Dot Slider ===
    const navLinksContainer = document.querySelector('.nav-links');
    const indicator = document.querySelector('.nav-indicator');
    const navItems = document.querySelectorAll('.nav-links a');
    
    // Hardcode "Home" as the only permanently active item
    const activeItem = navItems.length > 0 ? navItems[0] : null;

    // Ensure only Home has the active class
    navItems.forEach(nav => nav.classList.remove('active'));
    if (activeItem) activeItem.classList.add('active');

    function updateIndicator(item) {
        if (!item || !indicator) return;
        const left = item.offsetLeft;
        const width = item.offsetWidth;
        indicator.style.transform = `translateX(${left + width / 2 - 2}px)`;
    }

    if (activeItem) {
        // Small delay to ensure layout is calculated properly
        setTimeout(() => updateIndicator(activeItem), 50);
    }

    // Also update on window resize
    window.addEventListener('resize', () => {
        if (activeItem) updateIndicator(activeItem);
    });

    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            updateIndicator(item);
        });
    });

    if (navLinksContainer) {
        navLinksContainer.addEventListener('mouseleave', () => {
            if (activeItem) updateIndicator(activeItem);
        });
    }

    // === Tech Stack Marquee (Interactive) ===
    // Handled via CSS keyframes with pause-on-hover for seamless 60fps performance

    // === Real Global View Counter ===
    const viewCountElement = document.getElementById('view-count');
    if (viewCountElement) {
        const COUNTER_KEY = 'meghanaagnur-portfolio-views-v1';
        const API_BASE = 'https://countapi.mileshilliard.com/api/v1';
        const SESSION_FLAG = 'portfolio_view_counted';
        const CACHE_KEY = 'portfolio_live_views';

        // 1. Immediately display cached count to avoid layout shift
        const cachedViews = localStorage.getItem(CACHE_KEY);
        if (cachedViews) {
            viewCountElement.textContent = Number(cachedViews).toLocaleString();
        }

        // 2. Increment once per session, get for refreshes/subsequent pageviews in same session
        const hasCountedSession = sessionStorage.getItem(SESSION_FLAG);
        const endpoint = hasCountedSession 
            ? `${API_BASE}/get/${COUNTER_KEY}` 
            : `${API_BASE}/hit/${COUNTER_KEY}`;

        // AbortController to avoid hanging on slow network
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        function animateCount(element, start, end) {
            if (start === end || isNaN(start)) {
                element.textContent = end.toLocaleString();
                return;
            }
            const duration = 600;
            const startTime = performance.now();
            function updateNumber(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 2);
                const current = Math.floor(start + (end - start) * eased);
                element.textContent = current.toLocaleString();
                if (progress < 1) {
                    requestAnimationFrame(updateNumber);
                } else {
                    element.textContent = end.toLocaleString();
                }
            }
            requestAnimationFrame(updateNumber);
        }

        fetch(endpoint, { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                clearTimeout(timeoutId);
                if (data && typeof data.value === 'number') {
                    const realCount = data.value;
                    sessionStorage.setItem(SESSION_FLAG, 'true');
                    localStorage.setItem(CACHE_KEY, realCount);

                    const startNum = cachedViews ? parseInt(cachedViews, 10) : 0;
                    animateCount(viewCountElement, startNum, realCount);
                }
            })
            .catch(err => {
                clearTimeout(timeoutId);
                console.warn('Real view count fetch error:', err);
                if (!cachedViews) {
                    viewCountElement.textContent = '1';
                }
            });
    }

    // === Theme Switcher (Dark / Light Mode) ===
    const themeToggleBtn = document.getElementById('themeToggle');
    
    // Retrieve saved theme or default to pitch black ('dark')
    const savedTheme = localStorage.getItem('portfolio_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    function updateBannerImageLoading(theme) {
        const dayPond = document.querySelector('.layer-pond .banner-layer-day');
        const nightPond = document.querySelector('.layer-pond .banner-layer-night');
        const dayImages = document.querySelectorAll('#heroBanner .banner-layer-day');
        const nightImages = document.querySelectorAll('#heroBanner .banner-layer-night');

        // Footer scenic images
        const dayLake = document.querySelector('.layer-swiss-lake .footer-layer-day');
        const nightLake = document.querySelector('.layer-swiss-lake .footer-layer-night');
        const dayFooterImages = document.querySelectorAll('#footerScene .footer-layer-day, #footerScene .footer-boat-day');
        const nightFooterImages = document.querySelectorAll('#footerScene .footer-layer-night, #footerScene .footer-boat-night');

        if (theme === 'light') {
            if (dayPond) {
                dayPond.setAttribute('loading', 'eager');
                dayPond.setAttribute('fetchpriority', 'high');
            }
            if (nightPond) {
                nightPond.setAttribute('loading', 'lazy');
                nightPond.removeAttribute('fetchpriority');
            }
            if (dayLake) {
                dayLake.setAttribute('loading', 'eager');
                dayLake.setAttribute('fetchpriority', 'high');
            }
            if (nightLake) {
                nightLake.setAttribute('loading', 'lazy');
                nightLake.removeAttribute('fetchpriority');
            }
            dayImages.forEach(img => img.setAttribute('loading', 'eager'));
            nightImages.forEach(img => img.setAttribute('loading', 'lazy'));
            dayFooterImages.forEach(img => img.setAttribute('loading', 'eager'));
            nightFooterImages.forEach(img => img.setAttribute('loading', 'lazy'));
        } else {
            if (nightPond) {
                nightPond.setAttribute('loading', 'eager');
                nightPond.setAttribute('fetchpriority', 'high');
            }
            if (dayPond) {
                dayPond.setAttribute('loading', 'lazy');
                dayPond.removeAttribute('fetchpriority');
            }
            if (nightLake) {
                nightLake.setAttribute('loading', 'eager');
                nightLake.setAttribute('fetchpriority', 'high');
            }
            if (dayLake) {
                dayLake.setAttribute('loading', 'lazy');
                dayLake.removeAttribute('fetchpriority');
            }
            nightImages.forEach(img => img.setAttribute('loading', 'eager'));
            dayImages.forEach(img => img.setAttribute('loading', 'lazy'));
            nightFooterImages.forEach(img => img.setAttribute('loading', 'eager'));
            dayFooterImages.forEach(img => img.setAttribute('loading', 'lazy'));
        }
    }

    updateBannerImageLoading(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('portfolio_theme', nextTheme);
            updateBannerImageLoading(nextTheme);

            // Re-align navigation indicator in case font-rendering or layout micro-adjusted
            if (activeItem) {
                setTimeout(() => updateIndicator(activeItem), 50);
            }
        });
    }

    // === Interactive Hero Banner Swan & Pond Physics Engine ===
    const heroBanner = document.getElementById('heroBanner');
    const layerRightSwan = document.querySelector('.layer-swan-right');
    const layerLeftSwan = document.querySelector('.layer-swan-left');
    const layerPond = document.querySelector('.layer-pond');

    if (heroBanner && layerRightSwan && layerLeftSwan) {
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
            // Continuous swimming motion: paddle impulse bursts + sinusoidal glide path
            const strokePhase = t * 2.6;
            const strokeSurge = Math.pow(Math.sin(strokePhase), 2) * 3.5;
            const ambientGlideX = Math.sin(t * 0.45) * 20 + Math.cos(t * 0.2) * 8 + strokeSurge;
            const ambientGlideY = Math.cos(t * 0.55) * 6 + Math.sin(t * 1.3) * 2;
            const ambientBob = Math.sin(t * 2.6) * 2.5; // swimming water bobbing
            const ambientBank = Math.cos(t * 0.45) * 2.2;

            // Cursor response: swims smoothly towards cursor position
            const cursorRightX = currentCursorX * 36;
            const cursorRightY = currentCursorY * 18;

            const totalRightX = ambientGlideX + cursorRightX;
            const totalRightY = ambientGlideY + ambientBob + cursorRightY;

            // Real-time banking based on swimming direction & velocity
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
            // Natural resting water bobbing, grazing dips, and turns toward cursor with curiosity
            const dipCycle = Math.sin(t * 0.3); // Grazing dip every ~10s
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
            }, { threshold: 0 });
            bannerObserver.observe(heroBanner);
        }
    }

    // === Glare Button Click Trigger ===
    const glareButtons = document.querySelectorAll('.glare-button');
    glareButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.remove('glare-animate');
            void btn.offsetWidth; // Force reflow to re-trigger CSS keyframe
            btn.classList.add('glare-animate');
            setTimeout(() => btn.classList.remove('glare-animate'), 650);
        });
    });

    // === Experience Category Filter ===
    const filterBtns = document.querySelectorAll('.exp-filter-btn');
    const expGroups = document.querySelectorAll('.experience-group');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            expGroups.forEach(group => {
                const groupType = group.getAttribute('data-group');
                if (filter === 'all' || filter === groupType) {
                    group.style.display = 'block';
                } else {
                    group.style.display = 'none';
                }
            });
        });
    });

    // === Back to Top Smooth Scroll ===
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // =========================================================================
    // === Global Tactile Click Sound Effect (Web Audio API Engine) ============
    // =========================================================================
    (function initClickSound() {
        let audioCtx = null;
        let audioBuffer = null;
        let isFetching = false;
        let lastPlayTime = 0;
        const SOUND_URL = 'click.mp3';

        // Lazy initialize AudioContext on first interaction
        function getAudioContext() {
            if (!audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    audioCtx = new AudioContextClass();
                }
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
            return audioCtx;
        }

        // Preload and decode audio buffer
        function loadBuffer() {
            if (audioBuffer || isFetching) return;
            isFetching = true;
            fetch(SOUND_URL)
                .then(res => {
                    if (!res.ok) throw new Error('Failed to load ' + SOUND_URL);
                    return res.arrayBuffer();
                })
                .then(arrayBuffer => {
                    const ctx = getAudioContext();
                    if (!ctx) return null;
                    return ctx.decodeAudioData(arrayBuffer);
                })
                .then(decoded => {
                    if (decoded) audioBuffer = decoded;
                })
                .catch(err => {
                    console.warn('Click audio buffer load fallback:', err);
                })
                .finally(() => {
                    isFetching = false;
                });
        }

        // HTMLAudio fallback pool
        const audioPool = [new Audio(SOUND_URL), new Audio(SOUND_URL), new Audio(SOUND_URL)];
        let poolIdx = 0;

        function playClickSound() {
            const now = performance.now();
            if (now - lastPlayTime < 35) return; // Debounce rapid bursts
            lastPlayTime = now;

            const ctx = getAudioContext();
            if (ctx && audioBuffer) {
                try {
                    const source = ctx.createBufferSource();
                    const gainNode = ctx.createGain();
                    source.buffer = audioBuffer;
                    gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
                    source.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    source.start(0);
                    return;
                } catch (e) {
                    // Fall through to HTMLAudio pool
                }
            }

            // Fallback if buffer not yet decoded or WebAudio unavailable
            try {
                const audio = audioPool[poolIdx];
                poolIdx = (poolIdx + 1) % audioPool.length;
                audio.volume = 0.35;
                audio.currentTime = 0;
                audio.play().catch(() => {});
            } catch (e) {}

            // Trigger buffer fetch if not already loaded
            if (!audioBuffer) {
                loadBuffer();
            }
        }

        // Start loading early
        loadBuffer();

        // Target all interactive elements across the site
        const INTERACTIVE_SELECTOR = 'a, button, input[type="button"], input[type="submit"], [role="button"], .glare-button, .contact-strip-item, .tech-item, .project-card, .theme-toggle, .graph-cell, .timeline-item, .footer-back-to-top, .view-all, .views, .nav-links a';

        // Immediate tactile response on pointerdown / mousedown
        document.addEventListener('pointerdown', (e) => {
            const el = e.target.closest(INTERACTIVE_SELECTOR);
            if (el) {
                playClickSound();
            }
        }, { passive: true });

        // Keyboard navigation support (Enter or Space on interactive elements)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const el = document.activeElement && document.activeElement.closest(INTERACTIVE_SELECTOR);
                if (el) {
                    playClickSound();
                }
            }
        }, { passive: true });

        // Expose globally for any programmatic triggers if needed
        window.playClickSound = playClickSound;
    })();

    // =========================================================================
    // === Contact & Connect Form (Direct Email / Web3Forms / Resend API) =====
    // =========================================================================
    const contactForm = document.getElementById('contactForm');
    const sendMailBtn = document.getElementById('sendMailBtn');
    const sendMailStatus = document.getElementById('sendMailStatus');

    if (contactForm && sendMailBtn) {
        // Configuration:
        // For static sites (GitHub Pages), Web3Forms is 100% free with no backend server needed.
        // Get your free key instantly by entering meghanaagnur@gmail.com at https://web3forms.com
        // If left empty, it will open the visitor's default email client prefilled with your address.
        const CONTACT_CONFIG = {
            web3FormsKey: '', // e.g. 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
            recipientEmail: 'meghanaagnur@gmail.com',
            resendEndpoint: '' // Optional: URL to your serverless Resend function if hosted on Vercel/Cloudflare
        };

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('senderName');
            const emailInput = document.getElementById('senderEmail');
            const messageInput = document.getElementById('senderMessage');

            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const message = messageInput ? messageInput.value.trim() : '';

            if (!email || !message) {
                if (sendMailStatus) {
                    sendMailStatus.textContent = 'Please fill out your email and message.';
                    sendMailStatus.className = 'form-status error';
                }
                return;
            }

            // Disable button while processing
            sendMailBtn.disabled = true;
            const btnSpan = sendMailBtn.querySelector('span');
            const originalBtnText = btnSpan ? btnSpan.textContent : 'Send';
            if (btnSpan) btnSpan.textContent = 'Sending...';

            if (sendMailStatus) {
                sendMailStatus.textContent = 'Sending message...';
                sendMailStatus.className = 'form-status';
            }

            const senderDisplayName = name ? `${name} <${email}>` : email;

            try {
                // 1. If custom Resend serverless function is configured:
                if (CONTACT_CONFIG.resendEndpoint) {
                    const res = await fetch(CONTACT_CONFIG.resendEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, message, to: CONTACT_CONFIG.recipientEmail })
                    });
                    if (!res.ok) throw new Error('Failed to send via Resend endpoint');
                    showSuccess();
                    return;
                }

                // 2. If Web3Forms access key is configured:
                if (CONTACT_CONFIG.web3FormsKey) {
                    const res = await fetch('https://api.web3forms.com/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            access_key: CONTACT_CONFIG.web3FormsKey,
                            name: name || 'Portfolio Visitor',
                            email: email,
                            message: message,
                            subject: `New Portfolio Message from ${name || email}`,
                            from_name: name || 'Portfolio Visitor'
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showSuccess();
                        return;
                    } else {
                        throw new Error(data.message || 'Submission rejected');
                    }
                }

                // 3. Default Fallback: Open email client with prefilled mailto
                const mailtoUrl = `mailto:${CONTACT_CONFIG.recipientEmail}?subject=${encodeURIComponent('Portfolio Message from ' + (name || email))}&body=${encodeURIComponent(message + '\n\n---\nSent by: ' + senderDisplayName)}`;
                window.location.href = mailtoUrl;

                if (sendMailStatus) {
                    sendMailStatus.textContent = 'Opening your email client to send to Meghana!';
                    sendMailStatus.className = 'form-status success';
                }
                contactForm.reset();
            } catch (err) {
                console.warn('Form submission issue, opening mail client as fallback:', err);
                const mailtoUrl = `mailto:${CONTACT_CONFIG.recipientEmail}?subject=${encodeURIComponent('Portfolio Message from ' + (name || email))}&body=${encodeURIComponent(message + '\n\n---\nSent by: ' + senderDisplayName)}`;
                window.location.href = mailtoUrl;

                if (sendMailStatus) {
                    sendMailStatus.textContent = 'Opening email client to send to meghanaagnur@gmail.com!';
                    sendMailStatus.className = 'form-status';
                }
            } finally {
                sendMailBtn.disabled = false;
                if (btnSpan) btnSpan.textContent = originalBtnText;
            }

            function showSuccess() {
                if (sendMailStatus) {
                    sendMailStatus.textContent = '✓ Message sent! I\'ll get back to you soon.';
                    sendMailStatus.className = 'form-status success';
                }
                contactForm.reset();
            }
        });
    }
});
