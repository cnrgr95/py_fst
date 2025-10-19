// Login sayfası JavaScript dosyası

// Dil değiştirme fonksiyonu
function changeLanguage() {
    const languageSelect = document.getElementById('language_select');
    const selectedLang = languageSelect.value;
    
    // Sayfayı yenile ve yeni dil ile yönlendir
    window.location.href = `/change_language/${selectedLang}`;
}

document.addEventListener('DOMContentLoaded', function() {
    
    // Password toggle functionality
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
    
    // Form submission with loading state
    const loginForm = document.querySelector('.login-form');
    const submitButton = loginForm?.querySelector('button[type="submit"]');
    
    if (loginForm && submitButton) {
        loginForm.addEventListener('submit', function(event) {
            // Show loading state
            submitButton.classList.add('loading');
            submitButton.disabled = true;
            
            // Add loading text
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Logging in...';
            
            // Reset button state after 3 seconds (in case of no response)
            setTimeout(function() {
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }, 3000);
        });
    }
    
    // Language selector animation
    const languageButtons = document.querySelectorAll('.language-selector .btn');
    languageButtons.forEach(function(button) {
        button.addEventListener('click', function(event) {
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Show loading indicator
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-spinner fa-spin';
            }
        });
    });
    
    // Auto-focus on username field
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.focus();
    }
    
    // Enter key navigation
    usernameInput?.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            passwordInput?.focus();
        }
    });
    
    passwordInput?.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            loginForm?.requestSubmit();
        }
    });
    
    // Form validation
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            const username = usernameInput?.value.trim();
            const password = passwordInput?.value;
            
            // Clear previous error states
            clearErrors();
            
            let hasErrors = false;
            
            // Validate username
            if (!username) {
                showFieldError(usernameInput, 'Username is required');
                hasErrors = true;
            }
            
            // Validate password
            if (!password) {
                showFieldError(passwordInput, 'Password is required');
                hasErrors = true;
            }
            
            if (hasErrors) {
                event.preventDefault();
                return false;
            }
        });
    }
    
    // Demo credentials auto-fill
    const demoCredentials = document.querySelector('.demo-credentials');
    if (demoCredentials) {
        demoCredentials.addEventListener('click', function() {
            if (usernameInput && passwordInput) {
                usernameInput.value = 'admin';
                passwordInput.value = 'admin123';
                
                // Add visual feedback
                this.style.backgroundColor = '#e3f2fd';
                this.style.borderColor = '#2196f3';
                
                setTimeout(() => {
                    this.style.backgroundColor = '';
                    this.style.borderColor = '';
                }, 1000);
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Alt + L for language toggle
        if (event.altKey && event.key === 'l') {
            event.preventDefault();
            const languageDropdown = document.getElementById('languageDropdown');
            if (languageDropdown) {
                const dropdown = new bootstrap.Dropdown(languageDropdown);
                dropdown.toggle();
            }
        }
        
        // Escape to clear form
        if (event.key === 'Escape') {
            clearForm();
        }
    });
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(function(button) {
        button.addEventListener('click', function(event) {
            createRipple(event, this);
        });
    });
});

// Helper functions
function showFieldError(field, message) {
    if (!field) return;
    
    // Remove existing error
    clearFieldError(field);
    
    // Add error class
    field.classList.add('is-invalid');
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    // Insert after field
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearFieldError(field) {
    if (!field) return;
    
    field.classList.remove('is-invalid');
    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function clearErrors() {
    const invalidFields = document.querySelectorAll('.is-invalid');
    invalidFields.forEach(clearFieldError);
}

function clearForm() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    clearErrors();
    
    if (usernameInput) usernameInput.focus();
}

function createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add ripple CSS
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .btn {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(style);

// Language change function
function changeLanguage() {
    const languageSelect = document.getElementById('language_select');
    if (languageSelect) {
        const selectedLang = languageSelect.value;
        window.location.href = `/change_language/${selectedLang}`;
    }
}