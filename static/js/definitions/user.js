// User Management JavaScript Functions

// Global variables
let currentUserId = null;
let usersData = [];

// Initialize user management page
document.addEventListener('DOMContentLoaded', function() {
    // Get users data from window object
    if (window.usersData) {
        usersData = window.usersData;
        console.log('Users data loaded:', usersData);
    }
    
    initializeUserPage();
    bindEvents();
    
    // Check for permissions hash in URL
    checkPermissionsHash();
});

function checkPermissionsHash() {
    const hash = window.location.hash;
    
    if (hash && hash.startsWith('#permissions-')) {
        const userId = hash.replace('#permissions-', '');
        console.log('Opening permissions popup for user:', userId);
        
        // Clear the hash
        window.history.replaceState(null, null, window.location.pathname);
        
        // Open permissions popup
        setTimeout(() => {
            managePermissions(userId);
        }, 500); // Small delay to ensure page is fully loaded
    }
}

// Initialize page components
function initializeUserPage() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize DataTable if available
    if (typeof DataTable !== 'undefined') {
        new DataTable('#usersTable', {
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

function managePermissions(userId) {
    console.log('Manage permissions for user:', userId);
    
    // Find user in the data
    const user = usersData.find(u => u.id == userId);
    if (!user) {
        console.error('User not found with ID:', userId);
        showNotification('User not found!', 'error');
        return;
    }
    
    // Show permissions modal
    const permissionsModal = new bootstrap.Modal(document.getElementById('userPermissionsModal'));
    
    // Set user ID in modal dataset for easy access
    document.getElementById('userPermissionsModal').dataset.userId = userId;
    
    permissionsModal.show();
    
    // Load user data into modal
    loadUserPermissionsData(userId, user);
}

function loadUserPermissionsData(userId, user) {
    // Set user ID in editUserId input for compatibility
    const editUserIdInput = document.getElementById('editUserId');
    if (editUserIdInput) {
        editUserIdInput.value = userId;
    }
    
    // Set user info in modal
    const fullName = (user.first_name && user.last_name) ? 
        `${user.first_name} ${user.last_name}` : 
        (user.full_name || user.username);
    
    document.getElementById('permissionsUserName').textContent = fullName;
    document.getElementById('permissionsUserUsername').textContent = user.username;
    document.getElementById('permissionsUserEmail').textContent = user.email;
    
    // Set user status
    const statusElement = document.getElementById('permissionsUserStatus');
    if (user.is_active) {
        statusElement.innerHTML = '<i class="fas fa-check-circle text-success"></i> ' + (translations.active || 'Active');
    } else {
        statusElement.innerHTML = '<i class="fas fa-times-circle text-danger"></i> ' + (translations.inactive || 'Inactive');
    }
    
    // Load permissions data via API
    loadPermissionsFromAPI(userId);
}

function loadPermissionsFromAPI(userId) {
    // Show loading state
    const container = document.getElementById('permissionsContainer');
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">${translations.loading || 'Loading...'}</span>
            </div>
            <p class="mt-3 text-muted">${translations.loading_permissions || 'Loading permissions...'}</p>
        </div>
    `;
    
    // Make API call to get user permissions
    fetch(`/api/user_permissions/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderPermissionsData(data.data);
            } else {
                throw new Error(data.message || 'Failed to load permissions');
            }
        })
        .catch(error => {
            console.error('Error loading permissions:', error);
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h5 class="text-danger">${translations.error_loading_permissions || 'Error loading permissions'}</h5>
                    <p class="text-muted">${error.message}</p>
                </div>
            `;
        });
}

function renderPermissionsData(data) {
    const { user_permissions, permissions_by_module } = data;
    
    // Render statistics
    renderPermissionStats(permissions_by_module, user_permissions);
    
    // Render permissions
    renderPermissionsList(permissions_by_module, user_permissions);
}

function renderPermissionStats(permissionsByModule, userPermissions) {
    const statsContainer = document.getElementById('permissionStats');
    let statsHTML = '';
    
    for (const [module, permissions] of Object.entries(permissionsByModule)) {
        const activeCount = permissions.filter(perm => 
            userPermissions.some(userPerm => userPerm.name === perm.name)
        ).length;
        
        statsHTML += `
            <div class="stat-item">
                <h6>${module.charAt(0).toUpperCase() + module.slice(1)}</h6>
                <div class="stat-number">${activeCount}/${permissions.length}</div>
                <div class="stat-label">Active</div>
            </div>
        `;
    }
    
    statsContainer.innerHTML = statsHTML;
}

function renderPermissionsList(permissionsByModule, userPermissions) {
    const container = document.getElementById('permissionsContainer');
    let permissionsHTML = '';
    
    if (Object.keys(permissionsByModule).length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">${translations.no_permissions_found || 'No permissions found'}</h5>
            </div>
        `;
        return;
    }
    
    for (const [module, permissions] of Object.entries(permissionsByModule)) {
        const activeCount = permissions.filter(perm => 
            userPermissions.some(userPerm => userPerm.name === perm.name)
        ).length;
        
        permissionsHTML += `
            <div class="permission-card">
                <div class="permission-header">
                    <div>
                        <i class="fas fa-folder me-2"></i>
                        ${module.charAt(0).toUpperCase() + module.slice(1)} ${translations.module || 'Module'}
                    </div>
                    <span class="permission-count">${activeCount}/${permissions.length}</span>
                </div>
                <div class="permission-body">
        `;
        
        permissions.forEach(permission => {
            const hasPermission = userPermissions.some(userPerm => userPerm.name === permission.name);
            
            permissionsHTML += `
                <div class="permission-item">
                    <div class="permission-info">
                        <div class="permission-name">${permission.description}</div>
                        <div class="permission-description">${permission.name}</div>
                    </div>
                    <div class="permission-status">
                        <div class="form-check form-switch">
                            <input class="form-check-input permission-toggle" 
                                   type="checkbox" 
                                   id="perm-${permission.name}" 
                                   ${hasPermission ? 'checked' : ''}
                                   data-permission-name="${permission.name}"
                                   data-permission-id="${permission.id || ''}">
                            <label class="form-check-label" for="perm-${permission.name}">
                                ${hasPermission ? 
                                    `<span class="badge bg-success">Active</span>` :
                                    `<span class="badge bg-secondary">Inactive</span>`
                                }
                            </label>
                        </div>
                    </div>
                </div>
            `;
        });
        
        permissionsHTML += `
                </div>
            </div>
        `;
    }
    
    container.innerHTML = permissionsHTML;
    
    // Bind toggle event listeners
    bindPermissionToggleEvents();
    
    // Bind save button event listener
    bindSaveButtonEvent();
}

function bindPermissionToggleEvents() {
    // Remove existing event listeners first
    const existingToggles = document.querySelectorAll('.permission-toggle');
    existingToggles.forEach(toggle => {
        // Clone the element to remove all event listeners
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
    });
    
    // Add new event listeners
    const toggleButtons = document.querySelectorAll('.permission-toggle');
    toggleButtons.forEach(toggle => {
        toggle.addEventListener('change', handlePermissionToggle);
    });
}

function bindSaveButtonEvent() {
    const saveBtn = document.getElementById('savePermissionsBtn');
    if (saveBtn) {
        // Remove existing event listener
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        // Add new event listener
        document.getElementById('savePermissionsBtn').addEventListener('click', handleSavePermissions);
    }
}

function handlePermissionToggle(event) {
    const toggle = event.target;
    const permissionName = toggle.dataset.permissionName;
    const permissionId = toggle.dataset.permissionId;
    const isChecked = toggle.checked;
    
    console.log('=== PERMISSION TOGGLE DEBUG ===');
    console.log('Permission Name:', permissionName);
    console.log('Permission ID:', permissionId);
    console.log('Is Checked:', isChecked);
    console.log('Toggle Element:', toggle);
    
    // Get current user ID from modal
    console.log('=== USER ID DEBUG ===');
    console.log('editUserId element:', document.getElementById('editUserId'));
    console.log('editUserId value:', document.getElementById('editUserId')?.value);
    console.log('window.location.hash:', window.location.hash);
    console.log('hash user ID:', window.location.hash.replace('#permissions-', ''));
    
    const userId = document.getElementById('editUserId')?.value || 
                   window.location.hash.replace('#permissions-', '') ||
                   document.querySelector('#userPermissionsModal')?.dataset?.userId;
    
    console.log('Final userId:', userId);
    
    if (!userId) {
        console.error('User ID not found');
        showNotification('User ID not found!', 'error');
        return;
    }
    
    // Show loading state
    const label = toggle.closest('.permission-item').querySelector('.form-check-label');
    const originalContent = label.innerHTML;
    
    // Preserve badge during loading - don't replace entire innerHTML
    const existingBadge = label.querySelector('.badge');
    if (existingBadge) {
        // Add loading spinner next to badge, don't replace badge
        existingBadge.style.opacity = '0.5';
        label.insertAdjacentHTML('beforeend', '<span class="spinner-border spinner-border-sm ms-2"></span>');
    } else {
        // No badge exists, show loading text
        label.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Loading...';
    }
    
    toggle.disabled = true;
    
    // Make API call
    const action = isChecked ? 'assign' : 'revoke';
    const url = `/api/user_permissions/${userId}/${action}`;
    
    console.log('Making API call:', url, 'Action:', action);
    
    // Get CSRF token
    const csrfToken = document.querySelector('meta[name=csrf-token]')?.getAttribute('content') || 
                      document.querySelector('input[name=csrf_token]')?.value;
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            permission_name: permissionName,
            permission_id: permissionId
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('=== API RESPONSE DEBUG ===');
        console.log('API Response:', data);
        console.log('Success:', data.success);
        console.log('Message:', data.message);
        
        if (data.success) {
            // Update UI
            console.log('=== UI UPDATE DEBUG ===');
            console.log('Label element:', label);
            console.log('Label innerHTML:', label.innerHTML);
            console.log('Badge element:', label.querySelector('.badge'));
            
            // Try multiple ways to find and update badge
            let badge = label.querySelector('.badge');
            
            if (!badge) {
                // Try to find badge in the entire permission item
                const permissionItem = toggle.closest('.permission-item');
                badge = permissionItem.querySelector('.badge');
                console.log('Badge found in permission item:', badge);
            }
            
            if (badge) {
                console.log('Badge found, updating...');
                if (isChecked) {
                    badge.className = 'badge bg-success';
                    badge.textContent = 'Active';
                } else {
                    badge.className = 'badge bg-secondary';
                    badge.textContent = 'Inactive';
                }
                console.log('Badge updated successfully');
            } else {
                console.warn('Badge element not found, updating label content directly');
                // Fallback: Update label content directly
                if (isChecked) {
                    label.innerHTML = `<span class="badge bg-success">Active</span>`;
                } else {
                    label.innerHTML = `<span class="badge bg-secondary">Inactive</span>`;
                }
                console.log('Label content updated directly');
            }
            
            // Update statistics manually
            updateStatsForModule(toggle);
            
            console.log('=== SUCCESS DEBUG ===');
            console.log('Permission updated successfully');
            console.log('Toggle state:', toggle.checked);
            console.log('IsChecked:', isChecked);
            
            showNotification(data.message || 'Permission updated successfully!', 'success');
        } else {
            throw new Error(data.message || 'Failed to update permission');
        }
    })
    .catch(error => {
        console.error('=== ERROR DEBUG ===');
        console.error('Error updating permission:', error);
        console.error('Toggle state before revert:', toggle.checked);
        
        // Revert toggle state
        toggle.checked = !isChecked;
        console.error('Toggle state after revert:', toggle.checked);
        
        showNotification(error.message || 'Failed to update permission!', 'error');
    })
    .finally(() => {
        // Restore UI state
        toggle.disabled = false;
        
        // Clean up loading state
        const spinner = label.querySelector('.spinner-border');
        if (spinner) {
            spinner.remove();
        }
        
        // Restore badge opacity
        const badge = label.querySelector('.badge');
        if (badge) {
            badge.style.opacity = '1';
        }
        
        // If no badge exists, restore original content
        if (!badge) {
            label.innerHTML = originalContent;
        }
    });
}

