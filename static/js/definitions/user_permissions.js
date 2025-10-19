// User Permissions Management JavaScript
// Clean, organized JavaScript for user permissions page

// Global variables
let currentUserId = null;
let permissionsData = [];
let userPermissions = [];

// Initialize user permissions page
document.addEventListener('DOMContentLoaded', function() {
    initializePermissionsPage();
    bindEvents();
    loadUserPermissions();
});

// Initialize page components
function initializePermissionsPage() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Get user ID from URL or data attribute
    const userIdElement = document.querySelector('[data-user-id]');
    if (userIdElement) {
        currentUserId = userIdElement.getAttribute('data-user-id');
    }

    // Initialize theme support
    initializeThemeSupport();
}

// Initialize theme support
function initializeThemeSupport() {
    // Listen for theme changes
    document.addEventListener('themeChanged', function(event) {
        updateThemeSpecificElements(event.detail.theme);
    });
}

// Update theme-specific elements
function updateThemeSpecificElements(theme) {
    // Update any theme-specific elements if needed
    console.log('Theme changed to:', theme);
}

// Bind event listeners
function bindEvents() {
    // Permission toggle events
    const permissionItems = document.querySelectorAll('.permission-item');
    permissionItems.forEach(item => {
        const toggleBtn = item.querySelector('.permission-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', handlePermissionToggle);
        }
    });

    // Back button
    const backBtn = document.querySelector('.btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.history.back();
        });
    }

    // Refresh button
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadUserPermissions);
    }
}

// Load user permissions
function loadUserPermissions() {
    if (!currentUserId) {
        console.error('User ID not found');
        return;
    }

    showLoadingState(true);

    // TODO: Replace with actual API call
    // For now, simulate loading
    setTimeout(() => {
        // Simulate API response
        const mockPermissions = generateMockPermissions();
        displayPermissions(mockPermissions);
        showLoadingState(false);
    }, 1000);
}

// Generate mock permissions data
function generateMockPermissions() {
    return {
        'user_management': [
            { name: 'user.create', description: 'Create new users' },
            { name: 'user.read', description: 'View user information' },
            { name: 'user.update', description: 'Update user information' },
            { name: 'user.delete', description: 'Delete users' }
        ],
        'permission_management': [
            { name: 'permission.grant', description: 'Grant permissions to users' },
            { name: 'permission.revoke', description: 'Revoke permissions from users' },
            { name: 'permission.view', description: 'View user permissions' }
        ],
        'system_settings': [
            { name: 'settings.read', description: 'View system settings' },
            { name: 'settings.update', description: 'Update system settings' }
        ]
    };
}

// Display permissions
function displayPermissions(permissions) {
    const container = document.querySelector('.permissions-container');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Create permission cards
    Object.entries(permissions).forEach(([module, modulePermissions]) => {
        const card = createPermissionCard(module, modulePermissions);
        container.appendChild(card);
    });

    // Update statistics
    updatePermissionStatistics(permissions);
}

// Create permission card
function createPermissionCard(module, permissions) {
    const card = document.createElement('div');
    card.className = 'permission-card';
    
    const activeCount = permissions.filter(p => hasPermission(p.name)).length;
    
    card.innerHTML = `
        <div class="permission-header">
            <div>
                <i class="fas fa-folder me-2"></i>
                ${module.charAt(0).toUpperCase() + module.slice(1)} ${translations.module || 'Module'}
            </div>
            <span class="permission-count">${activeCount}/${permissions.length}</span>
        </div>
        <div class="permission-body">
            ${permissions.map(permission => createPermissionItem(permission)).join('')}
        </div>
    `;
    
    return card;
}

// Create permission item
function createPermissionItem(permission) {
    const hasPerm = hasPermission(permission.name);
    
    return `
        <div class="permission-item">
            <div class="permission-info">
                <div class="permission-name">${permission.description}</div>
                <div class="permission-description">${permission.name}</div>
            </div>
            <div class="permission-status">
                <span class="status-indicator ${hasPerm ? 'status-active' : 'status-inactive'}"></span>
                <span class="badge ${hasPerm ? 'bg-success' : 'bg-secondary'}">
                    ${hasPerm ? (translations.active || 'Active') : (translations.inactive || 'Inactive')}
                </span>
            </div>
        </div>
    `;
}

