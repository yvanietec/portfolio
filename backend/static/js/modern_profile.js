// Modern Profile JavaScript

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    initializeProfile();
});

function initializeProfile() {
    // Set up completion ring progress
    const completionRing = document.querySelector('.completion-ring');
    if (completionRing) {
        const progress = completionRing.dataset.progress || 0;
        completionRing.style.setProperty('--progress', `${progress}%`);
    }

    // Close modal when clicking outside
    window.addEventListener('click', function (event) {
        const modal = document.getElementById('settingsModal');
        if (event.target === modal) {
            closeSettings();
        }
    });

    // Handle escape key for modal
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeSettings();
        }
    });
}

// Photo upload functions
function togglePhotoUpload() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.click();
    }
}

// Image preview function for profile photo upload
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Find the current photo display area and update it
            const photoContainer = input.closest('.flex').querySelector('.relative');
            if (photoContainer) {
                // Remove existing image or placeholder
                const existingImg = photoContainer.querySelector('img');
                const existingPlaceholder = photoContainer.querySelector('.bg-violet-100');

                if (existingImg) {
                    existingImg.remove();
                }
                if (existingPlaceholder) {
                    existingPlaceholder.remove();
                }

                // Create new image preview
                const newImg = document.createElement('img');
                newImg.src = e.target.result;
                newImg.alt = 'Profile Photo Preview';
                newImg.className = 'w-16 h-16 rounded-full object-cover border-2 border-violet-200 shadow-md';
                photoContainer.appendChild(newImg);
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Settings modal functions
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });

    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('bg-violet-600', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-700');
    });

    // Show selected tab content
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    const clickedButton = event.target.closest('.tab-btn');
    if (clickedButton) {
        clickedButton.classList.add('active', 'bg-violet-600', 'text-white');
        clickedButton.classList.remove('bg-gray-100', 'text-gray-700');
    }
}

// Enhanced settings modal functions
function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Animate modal in
        const modalContent = modal.querySelector('.bg-white');
        if (modalContent) {
            modalContent.style.transform = 'scale(0.9)';
            modalContent.style.opacity = '0';

            setTimeout(() => {
                modalContent.style.transition = 'all 0.3s ease';
                modalContent.style.transform = 'scale(1)';
                modalContent.style.opacity = '1';
            }, 10);
        }
    }
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        // Animate modal out
        const modalContent = modal.querySelector('.bg-white');
        if (modalContent) {
            modalContent.style.transition = 'all 0.3s ease';
            modalContent.style.transform = 'scale(0.9)';
            modalContent.style.opacity = '0';

            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        } else {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
}

// Portfolio link copying functions
function copyPortfolioLink() {
    const portfolioSlug = window.portfolioSlug;
    if (!portfolioSlug) {
        showNotification('Portfolio not available', 'error');
        return;
    }

    const protocol = window.location.protocol;
    const host = window.location.host;
    const url = `${protocol}//${host}/portfolio/public/${portfolioSlug}/`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Portfolio link copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(url);
        });
    } else {
        fallbackCopyToClipboard(url);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showNotification('Portfolio link copied to clipboard!', 'success');
    } catch (err) {
        prompt('Copy this URL:', text);
        showNotification('Please copy the URL from the prompt', 'info');
    }

    document.body.removeChild(textArea);
}

// Portfolio URL sharing function
function copyPublicURL() {
    const portfolioSlug = window.portfolioSlug;
    if (!portfolioSlug) {
        return;
    }

    const protocol = window.location.protocol;
    const host = window.location.host;
    const url = `${protocol}//${host}/portfolio/public/${portfolioSlug}/`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            // URL copied silently without notification
        }).catch(() => {
            fallbackCopyToClipboard(url);
        });
    } else {
        fallbackCopyToClipboard(url);
    }
}

// Notification system
function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existing = document.querySelector('.portfolio-notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `portfolio-notification portfolio-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        transform: translateX(100%);
        transition: transform 0.3s ease-out;
        max-width: 400px;
        backdrop-filter: blur(10px);
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: 'linear-gradient(135deg, #10b981, #059669)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
        info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };
    return colors[type] || colors.info;
}

// Make functions globally available
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.showTab = showTab;
window.togglePhotoUpload = togglePhotoUpload;
window.copyPortfolioLink = copyPortfolioLink;
window.copyPublicURL = copyPublicURL;
window.previewImage = previewImage;
window.showNotification = showNotification;
