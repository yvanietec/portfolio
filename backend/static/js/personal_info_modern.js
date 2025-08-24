// Modern Personal Info Form JavaScript - Enhanced User Experience

document.addEventListener('DOMContentLoaded', function () {
    // Initialize the personal info form
    initializePersonalInfoForm();

    // Add smooth animations
    addSmoothAnimations();

    // Add form validation
    addFormValidation();

    // Add auto-save functionality
    addAutoSave();

    // Add interactive elements
    addInteractiveElements();

    // Initialize contact field
    initializeContactField();
});

function initializePersonalInfoForm() {
    console.log('🚀 Initializing modern personal info form...');

    // Add loading states
    const form = document.querySelector('.elegant-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            const submitBtn = this.querySelector('.btn-primary');
            if (submitBtn) {
                submitBtn.classList.add('loading');
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }
        });
    }

    // Initialize form fields
    initializeFormFields();

    // Add welcome animation
    showWelcomeAnimation();
}

function initializeFormFields() {
    const formGroups = document.querySelectorAll('.form-group');

    formGroups.forEach((group, index) => {
        // Stagger animations
        setTimeout(() => {
            group.style.opacity = '1';
            group.style.transform = 'translateY(0)';
        }, index * 100);

        const input = group.querySelector('input, textarea, select');
        if (input) {
            // Add focus animations
            input.addEventListener('focus', function () {
                this.closest('.form-group').classList.add('focused');
                addFieldFocusEffect(this);
            });

            input.addEventListener('blur', function () {
                this.closest('.form-group').classList.remove('focused');
                validateField(this);
            });

            // Add input animations
            input.addEventListener('input', function () {
                handleFieldInput(this);
            });

            // Add floating labels effect
            if (input.value && input.value.trim() !== '') {
                input.closest('.form-group').classList.add('has-value');
            }

            input.addEventListener('input', function () {
                if (this.value && this.value.trim() !== '') {
                    this.closest('.form-group').classList.add('has-value');
                } else {
                    this.closest('.form-group').classList.remove('has-value');
                }
            });
        }
    });
}

function addFieldFocusEffect(field) {
    // Create ripple effect
    const rect = field.getBoundingClientRect();
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: fixed;
        background: rgba(139, 92, 246, 0.3);
        border-radius: 50%;
        width: 6px;
        height: 6px;
        animation: ripple 0.8s ease-out;
        pointer-events: none;
        z-index: 1000;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top + rect.height / 2}px;
        transform: translate(-50%, -50%);
    `;

    document.body.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 800);

    // Add field highlight
    field.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.3)';
    setTimeout(() => {
        field.style.boxShadow = '';
    }, 300);
}

function handleFieldInput(field) {
    // Real-time validation
    validateField(field);

    // Add typing effect
    field.classList.add('typing');
    clearTimeout(field.typingTimer);
    field.typingTimer = setTimeout(() => {
        field.classList.remove('typing');
    }, 1000);
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    const formGroup = field.closest('.form-group');

    // Remove existing error/success states
    formGroup.classList.remove('success', 'error');
    const existingError = formGroup.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }

    let isValid = true;
    let errorMessage = '';

    // Field-specific validation rules
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    } else if (fieldName === 'email' && value && !isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    } else if (fieldName === 'contact' && value && !isValidPhone(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid 10-digit phone number';
    } else if (fieldName === 'pin_code' && value && !isValidPinCode(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid 6-digit PIN code';
    } else if (fieldName === 'first_name' && value && value.length < 2) {
        isValid = false;
        errorMessage = 'First name must be at least 2 characters';
    } else if (fieldName === 'last_name' && value && value.length < 2) {
        isValid = false;
        errorMessage = 'Last name must be at least 2 characters';
    }

    if (!isValid) {
        formGroup.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = errorMessage;
        formGroup.appendChild(errorDiv);

        // Shake animation
        field.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            field.style.animation = '';
        }, 500);
    } else if (value) {
        formGroup.classList.add('success');

        // Success animation
        const successIcon = document.createElement('div');
        successIcon.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #10b981;
            font-size: 16px;
            animation: bounceIn 0.5s ease-out;
        `;
        successIcon.innerHTML = '✓';
        field.parentElement.style.position = 'relative';
        field.parentElement.appendChild(successIcon);

        setTimeout(() => {
            successIcon.remove();
        }, 2000);
    }

    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

function isValidPinCode(pinCode) {
    const pinCodeRegex = /^[0-9]{6}$/;
    return pinCodeRegex.test(pinCode);
}

function addSmoothAnimations() {
    // Add intersection observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });

    // Observe form elements
    document.querySelectorAll('.form-group, .form-container').forEach(element => {
        observer.observe(element);
    });

    // Add sidebar step hover effects
    const steps = document.querySelectorAll('.step-item');
    steps.forEach(step => {
        step.addEventListener('mouseenter', function () {
            this.style.transform = 'translateX(8px)';
        });

        step.addEventListener('mouseleave', function () {
            this.style.transform = 'translateX(0)';
        });
    });
}

