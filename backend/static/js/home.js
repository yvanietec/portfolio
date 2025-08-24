/**
 * Home Page Specific JavaScript
 * Enhanced interactions and animations for the homepage
 */

(function () {
    'use strict';

    const HomePage = {
        // Configuration
        config: {
            animationDelay: 100,
            typewriterSpeed: 50,
            countUpDuration: 2000,
            parallaxSpeed: 0.5
        },

        // Initialize home page functionality
        init: function () {
            this.initTypewriter();
            this.initCounters();
            this.initParallaxEffects();
            this.initScrollAnimations();
            this.initCTAInteractions();
            this.initFeatureCards();
            this.initHeroInteractions();
        },

        // Typewriter effect for hero title
        initTypewriter: function () {
            const typewriterElements = document.querySelectorAll('[data-typewriter]');

            typewriterElements.forEach(element => {
                const text = element.textContent;
                const speed = element.dataset.typewriterSpeed || this.config.typewriterSpeed;

                element.textContent = '';
                element.style.borderRight = '2px solid var(--primary-color)';

                this.typeWriter(element, text, 0, speed);
            });
        },

        typeWriter: function (element, text, index, speed) {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                setTimeout(() => {
                    this.typeWriter(element, text, index + 1, speed);
                }, speed);
            } else {
                // Remove cursor after typing is complete
                setTimeout(() => {
                    element.style.borderRight = 'none';
                }, 1000);
            }
        },

        // Animated counters for statistics
        initCounters: function () {
            const counters = document.querySelectorAll('.stat-number[data-count]');

            const observerOptions = {
                threshold: 0.5,
                rootMargin: '0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            counters.forEach(counter => {
                observer.observe(counter);
            });
        },

        animateCounter: function (element) {
            const target = parseInt(element.dataset.count);
            const duration = this.config.countUpDuration;
            const start = performance.now();
            const startValue = 0;

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function for smooth animation
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const current = Math.floor(startValue + (target - startValue) * easeOutQuart);

                element.textContent = current.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = target.toLocaleString();
                }
            };

            requestAnimationFrame(updateCounter);
        },

        // Parallax effects for background elements
        initParallaxEffects: function () {
            const parallaxElements = document.querySelectorAll('[data-parallax]');

            if (parallaxElements.length === 0) return;

            const updateParallax = Portfolio.utils.throttle(() => {
                const scrolled = window.pageYOffset;

                parallaxElements.forEach(element => {
                    const speed = parseFloat(element.dataset.parallax) || this.config.parallaxSpeed;
                    const yPos = -(scrolled * speed);
                    element.style.transform = `translateY(${yPos}px)`;
                });
            }, 16);

            window.addEventListener('scroll', updateParallax);
        },

        // Enhanced scroll animations
        initScrollAnimations: function () {
            // Staggered animations for feature cards
            const featureCards = document.querySelectorAll('.feature-card');

            const observerOptions = {
                threshold: 0.2,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add('animate-in');
                        }, index * this.config.animationDelay);
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            featureCards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                observer.observe(card);
            });

            // Add CSS for animation
            this.addAnimationStyles();
        },

        addAnimationStyles: function () {
            if (!document.querySelector('#home-animations')) {
                const style = document.createElement('style');
                style.id = 'home-animations';
                style.textContent = `
                    .animate-in {
                        opacity: 1 !important;
                        transform: translateY(0) !important;
                        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    
                    .feature-card:hover .feature-icon {
                        transform: scale(1.1) rotate(5deg);
                        transition: transform 0.3s ease;
                    }
                    
                    .hero-img {
                        transition: transform 0.3s ease;
                    }
                    
                    .btn-hover-effect:hover {
                        transform: translateY(-2px) scale(1.02);
                    }
                `;
                document.head.appendChild(style);
            }
        },

        // Call-to-action interactions
        initCTAInteractions: function () {
            const ctaButtons = document.querySelectorAll('.cta-button, .btn');

            ctaButtons.forEach(button => {
                button.classList.add('btn-hover-effect');

                // Add ripple effect
                button.addEventListener('click', (e) => {
                    this.createRipple(e, button);
                });

                // Add magnetic effect for larger buttons
                if (button.classList.contains('cta-button')) {
                    this.addMagneticEffect(button);
                }
            });
        },

        createRipple: function (event, element) {
            const ripple = document.createElement('span');
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;

            // Add ripple animation if not exists
            if (!document.querySelector('#ripple-animation')) {
                const style = document.createElement('style');
                style.id = 'ripple-animation';
                style.textContent = `
                    @keyframes ripple {
                        to {
                            transform: scale(4);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            element.style.position = 'relative';
            element.style.overflow = 'hidden';
            element.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        },

        addMagneticEffect: function (element) {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                element.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translate(0, 0)';
            });
        },

        // Enhanced feature card interactions
        initFeatureCards: function () {
            const featureCards = document.querySelectorAll('.feature-card');

            featureCards.forEach(card => {
                // Add tilt effect
                this.addTiltEffect(card);

                // Add glow effect on hover
                card.addEventListener('mouseenter', () => {
                    this.addGlowEffect(card);
                });

                card.addEventListener('mouseleave', () => {
                    this.removeGlowEffect(card);
                });
            });
        },

        addTiltEffect: function (element) {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;

                element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            });
        },

        addGlowEffect: function (element) {
            element.style.boxShadow = '0 15px 35px rgba(37, 99, 235, 0.2), 0 5px 15px rgba(0, 0, 0, 0.1)';
        },

        removeGlowEffect: function (element) {
            element.style.boxShadow = '';
        },

        // Hero section interactions
        initHeroInteractions: function () {
            const heroImage = document.querySelector('.hero-img');
            const heroContent = document.querySelector('.hero-content');

            if (heroImage) {
                // Add floating animation
                this.addFloatingAnimation(heroImage);

                // Add interactive tilt
                this.addImageTilt(heroImage);
            }

            if (heroContent) {
                // Staggered animation for hero content
                this.animateHeroContent(heroContent);
            }
        },

        addFloatingAnimation: function (element) {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes heroFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                .hero-floating {
                    animation: heroFloat 4s ease-in-out infinite;
                }
            `;
            document.head.appendChild(style);

            element.classList.add('hero-floating');
        },

        addImageTilt: function (element) {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const tiltX = (y / rect.height) * 10;
                const tiltY = (x / rect.width) * -10;

                element.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'rotateX(0) rotateY(0) scale(1)';
            });
        },

        animateHeroContent: function (container) {
            const elements = container.querySelectorAll('h1, p, .welcome-message, .auth-actions');

            elements.forEach((element, index) => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';

                setTimeout(() => {
                    element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 200);
            });
        },

        // Utility function to check if user prefers reduced motion
        prefersReducedMotion: function () {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
    };

    // Advanced interaction handlers
    const InteractionHandlers = {
        init: function () {
            this.initKeyboardNavigation();
            this.initFocusManagement();
            this.initGestures();
        },

        initKeyboardNavigation: function () {
            // Enhanced keyboard navigation for buttons only (not links)
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const focusedElement = document.activeElement;
                    // Only handle button elements with .btn class, not regular links
                    if (focusedElement.classList.contains('btn') && focusedElement.tagName === 'BUTTON') {
                        e.preventDefault();
                        focusedElement.click();
                    }
                }
            });
        },

        initFocusManagement: function () {
            // Improve focus visibility
            document.addEventListener('focusin', (e) => {
                if (e.target.matches('.btn, a, input, textarea, select')) {
                    e.target.style.outline = '3px solid var(--primary-color)';
                    e.target.style.outlineOffset = '2px';
                }
            });

            document.addEventListener('focusout', (e) => {
                e.target.style.outline = '';
                e.target.style.outlineOffset = '';
            });
        },

        initGestures: function () {
            // Add touch gesture support for mobile
            let touchStartX = null;
            let touchStartY = null;

            document.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            });

            document.addEventListener('touchend', (e) => {
                if (!touchStartX || !touchStartY) return;

                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;

                const deltaX = touchStartX - touchEndX;
                const deltaY = touchStartY - touchEndY;

                // Detect swipe gestures
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (Math.abs(deltaX) > 50) {
                        if (deltaX > 0) {
                            // Swipe left
                            this.handleSwipeLeft();
                        } else {
                            // Swipe right
                            this.handleSwipeRight();
                        }
                    }
                }

                touchStartX = null;
                touchStartY = null;
            });
        },

        handleSwipeLeft: function () {
            // Handle left swipe (could be used for navigation)
            console.log('Swipe left detected');
        },

        handleSwipeRight: function () {
            // Handle right swipe (could be used for navigation)
            console.log('Swipe right detected');
        }
    };

    // Performance monitoring for home page
    const PerformanceMonitor = {
        init: function () {
            this.monitorAnimations();
            this.monitorScrollPerformance();
        },

        monitorAnimations: function () {
            // Monitor animation performance
            let animationCount = 0;
            const maxAnimations = 20;

            const originalAnimate = HTMLElement.prototype.animate;
            HTMLElement.prototype.animate = function (...args) {
                animationCount++;
                if (animationCount > maxAnimations) {
                    console.warn('Too many animations running simultaneously');
                }

                const animation = originalAnimate.apply(this, args);
                animation.addEventListener('finish', () => {
                    animationCount--;
                });

                return animation;
            };
        },

        monitorScrollPerformance: function () {
            let scrollCount = 0;
            let lastTime = performance.now();

            window.addEventListener('scroll', () => {
                scrollCount++;
                const currentTime = performance.now();

                if (currentTime - lastTime > 1000) {
                    if (scrollCount > 60) {
                        console.warn('High scroll event frequency detected');
                    }
                    scrollCount = 0;
                    lastTime = currentTime;
                }
            });
        }
    };

    // Initialize everything when DOM is ready
    function initHomePage() {
        // Skip animations if user prefers reduced motion
        if (!HomePage.prefersReducedMotion()) {
            HomePage.init();
        }

        // TEMPORARILY DISABLED FOR DEBUGGING
        // InteractionHandlers.init();
        PerformanceMonitor.init();

        // Add to global Portfolio object
        window.Portfolio = window.Portfolio || {};
        window.Portfolio.home = HomePage;

        console.log('Home page enhancements loaded');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomePage);
    } else {
        initHomePage();
    }

})();
