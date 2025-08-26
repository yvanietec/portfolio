/* Authentication Pages JavaScript */

document.addEventListener('DOMContentLoaded', function () {
    initializeAuthPage();
});

function initializeAuthPage() {
    initializePasswordToggle();
    initializeFormValidation();
    initializeFormAnimations();
    initializeKeyboardShortcuts();
    initializeAjaxAvailabilityChecks();
    // AJAX username/email availability check for register page
    function initializeAjaxAvailabilityChecks() {
        // Only run on register page
        const form = document.getElementById('registerForm');
        if (!form) return;

        // Username check
        const usernameInput = document.getElementById('id_username');
        let usernameFeedback = document.getElementById('username-availability');
        if (!usernameFeedback) {
            // If not present, create and insert after username input
            usernameFeedback = document.createElement('div');
            usernameFeedback.id = 'username-availability';
            usernameFeedback.className = 'field-feedback';
            usernameInput && usernameInput.parentNode.appendChild(usernameFeedback);
        }
        let usernameTimeout = null;
        if (usernameInput && usernameFeedback) {
            usernameInput.addEventListener('input', function () {
                const value = this.value.trim();
                usernameFeedback.textContent = '';
                usernameFeedback.className = 'field-feedback';
                if (value.length < 3) {
                    return;
                }
                clearTimeout(usernameTimeout);
                usernameTimeout = setTimeout(function () {
                    fetch('/ajax/check/?field=username&value=' + encodeURIComponent(value))
                        .then(response => response.json())
                        .then(data => {
                            if (data.available) {
                                usernameFeedback.textContent = 'Username is available';
                                usernameFeedback.style.color = 'green';
                            } else {
                                usernameFeedback.textContent = data.error ? data.error : 'Username is already taken';
                                usernameFeedback.style.color = 'red';
                            }
                        })
                        .catch(() => {
                            usernameFeedback.textContent = 'Could not check username';
                            usernameFeedback.style.color = 'orange';
                        });
                }, 400);
            });
        }

        // Email check
        const emailInput = document.getElementById('id_email');
        let emailFeedback = document.getElementById('email-availability');
        if (!emailFeedback) {
            // If not present, create and insert after email input
            emailFeedback = document.createElement('div');
            emailFeedback.id = 'email-availability';
            emailFeedback.className = 'field-feedback';
            emailInput && emailInput.parentNode.appendChild(emailFeedback);
        }
        let emailTimeout = null;
        if (emailInput && emailFeedback) {
            emailInput.addEventListener('input', function () {
                const value = this.value.trim();
                emailFeedback.textContent = '';
                emailFeedback.className = 'field-feedback';
                if (value.length < 5 || value.indexOf('@') === -1) {
                    return;
                }
                clearTimeout(emailTimeout);
                emailTimeout = setTimeout(function () {
                    fetch('/ajax/check/?field=email&value=' + encodeURIComponent(value))
                        .then(response => response.json())
                        .then(data => {
                            if (data.available) {
                                emailFeedback.textContent = 'Email is available';
                                emailFeedback.style.color = 'green';
                            } else {
                                emailFeedback.textContent = data.error ? data.error : 'Email is already registered';
                                emailFeedback.style.color = 'red';
                            }
                        })
                        .catch(() => {
                            emailFeedback.textContent = 'Could not check email';
                            emailFeedback.style.color = 'orange';
                        });
                }, 400);
            });
        }
    }
}