function handleSavePermissions() {
    const saveBtn = document.getElementById('savePermissionsBtn');
    const userId = document.getElementById('editUserId').value || 
                   window.location.hash.replace('#permissions-', '');
    
    if (!userId) {
        showNotification('User ID not found!', 'error');
        return;
    }
    
    // Show loading state
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
    saveBtn.disabled = true;
    
    // Collect all permission changes
    const toggles = document.querySelectorAll('.permission-toggle');
    const changes = [];
    
    toggles.forEach(toggle => {
        const permissionName = toggle.dataset.permissionName;
        const permissionId = toggle.dataset.permissionId;
        const isChecked = toggle.checked;
        
        changes.push({
            permission_name: permissionName,
            permission_id: permissionId,
            action: isChecked ? 'assign' : 'revoke'
        });
    });
    
    console.log('Saving permissions:', changes);
    
    // Get CSRF token
    const csrfToken = document.querySelector('meta[name=csrf-token]')?.getAttribute('content') || 
                      document.querySelector('input[name=csrf_token]')?.value;
    
    // Send batch request
    fetch(`/api/user_permissions/${userId}/batch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ changes: changes })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Batch save response:', data);
        if (data.success) {
            showNotification('Permissions saved successfully!', 'success');
            // Close modal after successful save
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('userPermissionsModal'));
                if (modal) modal.hide();
            }, 1500);
        } else {
            throw new Error(data.message || 'Failed to save permissions');
        }
    })
    .catch(error => {
        console.error('Error saving permissions:', error);
        showNotification(error.message || 'Failed to save permissions!', 'error');
    })
    .finally(() => {
        // Restore button state
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    });
}

function updateStatsForModule(toggle) {
    // Find the permission card container
    const permissionCard = toggle.closest('.permission-card');
    if (!permissionCard) return;
    
    // Count active permissions in this module
    const permissionItems = permissionCard.querySelectorAll('.permission-item');
    let activeCount = 0;
    
    permissionItems.forEach(item => {
        const toggle = item.querySelector('.permission-toggle');
        if (toggle && toggle.checked) {
            activeCount++;
        }
    });
    
    // Update the count display
    const countElement = permissionCard.querySelector('.permission-count');
    if (countElement) {
        const totalCount = permissionItems.length;
        countElement.textContent = `${activeCount}/${totalCount}`;
    }
}

function updatePermissionStats() {
    // Update only the statistics without re-rendering all permissions
    const userId = document.getElementById('editUserId').value || 
                   window.location.hash.replace('#permissions-', '');
    
    if (userId) {
        // Re-fetch only the user permissions data for stats
        fetch(`/api/user_permissions/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update only the statistics
                    renderPermissionStats(data.permissions_by_module, data.user_permissions);
                }
            })
            .catch(error => {
                console.error('Error updating permission stats:', error);
            });
    }
}

