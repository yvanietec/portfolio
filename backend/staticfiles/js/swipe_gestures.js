/**
 * Swipe Back Gestures
 * Allows users to swipe from the left edge of the screen to go back
 * Only active on mobile devices
 */

class SwipeBackGestures {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.threshold = 100; // Minimum swipe distance
        this.edgeThreshold = 50; // Maximum distance from left edge to start swipe
        this.isMobile = false;
        this.init();
    }

    init() {
        this.checkMobile();
        this.setupSwipeGestures();

        // Listen for resize and orientation changes
        window.addEventListener('resize', () => this.checkMobile());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.checkMobile(), 100);
        });
    }

    checkMobile() {
        this.isMobile = this.isMobileDevice();
    }

    isMobileDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile'];
        const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
        const isMobileWidth = window.innerWidth <= 768;
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        return isMobileUA || (isMobileWidth && hasTouch);
    }

    setupSwipeGestures() {
        // Only add event listeners if mobile
        if (!this.isMobile) return;

        document.addEventListener('touchstart', (e) => {
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = this.startX - endX;
            const deltaY = Math.abs(this.startY - endY);

            // Swipe from left edge and horizontal movement
            if (this.startX < this.edgeThreshold && deltaX > this.threshold && deltaY < 50) {
                this.goBack();
            }
        }, { passive: true });
    }

    goBack() {
        // Add visual feedback (optional)
        this.showSwipeFeedback();

        // Go back in browser history
        window.history.back();
    }

    showSwipeFeedback() {
        // Create a temporary visual indicator
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            background: rgba(139, 92, 246, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 999;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            backdrop-filter: blur(10px);
        `;
        feedback.textContent = 'Going back...';
        document.body.appendChild(feedback);

        // Show feedback briefly
        setTimeout(() => feedback.style.opacity = '1', 100);
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => document.body.removeChild(feedback), 300);
        }, 1000);
    }
}

// Initialize swipe gestures when script loads
const swipeGestures = new SwipeBackGestures();

// Export for global access
window.SwipeBackGestures = SwipeBackGestures;
window.swipeGestures = swipeGestures;
