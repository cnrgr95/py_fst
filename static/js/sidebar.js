// Sidebar JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Sidebar toggle elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarCollapseToggle = document.getElementById('sidebarCollapseToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    // Sidebar toggle functionality
    function toggleSidebar() {
        if (window.innerWidth <= 991.98) {
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        }
    }
    
    // Mobile sidebar toggle
    if (sidebarToggleMobile) {
        sidebarToggleMobile.addEventListener('click', function() {
            toggleSidebar();
        });
    }
    
    // Close sidebar button
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            toggleSidebar();
        });
    }
    
    // Sidebar collapse toggle (desktop)
    if (sidebarCollapseToggle) {
        sidebarCollapseToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Save state to localStorage
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
    }
    
    // Restore sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true' && window.innerWidth > 991.98) {
        sidebar.classList.add('collapsed');
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            toggleSidebar();
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
            sidebarOverlay.classList.remove('show');
            
            // Restore collapsed state on desktop
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
            } else {
                sidebar.classList.remove('collapsed');
            }
        } else {
            // Remove collapsed state on mobile
            sidebar.classList.remove('collapsed');
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
                
                // Close all other collapses in the same level
                const allCollapses = document.querySelectorAll('.collapse');
                allCollapses.forEach(collapse => {
                    if (collapse !== target) {
                        collapse.classList.remove('show');
                    }
                });
                
                // Toggle current collapse
                if (isExpanded) {
                    target.classList.remove('show');
                } else {
                    target.classList.add('show');
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
