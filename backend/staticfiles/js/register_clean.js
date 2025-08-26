/* Modern Register Page JavaScript */

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Modern register validation loaded');
    initializeRegistration();
});

function initializeRegistration() {
    console.log('🚀 Initializing modern registration features...');

    // Initialize all validation features
    initializeUsernameValidation();
    initializeEmailValidation();
    initializePasswordMatching();
    initializePasswordToggles();
    initializePasswordStrength();
    initializeFormValidation();

    console.log('🎉 All registration features initialized successfully!');
}

// Username Validation with Debouncing
function initializeUsernameValidation() {
    const usernameField = document.getElementById('id_username');
    if (!usernameField) {
        console.warn('Username field not found');
        return;
    }

    let usernameTimeout;
    usernameField.addEventListener('input', function () {
        const value = this.value.trim();
        clearTimeout(usernameTimeout);

        if (value.length >= 3) {
            usernameTimeout = setTimeout(() => {
                checkAvailability('username', value);
            }, 500); // Debounced for better UX
        } else {
            clearFeedback('username');
        }

        // Clear form errors when user starts typing
        const errorContainer = document.getElementById('form-errors');
        if (errorContainer) {
            errorContainer.remove();
        }
    });
    console.log('✅ Username validation setup complete');
}

// Email Validation with Debouncing
function initializeEmailValidation() {
    const emailField = document.getElementById('id_email');
    if (!emailField) {
        console.warn('Email field not found');
        return;
    }

    let emailTimeout;
    emailField.addEventListener('input', function () {
        const value = this.value.trim();
        clearTimeout(emailTimeout);

        if (value.length >= 5 && value.includes('@') && value.includes('.')) {
            emailTimeout = setTimeout(() => {
                checkAvailability('email', value);
            }, 500); // Debounced for better UX
        } else {
            clearFeedback('email');
        }

        // Clear form errors when user starts typing
        const errorContainer = document.getElementById('form-errors');
        if (errorContainer) {
            errorContainer.remove();
        }
    });
    console.log('✅ Email validation setup complete');
}

// Global validation state tracking
let validationState = {
    username: { available: false, checked: false },
    email: { available: false, checked: false }
};

// Modern Availability Check with Better UI Feedback
function checkAvailability(field, value) {
    const feedbackElement = document.getElementById(field + '-feedback');
    if (!feedbackElement) {
        console.error(`Feedback element not found: ${field}-feedback`);
        return;
    }

    // Update validation state to show checking
    validationState[field] = { available: false, checked: false, checking: true };

    // Show modern loading state
    feedbackElement.innerHTML = '<span style="color: #007bff;"><i class="fas fa-spinner fa-spin"></i> Checking availability...</span>';
    feedbackElement.className = 'field-feedback';

    fetch('/ajax/check/?field=' + field + '&value=' + encodeURIComponent(value))
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`${field} availability result:`, data);

            // Update global validation state
            validationState[field] = {
                available: data.available,
                checked: true,
                checking: false,
                value: value
            };

            if (data.available) {
                feedbackElement.innerHTML = '<span style="color: #28a745;"><i class="fas fa-check-circle"></i> ' +
                    field.charAt(0).toUpperCase() + field.slice(1) + ' looks good!</span>';
                feedbackElement.className = 'field-feedback success';
            } else {
                feedbackElement.innerHTML = '<span style="color: #dc3545;"><i class="fas fa-exclamation-circle"></i> ' +
                    field.charAt(0).toUpperCase() + field.slice(1) + ' is already taken</span>';
                feedbackElement.className = 'field-feedback error';
            }
        })
        .catch(error => {
            console.error(`${field} availability check failed:`, error);
            feedbackElement.innerHTML = '<span style="color: #ffc107;"><i class="fas fa-exclamation-triangle"></i> Unable to check availability</span>';
            feedbackElement.className = 'field-feedback error';
        });
}

function clearFeedback(field) {
    const feedbackElement = document.getElementById(field + '-feedback');
    if (feedbackElement) {
        feedbackElement.innerHTML = '';
        feedbackElement.className = 'field-feedback';
    }

    // Clear validation state for this field
    if (validationState[field]) {
        validationState[field] = { available: false, checked: false, checking: false };
    }

    // Clear any form errors
    const errorContainer = document.getElementById('form-errors');
    if (errorContainer) {
        errorContainer.remove();
    }
}

// Modern Password Matching Validation
function initializePasswordMatching() {
    const passwordField = document.getElementById('id_password');
    const confirmField = document.getElementById('id_password_confirm');
    const matchFeedback = document.getElementById('password-match-feedback');

    if (!passwordField || !confirmField || !matchFeedback) {
        console.warn('Password matching elements not found');
        return;
    }

    function checkPasswordMatch() {
        const password = passwordField.value;
        const confirm = confirmField.value;

        if (!confirm) {
            matchFeedback.innerHTML = '';
            matchFeedback.className = 'field-feedback';
            return;
        }

        if (password === confirm) {
            matchFeedback.innerHTML = '<span style="color: #28a745;"><i class="fas fa-check-circle"></i> Passwords match</span>';
            matchFeedback.className = 'field-feedback success';
        } else {
            matchFeedback.innerHTML = '<span style="color: #dc3545;"><i class="fas fa-exclamation-circle"></i> Passwords do not match</span>';
            matchFeedback.className = 'field-feedback error';
        }
    }

    passwordField.addEventListener('input', checkPasswordMatch);
    confirmField.addEventListener('input', checkPasswordMatch);
    console.log('✅ Password matching validation setup complete');
}

