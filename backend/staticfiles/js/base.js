/**
 * Base JavaScript functionality for Portfolio Platform
 * Includes mobile navigation, animations, and utility functions
 */

// Global Portfolio object to namespace our functions
window.Portfolio = window.Portfolio || {};

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        animationDuration: 300,
        mobileBreakpoint: 768,
        scrollOffset: 100,
        debounceDelay: 250
    };

    // Utility Functions
    const Utils = {
        // Debounce function for performance optimization
        debounce: function (func, wait, immediate) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func.apply(this, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(this, args);
            };
        },

        // Throttle function for scroll events
        throttle: function (func, limit) {
            let inThrottle;
            return function (...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Check if element is in viewport
        isInViewport: function (element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        // Smooth scroll to element
        scrollToElement: function (element, offset = 0) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        },

        // Add class with animation
        addClass: function (element, className, delay = 0) {
            setTimeout(() => {
                element.classList.add(className);
            }, delay);
        },

        // Remove class with animation
        removeClass: function (element, className, delay = 0) {
            setTimeout(() => {
                element.classList.remove(className);
            }, delay);
        }
    };

    // Mobile Navigation Module
    const MobileNav = {
        init: function () {
            this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            this.navLinks = document.querySelector('.nav-links');
            this.overlay = this.createOverlay();

            if (this.mobileMenuBtn && this.navLinks) {
                this.bindEvents();
            }
        },

        createOverlay: function () {
            const overlay = document.createElement('div');
            overlay.className = 'mobile-nav-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 40;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(overlay);
            return overlay;
        },

        bindEvents: function () {
            // Toggle mobile menu
            this.mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });

            // Close menu when clicking overlay
            this.overlay.addEventListener('click', () => {
                this.closeMenu();
            });

            // Close menu when clicking nav links
            this.navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= CONFIG.mobileBreakpoint) {
                        this.closeMenu();
                    }
                });
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.navLinks.classList.contains('active')) {
                    this.closeMenu();
                }
            });

            // Handle window resize
            window.addEventListener('resize', Utils.debounce(() => {
                if (window.innerWidth > CONFIG.mobileBreakpoint) {
                    this.closeMenu();
                }
            }, CONFIG.debounceDelay));
        },

        toggleMenu: function () {
            const isOpen = this.navLinks.classList.contains('active');
            if (isOpen) {
                this.closeMenu();
            } else {
                this.openMenu();
            }
        },

        openMenu: function () {
            this.navLinks.classList.add('active');
            this.overlay.style.opacity = '1';
            this.overlay.style.visibility = 'visible';
            document.body.style.overflow = 'hidden';

            // Animate menu items
            const menuItems = this.navLinks.querySelectorAll('a');
            menuItems.forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                Utils.addClass(item, 'animate-in', index * 50);
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 50 + 100);
            });
        },

        closeMenu: function () {
            this.navLinks.classList.remove('active');
            this.overlay.style.opacity = '0';
            this.overlay.style.visibility = 'hidden';
            document.body.style.overflow = '';
        }
    };

    // Animation Module
    const Animations = {
        init: function () {
            this.observeElements();
            this.initScrollAnimations();
        },

        observeElements: function () {
            // Intersection Observer for fade-in animations
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in-up');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            // Observe elements with animation classes
            document.querySelectorAll('.animate-on-scroll').forEach(el => {
                observer.observe(el);
            });

            // Auto-observe common elements
            document.querySelectorAll('.feature-card, .stat-item, .cta-section').forEach(el => {
                observer.observe(el);
            });
        },

        initScrollAnimations: function () {
            // Parallax effect for hero backgrounds
            const heroElements = document.querySelectorAll('.hero-section');

            if (heroElements.length > 0) {
                window.addEventListener('scroll', Utils.throttle(() => {
                    const scrolled = window.pageYOffset;
                    const rate = scrolled * -0.5;

                    heroElements.forEach(hero => {
                        hero.style.transform = `translateY(${rate}px)`;
                    });
                }, 16));
            }
        }
    };

    // Notification System
    const Notifications = {
        container: null,

        init: function () {
            this.createContainer();
        },

        createContainer: function () {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        },

        show: function (message, type = 'info', duration = 5000) {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-message">${message}</span>
                    <button class="notification-close">&times;</button>
                </div>
            `;

            // Styles
            notification.style.cssText = `
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 10px;
                padding: 16px;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                border-left: 4px solid ${this.getTypeColor(type)};
            `;

            this.container.appendChild(notification);

            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 10);

            // Auto remove
            if (duration > 0) {
                setTimeout(() => {
                    this.remove(notification);
                }, duration);
            }

            // Manual close
            notification.querySelector('.notification-close').addEventListener('click', () => {
                this.remove(notification);
            });

            return notification;
        },

        remove: function (notification) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        },

        getTypeColor: function (type) {
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6'
            };
            return colors[type] || colors.info;
        }
    };

    // Theme Manager
    const ThemeManager = {
        init: function () {
            this.loadTheme();
            this.bindEvents();
        },

        loadTheme: function () {
            const savedTheme = localStorage.getItem('portfolio-theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
            }
        },

        setTheme: function (theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('portfolio-theme', theme);
        },

        toggleTheme: function () {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },

        bindEvents: function () {
            // Listen for theme toggle buttons
            document.addEventListener('click', (e) => {
                if (e.target.matches('[data-toggle-theme]')) {
                    this.toggleTheme();
                }
            });
        }
    };

    // Loading Manager
    const LoadingManager = {
        init: function () {
            this.hideLoader();
            this.bindLoadingEvents();
        },

        showLoader: function () {
            let loader = document.querySelector('.page-loader');
            if (!loader) {
                loader = this.createLoader();
            }
            loader.style.display = 'flex';
        },

        hideLoader: function () {
            const loader = document.querySelector('.page-loader');
            if (loader) {
                setTimeout(() => {
                    loader.style.opacity = '0';
                    setTimeout(() => {
                        loader.style.display = 'none';
                    }, 300);
                }, 100);
            }
        },

        createLoader: function () {
            const loader = document.createElement('div');
            loader.className = 'page-loader';
            loader.innerHTML = `
                <div class="loader-spinner">
                    <div class="spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(loader);
            return loader;
        },

        bindLoadingEvents: function () {
            // Show loader for form submissions
            document.addEventListener('submit', (e) => {
                if (!e.target.hasAttribute('data-no-loader')) {
                    this.showLoader();
                }
            });

            // Show loader for certain links
            document.addEventListener('click', (e) => {
                if (e.target.matches('a[data-loading]')) {
                    this.showLoader();
                }
            });
        }
    };

    // Form Enhancements
    const FormEnhancements = {
        init: function () {
            this.enhanceForms();
        },

        enhanceForms: function () {
            // Add floating labels
            document.querySelectorAll('input, textarea, select').forEach(input => {
                if (input.type !== 'checkbox' && input.type !== 'radio') {
                    this.addFloatingLabel(input);
                }
            });

            // Add form validation feedback
            document.querySelectorAll('form').forEach(form => {
                this.addValidation(form);
            });
        },

        addFloatingLabel: function (input) {
            const parent = input.parentNode;
            const label = parent.querySelector('label');

            if (label && !parent.classList.contains('floating-label')) {
                parent.classList.add('floating-label');

                input.addEventListener('focus', () => {
                    label.classList.add('focused');
                });

                input.addEventListener('blur', () => {
                    if (!input.value) {
                        label.classList.remove('focused');
                    }
                });

                if (input.value) {
                    label.classList.add('focused');
                }
            }
        },

        addValidation: function (form) {
            form.addEventListener('submit', (e) => {
                const isValid = this.validateForm(form);
                if (!isValid) {
                    e.preventDefault();
                }
            });
        },

        validateForm: function (form) {
            let isValid = true;
            const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    this.showFieldError(input, 'This field is required');
                    isValid = false;
                } else {
                    this.clearFieldError(input);
                }
            });

            return isValid;
        },

        showFieldError: function (input, message) {
            input.classList.add('error');
            let errorEl = input.parentNode.querySelector('.field-error');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'field-error';
                input.parentNode.appendChild(errorEl);
            }
            errorEl.textContent = message;
        },

        clearFieldError: function (input) {
            input.classList.remove('error');
            const errorEl = input.parentNode.querySelector('.field-error');
            if (errorEl) {
                errorEl.remove();
            }
        }
    };

    // Initialize everything when DOM is ready
    function init() {
        MobileNav.init();
        Animations.init();
        Notifications.init();
        ThemeManager.init();
        LoadingManager.init();
        FormEnhancements.init();

        // Add global Portfolio methods
        window.Portfolio.utils = Utils;
        window.Portfolio.notify = Notifications.show.bind(Notifications);
        window.Portfolio.theme = ThemeManager;
        window.Portfolio.loading = LoadingManager;

        console.log('Portfolio Platform initialized successfully');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden
            console.log('Page hidden');
        } else {
            // Page is visible
            console.log('Page visible');
        }
    });

    // Performance monitoring
    window.addEventListener('load', () => {
        // Log performance metrics
        if (window.performance && window.performance.timing) {
            const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
            console.log(`Page load time: ${loadTime}ms`);
        }
    });

})();