function loadUserData(userId) {
    console.log('Loading user data for ID:', userId);
    console.log('Available users data:', usersData);
    
    // Set the user ID
    document.getElementById('editUserId').value = userId;
    
    // Find user in the data
    const user = usersData.find(u => u.id == userId);
    console.log('Found user:', user);
    
    if (user) {
        document.getElementById('editUsername').value = user.username || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editFirstName').value = user.first_name || '';
        document.getElementById('editLastName').value = user.last_name || '';
        document.getElementById('editCountry').value = user.country || '';
        document.getElementById('editRegion').value = user.region || '';
        document.getElementById('editDepartment').value = user.department || '';
        document.getElementById('editPosition').value = user.position || '';
        document.getElementById('editIsActive').checked = user.is_active || false;
        
        // Clear password fields
        document.getElementById('editPassword').value = '';
        document.getElementById('editConfirmPassword').value = '';
        
        console.log('User data loaded successfully');
    } else {
        console.error('User not found with ID:', userId);
        // Clear all fields if user not found
        document.getElementById('editUsername').value = '';
        document.getElementById('editEmail').value = '';
        document.getElementById('editFullName').value = '';
        document.getElementById('editIsActive').checked = false;
        document.getElementById('editPassword').value = '';
        document.getElementById('editConfirmPassword').value = '';
    }
}

