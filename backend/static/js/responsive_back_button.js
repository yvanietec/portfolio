/**
 * Responsive Back Button Handler
 * Shows back button on desktop, hides on mobile
 */

class ResponsiveBackButton {
    constructor() {
        this.backButton = null;
        this.isMobile = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupBackButton());
        } else {
            this.setupBackButton();
        }
    }

    setupBackButton() {
        // Find the back button in wizard progress
        this.backButton = document.querySelector('.back-button');

        if (!this.backButton) {
            console.log('Back button not found');
            return;
        }

        // Check if mobile on initial load
        this.checkMobileAndUpdate();

        // Listen for window resize events
        window.addEventListener('resize', () => {
            this.checkMobileAndUpdate();
        });

        // Listen for orientation change (for mobile devices)
        window.addEventListener('orientationchange', () => {
            // Add a small delay to ensure orientation change is complete
            setTimeout(() => {
                this.checkMobileAndUpdate();
            }, 100);
        });

        console.log('✅ Responsive back button initialized');
    }

    checkMobileAndUpdate() {
        const wasMobile = this.isMobile;
        this.isMobile = this.isMobileDevice();

        // Only update if mobile state changed
        if (wasMobile !== this.isMobile) {
            this.updateBackButtonVisibility();
        }
    }

    isMobileDevice() {
        // Check for mobile devices using multiple methods
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
            'android', 'webos', 'iphone', 'ipad', 'ipod',
            'blackberry', 'windows phone', 'mobile'
        ];

        // Check user agent
        const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

        // Check screen width (mobile breakpoint)
        const isMobileWidth = window.innerWidth <= 768;

        // Check for touch capability (most mobile devices have touch)
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Check for mobile-specific features
        const isMobileFeatures = window.matchMedia('(max-width: 768px)').matches;

        // Consider it mobile if any of these conditions are met
        return isMobileUA || (isMobileWidth && hasTouch) || isMobileFeatures;
    }

    updateBackButtonVisibility() {
        if (!this.backButton) return;

        if (this.isMobile) {
            // Hide back button on mobile
            this.backButton.style.display = 'none';
            console.log('📱 Mobile detected: Back button hidden');
        } else {
            // Show back button on desktop
            this.backButton.style.display = 'inline-block';
            console.log('🖥️ Desktop detected: Back button shown');
        }
    }

    // Public method to manually check and update
    refresh() {
        this.checkMobileAndUpdate();
    }

    // Public method to force show/hide
    setVisibility(show) {
        if (!this.backButton) return;
        this.backButton.style.display = show ? 'inline-block' : 'none';
    }
}

// Initialize when script loads
const responsiveBackButton = new ResponsiveBackButton();

// Export for global access
window.ResponsiveBackButton = ResponsiveBackButton;
window.responsiveBackButton = responsiveBackButton;
