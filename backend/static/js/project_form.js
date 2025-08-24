// Modern Project Form JavaScript - Enhanced User Experience

document.addEventListener('DOMContentLoaded', function () {
    // Initialize the project form
    initializeProjectForm();

    // Add smooth animations
    addSmoothAnimations();

    // Add form validation
    addFormValidation();

    // Add auto-save functionality
    addAutoSave();
});

function initializeProjectForm() {
    const totalForms = document.getElementById('id_form-TOTAL_FORMS');
    const formsContainer = document.querySelector('.project-forms');
    const emptyFormTemplate = document.getElementById('empty-form-template');

    if (!totalForms || !formsContainer || !emptyFormTemplate) {
        console.log('Project form elements not found');
        return;
    }

    // Add project button (if it exists)
    const addButton = document.getElementById('add-project');
    if (addButton) {
        addButton.addEventListener('click', function () {
            addNewProjectForm(totalForms, formsContainer, emptyFormTemplate.innerHTML);
        });
    }

    // Handle remove buttons
    document.addEventListener('click', function (e) {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            handleRemoveProject(removeBtn, totalForms);
        }
    });

    // Add form counters
    updateFormCounters();

    // Initialize existing forms
    initializeExistingForms();
}

function addNewProjectForm(totalForms, formsContainer, emptyFormTemplate) {
    const formNum = parseInt(totalForms.value);
    const newFormHtml = emptyFormTemplate.replace(/__prefix__/g, formNum);

    const wrapper = document.createElement('div');
    wrapper.classList.add('project-card');
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateY(30px)';

    wrapper.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">Project #${formNum + 1}</h3>
            <button type="button" class="remove-btn" data-index="${formNum}">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        </div>
        <div class="form-grid">
            ${newFormHtml}
        </div>
    `;

    formsContainer.appendChild(wrapper);

    // Animate in
    setTimeout(() => {
        wrapper.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        wrapper.style.opacity = '1';
        wrapper.style.transform = 'translateY(0)';
    }, 10);

    totalForms.value = formNum + 1;

    // Initialize the new form
    initializeFormFields(wrapper);
    updateFormCounters();

    // Scroll to new form
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Show success message
    showNotification('New project form added!', 'success');
}

function handleRemoveProject(removeBtn, totalForms) {
    const index = removeBtn.getAttribute('data-index');
    const card = removeBtn.closest('.project-card');
    const deleteField = document.getElementById(`id_form-${index}-DELETE`);

    // Add confirmation
    if (!confirm('Are you sure you want to remove this project?')) {
        return;
    }

    // Add loading state
    card.classList.add('loading');

    setTimeout(() => {
        if (deleteField) {
            // Mark for deletion
            deleteField.checked = true;
            card.style.transition = 'all 0.4s ease-out';
            card.style.opacity = '0';
            card.style.transform = 'translateY(-20px) scale(0.95)';

            setTimeout(() => {
                card.style.display = 'none';
            }, 400);
        } else {
            // Remove immediately
            card.style.transition = 'all 0.4s ease-out';
            card.style.opacity = '0';
            card.style.transform = 'translateY(-20px) scale(0.95)';

            setTimeout(() => {
                card.remove();
                const remaining = document.querySelectorAll('.project-card').length;
                totalForms.value = remaining;
                updateFormCounters();
            }, 400);
        }

        showNotification('Project removed successfully!', 'info');
    }, 500);
}

function initializeExistingForms() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        // Stagger animation
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);

        initializeFormFields(card);
    });
}

function initializeFormFields(card) {
    const inputs = card.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        // Add focus animations
        input.addEventListener('focus', function () {
            this.parentElement.classList.add('focused');
            addFieldAnimation(this);
        });

        input.addEventListener('blur', function () {
            this.parentElement.classList.remove('focused');
        });

        // Add input animations
        input.addEventListener('input', function () {
            validateField(this);
        });

        // Add floating labels effect
        if (input.value) {
            input.parentElement.classList.add('has-value');
        }

        input.addEventListener('input', function () {
            if (this.value) {
                this.parentElement.classList.add('has-value');
            } else {
                this.parentElement.classList.remove('has-value');
            }
        });
    });


}

function addFieldAnimation(field) {
    // Create ripple effect
    const rect = field.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.style.cssText = `
        position: absolute;
        background: rgba(139, 92, 246, 0.3);
        border-radius: 50%;
        width: 4px;
        height: 4px;
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1000;
        left: ${rect.left + window.scrollX}px;
        top: ${rect.top + window.scrollY}px;
    `;

    document.body.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
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

    document.querySelectorAll('.project-card').forEach(card => {
        observer.observe(card);
    });
}

function addFormValidation() {
    const form = document.querySelector('.elegant-projects-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        const isValid = validateAllFields();
        if (!isValid) {
            e.preventDefault();
            showNotification('Please fill in all required fields correctly.', 'error');
        } else {
            showNotification('Saving your projects...', 'loading');
        }
    });
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;

    // Remove existing error
    const existingError = field.parentElement.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }

    let isValid = true;
    let errorMessage = '';

    // Basic validation rules
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    } else if (fieldName.includes('email') && value && !isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    } else if (fieldName.includes('link') && value && !isValidUrl(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid URL';
    }

    if (!isValid) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = errorMessage;
        field.parentElement.appendChild(errorDiv);
        field.style.borderColor = '#ef4444';
    } else {
        field.style.borderColor = '#10b981';
    }

    return isValid;
}

function validateAllFields() {
    const fields = document.querySelectorAll('.project-card input[required], .project-card textarea[required]');
    let allValid = true;

    fields.forEach(field => {
        if (!validateField(field)) {
            allValid = false;
        }
    });

    return allValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function updateFormCounters() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card, index) => {
        const title = card.querySelector('.card-title');
        if (title) {
            title.textContent = `Project #${index + 1}`;
        }
    });
}

function addAutoSave() {
    let autoSaveTimer;
    const inputs = document.querySelectorAll('.project-card input, .project-card textarea');

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
    const formData = new FormData(document.querySelector('.elegant-projects-form'));
    const data = Object.fromEntries(formData);

    // Save to localStorage as backup
    localStorage.setItem('projectFormData', JSON.stringify(data));

    // Show subtle save indicator
    showNotification('Changes saved locally', 'info', 2000);
}

function loadFormData() {
    const savedData = localStorage.getItem('projectFormData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            // Restore form data if needed
            console.log('Saved form data available:', data);
        } catch (e) {
            console.log('Error loading saved form data:', e);
        }
    }
}

function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existing = document.querySelector('.form-notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `form-notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        transform: translateX(100%);
        transition: transform 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        loading: '⏳'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        loading: '#8b5cf6'
    };
    return colors[type] || colors.info;
}

// Add CSS for additional animations
const additionalStyles = `
<style>
.form-notification {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.project-card.animate-in {
    animation: slideInFromRight 0.6s ease-out;
}

@keyframes slideInFromRight {
    from {
        opacity: 0;
        transform: translateX(50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes ripple {
    to {
        transform: scale(20);
        opacity: 0;
    }
}

.form-group.focused {
    transform: scale(1.02);
}

.form-group.has-value label {
    color: var(--project-primary);
    transform: translateY(-2px);
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Initialize saved data on load
loadFormData();