function initializePasswordToggle() {
    // Handle main password field
    const toggleButton = document.getElementById('togglePassword');
    const passwordField = document.getElementById('id_password');

    if (toggleButton && passwordField) {
        toggleButton.addEventListener('click', function (e) {
            e.preventDefault();
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);

            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }

    // Handle confirm password field
    const toggleConfirmButton = document.getElementById('togglePasswordConfirm');
    const confirmPasswordField = document.getElementById('id_password_confirm');

    if (toggleConfirmButton && confirmPasswordField) {
        toggleConfirmButton.addEventListener('click', function (e) {
            e.preventDefault();
            const type = confirmPasswordField.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordField.setAttribute('type', type);

            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
}

function initializeFormValidation() {
    const form = document.getElementById('loginForm') || document.getElementById('registerForm');

    if (form) {
        // Real-time validation
        const inputs = form.querySelectorAll('.form-input');

        inputs.forEach(input => {
            input.addEventListener('blur', function () {
                validateField(this);
            });

            input.addEventListener('input', function () {
                // Remove error state on input
                this.classList.remove('error');
                const errorMsg = this.parentNode.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.remove();
                }
            });
        });

        // Form submission
        form.addEventListener('submit', function (e) {
            let isValid = true;

            inputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });

            if (isValid) {
                showLoadingState(this);
            }
        });
    }
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';

    // Remove existing error
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Basic validation
    if (field.hasAttribute('required') && !value) {
        errorMessage = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        isValid = false;
    } else if (fieldName === 'email' && value && !isValidEmail(value)) {
        errorMessage = 'Please enter a valid email address';
        isValid = false;
    } else if (fieldName === 'password' && value && value.length < 6) {
        errorMessage = 'Password must be at least 6 characters long';
        isValid = false;
    } else if (fieldName === 'username' && value && value.length < 3) {
        errorMessage = 'Username must be at least 3 characters long';
        isValid = false;
    }

    if (!isValid) {
        showFieldError(field, errorMessage);
    }

    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    field.parentNode.appendChild(errorDiv);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showLoadingState(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('loading');

        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';

        // Restore button after a timeout (in case of error)
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
            submitButton.innerHTML = originalText;
        }, 10000);
    }
}

function initializeFormAnimations() {
    // Animate form elements on load
    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        authCard.style.opacity = '0';
        authCard.style.transform = 'translateY(20px)';

        setTimeout(() => {
            authCard.style.transition = 'all 0.6s ease';
            authCard.style.opacity = '1';
            authCard.style.transform = 'translateY(0)';
        }, 100);
    }

    // Animate form groups
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateX(-20px)';

        setTimeout(() => {
            group.style.transition = 'all 0.4s ease';
            group.style.opacity = '1';
            group.style.transform = 'translateX(0)';
        }, 200 + (index * 100));
    });
}

function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        // Enter key on form inputs
        if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
            const form = e.target.closest('form');
            const inputs = Array.from(form.querySelectorAll('.form-input'));
            const currentIndex = inputs.indexOf(e.target);

            if (currentIndex < inputs.length - 1) {
                e.preventDefault();
                inputs[currentIndex + 1].focus();
            } else {
                form.querySelector('button[type="submit"]').click();
            }
        }

        // Escape key to clear form
        if (e.key === 'Escape') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.classList.contains('form-input')) {
                activeElement.blur();
            }
        }
    });
}

// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function () {
    const alerts = document.querySelectorAll('.auth-alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'all 0.5s ease';
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                alert.remove();
            }, 500);
        }, 5000);
    });
});

// Add focus states for better accessibility
document.addEventListener('DOMContentLoaded', function () {
    const focusableElements = document.querySelectorAll('.form-input, .auth-btn, .auth-link');

    focusableElements.forEach(element => {
        element.addEventListener('focus', function () {
            this.classList.add('focused');
        });

        element.addEventListener('blur', function () {
            this.classList.remove('focused');
        });
    });
});

// Add ripple effect to buttons
function addRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('auth-btn')) {
        addRippleEffect(e.target, e);
    }
});

// Add custom CSS for ripple effect
const rippleCSS = `
.auth-btn {
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

.form-input.error {
    border-color: #e74c3c;
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.error-message {
    color: #e74c3c;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: slideInDown 0.3s ease;
}

.focused {
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}
`;

// Inject custom CSS
const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);
