document.addEventListener('DOMContentLoaded', () => {
    // === Github Graph Generation ===
    const graphContainer = document.getElementById('githubGraph');
    if (graphContainer) {
        // 52 weeks * 7 days = 364 cells
        for (let i = 0; i < 364; i++) {
            const cell = document.createElement('div');
            cell.className = 'graph-cell';
            
            // Randomly assign contribution levels (0-4)
            // Weight it heavily towards 0 for realistic look
            const rand = Math.random();
            let level = 0;
            if (rand > 0.95) level = 4;
            else if (rand > 0.9) level = 3;
            else if (rand > 0.8) level = 2;
            else if (rand > 0.6) level = 1;
            
            if (level > 0) {
                cell.classList.add(`level-${level}`);
                cell.style.backgroundColor = `var(--level-${level})`;
            }
            
            graphContainer.appendChild(cell);
        }
    }



    // === Navigation Dot Slider ===
    const navLinksContainer = document.querySelector('.nav-links');
    const indicator = document.querySelector('.nav-indicator');
    const navItems = document.querySelectorAll('.nav-links a');
    let activeItem = document.querySelector('.nav-links a.active');

    function updateIndicator(item) {
        if (!item || !indicator) return;
        const left = item.offsetLeft;
        const width = item.offsetWidth;
        indicator.style.transform = `translateX(${left + width / 2 - 2}px)`;
    }

    if (activeItem) {
        // Small delay to ensure layout is calculated properly
        setTimeout(() => updateIndicator(activeItem), 50);
    } else if (navItems.length > 0) {
        setTimeout(() => updateIndicator(navItems[0]), 50);
    }

    // Also update on window resize
    window.addEventListener('resize', () => {
        if (activeItem) updateIndicator(activeItem);
    });

    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            updateIndicator(item);
        });
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            activeItem = item;
            updateIndicator(item);
        });
    });

    if (navLinksContainer) {
        navLinksContainer.addEventListener('mouseleave', () => {
            if (activeItem) updateIndicator(activeItem);
        });
    }

    // === Theme Toggle ===
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
        });
    }

    // === Tech Stack Filtering ===
    const filterBtns = document.querySelectorAll('.tech-filter');
    const techItems = document.querySelectorAll('.tech-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            techItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // === View Counter ===
    const viewCountElement = document.getElementById('view-count');
    if (viewCountElement) {
        // Since the previous external API seems to be down/inaccessible, 
        // using localStorage to simulate a persistent view counter for the user.
        let currentViews = localStorage.getItem('portfolio_views');
        if (!currentViews) {
            currentViews = 1024; // Starting number
        } else {
            currentViews = parseInt(currentViews) + 1;
        }
        localStorage.setItem('portfolio_views', currentViews);
        viewCountElement.textContent = currentViews.toLocaleString();
    }
});
