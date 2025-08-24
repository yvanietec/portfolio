/* Social Links JavaScript - Step 2 Specific Features */

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Social Links Step 2 enhancements loaded');
    initializeSocialLinksStep2();
});

function initializeSocialLinksStep2() {
    console.log('🚀 Initializing social links step 2 features...');

    // Add specific class for step 2 styling
    const container = document.querySelector('.form-layout-container');
    if (container) {
        container.classList.add('social-links-step2');
    }

    // Initialize step 2 specific features
    initializeSocialLinkValidation();
    initializeSocialIconUpdates();
    initializeSocialLinkPreviews();

    console.log('🎉 Social links step 2 features initialized successfully!');
}

// Social Link Validation
function initializeSocialLinkValidation() {
    const socialInputs = {
        'github_link': {
            pattern: /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/?$/,
            message: 'Please enter a valid GitHub URL (e.g., https://github.com/username)',
            icon: 'fab fa-github'
        },
        'linkedin_link': {
            pattern: /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w\-\.]+\/?$/,
            message: 'Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)',
            icon: 'fab fa-linkedin'
        },
        'facebook_link': {
            pattern: /^https?:\/\/(www\.)?facebook\.com\/[\w\-\.]+\/?$/,
            message: 'Please enter a valid Facebook URL (e.g., https://facebook.com/username)',
            icon: 'fab fa-facebook'
        },
        'instagram_link': {
            pattern: /^https?:\/\/(www\.)?instagram\.com\/[\w\-\.]+\/?$/,
            message: 'Please enter a valid Instagram URL (e.g., https://instagram.com/username)',
            icon: 'fab fa-instagram'
        },
        'twitter_link': {
            pattern: /^https?:\/\/(www\.)?twitter\.com\/[\w\-\.]+\/?$/,
            message: 'Please enter a valid Twitter URL (e.g., https://twitter.com/username)',
            icon: 'fab fa-twitter'
        },
        'youtube_link': {
            pattern: /^https?:\/\/(www\.)?youtube\.com\/(channel\/|c\/|user\/)?[\w\-\.]+\/?$/,
            message: 'Please enter a valid YouTube URL',
            icon: 'fab fa-youtube'
        },
        'portfolio_website': {
            pattern: /^https?:\/\/[\w\-\.]+(\.[\w\-\.]+)+.*$/,
            message: 'Please enter a valid website URL (e.g., https://yourportfolio.com)',
            icon: 'fas fa-globe'
        },
        'other_social_link': {
            pattern: /^https?:\/\/[\w\-\.]+(\.[\w\-\.]+)+.*$/,
            message: 'Please enter a valid URL (e.g., https://example.com)',
            icon: 'fas fa-link'
        }
    };

    Object.keys(socialInputs).forEach(fieldName => {
        const input = document.querySelector(`input[name="${fieldName}"]`);
        if (input) {
            // Real-time validation
            input.addEventListener('input', function () {
                validateSocialLink(this, socialInputs[fieldName]);
            });

            input.addEventListener('blur', function () {
                validateSocialLink(this, socialInputs[fieldName]);
            });

            // Initial validation if field has value
            if (input.value.trim()) {
                validateSocialLink(input, socialInputs[fieldName]);
            }
        }
    });

    console.log('✅ Social link validation initialized');
}

function validateSocialLink(input, config) {
    const value = input.value.trim();
    const container = input.closest('.social-input-container') || input.parentNode;

    // Remove existing validation classes
    container.classList.remove('valid', 'invalid');
    removeFieldError(input);

    if (value === '') {
        return true;
    }

    // Validate against pattern
    if (config.pattern && !config.pattern.test(value)) {
        container.classList.add('invalid');
        showFieldError(input, config.message);
        return false;
    }

    // Basic URL validation
    try {
        new URL(value);
        container.classList.add('valid');
        showSocialLinkSuccess(input, value);
        return true;
    } catch {
        container.classList.add('invalid');
        showFieldError(input, 'Please enter a valid URL');
        return false;
    }
}

