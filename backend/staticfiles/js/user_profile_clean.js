// User Profile Page JavaScript - Clean Version

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {

    // Animate progress bar
    animateProgressBar();

    // Initialize tooltips and interactions
    initializeInteractions();

});

// Progress bar animation
function animateProgressBar() {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        const targetWidth = progressFill.getAttribute('data-progress');
        if (targetWidth) {
            // Start from 0 width
            progressFill.style.width = '0%';

            // Animate to target width after a delay
            setTimeout(() => {
                progressFill.style.width = targetWidth + '%';
            }, 500);
        }
    }
}

// Initialize interactive elements
function initializeInteractions() {
    // Add hover effects to checklist items
    const checklistItems = document.querySelectorAll('.checklist-item');
    checklistItems.forEach(item => {
        item.addEventListener('mouseenter', function () {
            this.style.transform = 'translateX(5px)';
        });

        item.addEventListener('mouseleave', function () {
            this.style.transform = 'translateX(0)';
        });
    });

    // Add click animation to buttons
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Portfolio URL sharing function
function copyPublicURL() {
    // Get the portfolio slug from the data attribute or window variable
    const container = document.querySelector('[data-portfolio-slug]');
    const portfolioSlug = container ? container.getAttribute('data-portfolio-slug') : window.portfolioSlug;

    if (!portfolioSlug) {
        return;
    }

    const protocol = window.location.protocol;
    const host = window.location.host;
    const url = `${protocol}//${host}/portfolio/${portfolioSlug}/`;

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

// Fallback copy method
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
        // URL copied silently without notification
    } catch (err) {
        prompt('Copy this URL:', text);
    }

    document.body.removeChild(textArea);
}

// Make functions globally available
window.copyPublicURL = copyPublicURL;

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .action-btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
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
`;
document.head.appendChild(style);