function addFormValidation() {
    const form = document.querySelector('.elegant-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        const isValid = validateAllFields();
        if (!isValid) {
            e.preventDefault();

            // Focus on first error field
            const firstError = document.querySelector('.form-group.error input, .form-group.error textarea');
            if (firstError) {
                firstError.focus();
            }
        }
    });
}

function validateAllFields() {
    const requiredFields = document.querySelectorAll('.elegant-form input[required], .elegant-form textarea[required]');
    let allValid = true;

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            allValid = false;
        }
    });

    return allValid;
}

function addAutoSave() {
    let autoSaveTimer;
    const inputs = document.querySelectorAll('.elegant-form input, .elegant-form textarea');

    inputs.forEach(input => {
        input.addEventListener('input', function () {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                saveFormData();
            }, 2000); // Auto-save after 2 seconds of inactivity
        });
    });
}

function saveFormData() {
    const formData = new FormData(document.querySelector('.elegant-form'));
    const data = Object.fromEntries(formData);

    // Save to localStorage as backup
    localStorage.setItem('personalInfoFormData', JSON.stringify(data));
}

function loadFormData() {
    const savedData = localStorage.getItem('personalInfoFormData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            console.log('Saved form data available:', data);
            // Optionally restore form data here
        } catch (e) {
            console.log('Error loading saved form data:', e);
        }
    }
}

function addInteractiveElements() {
    // Add progress animation
    animateProgress();

    // Add sidebar interactions
    enhanceSidebar();

    // Add form container hover effects
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-8px)';
        });

        formContainer.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(-4px)';
        });
    }
}

function animateProgress() {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        // Animate progress bar on load
        const targetWidth = progressFill.style.width;
        progressFill.style.width = '0%';

        setTimeout(() => {
            progressFill.style.width = targetWidth;
        }, 500);
    }
}

function enhanceSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        // Add floating effect
        let isFloating = false;

        setInterval(() => {
            if (!isFloating) {
                isFloating = true;
                sidebar.style.transform = 'translateY(-2px)';
                setTimeout(() => {
                    sidebar.style.transform = 'translateY(0)';
                    isFloating = false;
                }, 2000);
            }
        }, 5000);
    }

    // Add step completion effects
    const activeStep = document.querySelector('.step-item.active');
    if (activeStep) {
        const stepNumber = activeStep.querySelector('.step-number');
        if (stepNumber) {
            stepNumber.style.animation = 'pulse 2s infinite';
        }
    }
}

function initializeContactField() {
    const contactInput = document.querySelector('input[name="contact"]');
    if (contactInput) {
        // Format phone number as user types
        contactInput.addEventListener('input', function () {
            let value = this.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length > 10) {
                value = value.substring(0, 10); // Limit to 10 digits
            }
            this.value = value;
        });

        // Add phone validation visual feedback
        contactInput.addEventListener('blur', function () {
            if (this.value && this.value.length === 10) {
                // showNotification('Valid phone number!', 'success', 1500); // Removed
            }
        });
    }
}

function showWelcomeAnimation() {
    const welcomeText = document.querySelector('.welcome-text');
    if (!welcomeText) return;

    const text = welcomeText.textContent;
    welcomeText.textContent = '';

    let i = 0;
    const typeWriter = () => {
        if (i < text.length) {
            welcomeText.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    };

    typeWriter();
}

// Add CSS for additional animations
const additionalStyles = `
<style>
@keyframes ripple {
    to {
        transform: translate(-50%, -50%) scale(15);
        opacity: 0;
    }
}

@keyframes bounceIn {
    0% {
        transform: translateY(-50%) scale(0);
        opacity: 0;
    }
    50% {
        transform: translateY(-50%) scale(1.2);
        opacity: 1;
    }
    100% {
        transform: translateY(-50%) scale(1);
        opacity: 1;
    }
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
    }
    50% {
        transform: scale(1.05);
        box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
    }
}

.form-group.focused {
    transform: scale(1.02);
}

.form-group.typing input {
    background: rgba(139, 92, 246, 0.02);
}

.form-group.has-value .form-label {
    color: var(--personal-primary);
    transform: translateY(-2px);
}

.form-group.animate-in {
    animation: slideInFromLeft 0.6s ease-out;
}

@keyframes slideInFromLeft {
    from {
        opacity: 0;
        transform: translateX(-30px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.sidebar {
    transition: transform 0.3s ease-out;
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Initialize saved data on load
loadFormData();

// Add keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFormData();
        // showNotification('Form data saved!', 'success', 2000); // Removed
    }

    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.querySelector('.elegant-form');
        if (form) {
            form.submit();
        }
    }
});

console.log('✨ Personal Info Form Enhanced Successfully!');
