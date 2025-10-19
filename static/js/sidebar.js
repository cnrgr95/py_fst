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
    
    // Dropdown behavior - only one dropdown open at a time
    const dropdownToggles = document.querySelectorAll('[data-bs-toggle="collapse"]');
    
    dropdownToggles.forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const target = document.querySelector(this.getAttribute('data-bs-target'));
            const isCurrentlyOpen = target.classList.contains('show');
            const isSidebarLocked = sidebar.classList.contains('locked');
            const isSidebarHovered = sidebar.matches(':hover');
            
            // Only allow dropdown toggle if sidebar is hovered or locked
            if (!isSidebarHovered && !isSidebarLocked) {
                return;
            }
            
            // Close all other dropdowns first
            dropdownToggles.forEach(function(otherToggle) {
                if (otherToggle !== toggle) {
                    const otherTarget = document.querySelector(otherToggle.getAttribute('data-bs-target'));
                    if (otherTarget && otherTarget.classList.contains('show')) {
                        otherTarget.classList.remove('show');
                        otherToggle.setAttribute('aria-expanded', 'false');
                        otherToggle.classList.remove('active');
                        
                        // Rotate chevron back
                        const chevron = otherToggle.querySelector('.fa-chevron-down');
                        if (chevron) {
                            chevron.style.transform = 'rotate(0deg)';
                        }
                    }
                }
            });
            
            // Toggle current dropdown
            if (target) {
                const chevron = this.querySelector('.fa-chevron-down');
                
                if (isCurrentlyOpen) {
                    // Close current dropdown
                    target.classList.remove('show');
                    this.setAttribute('aria-expanded', 'false');
                    this.classList.remove('active');
                    if (chevron) {
                        chevron.style.transform = 'rotate(0deg)';
                    }
                } else {
                    // Open current dropdown
                    target.classList.add('show');
                    this.setAttribute('aria-expanded', 'true');
                    this.classList.add('active');
                    if (chevron) {
                        chevron.style.transform = 'rotate(180deg)';
                    }
                }
            }
        });
    });
    
    // Sidebar lock toggle functionality
    const sidebarLockToggle = document.getElementById('sidebarLockToggle');
    
    if (sidebarLockToggle) {
        sidebarLockToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            sidebar.classList.toggle('locked');
            this.classList.toggle('locked');
            
            // Save state to localStorage
            const isLocked = sidebar.classList.contains('locked');
            localStorage.setItem('sidebarLocked', isLocked);
            
            // Update aria-pressed attribute
            this.setAttribute('aria-pressed', isLocked.toString());
            
            // Update icon visibility
            const unlockIcon = this.querySelector('.fa-unlock-alt');
            const lockIcon = this.querySelector('.fa-lock');
            
            if (isLocked) {
                if (unlockIcon) unlockIcon.style.display = 'none';
                if (lockIcon) lockIcon.style.display = 'inline-block';
                this.title = 'Unpin Sidebar';
            } else {
                if (unlockIcon) unlockIcon.style.display = 'inline-block';
                if (lockIcon) lockIcon.style.display = 'none';
                this.title = 'Pin Sidebar Open';
            }
            
            // Handle dropdown transitions during lock toggle
            handleDropdownTransitions(isLocked);
        });
    }
    
    // Dropdown transition handler function
    function handleDropdownTransitions(isLocked) {
        const collapseTriggers = document.querySelectorAll('[data-bs-toggle="collapse"]');
        
        collapseTriggers.forEach(trigger => {
            const targetId = trigger.getAttribute('data-bs-target');
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
            
            // Update icon visibility for restored state
            const unlockIcon = sidebarLockToggle.querySelector('.fa-unlock-alt');
            const lockIcon = sidebarLockToggle.querySelector('.fa-lock');
            
            if (unlockIcon) unlockIcon.style.display = 'none';
            if (lockIcon) lockIcon.style.display = 'inline-block';
            sidebarLockToggle.title = 'Unpin Sidebar';
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
    const collapseTriggers = document.querySelectorAll('[data-bs-toggle="collapse"]');
    
    collapseTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.getAttribute('data-bs-target');
            const target = document.querySelector(targetId);
            
            if (target) {
                const isExpanded = target.classList.contains('show');
                const isSidebarLocked = sidebar.classList.contains('locked');
                const isSidebarHovered = sidebar.matches(':hover');
                
                // Close all other dropdowns first (except when sidebar is locked)
                if (!isSidebarLocked) {
                    collapseTriggers.forEach(otherTrigger => {
                        if (otherTrigger !== trigger) {
                            const otherTargetId = otherTrigger.getAttribute('data-bs-target');
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
            if (!e.target.closest('[data-bs-toggle="collapse"]') && 
                !e.target.closest('.collapse') && 
                !e.target.closest('.sidebar')) {
                setTimeout(() => {
                    collapseTriggers.forEach(trigger => {
                        const targetId = trigger.getAttribute('data-bs-target');
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
                    const targetId = trigger.getAttribute('data-bs-target');
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
            const collapseTriggers = document.querySelectorAll('[data-bs-toggle="collapse"]');
            collapseTriggers.forEach(trigger => {
                const targetId = trigger.getAttribute('data-bs-target');
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
    
    // Clean dropdown behavior when sidebar transitions
    const sidebar = document.getElementById('sidebar');
    
    // Close all dropdowns cleanly when sidebar is not hovered or locked
    function closeAllDropdownsCleanly() {
        dropdownToggles.forEach(function(toggle) {
            const target = document.querySelector(toggle.getAttribute('data-bs-target'));
            if (target && target.classList.contains('show')) {
                target.classList.remove('show');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.classList.remove('active');
                
                // Reset chevron
                const chevron = toggle.querySelector('.fa-chevron-down');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            }
        });
    }
    
    // Handle sidebar hover events for clean transitions
    if (sidebar) {
        let hoverTimeout;
        
        // Close dropdowns immediately when mouse leaves sidebar
        sidebar.addEventListener('mouseleave', function() {
            if (!sidebar.classList.contains('locked')) {
                closeAllDropdownsCleanly();
            }
        });
        
        // Handle sidebar width changes for clean transitions
        function handleSidebarTransition() {
            if (!sidebar.classList.contains('locked')) {
                closeAllDropdownsCleanly();
            }
        }
        
        // Listen for sidebar width changes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
                    handleSidebarTransition();
                }
            });
        });
        
        observer.observe(sidebar, {
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }
    
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