// Form handlers
function handleAddUser(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Validate form
    if (!validateUserForm(formData, form.id)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    setLoadingState(submitBtn, true);
    
    // Submit form normally (let browser handle the POST request)
    form.submit();
}

function handleEditUser(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Validate form
    if (!validateUserForm(formData, form.id)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    setLoadingState(submitBtn, true);
    
    // Submit form normally (let browser handle the POST request)
    form.submit();
}

// Form validation
function validateUserForm(formData, formId) {
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
    
    // Validate first name
    const firstName = formData.get('first_name');
    if (!firstName || firstName.trim().length < 1) {
        errors.push(translations.firstname_required || 'First name is required');
        isValid = false;
    }
    
    // Validate last name
    const lastName = formData.get('last_name');
    if (!lastName || lastName.trim().length < 1) {
        errors.push(translations.lastname_required || 'Last name is required');
        isValid = false;
    }
    
    // Validate password (for new users or if password is provided)
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    
    // Check if this is add user form (password required) or edit user form (password optional)
    const isAddUserForm = formId === 'userForm';
    
    if (isAddUserForm) {
        // Add user form - password is required
        if (!password || password.length < 6) {
            errors.push(translations.password_min_length || 'Password must be at least 6 characters long');
            isValid = false;
        }
        
        if (password !== confirmPassword) {
            errors.push(translations.password_mismatch || 'Passwords do not match');
            isValid = false;
        }
    } else {
        // Edit user form - password is optional
        if (password || confirmPassword) {
            if (password && password.length < 6) {
                errors.push(translations.password_min_length || 'Password must be at least 6 characters long');
                isValid = false;
            }
            
            if (password !== confirmPassword) {
                errors.push(translations.password_mismatch || 'Passwords do not match');
                isValid = false;
            }
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

// Yetki yönetimi fonksiyonu
// Export functions for global access
window.editUser = editUser;
window.deleteUser = deleteUser;
window.managePermissions = managePermissions;
