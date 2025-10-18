// Sidebar JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Sidebar toggle elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
    const sidebarToggleClose = document.getElementById('sidebarToggleClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    // Sidebar toggle functionality
    function toggleSidebar() {
        if (window.innerWidth <= 991.98) {
            const isOpen = sidebar.classList.contains('show');
            if (isOpen) {
                sidebar.classList.remove('show');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('show');
                }
                document.body.classList.remove('sidebar-open');
            } else {
                sidebar.classList.add('show');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.add('show');
                }
                document.body.classList.add('sidebar-open');
            }
        }
    }
    
    
    // Mobile sidebar toggle
    if (sidebarToggleMobile) {
        sidebarToggleMobile.addEventListener('click', function() {
            toggleSidebar();
        });
    }
    
    // Close sidebar button
    if (sidebarToggleClose) {
        sidebarToggleClose.addEventListener('click', function() {
            toggleSidebar();
        });
    }
    
    // Sidebar lock toggle functionality
    const sidebarLockToggle = document.getElementById('sidebarLockToggle');
    
    if (sidebarLockToggle) {
        sidebarLockToggle.addEventListener('click', function() {
            sidebar.classList.toggle('locked');
            this.classList.toggle('locked');
            
            // Save state to localStorage
            const isLocked = sidebar.classList.contains('locked');
            localStorage.setItem('sidebarLocked', isLocked);
        });
    }
    
    // Restore sidebar lock state from localStorage
    const savedLockState = localStorage.getItem('sidebarLocked');
    if (savedLockState === 'true') {
        sidebar.classList.add('locked');
        if (sidebarLockToggle) {
            sidebarLockToggle.classList.add('locked');
        }
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
            document.body.classList.remove('sidebar-open');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 991.98) {
            if (!sidebar.contains(event.target) && 
                !sidebarToggleMobile.contains(event.target) && 
                sidebar.classList.contains('show')) {
                toggleSidebar();
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 991.98) {
            sidebar.classList.remove('show');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('show');
            }
            document.body.classList.remove('sidebar-open');
        }
    });
    
    // Active menu item highlighting
    const currentPath = window.location.pathname;
    const menuLinks = document.querySelectorAll('.sidebar-menu .nav-link');
    
    menuLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            
            // Expand parent collapse if exists
            const parentCollapse = link.closest('.collapse');
            if (parentCollapse) {
                parentCollapse.classList.add('show');
            }
        }
    });
    
    // Collapse functionality
    const collapseTriggers = document.querySelectorAll('[data-bs-toggle="collapse"]');
    
    collapseTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-bs-target');
            const target = document.querySelector(targetId);
            
            if (target) {
                const isExpanded = target.classList.contains('show');
                
                // Toggle current collapse
                if (isExpanded) {
                    target.classList.remove('show');
                    this.setAttribute('aria-expanded', 'false');
                } else {
                    target.classList.add('show');
                    this.setAttribute('aria-expanded', 'true');
                }
            }
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(event) {
        // ESC key closes sidebar on mobile
        if (event.key === 'Escape' && window.innerWidth <= 991.98) {
            if (sidebar.classList.contains('show')) {
                toggleSidebar();
            }
        }
    });
    
    // Smooth scroll for sidebar
    sidebar.addEventListener('wheel', function(event) {
        event.preventDefault();
        sidebar.scrollTop += event.deltaY;
    }, { passive: false });
    
    // Initialize tooltips for sidebar icons
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Sidebar utility functions
const SidebarUtils = {
    // Toggle sidebar programmatically
    toggle: function() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (window.innerWidth <= 991.98) {
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        }
    },
    
    // Close sidebar
    close: function() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (window.innerWidth <= 991.98) {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        }
    },
    
    // Open sidebar
    open: function() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (window.innerWidth <= 991.98) {
            sidebar.classList.add('show');
            sidebarOverlay.classList.add('show');
        }
    },
    
    // Check if sidebar is open
    isOpen: function() {
        const sidebar = document.getElementById('sidebar');
        return sidebar.classList.contains('show');
    }
};

// Make SidebarUtils globally available
window.SidebarUtils = SidebarUtils;