// Modern Password Toggle Functionality
function initializePasswordToggles() {
    // Main password toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordField = document.getElementById('id_password');

    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', function (e) {
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
        console.log('✅ Password toggle setup complete');
    }

    // Confirm password toggle
    const toggleConfirm = document.getElementById('togglePasswordConfirm');
    const confirmField = document.getElementById('id_password_confirm');

    if (toggleConfirm && confirmField) {
        toggleConfirm.addEventListener('click', function (e) {
            e.preventDefault();
            const type = confirmField.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmField.setAttribute('type', type);

            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
        console.log('✅ Confirm password toggle setup complete');
    }
}

// Modern Password Strength Indicator
function initializePasswordStrength() {
    const passwordField = document.getElementById('id_password');
    const strengthIndicator = document.getElementById('passwordStrength');

    if (!passwordField || !strengthIndicator) {
        console.warn('Password strength elements not found');
        return;
    }

    passwordField.addEventListener('input', function () {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        updateStrengthIndicator(strength);
    });

    console.log('✅ Password strength indicator setup complete');
}

function calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];

    // Length check
    if (password.length >= 8) {
        score += 25;
    } else {
        feedback.push('At least 8 characters');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
        score += 25;
    } else {
        feedback.push('One uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
        score += 25;
    } else {
        feedback.push('One lowercase letter');
    }

    // Number or special character check
    if (/[\d\W]/.test(password)) {
        score += 25;
    } else {
        feedback.push('One number or special character');
    }

    return { score, feedback };
}

function updateStrengthIndicator(strength) {
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');

    if (!strengthBar || !strengthText) return;

    strengthBar.style.width = strength.score + '%';

    if (strength.score < 50) {
        strengthBar.style.backgroundColor = '#dc3545';
        strengthText.textContent = 'Weak password';
    } else if (strength.score < 75) {
        strengthBar.style.backgroundColor = '#ffc107';
        strengthText.textContent = 'Fair password';
    } else if (strength.score < 100) {
        strengthBar.style.backgroundColor = '#28a745';
        strengthText.textContent = 'Good password';
    } else {
        strengthBar.style.backgroundColor = '#28a745';
        strengthText.textContent = 'Strong password';
    }
}

// Modern Form Validation
function initializeFormValidation() {
    const form = document.getElementById('registerForm');
    if (!form) {
        console.warn('Register form not found');
        return;
    }

    form.addEventListener('submit', function (e) {
        if (!validateForm()) {
            e.preventDefault();
            console.log('Form validation failed');
        }
    });

    console.log('✅ Form validation setup complete');
}

function validateForm() {
    let isValid = true;
    const errors = [];

    // Check username
    const username = document.getElementById('id_username').value.trim();
    if (username.length < 3) {
        errors.push('Username must be at least 3 characters');
        isValid = false;
    } else if (validationState.username.checking) {
        errors.push('Please wait for username validation to complete');
        isValid = false;
    } else if (!validationState.username.checked || !validationState.username.available) {
        errors.push('Please ensure username is available');
        isValid = false;
    } else if (validationState.username.value !== username) {
        // Username changed after validation, need to re-check
        errors.push('Please wait for username validation to complete');
        isValid = false;
    }

    // Check email
    const email = document.getElementById('id_email').value.trim();
    if (!email.includes('@') || !email.includes('.')) {
        errors.push('Please enter a valid email address');
        isValid = false;
    } else if (validationState.email.checking) {
        errors.push('Please wait for email validation to complete');
        isValid = false;
    } else if (!validationState.email.checked || !validationState.email.available) {
        errors.push('Please ensure email is available');
        isValid = false;
    } else if (validationState.email.value !== email) {
        // Email changed after validation, need to re-check
        errors.push('Please wait for email validation to complete');
        isValid = false;
    }

    // Check password match
    const password = document.getElementById('id_password').value;
    const confirmPassword = document.getElementById('id_password_confirm').value;
    if (password !== confirmPassword) {
        errors.push('Passwords do not match');
        isValid = false;
    }

    // Check password length
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
        isValid = false;
    }

    // Check terms agreement
    const agreeTerms = document.getElementById('id_agree_terms');
    if (agreeTerms && !agreeTerms.checked) {
        errors.push('You must agree to the terms and conditions');
        isValid = false;
    }

    if (errors.length > 0) {
        console.log('Validation errors:', errors);
        // Show errors to user
        showValidationErrors(errors);
    }

    return isValid;
}

function showValidationErrors(errors) {
    // Create or update error display
    let errorContainer = document.getElementById('form-errors');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'form-errors';
        errorContainer.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
        const form = document.getElementById('registerForm');
        form.insertBefore(errorContainer, form.firstChild);
    }

    errorContainer.innerHTML = '<div class="font-bold mb-2">Please fix the following errors:</div>' +
        '<ul class="list-disc list-inside">' +
        errors.map(error => `<li>${error}</li>`).join('') +
        '</ul>';
}