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
            
            // Update aria-pressed attribute
            this.setAttribute('aria-pressed', isLocked.toString());
            
            // Handle dropdown transitions during lock toggle
            handleDropdownTransitions(isLocked);
        });
    }
    
    // Dropdown transition handler function
    function handleDropdownTransitions(isLocked) {
        const collapseTriggers = document.querySelectorAll('[data-toggle="collapse"]');
        
        collapseTriggers.forEach(trigger => {
            const targetId = trigger.getAttribute('data-target');
            const target = document.querySelector(targetId);
            
            if (target) {
                const isExpanded = target.classList.contains('show');
                
                if (isLocked && isExpanded) {
                    // When locking, ensure dropdowns stay open and visible
                    target.style.transition = 'all 0.3s ease';
                } else if (!isLocked && isExpanded) {
                    // When unlocking, prepare for absolute positioning
                    target.style.transition = 'all 0.3s ease';
                }
            }
        });
    }
    
    // Restore sidebar lock state from localStorage
    const savedLockState = localStorage.getItem('sidebarLocked');
    if (savedLockState === 'true') {
        sidebar.classList.add('locked');
        if (sidebarLockToggle) {
            sidebarLockToggle.classList.add('locked');
            sidebarLockToggle.setAttribute('aria-pressed', 'true');
        }
        // Handle dropdown transitions on page load
        handleDropdownTransitions(true);
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
        if (window.innerWidth <= 991.98 && sidebar.classList.contains('show')) {
            if (!sidebar.contains(event.target) && 
                sidebarToggleMobile && !sidebarToggleMobile.contains(event.target)) {
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
    
    // Enhanced dropdown toggle functionality
    const collapseTriggers = document.querySelectorAll('[data-toggle="collapse"]');
    
    collapseTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.getAttribute('data-target');
            const target = document.querySelector(targetId);
            
            if (target) {
                const isExpanded = target.classList.contains('show');
                const isSidebarLocked = sidebar.classList.contains('locked');
                const isSidebarHovered = sidebar.matches(':hover');
                
                // Close all other dropdowns first (except when sidebar is locked)
                if (!isSidebarLocked) {
                    collapseTriggers.forEach(otherTrigger => {
                        if (otherTrigger !== trigger) {
                            const otherTargetId = otherTrigger.getAttribute('data-target');
                            const otherTarget = document.querySelector(otherTargetId);
                            if (otherTarget && otherTarget.classList.contains('show')) {
                                otherTarget.classList.remove('show');
                                otherTrigger.setAttribute('aria-expanded', 'false');
                                // Remove rotation from chevron
                                const chevron = otherTrigger.querySelector('.fa-chevron-down');
                                if (chevron) {
                                    chevron.style.transform = 'rotate(0deg)';
                                }
                            }
                        }
                    });
                }
                
                // Toggle current dropdown
                if (isExpanded) {
                    target.classList.remove('show');
                    this.setAttribute('aria-expanded', 'false');
                    // Reset chevron rotation
                    const chevron = this.querySelector('.fa-chevron-down');
                    if (chevron) {
                        chevron.style.transform = 'rotate(0deg)';
                    }
                } else {
                    target.classList.add('show');
                    this.setAttribute('aria-expanded', 'true');
                    // Rotate chevron
                    const chevron = this.querySelector('.fa-chevron-down');
                    if (chevron) {
                        chevron.style.transform = 'rotate(180deg)';
                    }
                }
            }
        });
    });
    
    // Enhanced outside click handler for dropdowns and mobile sidebar
    document.addEventListener('click', function(e) {
        const isMobile = window.innerWidth <= 991.98;
        const isSidebarLocked = sidebar.classList.contains('locked');
        
        // Mobile: Close sidebar when clicking outside
        if (isMobile) {
            if (!e.target.closest('.sidebar') && 
                !e.target.closest('#sidebarToggleMobile') && 
                sidebar.classList.contains('show')) {
                toggleSidebar();
            }
        } 
        // Desktop: Close dropdowns when clicking outside (except when locked)
        else if (!isSidebarLocked) {
            if (!e.target.closest('[data-toggle="collapse"]') && 
                !e.target.closest('.collapse') && 
                !e.target.closest('.sidebar')) {
                setTimeout(() => {
                    collapseTriggers.forEach(trigger => {
                        const targetId = trigger.getAttribute('data-target');
                        const target = document.querySelector(targetId);
                        if (target && target.classList.contains('show')) {
                            target.classList.remove('show');
                            trigger.setAttribute('aria-expanded', 'false');
                            // Reset chevron rotation
                            const chevron = trigger.querySelector('.fa-chevron-down');
                            if (chevron) {
                                chevron.style.transform = 'rotate(0deg)';
                            }
                        }
                    });
                }, 150); // Increased delay for better UX
            }
        }
    });
    
    // Enhanced keyboard navigation
    document.addEventListener('keydown', function(event) {
        // ESC key closes sidebar on mobile or dropdowns on desktop
        if (event.key === 'Escape') {
            if (window.innerWidth <= 991.98) {
                // Mobile: Close sidebar
                if (sidebar.classList.contains('show')) {
                    toggleSidebar();
                }
            } else {
                // Desktop: Close all open dropdowns
                collapseTriggers.forEach(trigger => {
                    const targetId = trigger.getAttribute('data-target');
                    const target = document.querySelector(targetId);
                    if (target && target.classList.contains('show')) {
                        target.classList.remove('show');
                        trigger.setAttribute('aria-expanded', 'false');
                        // Reset chevron rotation
                        const chevron = trigger.querySelector('.fa-chevron-down');
                        if (chevron) {
                            chevron.style.transform = 'rotate(0deg)';
                        }
                    }
                });
            }
        }
    });
    
    // Handle dropdown transitions during hover
    sidebar.addEventListener('mouseenter', function() {
        if (!sidebar.classList.contains('locked')) {
            handleDropdownTransitions(false);
        }
    });
    
    sidebar.addEventListener('mouseleave', function() {
        if (!sidebar.classList.contains('locked')) {
            // Close any open dropdowns when leaving sidebar (unless locked)
            const collapseTriggers = document.querySelectorAll('[data-toggle="collapse"]');
            collapseTriggers.forEach(trigger => {
                const targetId = trigger.getAttribute('data-target');
                const target = document.querySelector(targetId);
                if (target && target.classList.contains('show')) {
                    target.classList.remove('show');
                    trigger.setAttribute('aria-expanded', 'false');
                    // Reset chevron rotation
                    const chevron = trigger.querySelector('.fa-chevron-down');
                    if (chevron) {
                        chevron.style.transform = 'rotate(0deg)';
                    }
                }
            });
        }
    });
    
    // Native scroll behavior - wheel override removed
    
    // Initialize tooltips for sidebar icons with Bootstrap protection
    if (window.bootstrap && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});

// Sidebar utility functions
const SidebarUtils = {
    toggle: function() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (window.innerWidth <= 991.98) {
            sidebar.classList.toggle('show');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('show');
            }
        }
    },
    
    close: function() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (window.innerWidth <= 991.98) {
            sidebar.classList.remove('show');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('show');
            }
        }
    },
    
    isOpen: function() {
        const sidebar = document.getElementById('sidebar');
        return sidebar.classList.contains('show');
    }
};

window.SidebarUtils = SidebarUtils;