// Check if user has permission
function hasPermission(permissionName) {
    return userPermissions.includes(permissionName);
}

// Handle permission toggle
function handlePermissionToggle(event) {
    const permissionName = event.target.getAttribute('data-permission');
    const isActive = hasPermission(permissionName);
    
    if (isActive) {
        revokePermission(permissionName);
    } else {
        grantPermission(permissionName);
    }
}

// Grant permission
function grantPermission(permissionName) {
    if (!userPermissions.includes(permissionName)) {
        userPermissions.push(permissionName);
        updatePermissionUI(permissionName, true);
        showNotification(translations.permission_granted || 'Permission granted', 'success');
    }
}

// Revoke permission
function revokePermission(permissionName) {
    const index = userPermissions.indexOf(permissionName);
    if (index > -1) {
        userPermissions.splice(index, 1);
        updatePermissionUI(permissionName, false);
        showNotification(translations.permission_revoked || 'Permission revoked', 'info');
    }
}

// Update permission UI
function updatePermissionUI(permissionName, isActive) {
    const permissionItems = document.querySelectorAll('.permission-item');
    permissionItems.forEach(item => {
        const description = item.querySelector('.permission-description');
        if (description && description.textContent === permissionName) {
            const statusIndicator = item.querySelector('.status-indicator');
            const badge = item.querySelector('.badge');
            
            if (isActive) {
                statusIndicator.className = 'status-indicator status-active';
                badge.className = 'badge bg-success';
                badge.textContent = translations.active || 'Active';
            } else {
                statusIndicator.className = 'status-indicator status-inactive';
                badge.className = 'badge bg-secondary';
                badge.textContent = translations.inactive || 'Inactive';
            }
        }
    });
    
    // Update statistics
    updatePermissionStatistics();
}

// Update permission statistics
function updatePermissionStatistics(permissions = null) {
    if (!permissions) {
        // Recalculate from current state
        const moduleStats = {};
        const permissionCards = document.querySelectorAll('.permission-card');
        
        permissionCards.forEach(card => {
            const moduleName = card.querySelector('.permission-header div').textContent.split(' ')[0].toLowerCase();
            const permissionItems = card.querySelectorAll('.permission-item');
            const activeCount = Array.from(permissionItems).filter(item => 
                item.querySelector('.badge').classList.contains('bg-success')
            ).length;
            
            moduleStats[moduleName] = {
                total: permissionItems.length,
                active: activeCount
            };
        });
        
        updateStatsDisplay(moduleStats);
    } else {
        // Use provided permissions data
        const moduleStats = {};
        Object.entries(permissions).forEach(([module, modulePermissions]) => {
            const activeCount = modulePermissions.filter(p => hasPermission(p.name)).length;
            moduleStats[module] = {
                total: modulePermissions.length,
                active: activeCount
            };
        });
        
        updateStatsDisplay(moduleStats);
    }
}

// Update stats display
function updateStatsDisplay(moduleStats) {
    const statsContainer = document.querySelector('.module-stats');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = '';
    
    Object.entries(moduleStats).forEach(([module, stats]) => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.innerHTML = `
            <h6>${module.charAt(0).toUpperCase() + module.slice(1)}</h6>
            <div class="stat-number">${stats.active}/${stats.total}</div>
            <div class="stat-label">${translations.active_permissions || 'Active'}</div>
        `;
        statsContainer.appendChild(statItem);
    });
}

// Show loading state
function showLoadingState(isLoading) {
    const container = document.querySelector('.permissions-container');
    if (!container) return;
    
    if (isLoading) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">${translations.loading || 'Loading...'}</span>
                </div>
                <p class="mt-3 text-muted">${translations.loading_permissions || 'Loading permissions...'}</p>
            </div>
        `;
    }
}

// Show notification
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

// Utility functions
function formatDate(date) {
    if (!date) return translations.unknown || 'Unknown';
    return new Date(date).toLocaleDateString();
}

function formatDateTime(date) {
    if (!date) return translations.unknown || 'Unknown';
    return new Date(date).toLocaleString();
}

// Export functions for global access
window.UserPermissions = {
    loadUserPermissions,
    grantPermission,
    revokePermission,
    hasPermission,
    showNotification
};
