/* Personal Info Forms JavaScript - Step 1 Specific Features */

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Personal Info Step 1 enhancements loaded');
    initializePersonalInfoStep1();
});

function initializePersonalInfoStep1() {
    console.log('🚀 Initializing personal info step 1 features...');

    // Add specific class for step 1 styling
    const container = document.querySelector('.form-layout-container');
    if (container) {
        container.classList.add('personal-info-step1');
    }

    // Initialize step 1 specific features
    initializeContactFieldFormatting();
    initializeProfilePhotoPreview();
    initializeStep1Validation();
    initializeNameFieldCapitalization();

    console.log('🎉 Personal info step 1 features initialized successfully!');
}

// Contact Field Formatting for Indian numbers
function initializeContactFieldFormatting() {
    const contactField = document.querySelector('input[name="contact"]');
    if (!contactField) return;

    contactField.addEventListener('input', function () {
        // Remove any non-digit characters
        let value = this.value.replace(/\D/g, '');

        // Limit to 10 digits
        if (value.length > 10) {
            value = value.substring(0, 10);
        }

        this.value = value;

        // Real-time validation
        validateContactField(this);
    });

    contactField.addEventListener('blur', function () {
        validateContactField(this);
    });

    console.log('✅ Contact field formatting initialized');
}

function validateContactField(field) {
    const value = field.value.trim();

    if (value && value.length !== 10) {
        showFieldError(field, 'Please enter a valid 10-digit mobile number');
        return false;
    }

    if (value && !/^[6-9]\d{9}$/.test(value)) {
        showFieldError(field, 'Please enter a valid Indian mobile number');
        return false;
    }

    removeFieldError(field);
    return true;
}

// Profile Photo Preview
function initializeProfilePhotoPreview() {
    const photoInput = document.querySelector('input[name="profile_photo"]');
    if (!photoInput) return;

    photoInput.addEventListener('change', function () {
        handlePhotoPreview(this);
    });

    console.log('✅ Profile photo preview initialized');
}

function handlePhotoPreview(input) {
    const file = input.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showFieldError(input, 'Please select a valid image file (JPEG, PNG, or GIF)');
        input.value = '';
        return;
    }

    // Validate file size (5MB limit for profile photos)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showFieldError(input, 'Profile photo must be less than 5MB');
        input.value = '';
        return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = function (e) {
        showPhotoPreview(e.target.result, input);
    };
    reader.readAsDataURL(file);

    removeFieldError(input);
}

function showPhotoPreview(src, input) {
    // Remove existing preview
    const existingPreview = input.parentNode.querySelector('.photo-preview');
    if (existingPreview) {
        existingPreview.remove();
    }

    // Create new preview
    const preview = document.createElement('div');
    preview.className = 'photo-preview';
    preview.innerHTML = `
        <div style="margin-top: 15px; text-align: center;">
            <img src="${src}" alt="Preview" style="max-width: 150px; max-height: 150px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="margin-top: 8px; font-size: 14px; color: #27ae60;">✓ Photo selected</p>
        </div>
    `;

    input.parentNode.appendChild(preview);
}

// Step 1 Specific Validation
function initializeStep1Validation() {
    const form = document.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        if (!validateStep1Form()) {
            e.preventDefault();
            return false;
        }
    });

    console.log('✅ Step 1 validation initialized');
}

function validateStep1Form() {
    let isValid = true;
    const requiredFields = [
        'first_name',
        'last_name',
        'email',
        'contact'
    ];

    requiredFields.forEach(fieldName => {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            if (!field.value.trim()) {
                showFieldError(field, `${getFieldLabel(field)} is required`);
                isValid = false;
            } else if (fieldName === 'contact') {
                if (!validateContactField(field)) {
                    isValid = false;
                }
            } else if (fieldName === 'email') {
                if (!validateEmailField(field)) {
                    isValid = false;
                }
            }
        }
    });

    return isValid;
}

function validateEmailField(field) {
    const email = field.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }

    removeFieldError(field);
    return true;
}

// Name field capitalization
function initializeNameFieldCapitalization() {
    const nameFields = document.querySelectorAll('input[name="first_name"], input[name="last_name"]');

    nameFields.forEach(field => {
        field.addEventListener('input', function () {
            // Capitalize first letter of each word
            this.value = this.value.replace(/\b\w/g, l => l.toUpperCase());
        });
    });

    console.log('✅ Name field capitalization initialized');
}

// Utility functions
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

    // Add error styling to the field
    field.style.borderColor = '#e74c3c';
}

function removeFieldError(field) {
    field.classList.remove('error');
    field.style.borderColor = '';

    const errorDiv = field.parentNode.querySelector('.form-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

console.log('✅ Personal Info Step 1 JavaScript loaded successfully');
