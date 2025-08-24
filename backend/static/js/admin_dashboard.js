// Admin Dashboard JavaScript - Modern Functionality

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {

    // Initialize all components
    initializeTooltips();
    initializeAnimations();
    initializeInteractions();
    initializeCharts();

});

// Initialize Bootstrap tooltips
function initializeTooltips() {
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl, {
                trigger: 'hover focus',
                placement: 'top',
                animation: true,
                delay: { show: 200, hide: 100 }
            });
        });
    }
}

// Initialize page animations
function initializeAnimations() {
    // Add fade-in animation to main elements
    const elements = document.querySelectorAll('.stat-card, .data-table-container, .quick-actions');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';

        setTimeout(() => {
            element.style.transition = 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Animate stat numbers
    animateStatNumbers();
}

// Animate counting numbers in stat cards
function animateStatNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');

    statNumbers.forEach(element => {
        const finalValue = parseInt(element.textContent.replace(/\D/g, ''));
        if (isNaN(finalValue)) return;

        let currentValue = 0;
        const increment = finalValue / 30; // Animation duration: 30 steps
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                element.textContent = finalValue.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentValue).toLocaleString();
            }
        }, 50);
    });
}

// Initialize interactive elements
function initializeInteractions() {
    // Enhanced table row hover effects
    const tableRows = document.querySelectorAll('.table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.02)';
            this.style.zIndex = '10';
        });

        row.addEventListener('mouseleave', function () {
            this.style.transform = 'scale(1)';
            this.style.zIndex = '1';
        });
    });

    // Enhanced button interactions
    const actionBtns = document.querySelectorAll('.action-btn, .quick-action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            // Create ripple effect
            createRippleEffect(this, e);
        });
    });

    // Sidebar navigation active state
    updateActiveNavigation();

    // Auto-refresh functionality for real-time data
    initializeAutoRefresh();
}

// Create ripple effect on button clicks
function createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    // Add ripple styles
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple-animation 0.6s linear';
    ripple.style.pointerEvents = 'none';

    // Ensure button has relative positioning
    if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative';
    }
    element.style.overflow = 'hidden';

    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Update active navigation state
function updateActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Initialize simple chart animations (if needed)
function initializeCharts() {
    // Simple progress bars or chart animations can be added here
    const progressElements = document.querySelectorAll('.progress-bar');

    progressElements.forEach(progress => {
        const width = progress.style.width || progress.getAttribute('aria-valuenow') + '%';
        progress.style.width = '0%';

        setTimeout(() => {
            progress.style.transition = 'width 1.5s ease-out';
            progress.style.width = width;
        }, 500);
    });
}

// Auto-refresh functionality for real-time updates
function initializeAutoRefresh() {
    // Check if auto-refresh is enabled (you can add data attribute to enable this)
    const autoRefreshEnabled = document.querySelector('[data-auto-refresh]');
    if (!autoRefreshEnabled) return;

    const refreshInterval = parseInt(autoRefreshEnabled.dataset.autoRefresh) || 30000; // Default 30 seconds

    setInterval(() => {
        // Only refresh if the page is visible
        if (!document.hidden) {
            refreshDashboardData();
        }
    }, refreshInterval);
}

// Refresh dashboard data via AJAX
function refreshDashboardData() {
    // This would typically make an AJAX call to get updated data
    // For now, we'll just update the timestamp
    const timestampElements = document.querySelectorAll('.last-updated');
    timestampElements.forEach(element => {
        element.textContent = 'Updated: ' + new Date().toLocaleTimeString();
    });

    // Show a subtle notification
    showNotification('Dashboard data refreshed', 'info', 2000);
}

// Enhanced notification system
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.admin-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.innerHTML = `
        <div class="admin-notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="admin-notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(44, 62, 80, 0.2);
        border: 1px solid #BDC3C7;
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        z-index: 10000;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    });

    // Auto remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

// Get notification icon based on type
function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Confirmation dialogs with better styling
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Enhanced delete confirmation
function confirmDelete(itemName, deleteUrl) {
    if (confirm(`Are you sure you want to delete ${itemName}? This action cannot be undone.`)) {
        window.location.href = deleteUrl;
    }
}

// Search functionality enhancement
function initializeSearch() {
    const searchInputs = document.querySelectorAll('input[type="search"], .search-input');

    searchInputs.forEach(input => {
        let searchTimeout;

        input.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(this.value);
            }, 300);
        });
    });
}

// Perform search in tables
function performSearch(query) {
    const tables = document.querySelectorAll('.table tbody');

    tables.forEach(tbody => {
        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(query.toLowerCase());

            row.style.display = matches || query === '' ? '' : 'none';
        });
    });
}

// Export functionality
function exportData(format, tableName) {
    showNotification(`Exporting ${tableName} data as ${format.toUpperCase()}...`, 'info');

    // This would typically trigger a server-side export
    // For demo purposes, we'll just show a notification
    setTimeout(() => {
        showNotification(`${tableName} data exported successfully!`, 'success');
    }, 2000);
}

// Make functions globally available
window.showNotification = showNotification;
window.confirmAction = confirmAction;
window.confirmDelete = confirmDelete;
window.exportData = exportData;

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .admin-notification {
        border-left: 4px solid #3498DB;
    }
    
    .admin-notification-success {
        border-left-color: #27AE60;
    }
    
    .admin-notification-error {
        border-left-color: #E74C3C;
    }
    
    .admin-notification-warning {
        border-left-color: #F39C12;
    }
    
    .admin-notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }
    
    .admin-notification-close {
        background: none;
        border: none;
        color: #7F8C8D;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: all 0.2s;
        margin-left: 1rem;
    }
    
    .admin-notification-close:hover {
        background-color: rgba(0, 0, 0, 0.05);
        color: #2C3E50;
    }
`;
document.head.appendChild(style);
