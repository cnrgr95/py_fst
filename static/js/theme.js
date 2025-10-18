// Theme JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Initialize theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // Theme toggle functionality
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = body.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }
    
    // Set theme function
    function setTheme(theme) {
        body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle button icon
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
                themeToggle.setAttribute('title', 'Switch to Light Mode');
            } else {
                icon.className = 'fas fa-moon';
                themeToggle.setAttribute('title', 'Switch to Dark Mode');
            }
        }
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#2d3748' : '#ffffff');
        }
        
        // Trigger custom event for theme change
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: theme }
        }));
    }
    
    // Listen for system theme changes
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Only apply system theme if no theme is saved
        if (!localStorage.getItem('theme')) {
            setTheme(mediaQuery.matches ? 'dark' : 'light');
        }
        
        // Listen for system theme changes
        mediaQuery.addEventListener('change', function(e) {
            // Only update if no theme preference is saved
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
});

// Theme utility functions
const ThemeUtils = {
    // Get current theme
    getCurrentTheme: function() {
        return document.body.getAttribute('data-theme') || 'light';
    },
    
    // Set theme programmatically
    setTheme: function(theme) {
        if (theme === 'light' || theme === 'dark') {
            const body = document.body;
            body.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Update theme toggle button
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                const icon = themeToggle.querySelector('i');
                if (theme === 'dark') {
                    icon.className = 'fas fa-sun';
                    themeToggle.setAttribute('title', 'Switch to Light Mode');
                } else {
                    icon.className = 'fas fa-moon';
                    themeToggle.setAttribute('title', 'Switch to Light Mode');
                }
            }
            
            // Trigger custom event
            document.dispatchEvent(new CustomEvent('themeChanged', {
                detail: { theme: theme }
            }));
        }
    },
    
    // Toggle theme
    toggleTheme: function() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },
    
    // Check if dark mode is enabled
    isDarkMode: function() {
        return this.getCurrentTheme() === 'dark';
    },
    
    // Check if light mode is enabled
    isLightMode: function() {
        return this.getCurrentTheme() === 'light';
    },
    
    // Reset to system theme
    resetToSystemTheme: function() {
        localStorage.removeItem('theme');
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.setTheme(mediaQuery.matches ? 'dark' : 'light');
        } else {
            this.setTheme('light');
        }
    }
};

// Make ThemeUtils globally available
window.ThemeUtils = ThemeUtils;

// Listen for theme changes and update components accordingly
document.addEventListener('themeChanged', function(event) {
    const theme = event.detail.theme;
    
    // Update any components that need theme-specific styling
    console.log('Theme changed to:', theme);
    
    // Example: Update chart colors, image filters, etc.
    // You can add more theme-specific logic here
});
