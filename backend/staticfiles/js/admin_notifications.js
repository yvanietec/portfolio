/* Admin Notifications JavaScript */
document.addEventListener('DOMContentLoaded', function () {
    initializeNotificationForm();
    initializePreview();
    initializeCharacterCounts();
    initializeScheduling();
});

function initializeNotificationForm() {
    const form = document.getElementById('notificationForm');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Confirm sending
        const audienceText = getSelectedAudienceText();
        const scheduleMethod = document.getElementById('send_method').value;

        let confirmMessage = `Send notification to ${audienceText}?`;
        if (scheduleMethod === 'scheduled') {
            const scheduleTime = document.getElementById('schedule_time').value;
            confirmMessage = `Schedule notification for ${new Date(scheduleTime).toLocaleString()}?`;
        }

        if (confirm(confirmMessage)) {
            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            // Simulate sending (replace with actual form submission)
            setTimeout(() => {
                this.submit();
            }, 1000);
        }
    });
}

function initializePreview() {
    const titleInput = document.getElementById('title');
    const messageInput = document.getElementById('message');
    const prioritySelect = document.getElementById('priority');
    const notificationTypeInputs = document.querySelectorAll('input[name="notification_type"]');

    const previewTitle = document.getElementById('previewTitle');
    const previewMessage = document.getElementById('previewMessage');
    const previewPriority = document.getElementById('previewPriority');
    const previewAudience = document.getElementById('previewAudience');

    // Update preview on input changes
    titleInput.addEventListener('input', function () {
        previewTitle.textContent = this.value || 'Your notification title will appear here';
    });

    messageInput.addEventListener('input', function () {
        previewMessage.textContent = this.value || 'Your notification message will appear here as you type...';
    });

    prioritySelect.addEventListener('change', function () {
        const priorityText = this.options[this.selectedIndex].text;
        previewPriority.textContent = priorityText;
        previewPriority.className = `notification-preview-priority priority-${this.value}`;
    });

    notificationTypeInputs.forEach(input => {
        input.addEventListener('change', function () {
            if (this.checked) {
                previewAudience.textContent = getSelectedAudienceText();
            }
        });
    });
}

function initializeCharacterCounts() {
    const titleInput = document.getElementById('title');
    const messageInput = document.getElementById('message');
    const titleCount = document.getElementById('titleCount');
    const messageCount = document.getElementById('messageCount');

    titleInput.addEventListener('input', function () {
        titleCount.textContent = this.value.length;

        // Color coding for character limits
        if (this.value.length > 80) {
            titleCount.style.color = '#dc3545';
        } else if (this.value.length > 60) {
            titleCount.style.color = '#ffc107';
        } else {
            titleCount.style.color = '#28a745';
        }
    });

    messageInput.addEventListener('input', function () {
        messageCount.textContent = this.value.length;

        // Color coding for character limits
        if (this.value.length > 400) {
            messageCount.style.color = '#dc3545';
        } else if (this.value.length > 300) {
            messageCount.style.color = '#ffc107';
        } else {
            messageCount.style.color = '#28a745';
        }
    });
}

function initializeScheduling() {
    const sendMethodSelect = document.getElementById('send_method');
    const scheduleSection = document.getElementById('scheduleSection');
    const scheduleTimeInput = document.getElementById('schedule_time');

    sendMethodSelect.addEventListener('change', function () {
        if (this.value === 'scheduled') {
            scheduleSection.style.display = 'block';
            scheduleTimeInput.required = true;

            // Set minimum date to current time
            const now = new Date();
            now.setMinutes(now.getMinutes() + 5); // At least 5 minutes from now
            scheduleTimeInput.min = now.toISOString().slice(0, 16);
        } else {
            scheduleSection.style.display = 'none';
            scheduleTimeInput.required = false;
        }
    });
}

function validateForm() {
    const title = document.getElementById('title').value.trim();
    const message = document.getElementById('message').value.trim();
    const sendMethod = document.getElementById('send_method').value;
    const scheduleTime = document.getElementById('schedule_time').value;

    // Basic validation
    if (!title) {
        showValidationError('Please enter a notification title');
        return false;
    }

    if (!message) {
        showValidationError('Please enter a notification message');
        return false;
    }

    if (title.length > 100) {
        showValidationError('Title must be 100 characters or less');
        return false;
    }

    if (message.length > 500) {
        showValidationError('Message must be 500 characters or less');
        return false;
    }

    // Schedule validation
    if (sendMethod === 'scheduled') {
        if (!scheduleTime) {
            showValidationError('Please select a schedule time');
            return false;
        }

        const selectedTime = new Date(scheduleTime);
        const now = new Date();

        if (selectedTime <= now) {
            showValidationError('Schedule time must be in the future');
            return false;
        }
    }

    return true;
}

