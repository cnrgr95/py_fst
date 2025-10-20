// Sidebar JavaScript - Basit Açma/Kapatma Versiyonu
(() => {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarToggleButtons = document.querySelectorAll('.js-sidebar-toggle');
    const sidebarToggleClose = document.getElementById('sidebarToggleClose');

    // Mobile toggle buttons
    sidebarToggleButtons.forEach(btn => {
        btn.addEventListener('click', handleMobileToggle);
    });

    // Close button
    if (sidebarToggleClose) {
        sidebarToggleClose.addEventListener('click', handleMobileToggle);
    }

    // Overlay click
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', handleMobileToggle);
    }

    // Mobile toggle handler
    function handleMobileToggle(e) {
        e.preventDefault();
        
        if (window.innerWidth <= 991.98) {
            const isOpen = sidebar.classList.contains('show');
            
            if (isOpen) {
                closeSidebar();
            } else {
                openSidebar();
            }
        }
    }

    // Open sidebar
    function openSidebar() {
        sidebar.classList.add('show');
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('show');
        }
        document.body.classList.add('sidebar-open');
        // Scroll kilidi
        lockScroll();
    }

    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('show');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('show');
        }
        document.body.classList.remove('sidebar-open');
        // Kilidi kaldır
        unlockScroll();
    }

    // Scroll kilidi (mobil UX)
    function lockScroll(){
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
    }
    
    function unlockScroll(){
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
    }

    // Window resize handler
    window.addEventListener('resize', () => {
        if (window.innerWidth < 992) {
            // Mobilde sidebar'ı kapat
            if (sidebar.classList.contains('show')) {
                closeSidebar();
            }
        }
    });

    // Outside click handler
    document.addEventListener('click', (event) => {
        const isMobile = window.innerWidth <= 991.98;
        
        if (isMobile) {
            // Mobile: Close sidebar when clicking outside
            if (!event.target.closest('.sidebar') && 
                !event.target.closest('.js-sidebar-toggle') && 
                sidebar.classList.contains('show')) {
                closeSidebar();
            }
        }
    });

    // Keyboard navigation handler
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (window.innerWidth <= 991.98) {
                // Mobile: Close sidebar
                if (sidebar.classList.contains('show')) {
                    closeSidebar();
                }
            } else {
                // Desktop: Close all open dropdowns
                document.querySelectorAll('.collapse.show').forEach(collapse => {
                    collapse.classList.remove('show');
                    const toggle = document.querySelector(`[data-bs-target="#${collapse.id}"]`);
                    if (toggle) {
                        toggle.setAttribute('aria-expanded', 'false');
                        toggle.classList.remove('active');
                        const chevron = toggle.querySelector('.chevron');
                        if (chevron) {
                            chevron.style.transform = 'rotate(0deg)';
                        }
                    }
                });
            }
        }
    });

    // Highlight active menu item
    function highlightActiveMenuItem() {
        const currentPath = window.location.pathname;
        const menuLinks = document.querySelectorAll('.sidebar-menu .nav-link');
        
        menuLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
                
                // Expand parent collapse if exists
                const parentCollapse = link.closest('.collapse');
                if (parentCollapse) {
                    parentCollapse.classList.add('show');
                    
                    // Update parent toggle
                    const parentToggle = document.querySelector(`[data-bs-target="#${parentCollapse.id}"]`);
                    if (parentToggle) {
                        parentToggle.setAttribute('aria-expanded', 'true');
                        parentToggle.classList.add('active');
                        
                        const chevron = parentToggle.querySelector('.chevron');
                        if (chevron) {
                            chevron.style.transform = 'rotate(180deg)';
                        }
                    }
                }
            }
        });
    }

    // Initialize
    highlightActiveMenuItem();

    // Sidebar utility functions
    window.SidebarUtils = {
        open: function() {
            if (window.innerWidth <= 991.98) {
                openSidebar();
            }
        },
        
        close: function() {
            if (window.innerWidth <= 991.98) {
                closeSidebar();
            }
        },
        
        isOpen: function() {
            return sidebar.classList.contains('show');
        }
    };
})();