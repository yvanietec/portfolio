/**
 * Form Validation and Character Counting
 * Prevents database flooding by enforcing character limits on client-side
 */

document.addEventListener('DOMContentLoaded', function () {
    // Add form submission validation
    addFormValidation();

    // Add character limit prevention
    addCharacterLimitPrevention();
});

function addCharacterLimitPrevention() {
    // Find all textareas and inputs with maxlength attribute
    const textElements = document.querySelectorAll('textarea[maxlength], input[maxlength]');

    textElements.forEach(element => {
        const maxLength = parseInt(element.getAttribute('maxlength'));
        const fieldName = element.name || element.id || 'field';

        // Prevent typing beyond maxlength
        element.addEventListener('keydown', function (e) {
            if (element.value.length >= maxLength &&
                !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) {
                e.preventDefault();
                showCharacterLimitWarning(fieldName, maxLength);
            }
        });

        // Prevent paste beyond maxlength
        element.addEventListener('paste', function (e) {
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (element.value.length + pastedText.length > maxLength) {
                e.preventDefault();
                showCharacterLimitWarning(fieldName, maxLength);
            }
        });
    });
}

function addFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', function (e) {
            const errors = validateForm(form);

            if (errors.length > 0) {
                e.preventDefault();
                showValidationErrors(errors);
            }
        });
    });
}

function validateForm(form) {
    const errors = [];
    const textElements = form.querySelectorAll('textarea[maxlength], input[maxlength]');

    textElements.forEach(element => {
        const maxLength = parseInt(element.getAttribute('maxlength'));
        const currentLength = element.value.length;
        const fieldName = element.name || element.id || 'field';

        if (currentLength > maxLength) {
            errors.push(`${fieldName}: Cannot exceed ${maxLength} characters`);
        }

        // Check for minimum length requirements
        const minLength = getMinimumLength(fieldName);
        if (minLength && currentLength > 0 && currentLength < minLength) {
            errors.push(`${fieldName}: Must be at least ${minLength} characters`);
        }
    });

    return errors;
}

function getMinimumLength(fieldName) {
    // Define minimum lengths based on field names
    const minLengths = {
        'description': 10,
        'content': 30,
        'summary': 30,
        'job_title': 3,
        'company_name': 2,
        'institution': 3,
        'degree': 3,
        'certification_name': 3,
        'issuer': 2
    };

    // Check if field name contains any of the key words
    for (const [key, minLength] of Object.entries(minLengths)) {
        if (fieldName.toLowerCase().includes(key)) {
            return minLength;
        }
    }

    return null;
}

function showCharacterLimitWarning(fieldName, maxLength) {
    // Create or update warning message
    let warning = document.getElementById('character-limit-warning');
    if (!warning) {
        warning = document.createElement('div');
        warning.id = 'character-limit-warning';
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc2626;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
        `;
        document.body.appendChild(warning);
    }

    warning.textContent = `Character limit reached for ${fieldName} (${maxLength} characters)`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (warning.parentNode) {
            warning.parentNode.removeChild(warning);
        }
    }, 3000);
}

function showValidationErrors(errors) {
    // Remove existing error display
    const existingError = document.getElementById('form-validation-errors');
    if (existingError) {
        existingError.remove();
    }

    // Create error display
    const errorDiv = document.createElement('div');
    errorDiv.id = 'form-validation-errors';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #dc2626;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        max-width: 500px;
        max-height: 300px;
        overflow-y: auto;
    `;

    const title = document.createElement('h4');
    title.textContent = 'Please fix the following errors:';
    title.style.margin = '0 0 12px 0';
    errorDiv.appendChild(title);

    const errorList = document.createElement('ul');
    errorList.style.margin = '0';
    errorList.style.paddingLeft = '20px';

    errors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error;
        li.style.marginBottom = '4px';
        errorList.appendChild(li);
    });

    errorDiv.appendChild(errorList);
    document.body.appendChild(errorDiv);

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Auto-resize textareas
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Initialize auto-resize for all textareas
document.addEventListener('DOMContentLoaded', function () {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        // Set initial height
        autoResizeTextarea(textarea);

        // Add event listeners
        textarea.addEventListener('input', function () {
            autoResizeTextarea(this);
        });

        textarea.addEventListener('focus', function () {
            autoResizeTextarea(this);
        });
    });
});