// Social Icon Updates
function initializeSocialIconUpdates() {
    const socialFields = document.querySelectorAll('.social-input-container input');

    socialFields.forEach(input => {
        input.addEventListener('input', function () {
            updateSocialIcon(this);
        });
    });

    console.log('✅ Social icon updates initialized');
}

function updateSocialIcon(input) {
    const container = input.closest('.social-input-container');
    if (!container) return;

    const icon = container.querySelector('.social-icon');
    if (!icon) return;

    const value = input.value.trim().toLowerCase();

    // Reset to default icon
    icon.className = 'social-icon fas fa-link';

    if (value.includes('github.com')) {
        icon.className = 'social-icon fab fa-github';
    } else if (value.includes('linkedin.com')) {
        icon.className = 'social-icon fab fa-linkedin';
    } else if (value.includes('facebook.com')) {
        icon.className = 'social-icon fab fa-facebook';
    } else if (value.includes('instagram.com')) {
        icon.className = 'social-icon fab fa-instagram';
    } else if (value.includes('twitter.com')) {
        icon.className = 'social-icon fab fa-twitter';
    } else if (value.includes('youtube.com')) {
        icon.className = 'social-icon fab fa-youtube';
    } else if (value && (value.includes('http') || value.includes('www'))) {
        icon.className = 'social-icon fas fa-globe';
    }
}

// Social Link Previews
function initializeSocialLinkPreviews() {
    const socialFields = document.querySelectorAll('.social-input-container input');

    socialFields.forEach(input => {
        input.addEventListener('blur', function () {
            if (this.value.trim() && this.closest('.social-input-container').classList.contains('valid')) {
                showSocialLinkPreview(this);
            }
        });
    });

    console.log('✅ Social link previews initialized');
}

function showSocialLinkPreview(input) {
    const url = input.value.trim();
    if (!url) return;

    // Remove existing preview
    const existingPreview = input.parentNode.parentNode.querySelector('.social-preview');
    if (existingPreview) {
        existingPreview.remove();
    }

    // Create preview
    const preview = document.createElement('div');
    preview.className = 'social-preview';
    preview.innerHTML = `
        <div style="margin-top: 10px; padding: 10px; background: #f0f9ff; border-radius: 6px; border-left: 3px solid #3b82f6;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-external-link-alt" style="color: #3b82f6; font-size: 12px;"></i>
                <a href="${url}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500;">
                    ${url.length > 40 ? url.substring(0, 40) + '...' : url}
                </a>
            </div>
        </div>
    `;

    input.parentNode.parentNode.appendChild(preview);
}

function showSocialLinkSuccess(input, url) {
    const container = input.closest('.social-input-container');
    if (!container) return;

    // Add success styling
    container.style.borderColor = '#10b981';
    container.style.backgroundColor = '#f0fdf4';

    // Show success icon temporarily
    const icon = container.querySelector('.social-icon');
    if (icon) {
        const originalClass = icon.className;
        icon.className = 'social-icon fas fa-check';
        icon.style.color = '#10b981';

        setTimeout(() => {
            icon.className = originalClass;
            icon.style.color = '';
            container.style.borderColor = '';
            container.style.backgroundColor = '';
        }, 2000);
    }
}

// Utility functions specific to social links
function showFieldError(field, message) {
    removeFieldError(field);

    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'social-error';
    errorDiv.textContent = message;

    field.parentNode.parentNode.appendChild(errorDiv);
}

function removeFieldError(field) {
    field.classList.remove('error');

    const errorDiv = field.parentNode.parentNode.querySelector('.social-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Auto-format URLs (add https:// if missing)
document.addEventListener('DOMContentLoaded', function () {
    const urlFields = document.querySelectorAll('.social-input-container input');

    urlFields.forEach(field => {
        field.addEventListener('blur', function () {
            let value = this.value.trim();
            if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                this.value = 'https://' + value;
            }
        });
    });
});

console.log('✅ Social Links Step 2 JavaScript loaded successfully');
