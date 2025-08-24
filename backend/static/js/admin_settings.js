/* Admin Settings JavaScript */
document.addEventListener('DOMContentLoaded', function () {
    initializeToggles();
    initializeSelects();
    addSettingsListeners();
});

function initializeToggles() {
    const toggles = document.querySelectorAll('.settings-toggle-input');

    toggles.forEach(toggle => {
        toggle.addEventListener('change', function () {
            const textElement = this.parentElement.querySelector('.settings-toggle-text');
            if (textElement) {
                textElement.textContent = this.checked ? 'Enabled' : 'Disabled';
            }

            // Add visual feedback
            const card = this.closest('.admin-form-card');
            if (card) {
                card.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 200);
            }

            // Handle specific toggles
            handleToggleChange(this.id, this.checked);
        });
    });
}

function initializeSelects() {
    const selects = document.querySelectorAll('.settings-select');

    selects.forEach(select => {
        select.addEventListener('change', function () {
            // Add visual feedback
            const card = this.closest('.admin-form-card');
            if (card) {
                card.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 200);
            }

            // Handle specific select changes
            handleSelectChange(this.name || this.id, this.value);
        });
    });
}

function addSettingsListeners() {
    // Add hover effects to settings items
    const settingsItems = document.querySelectorAll('.settings-item');

    settingsItems.forEach(item => {
        item.addEventListener('mouseenter', function () {
            this.style.transform = 'translateX(5px)';
            this.style.borderLeftWidth = '6px';
        });

        item.addEventListener('mouseleave', function () {
            this.style.transform = '';
            this.style.borderLeftWidth = '4px';
        });
    });
}

function handleToggleChange(toggleId, isEnabled) {
    switch (toggleId) {
        case 'maintenanceToggle':
            handleMaintenanceMode(isEnabled);
            break;
        case 'twoFactorToggle':
            handleTwoFactorAuth(isEnabled);
            break;
        case 'emailNotificationsToggle':
            handleEmailNotifications(isEnabled);
            break;
        case 'smsNotificationsToggle':
            handleSmsNotifications(isEnabled);
            break;
        case 'pushNotificationsToggle':
            handlePushNotifications(isEnabled);
            break;
        default:
            console.log(`Toggle ${toggleId} changed to ${isEnabled}`);
    }
}

function handleSelectChange(selectName, value) {
    console.log(`Select ${selectName} changed to ${value}`);

    // Add specific handling for different selects
    if (selectName === 'sessionTimeout') {
        showNotification(`Session timeout updated to ${value} minutes`, 'success');
    }
}

function handleMaintenanceMode(isEnabled) {
    if (isEnabled) {
        if (confirm('Enable maintenance mode? This will make the site unavailable to users.')) {
            showNotification('Maintenance mode enabled', 'warning');
        } else {
            // Revert the toggle
            const toggle = document.getElementById('maintenanceToggle');
            toggle.checked = false;
            toggle.parentElement.querySelector('.settings-toggle-text').textContent = 'Disabled';
        }
    } else {
        showNotification('Maintenance mode disabled', 'success');
    }
}

function handleTwoFactorAuth(isEnabled) {
    if (isEnabled) {
        showNotification('Two-factor authentication will be configured for all admin users', 'info');
    } else {
        if (confirm('Disable two-factor authentication? This will reduce security.')) {
            showNotification('Two-factor authentication disabled', 'warning');
        } else {
            // Revert the toggle
            const toggle = document.getElementById('twoFactorToggle');
            toggle.checked = true;
            toggle.parentElement.querySelector('.settings-toggle-text').textContent = 'Enabled';
        }
    }
}

function handleEmailNotifications(isEnabled) {
    showNotification(`Email notifications ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
}

function handleSmsNotifications(isEnabled) {
    if (isEnabled) {
        showNotification('SMS notifications enabled. Configure SMS provider in advanced settings.', 'info');
    } else {
        showNotification('SMS notifications disabled', 'info');
    }
}

function handlePushNotifications(isEnabled) {
    showNotification(`Push notifications ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
}

function saveSettings() {
    // Collect all settings
    const settings = {};

    // Collect toggle states
    const toggles = document.querySelectorAll('.settings-toggle-input');
    toggles.forEach(toggle => {
        settings[toggle.id] = toggle.checked;
    });

    // Collect select values
    const selects = document.querySelectorAll('.settings-select');
    selects.forEach(select => {
        settings[select.name || select.id] = select.value;
    });

    // Show loading state
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;

    // Simulate save (replace with actual AJAX call)
    setTimeout(() => {
        console.log('Settings to save:', settings);
        showNotification('Settings saved successfully!', 'success');

        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 2000);
}

function resetSettings() {
    if (confirm('Reset all settings to default values? This action cannot be undone.')) {
        // Show loading state
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
        btn.disabled = true;

        setTimeout(() => {
            // Reset toggles to default states
            document.getElementById('maintenanceToggle').checked = false;
            document.getElementById('twoFactorToggle').checked = false;
            document.getElementById('emailNotificationsToggle').checked = true;
            document.getElementById('smsNotificationsToggle').checked = false;
            document.getElementById('pushNotificationsToggle').checked = true;

            // Update toggle texts
            document.querySelectorAll('.settings-toggle-input').forEach(toggle => {
                const textElement = toggle.parentElement.querySelector('.settings-toggle-text');
                if (textElement) {
                    textElement.textContent = toggle.checked ? 'Enabled' : 'Disabled';
                }
            });

            // Reset selects
            const sessionSelect = document.querySelector('select');
            if (sessionSelect) {
                sessionSelect.value = '60';
            }

            showNotification('Settings reset to defaults', 'info');

            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1500);
    }
}

function exportSettings() {
    // Collect current settings
    const settings = {
        application: {
            name: document.querySelector('.settings-item-value').textContent.trim(),
            version: document.querySelector('.settings-version-badge').textContent.trim(),
            maintenanceMode: document.getElementById('maintenanceToggle').checked
        },
        security: {
            twoFactorAuth: document.getElementById('twoFactorToggle').checked,
            sessionTimeout: document.querySelector('.settings-select').value
        },
        notifications: {
            email: document.getElementById('emailNotificationsToggle').checked,
            sms: document.getElementById('smsNotificationsToggle').checked,
            push: document.getElementById('pushNotificationsToggle').checked
        },
        exportedAt: new Date().toISOString()
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_settings_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    showNotification('Settings configuration exported', 'success');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `settings-notification settings-notification-${type}`;
    notification.innerHTML = `
        <div class="settings-notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="settings-notification-close">&times;</button>
    `;

    // Add notification styles if not already added
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            .settings-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                padding: 1rem 1.5rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                border-left: 4px solid;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 500px;
                animation: slideInRight 0.3s ease-out;
            }
            
            .settings-notification-success { border-left-color: #28a745; }
            .settings-notification-info { border-left-color: #17a2b8; }
            .settings-notification-warning { border-left-color: #ffc107; }
            .settings-notification-danger { border-left-color: #dc3545; }
            
            .settings-notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: #2c3e50;
            }
            
            .settings-notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #6c757d;
                padding: 0.25rem;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentElement) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);

    // Close button functionality
    notification.querySelector('.settings-notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification.parentElement) {
                document.body.removeChild(notification);
            }
        }, 300);
    });
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'warning': return 'exclamation-triangle';
        case 'danger': return 'times-circle';
        case 'info':
        default: return 'info-circle';
    }
}
