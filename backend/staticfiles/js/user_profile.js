/**
 * User Profile Page JavaScript
 * Enhanced functionality for profile management and interactions
 */

(function () {
    'use strict';

    const UserProfile = {
        // Configuration
        config: {
            cropperOptions: {
                aspectRatio: 1,
                viewMode: 1,
                background: false,
                autoCrop: true,
                autoCropArea: 0.8,
                responsive: true,
                restore: false,
                checkCrossOrigin: false,
                checkOrientation: false,
                modal: true,
                guides: true,
                center: true,
                highlight: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: true
            }
        },

        // Initialize user profile functionality
        init: function () {
            this.initProfilePhotoUpload();
            this.initProgressAnimations();
            this.initActionButtons();
            this.initTooltips();
            this.initSmoothScrolling();
            this.initFormValidation();
            this.initConfirmDialogs();
            this.initShareFunctionality();
            this.initNotifications();
        },

        // Photo upload and cropping functionality
        initProfilePhotoUpload: function () {
            const photoInput = document.getElementById('photoInput');
            const photoPreview = document.getElementById('photoPreview');
            const photoForm = document.getElementById('photoForm');
            let cropper = null;

            if (!photoInput) return;

            // Handle file selection
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Validate file type
                if (!this.validateImageFile(file)) {
                    Portfolio.notify('Please select a valid image file (JPG, PNG, GIF)', 'error');
                    return;
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    Portfolio.notify('File size must be less than 5MB', 'error');
                    return;
                }

                this.showLoadingOverlay('Processing image...');

                const reader = new FileReader();
                reader.onload = (event) => {
                    this.hideLoadingOverlay();

                    if (photoPreview) {
                        photoPreview.src = event.target.result;
                        photoPreview.style.display = 'block';

                        // Destroy existing cropper
                        if (cropper) {
                            cropper.destroy();
                        }

                        // Initialize new cropper
                        cropper = new Cropper(photoPreview, this.config.cropperOptions);

                        // Show cropper container
                        const cropperContainer = photoPreview.closest('.photo-cropper-container');
                        if (cropperContainer) {
                            cropperContainer.style.display = 'block';
                            cropperContainer.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                };

                reader.onerror = () => {
                    this.hideLoadingOverlay();
                    Portfolio.notify('Error reading file', 'error');
                };

                reader.readAsDataURL(file);
            });

            // Handle form submission
            if (photoForm) {
                photoForm.addEventListener('submit', (e) => {
                    e.preventDefault();

                    if (!cropper) {
                        Portfolio.notify('Please select an image first', 'warning');
                        return;
                    }

                    this.uploadCroppedImage(cropper);
                });
            }
        },

        // Validate image file
        validateImageFile: function (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            return validTypes.includes(file.type);
        },

        // Upload cropped image
        uploadCroppedImage: function (cropper) {
            this.showLoadingOverlay('Uploading photo...');

            cropper.getCroppedCanvas({
                width: 400,
                height: 400,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            }).toBlob((blob) => {
                const formData = new FormData();
                formData.append('csrfmiddlewaretoken', this.getCSRFToken());
                formData.append('cropped_image', blob, 'profile.png');

                fetch(window.location.pathname, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                    .then(response => {
                        this.hideLoadingOverlay();

                        if (response.ok) {
                            Portfolio.notify('Profile photo updated successfully!', 'success');
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        } else {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                    })
                    .catch(error => {
                        this.hideLoadingOverlay();
                        console.error('Upload error:', error);
                        Portfolio.notify('Upload failed. Please try again.', 'error');
                    });
            }, 'image/png', 0.9);
        },

        // Get CSRF token
        getCSRFToken: function () {
            const token = document.querySelector('[name=csrfmiddlewaretoken]');
            return token ? token.value : '';
        },

        // Initialize progress animations
        initProgressAnimations: function () {
            const progressBars = document.querySelectorAll('.progress-fill');

            if (progressBars.length === 0) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const progressBar = entry.target;
                        const targetWidth = progressBar.dataset.width || '0%';

                        // Animate progress bar
                        setTimeout(() => {
                            progressBar.style.width = targetWidth;
                        }, 300);

                        // Animate counter if present
                        const counter = progressBar.querySelector('.counter');
                        if (counter) {
                            this.animateCounter(counter);
                        }

                        observer.unobserve(progressBar);
                    }
                });
            }, { threshold: 0.5 });

            progressBars.forEach(bar => observer.observe(bar));
        },

        // Animate counter numbers
        animateCounter: function (element) {
            const target = parseInt(element.textContent);
            const duration = 2000;
            const start = performance.now();

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);

                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const current = Math.floor(target * easeOutQuart);

                element.textContent = current + '%';

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                }
            };

            requestAnimationFrame(updateCounter);
        },

        // Initialize action buttons
        initActionButtons: function () {
            // Add click effects to action buttons
            document.querySelectorAll('.action-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    this.createRippleEffect(e, button);
                });
            });

            // Initialize copy functionality
            document.querySelectorAll('.copy-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const textToCopy = button.dataset.copy;
                    this.copyToClipboard(textToCopy);
                });
            });

            // Initialize download buttons
            document.querySelectorAll('.download-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const url = button.href;
                    if (url) {
                        this.trackDownload(url);
                    }
                });
            });
        },

        // Create ripple effect for buttons
        createRippleEffect: function (event, element) {
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
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
                z-index: 1;
            `;

            element.style.position = 'relative';
            element.style.overflow = 'hidden';
            element.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        },

        // Copy to clipboard functionality
        copyToClipboard: function (text) {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(() => {
                    Portfolio.notify('Copied to clipboard!', 'success');
                }).catch(() => {
                    this.fallbackCopy(text);
                });
            } else {
                this.fallbackCopy(text);
            }
        },

        // Fallback copy method
        fallbackCopy: function (text) {
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
                Portfolio.notify('Copied to clipboard!', 'success');
            } catch (err) {
                Portfolio.notify('Failed to copy. Please copy manually.', 'error');
            }

            textArea.remove();
        },

        // Initialize tooltips
        initTooltips: function () {
            document.querySelectorAll('[data-tooltip]').forEach(element => {
                element.addEventListener('mouseenter', (e) => {
                    this.showTooltip(e.target);
                });

                element.addEventListener('mouseleave', (e) => {
                    this.hideTooltip(e.target);
                });
            });
        },

        // Show tooltip
        showTooltip: function (element) {
            const tooltip = element.querySelector('.tooltip-text');
            if (tooltip) {
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
            }
        },

        // Hide tooltip
        hideTooltip: function (element) {
            const tooltip = element.querySelector('.tooltip-text');
            if (tooltip) {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            }
        },

        // Initialize smooth scrolling
        initSmoothScrolling: function () {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = document.querySelector(anchor.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        },

        // Initialize form validation
        initFormValidation: function () {
            const forms = document.querySelectorAll('form[data-validate]');

            forms.forEach(form => {
                form.addEventListener('submit', (e) => {
                    if (!this.validateForm(form)) {
                        e.preventDefault();
                    }
                });

                // Real-time validation
                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.addEventListener('blur', () => {
                        this.validateField(input);
                    });
                });
            });
        },

        // Validate form
        validateForm: function (form) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            return isValid;
        },

        // Validate individual field
        validateField: function (field) {
            const value = field.value.trim();
            const fieldType = field.type;
            let isValid = true;
            let message = '';

            // Required field validation
            if (field.hasAttribute('required') && !value) {
                isValid = false;
                message = 'This field is required';
            }

            // Email validation
            if (fieldType === 'email' && value && !this.isValidEmail(value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }

            // URL validation
            if (fieldType === 'url' && value && !this.isValidURL(value)) {
                isValid = false;
                message = 'Please enter a valid URL';
            }

            // Show/hide error message
            this.toggleFieldError(field, isValid, message);

            return isValid;
        },

        // Email validation
        isValidEmail: function (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        // URL validation
        isValidURL: function (url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },

        // Toggle field error display
        toggleFieldError: function (field, isValid, message) {
            const errorElement = field.parentNode.querySelector('.field-error');

            if (!isValid) {
                field.classList.add('error');

                if (!errorElement) {
                    const error = document.createElement('div');
                    error.className = 'field-error';
                    error.textContent = message;
                    field.parentNode.appendChild(error);
                } else {
                    errorElement.textContent = message;
                }
            } else {
                field.classList.remove('error');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        },

        // Initialize confirmation dialogs
        initConfirmDialogs: function () {
            document.querySelectorAll('[data-confirm]').forEach(element => {
                element.addEventListener('click', (e) => {
                    const message = element.dataset.confirm;
                    if (!confirm(message)) {
                        e.preventDefault();
                    }
                });
            });
        },

        // Initialize share functionality
        initShareFunctionality: function () {
            const shareButtons = document.querySelectorAll('.share-btn');

            shareButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const url = button.dataset.shareUrl || window.location.href;
                    const title = button.dataset.shareTitle || document.title;

                    this.shareProfile(url, title);
                });
            });
        },

        // Share profile
        shareProfile: function (url, title) {
            if (navigator.share) {
                navigator.share({
                    title: title,
                    url: url
                }).catch(err => {
                    console.log('Error sharing:', err);
                    this.fallbackShare(url);
                });
            } else {
                this.fallbackShare(url);
            }
        },

        // Fallback share method
        fallbackShare: function (url) {
            this.copyToClipboard(url);
            Portfolio.notify('Portfolio URL copied to clipboard!', 'success');
        },

        // Initialize notifications
        initNotifications: function () {
            // Auto-hide flash messages
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
                setTimeout(() => {
                    this.fadeOut(alert);
                }, 5000);
            });
        },

        // Fade out element
        fadeOut: function (element) {
            element.style.transition = 'opacity 0.5s ease';
            element.style.opacity = '0';
            setTimeout(() => {
                element.remove();
            }, 500);
        },

        // Show loading overlay
        showLoadingOverlay: function (message = 'Loading...') {
            let overlay = document.querySelector('.loading-overlay');

            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'loading-overlay';
                overlay.innerHTML = `
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <p class="loading-message">${message}</p>
                    </div>
                `;
                document.body.appendChild(overlay);
            } else {
                overlay.querySelector('.loading-message').textContent = message;
            }

            overlay.style.display = 'flex';
        },

        // Hide loading overlay
        hideLoadingOverlay: function () {
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        },

        // Track download
        trackDownload: function (url) {
            // Analytics tracking can be added here
            console.log('Download tracked:', url);
        },

        // Update progress bar
        updateProgressBar: function (percentage) {
            const progressBar = document.querySelector('.progress-fill');
            if (progressBar) {
                progressBar.style.width = percentage + '%';
                progressBar.dataset.width = percentage + '%';
            }
        },

        // Refresh profile data
        refreshProfile: function () {
            this.showLoadingOverlay('Refreshing profile...');

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    };

    // Copy profile URL function (global)
    window.copyPublicURL = function () {
        // Get the portfolio slug from a data attribute or global variable
        const portfolioSlug = window.portfolioSlug || document.querySelector('[data-portfolio-slug]')?.dataset.portfolioSlug;

        if (!portfolioSlug) {
            alert('Portfolio URL not available');
            return;
        }

        const protocol = window.location.protocol;
        const host = window.location.host;
        const url = `${protocol}//${host}/portfolio/${portfolioSlug}/`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                // Show modern notification
                showNotification('Portfolio URL copied to clipboard!', 'success');
            }).catch(() => {
                // Fallback for older browsers
                prompt('Copy this URL:', url);
            });
        } else {
            // Fallback for browsers without clipboard API
            prompt('Copy this URL:', url);
        }
    };

    // Modern notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.user-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `user-notification user-notification-${type}`;
        notification.innerHTML = `
            <div class="user-notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="user-notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('user-notification-show');
        });
    }

    // Progress bar animation
    function animateProgressBar() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const targetWidth = progressFill.getAttribute('data-progress') + '%';

            // Start from 0 width
            progressFill.style.width = '0%';

            // Animate to target width
            setTimeout(() => {
                progressFill.style.width = targetWidth;
            }, 500);
        }
    }

    // Make functions globally available
    window.copyPublicURL = copyPublicURL;
    window.showNotification = showNotification;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            UserProfile.init();
            animateProgressBar();
        });
    } else {
        UserProfile.init();
        animateProgressBar();
    }

    // Add to global Portfolio object
    window.Portfolio = window.Portfolio || {};
    window.Portfolio.userProfile = UserProfile;

    // Add custom CSS for ripple effect if not exists
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .field-error {
                color: #ef4444;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                animation: shake 0.5s ease-in-out;
            }
            
            .error {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }

})();
