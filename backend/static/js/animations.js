/**
 * Animation Library for Portfolio Platform
 * Custom animations and effects for enhanced user experience
 */

(function () {
    'use strict';

    // Animation Library
    const AnimationLibrary = {
        // Configuration
        config: {
            duration: 600,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            offset: 100
        },

        // Initialize all animations
        init: function () {
            this.addAnimationStyles();
            this.initIntersectionObserver();
            this.initScrollAnimations();
            this.initHoverAnimations();
            this.initLoadingAnimations();
        },

        // Add CSS animations to the page
        addAnimationStyles: function () {
            if (document.querySelector('#animation-library-styles')) return;

            const styles = `
                /* Fade Animations */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes fadeInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                @keyframes fadeInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                /* Scale Animations */
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }

                @keyframes scaleInBounce {
                    0% { opacity: 0; transform: scale(0.3); }
                    50% { opacity: 1; transform: scale(1.05); }
                    70% { transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }

                /* Rotation Animations */
                @keyframes rotateIn {
                    from { opacity: 0; transform: rotate(-180deg) scale(0.8); }
                    to { opacity: 1; transform: rotate(0deg) scale(1); }
                }

                @keyframes flipInX {
                    from { 
                        opacity: 0; 
                        transform: perspective(1000px) rotateX(-90deg); 
                    }
                    to { 
                        opacity: 1; 
                        transform: perspective(1000px) rotateX(0deg); 
                    }
                }

                @keyframes flipInY {
                    from { 
                        opacity: 0; 
                        transform: perspective(1000px) rotateY(-90deg); 
                    }
                    to { 
                        opacity: 1; 
                        transform: perspective(1000px) rotateY(0deg); 
                    }
                }

                /* Slide Animations */
                @keyframes slideInUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                @keyframes slideInDown {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }

                @keyframes slideInLeft {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }

                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                /* Bounce Animations */
                @keyframes bounceIn {
                    0% { opacity: 0; transform: scale(0.3); }
                    20% { transform: scale(1.1); }
                    40% { transform: scale(0.9); }
                    60% { opacity: 1; transform: scale(1.03); }
                    80% { transform: scale(0.97); }
                    100% { opacity: 1; transform: scale(1); }
                }

                @keyframes bounceInUp {
                    0% { opacity: 0; transform: translateY(2000px); }
                    60% { opacity: 1; transform: translateY(-30px); }
                    80% { transform: translateY(10px); }
                    100% { transform: translateY(0); }
                }

                /* Zoom Animations */
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale3d(0.3, 0.3, 0.3); }
                    50% { opacity: 1; }
                    to { opacity: 1; transform: scale3d(1, 1, 1); }
                }

                @keyframes zoomInRotate {
                    from { 
                        opacity: 0; 
                        transform: scale(0.5) rotate(-180deg); 
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1) rotate(0deg); 
                    }
                }

                /* Pulse and Glow Effects */
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
                }

                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.5); }
                    50% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.8); }
                }

                /* Shimmer Effect */
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }

                /* Typing Animation */
                @keyframes typing {
                    from { width: 0; }
                    to { width: 100%; }
                }

                @keyframes blinkCaret {
                    from, to { border-color: transparent; }
                    50% { border-color: var(--primary-color); }
                }

                /* Floating Animation */
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }

                @keyframes floatReverse {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(10px); }
                }

                /* Wobble Animation */
                @keyframes wobble {
                    0% { transform: translateX(0%); }
                    15% { transform: translateX(-25px) rotate(-5deg); }
                    30% { transform: translateX(20px) rotate(3deg); }
                    45% { transform: translateX(-15px) rotate(-3deg); }
                    60% { transform: translateX(10px) rotate(2deg); }
                    75% { transform: translateX(-5px) rotate(-1deg); }
                    100% { transform: translateX(0%); }
                }

                /* Animation Classes */
                .animate-fade-in { animation: fadeIn 0.6s ease-out; }
                .animate-fade-in-up { animation: fadeInUp 0.6s ease-out; }
                .animate-fade-in-down { animation: fadeInDown 0.6s ease-out; }
                .animate-fade-in-left { animation: fadeInLeft 0.6s ease-out; }
                .animate-fade-in-right { animation: fadeInRight 0.6s ease-out; }
                .animate-scale-in { animation: scaleIn 0.6s ease-out; }
                .animate-scale-in-bounce { animation: scaleInBounce 0.8s ease-out; }
                .animate-rotate-in { animation: rotateIn 0.8s ease-out; }
                .animate-flip-in-x { animation: flipInX 0.8s ease-out; }
                .animate-flip-in-y { animation: flipInY 0.8s ease-out; }
                .animate-slide-in-up { animation: slideInUp 0.6s ease-out; }
                .animate-slide-in-down { animation: slideInDown 0.6s ease-out; }
                .animate-slide-in-left { animation: slideInLeft 0.6s ease-out; }
                .animate-slide-in-right { animation: slideInRight 0.6s ease-out; }
                .animate-bounce-in { animation: bounceIn 0.8s ease-out; }
                .animate-bounce-in-up { animation: bounceInUp 1s ease-out; }
                .animate-zoom-in { animation: zoomIn 0.6s ease-out; }
                .animate-zoom-in-rotate { animation: zoomInRotate 0.8s ease-out; }
                .animate-pulse { animation: pulse 2s infinite; }
                .animate-glow { animation: glow 2s ease-in-out infinite alternate; }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-float-reverse { animation: floatReverse 3s ease-in-out infinite; }
                .animate-wobble { animation: wobble 1s ease-in-out; }

                /* Shimmer Effect Class */
                .shimmer {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }

                /* Typing Effect Classes */
                .typewriter {
                    overflow: hidden;
                    border-right: 2px solid var(--primary-color);
                    white-space: nowrap;
                    animation: typing 3.5s steps(40, end), blinkCaret 0.75s step-end infinite;
                }

                /* Stagger Animation Classes */
                .stagger-animation > * {
                    opacity: 0;
                    transform: translateY(20px);
                }

                .stagger-animation.animate > *:nth-child(1) { animation: fadeInUp 0.6s ease-out 0.1s forwards; }
                .stagger-animation.animate > *:nth-child(2) { animation: fadeInUp 0.6s ease-out 0.2s forwards; }
                .stagger-animation.animate > *:nth-child(3) { animation: fadeInUp 0.6s ease-out 0.3s forwards; }
                .stagger-animation.animate > *:nth-child(4) { animation: fadeInUp 0.6s ease-out 0.4s forwards; }
                .stagger-animation.animate > *:nth-child(5) { animation: fadeInUp 0.6s ease-out 0.5s forwards; }
                .stagger-animation.animate > *:nth-child(6) { animation: fadeInUp 0.6s ease-out 0.6s forwards; }

                /* Hover Animation Classes */
                .hover-lift:hover { transform: translateY(-5px); transition: transform 0.3s ease; }
                .hover-scale:hover { transform: scale(1.05); transition: transform 0.3s ease; }
                .hover-rotate:hover { transform: rotate(5deg); transition: transform 0.3s ease; }
                .hover-glow:hover { box-shadow: 0 0 20px rgba(37, 99, 235, 0.3); transition: box-shadow 0.3s ease; }

                /* Loading Animation Classes */
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .loading-dots {
                    display: inline-block;
                    position: relative;
                    width: 80px;
                    height: 80px;
                }

                .loading-dots div {
                    position: absolute;
                    top: 33px;
                    width: 13px;
                    height: 13px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    animation-timing-function: cubic-bezier(0, 1, 1, 0);
                }

                .loading-dots div:nth-child(1) {
                    left: 8px;
                    animation: dots1 0.6s infinite;
                }

                .loading-dots div:nth-child(2) {
                    left: 8px;
                    animation: dots2 0.6s infinite;
                }

                .loading-dots div:nth-child(3) {
                    left: 32px;
                    animation: dots2 0.6s infinite;
                }

                .loading-dots div:nth-child(4) {
                    left: 56px;
                    animation: dots3 0.6s infinite;
                }

                @keyframes dots1 {
                    0% { transform: scale(0); }
                    100% { transform: scale(1); }
                }

                @keyframes dots3 {
                    0% { transform: scale(1); }
                    100% { transform: scale(0); }
                }

                @keyframes dots2 {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(24px, 0); }
                }

                /* Reveal Animation Classes */
                .reveal-up { 
                    opacity: 0; 
                    transform: translateY(50px); 
                    transition: all 0.6s ease-out; 
                }

                .reveal-up.revealed { 
                    opacity: 1; 
                    transform: translateY(0); 
                }

                .reveal-scale { 
                    opacity: 0; 
                    transform: scale(0.8); 
                    transition: all 0.6s ease-out; 
                }

                .reveal-scale.revealed { 
                    opacity: 1; 
                    transform: scale(1); 
                }
            `;

            const styleSheet = document.createElement('style');
            styleSheet.id = 'animation-library-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        },

        // Initialize Intersection Observer for scroll animations
        initIntersectionObserver: function () {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: `0px 0px -${this.config.offset}px 0px`
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const animationType = element.dataset.animation || 'fade-in-up';
                        const delay = element.dataset.delay || 0;

                        setTimeout(() => {
                            element.classList.add(`animate-${animationType}`);
                        }, parseInt(delay));

                        observer.unobserve(element);
                    }
                });
            }, observerOptions);

            // Observe elements with animation data attributes
            document.querySelectorAll('[data-animation]').forEach(el => {
                observer.observe(el);
            });

            // Auto-observe common elements
            document.querySelectorAll('.animate-on-scroll, .card, .feature-card').forEach(el => {
                if (!el.dataset.animation) {
                    el.dataset.animation = 'fade-in-up';
                }
                observer.observe(el);
            });
        },

        // Initialize scroll-based animations
        initScrollAnimations: function () {
            const revealElements = document.querySelectorAll('.reveal-up, .reveal-scale');

            if (revealElements.length === 0) return;

            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });

            revealElements.forEach(el => revealObserver.observe(el));
        },

        // Initialize hover animations
        initHoverAnimations: function () {
            // Add hover animations to buttons
            document.querySelectorAll('.btn').forEach(btn => {
                if (!btn.classList.contains('hover-lift')) {
                    btn.classList.add('hover-lift');
                }
            });

            // Add hover animations to cards
            document.querySelectorAll('.card, .feature-card').forEach(card => {
                if (!card.classList.contains('hover-lift')) {
                    card.classList.add('hover-lift');
                }
            });
        },

        // Initialize loading animations
        initLoadingAnimations: function () {
            // Create loading overlay
            this.createLoadingOverlay();

            // Add loading states to forms
            document.querySelectorAll('form').forEach(form => {
                form.addEventListener('submit', () => {
                    this.showLoading();
                });
            });
        },

        // Create loading overlay
        createLoadingOverlay: function () {
            if (document.querySelector('#loading-overlay')) return;

            const overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                backdrop-filter: blur(5px);
            `;

            overlay.innerHTML = `
                <div class="loading-content" style="text-align: center;">
                    <div class="loading-spinner"></div>
                    <p style="margin-top: 1rem; color: var(--text-light);">Loading...</p>
                </div>
            `;

            document.body.appendChild(overlay);
        },

        // Show loading animation
        showLoading: function (message = 'Loading...') {
            const overlay = document.querySelector('#loading-overlay');
            const messageEl = overlay.querySelector('p');
            messageEl.textContent = message;
            overlay.style.display = 'flex';
        },

        // Hide loading animation
        hideLoading: function () {
            const overlay = document.querySelector('#loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        },

        // Animate element with specific animation
        animate: function (element, animationType, options = {}) {
            const {
                delay = 0,
                duration = this.config.duration,
                easing = this.config.easing,
                callback = null
            } = options;

            setTimeout(() => {
                element.style.animationDuration = `${duration}ms`;
                element.style.animationTimingFunction = easing;
                element.classList.add(`animate-${animationType}`);

                if (callback) {
                    element.addEventListener('animationend', callback, { once: true });
                }
            }, delay);
        },

        // Stagger animation for multiple elements
        staggerAnimate: function (elements, animationType, staggerDelay = 100) {
            elements.forEach((element, index) => {
                this.animate(element, animationType, {
                    delay: index * staggerDelay
                });
            });
        },

        // Create custom animation
        createCustomAnimation: function (name, keyframes) {
            const styleSheet = document.querySelector('#animation-library-styles');
            const newAnimation = `
                @keyframes ${name} {
                    ${keyframes}
                }
                .animate-${name} {
                    animation: ${name} 0.6s ease-out;
                }
            `;
            styleSheet.textContent += newAnimation;
        }
    };

    // Add to global Portfolio object
    window.Portfolio = window.Portfolio || {};
    window.Portfolio.animations = AnimationLibrary;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            AnimationLibrary.init();
        });
    } else {
        AnimationLibrary.init();
    }

})();
