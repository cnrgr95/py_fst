// User Management JavaScript Functions

// Global variables
let currentUserId = null;
let usersData = [];

// Initialize user management page
document.addEventListener('DOMContentLoaded', function() {
    initializeUserPage();
    bindEvents();
});

// Initialize page components
function initializeUserPage() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize DataTable if available
    if ($.fn.DataTable) {
        $('#usersTable').DataTable({
            "pageLength": 25,
            "order": [[ 0, "desc" ]],
            "columnDefs": [
                { "orderable": false, "targets": 7 } // Disable ordering on Actions column
            ],
            "language": {
                "search": translations.search || "Search:",
                "lengthMenu": translations.show_entries || "Show _MENU_ entries",
                "info": translations.showing_entries || "Showing _START_ to _END_ of _TOTAL_ entries",
                "infoEmpty": translations.no_entries || "No entries found",
                "infoFiltered": translations.filtered_entries || "(filtered from _MAX_ total entries)",
                "paginate": {
                    "first": translations.first || "First",
                    "last": translations.last || "Last",
                    "next": translations.next || "Next",
                    "previous": translations.previous || "Previous"
                }
            }
        });
    }
}

// Bind event listeners
function bindEvents() {
    // Form submission handlers
    const userForm = document.getElementById('userForm');
    const editUserForm = document.getElementById('editUserForm');
    
    if (userForm) {
        userForm.addEventListener('submit', handleAddUser);
    }
    
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUser);
    }

    // Modal events
    const userModal = document.getElementById('userModal');
    const editUserModal = document.getElementById('editUserModal');
    
    if (userModal) {
        userModal.addEventListener('hidden.bs.modal', resetUserForm);
    }
    
    if (editUserModal) {
        editUserModal.addEventListener('hidden.bs.modal', resetEditUserForm);
    }
}

// User management functions
function editUser(userId) {
    console.log('Edit user:', userId);
    currentUserId = userId;
    
    // Show edit modal
    const editModal = new bootstrap.Modal(document.getElementById('editUserModal'));
    editModal.show();
    
    // Load user data
    loadUserData(userId);
}

function deleteUser(userId) {
    const confirmMessage = translations.confirm_delete || 'Are you sure you want to delete this user?';
    
    if (confirm(confirmMessage)) {
        // TODO: Implement delete user functionality
        console.log('Delete user:', userId);
        
        // For now, just show a message
        const message = translations.delete_not_implemented || 'Delete functionality will be implemented soon.';
        showNotification(message, 'info');
    }
}

function loadUserData(userId) {
    // TODO: Load user data from server
    // For now, just set the user ID
    document.getElementById('editUserId').value = userId;
    
    // Example of loading user data (replace with actual API call)
    const user = usersData.find(u => u.id == userId);
    if (user) {
        document.getElementById('editUsername').value = user.username || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editFullName').value = user.full_name || '';
        document.getElementById('editIsActive').checked = user.is_active || false;
    }
}

// Form handlers
function handleAddUser(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Validate form
    if (!validateUserForm(formData)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    setLoadingState(submitBtn, true);
    
    // TODO: Implement add user functionality
    console.log('Add user form submitted');
    
    // Simulate API call
    setTimeout(() => {
        setLoadingState(submitBtn, false);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
        modal.hide();
        
        // Show success message
        const message = translations.user_added || 'User added successfully!';
        showNotification(message, 'success');
        
        // Reload page or update table
        setTimeout(() => {
            location.reload();
        }, 1000);
    }, 1000);
}

function handleEditUser(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Validate form
    if (!validateUserForm(formData)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    setLoadingState(submitBtn, true);
    
    // TODO: Implement edit user functionality
    console.log('Edit user form submitted');
    
    // Simulate API call
    setTimeout(() => {
        setLoadingState(submitBtn, false);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        modal.hide();
        
        // Show success message
        const message = translations.user_updated || 'User updated successfully!';
        showNotification(message, 'success');
        
        // Reload page or update table
        setTimeout(() => {
            location.reload();
        }, 1000);
    }, 1000);
}

// Form validation
function validateUserForm(formData) {
    let isValid = true;
    const errors = [];
    
    // Validate username
    const username = formData.get('username');
    if (!username || username.trim().length < 3) {
        errors.push(translations.username_required || 'Username must be at least 3 characters long');
        isValid = false;
    }
    
    // Validate email
    const email = formData.get('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push(translations.email_invalid || 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate full name
    const fullName = formData.get('full_name');
    if (!fullName || fullName.trim().length < 2) {
        errors.push(translations.fullname_required || 'Full name is required');
        isValid = false;
    }
    
    // Validate password (for new users or if password is provided)
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    
    if (password || confirmPassword) {
        if (password.length < 6) {
            errors.push(translations.password_min_length || 'Password must be at least 6 characters long');
            isValid = false;
        }
        
        if (password !== confirmPassword) {
            errors.push(translations.password_mismatch || 'Passwords do not match');
            isValid = false;
        }
    }
    
    // Show errors
    if (!isValid) {
        showValidationErrors(errors);
    }
    
    return isValid;
}

// Utility functions
function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>' + (translations.loading || 'Loading...');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = '<i class="fas fa-save me-2"></i>' + (translations.save || 'Save');
    }
}

function resetUserForm() {
    const form = document.getElementById('userForm');
    if (form) {
        form.reset();
        clearValidationErrors();
    }
}

function resetEditUserForm() {
    const form = document.getElementById('editUserForm');
    if (form) {
        form.reset();
        clearValidationErrors();
        currentUserId = null;
    }
}

function showValidationErrors(errors) {
    // Clear previous errors
    clearValidationErrors();
    
    // Show errors in a notification
    errors.forEach(error => {
        showNotification(error, 'error');
    });
}

function clearValidationErrors() {
    // Remove validation classes
    const inputs = document.querySelectorAll('.is-invalid');
    inputs.forEach(input => {
        input.classList.remove('is-invalid');
    });
    
    // Remove error messages
    const errorMessages = document.querySelectorAll('.invalid-feedback');
    errorMessages.forEach(message => {
        message.remove();
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Export functions for global access
window.editUser = editUser;
window.deleteUser = deleteUser;