function getSelectedAudienceText() {
    const selectedType = document.querySelector('input[name="notification_type"]:checked');
    if (!selectedType) return 'All Users';

    switch (selectedType.value) {
        case 'all': return 'All Users';
        case 'students': return 'Students Only';
        case 'agents': return 'Agents Only';
        case 'custom': return 'Custom Selection';
        default: return 'All Users';
    }
}

function showValidationError(message) {
    // Create or update validation error display
    let errorDiv = document.querySelector('.notification-validation-error');

    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'notification-validation-error';

        // Insert after the form header
        const formCard = document.querySelector('.admin-form-card');
        formCard.insertBefore(errorDiv, formCard.firstChild);
    }

    errorDiv.innerHTML = `
        <div class="notification-error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button class="notification-error-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

    // Add error styles if not already added
    if (!document.getElementById('notificationErrorStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationErrorStyles';
        style.textContent = `
            .notification-validation-error {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1.5rem;
                border-left: 4px solid #dc3545;
            }
            
            .notification-error-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: #721c24;
            }
            
            .notification-error-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #721c24;
                margin-left: auto;
                padding: 0.25rem;
            }
        `;
        document.head.appendChild(style);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);

    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
    if (confirm('Reset the form? All entered data will be lost.')) {
        // Reset form fields
        document.getElementById('notificationForm').reset();

        // Reset preview
        document.getElementById('previewTitle').textContent = 'Your notification title will appear here';
        document.getElementById('previewMessage').textContent = 'Your notification message will appear here as you type...';
        document.getElementById('previewPriority').textContent = 'Normal';
        document.getElementById('previewPriority').className = 'notification-preview-priority priority-normal';
        document.getElementById('previewAudience').textContent = 'All Users';

        // Reset character counts
        document.getElementById('titleCount').textContent = '0';
        document.getElementById('messageCount').textContent = '0';
        document.getElementById('titleCount').style.color = '#28a745';
        document.getElementById('messageCount').style.color = '#28a745';

        // Hide schedule section
        document.getElementById('scheduleSection').style.display = 'none';

        // Remove any validation errors
        const errorDiv = document.querySelector('.notification-validation-error');
        if (errorDiv) {
            errorDiv.remove();
        }

        showSuccessMessage('Form reset successfully');
    }
}

function saveDraft() {
    const title = document.getElementById('title').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!title && !message) {
        showValidationError('Please enter some content before saving as draft');
        return;
    }

    // Save to localStorage as draft
    const draft = {
        title: title,
        message: message,
        priority: document.getElementById('priority').value,
        notification_type: document.querySelector('input[name="notification_type"]:checked').value,
        send_method: document.getElementById('send_method').value,
        schedule_time: document.getElementById('schedule_time').value,
        saved_at: new Date().toISOString()
    };

    localStorage.setItem('notification_draft', JSON.stringify(draft));
    showSuccessMessage('Draft saved successfully');
}

function loadDraft() {
    const draft = localStorage.getItem('notification_draft');
    if (draft) {
        const data = JSON.parse(draft);

        // Populate form fields
        document.getElementById('title').value = data.title || '';
        document.getElementById('message').value = data.message || '';
        document.getElementById('priority').value = data.priority || 'normal';

        if (data.notification_type) {
            const typeInput = document.querySelector(`input[name="notification_type"][value="${data.notification_type}"]`);
            if (typeInput) typeInput.checked = true;
        }

        document.getElementById('send_method').value = data.send_method || 'immediate';
        document.getElementById('schedule_time').value = data.schedule_time || '';

        // Trigger events to update preview and counts
        document.getElementById('title').dispatchEvent(new Event('input'));
        document.getElementById('message').dispatchEvent(new Event('input'));
        document.getElementById('priority').dispatchEvent(new Event('change'));
        document.getElementById('send_method').dispatchEvent(new Event('change'));

        if (data.notification_type) {
            document.querySelector(`input[name="notification_type"][value="${data.notification_type}"]`).dispatchEvent(new Event('change'));
        }

        showSuccessMessage(`Draft loaded from ${new Date(data.saved_at).toLocaleString()}`);
    }
}

function showSuccessMessage(message) {
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'notification-success-message';
    successDiv.innerHTML = `
        <div class="notification-success-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;

    // Add success styles if not already added
    if (!document.getElementById('notificationSuccessStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationSuccessStyles';
        style.textContent = `
            .notification-success-message {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #d4edda;
                border: 1px solid #c3e6cb;
                border-radius: 8px;
                padding: 1rem 1.5rem;
                z-index: 10000;
                border-left: 4px solid #28a745;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-success-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: #155724;
                font-weight: 500;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(successDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.style.animation = 'slideInRight 0.3s ease-in reverse';
            setTimeout(() => {
                if (successDiv.parentElement) {
                    document.body.removeChild(successDiv);
                }
            }, 300);
        }
    }, 3000);
}

// Load draft on page load if available
window.addEventListener('load', function () {
    if (localStorage.getItem('notification_draft')) {
        if (confirm('A saved draft was found. Would you like to load it?')) {
            loadDraft();
        }
    }
});
