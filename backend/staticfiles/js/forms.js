/* Common Form JavaScript - Modern Features */

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Common form enhancements loaded');
    initializeCommonFormFeatures();
});

function initializeCommonFormFeatures() {
    console.log('🚀 Initializing common form features...');

    // Initialize all common features
    initializeInputEnhancements();
    initializeFormValidation();
    initializeProgressIndicator();
    initializeAnimations();
    initializeFileUploads();
    initializeFormPersistence();

    console.log('🎉 All common form features initialized successfully!');
}

// Enhanced Input Interactions
function initializeInputEnhancements() {
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        // Add focus and blur event listeners
        input.addEventListener('focus', function () {
            this.closest('.form-group')?.classList.add('focused');
            this.closest('.social-input-container')?.classList.add('focused');
            this.closest('.contact-field-container')?.classList.add('focused');
        });

        input.addEventListener('blur', function () {
            this.closest('.form-group')?.classList.remove('focused');
            this.closest('.social-input-container')?.classList.remove('focused');
            this.closest('.contact-field-container')?.classList.remove('focused');

            if (this.value.trim() === '') {
                this.closest('.form-group')?.classList.remove('has-value');
                this.closest('.social-input-container')?.classList.remove('has-value');
            } else {
                this.closest('.form-group')?.classList.add('has-value');
                this.closest('.social-input-container')?.classList.add('has-value');
            }
        });

        // Real-time validation
        input.addEventListener('input', function () {
            validateField(this);
            removeErrorDisplay(this);
        });

        // Initial state check
        if (input.value.trim() !== '') {
            input.closest('.form-group')?.classList.add('has-value');
            input.closest('.social-input-container')?.classList.add('has-value');
        }
    });

    console.log('✅ Input enhancements initialized');
}

// Form Validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', function (e) {
            if (!validateForm(this)) {
                e.preventDefault();
                showFormErrors();
                return false;
            }
        });

        // Real-time validation on field change
        const fields = form.querySelectorAll('input, textarea, select');
        fields.forEach(field => {
            field.addEventListener('blur', () => validateField(field));
            field.addEventListener('input', () => removeErrorDisplay(field));
        });
    });

    console.log('✅ Form validation initialized');
}

function validateForm(form) {
    let isValid = true;
    const fields = form.querySelectorAll('input[required], textarea[required], select[required]');

    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const required = field.hasAttribute('required');
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (required && !value) {
        isValid = false;
        errorMessage = `${getFieldLabel(field)} is required`;
    }

    // Email validation
    if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }

    // Phone validation
    if (type === 'tel' && value) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(value.replace(/\D/g, ''))) {
            isValid = false;
            errorMessage = 'Please enter a valid 10-digit phone number';
        }
    }

    // URL validation
    if (type === 'url' && value) {
        try {
            new URL(value);
        } catch {
            isValid = false;
            errorMessage = 'Please enter a valid URL (include http:// or https://)';
        }
    }

    // Display validation result
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        removeFieldError(field);
    }

    return isValid;
}

function getFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : 'This field';
}

function showFieldError(field, message) {
    removeFieldError(field);

    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;

    field.parentNode.appendChild(errorDiv);
}

function removeFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.form-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function removeErrorDisplay(field) {
    field.classList.remove('error');
}

function showFormErrors() {
    const firstError = document.querySelector('.form-error');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Focus the field with error
        const errorField = firstError.parentNode.querySelector('input, textarea, select');
        if (errorField) {
            setTimeout(() => errorField.focus(), 300);
        }
    }
}

// Progress Indicator
function initializeProgressIndicator() {
    updateProgressFromURL();

    console.log('✅ Progress indicator initialized');
}

function updateProgressFromURL() {
    const path = window.location.pathname;
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    if (!progressBar) return;

    let progress = 10; // Default
    let completedSteps = 1;

    // Define progress for each step
    const stepProgress = {
        'personal_info1': { progress: 10, steps: 1 },
        'personal_info2': { progress: 20, steps: 2 },
        'add_education': { progress: 30, steps: 3 },
        'add_experience': { progress: 40, steps: 4 },
        'add_project': { progress: 50, steps: 5 },
        'add_skill': { progress: 60, steps: 6 },
        'add_certification': { progress: 70, steps: 7 },
        'add_language': { progress: 80, steps: 8 },
        'add_hobby': { progress: 90, steps: 9 },
        'add_summary': { progress: 100, steps: 10 }
    };

    // Find current step
    for (const [step, data] of Object.entries(stepProgress)) {
        if (path.includes(step)) {
            progress = data.progress;
            completedSteps = data.steps;
            break;
        }
    }

    // Animate progress
    setTimeout(() => {
        progressBar.style.width = progress + '%';
        if (progressText) {
            progressText.textContent = `${completedSteps}/10 completed`;
        }
    }, 500);
}

// Form Animations
function initializeAnimations() {
    // Animate form groups on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    const formGroups = document.querySelectorAll('.form-group, .social-field-group');
    formGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateY(20px)';
        group.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(group);
    });

    console.log('✅ Form animations initialized');
}

// File Upload Enhancements
function initializeFileUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"]');

    fileInputs.forEach(input => {
        input.addEventListener('change', function () {
            handleFileUpload(this);
        });

        // Drag and drop functionality
        const parent = input.parentElement;
        if (parent) {
            parent.addEventListener('dragover', function (e) {
                e.preventDefault();
                this.classList.add('drag-over');
            });

            parent.addEventListener('dragleave', function (e) {
                e.preventDefault();
                this.classList.remove('drag-over');
            });

            parent.addEventListener('drop', function (e) {
                e.preventDefault();
                this.classList.remove('drag-over');

                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    input.files = files;
                    handleFileUpload(input);
                }
            });
        }
    });

    console.log('✅ File upload enhancements initialized');
}

function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showFieldError(input, 'File size must be less than 10MB');
        input.value = '';
        return;
    }

    // File type validation for profile photos
    if (input.name === 'profile_photo') {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            showFieldError(input, 'Please select a valid image file (JPEG, PNG, or GIF)');
            input.value = '';
            return;
        }
    }

    // Show file name
    const fileName = file.name;
    const label = input.previousElementSibling || input.nextElementSibling;
    if (label && label.tagName === 'LABEL') {
        label.textContent = `Selected: ${fileName}`;
        label.style.color = '#27ae60';
    }

    removeFieldError(input);
}

// Form Persistence (Auto-save to localStorage)
function initializeFormPersistence() {
    const form = document.querySelector('form');
    if (!form) return;

    const formId = getFormId();

    // Load saved data
    loadFormData(formId);

    // Save data on input
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            saveFormData(formId);
        });
    });

    // Clear saved data on successful submission
    form.addEventListener('submit', () => {
        clearFormData(formId);
    });

    console.log('✅ Form persistence initialized');
}

function getFormId() {
    const path = window.location.pathname;
    return `form_data_${path.replace(/\//g, '_')}`;
}

function saveFormData(formId) {
    const form = document.querySelector('form');
    if (!form) return;

    const formData = {};
    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        if (input.type !== 'file' && input.type !== 'password') {
            formData[input.name] = input.value;
        }
    });

    localStorage.setItem(formId, JSON.stringify(formData));
}

function loadFormData(formId) {
    const savedData = localStorage.getItem(formId);
    if (!savedData) return;

    try {
        const formData = JSON.parse(savedData);
        const form = document.querySelector('form');
        if (!form) return;

        Object.keys(formData).forEach(name => {
            const input = form.querySelector(`[name="${name}"]`);
            if (input && input.type !== 'file') {
                input.value = formData[name];
                // Trigger change event to update UI
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    } catch (e) {
        console.warn('Failed to load saved form data:', e);
    }
}

function clearFormData(formId) {
    localStorage.removeItem(formId);
}

// Social Link Validation
function validateSocialLink(input) {
    const value = input.value.trim();
    const platform = input.name;

    if (!value) return true;

    const patterns = {
        linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
        github: /^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/,
        twitter: /^https?:\/\/(www\.)?twitter\.com\/[\w-]+\/?$/,
        instagram: /^https?:\/\/(www\.)?instagram\.com\/[\w-]+\/?$/,
        facebook: /^https?:\/\/(www\.)?facebook\.com\/[\w.-]+\/?$/,
        youtube: /^https?:\/\/(www\.)?youtube\.com\/(channel\/|c\/|user\/)?[\w-]+\/?$/,
        portfolio: /^https?:\/\/.+$/
    };

    const pattern = patterns[platform];
    if (pattern && !pattern.test(value)) {
        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
        showFieldError(input, `Please enter a valid ${platformName} URL`);
        return false;
    }

    removeFieldError(input);
    return true;
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for external use
window.FormAPI = {
    validateField,
    validateSocialLink,
    saveFormData: () => saveFormData(getFormId()),
    loadFormData: () => loadFormData(getFormId())
};

console.log('✅ Common form JavaScript loaded successfully');
