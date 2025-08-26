/* Admin Delete Confirmation JavaScript */
document.addEventListener('DOMContentLoaded', function () {
    const deleteForm = document.getElementById('deleteForm');
    const deleteBtn = document.getElementById('deleteBtn');
    const confirmCheckbox = document.getElementById('confirmDeletion');

    // Enable/disable delete button based on checkbox
    if (confirmCheckbox && deleteBtn) {
        confirmCheckbox.addEventListener('change', function () {
            deleteBtn.disabled = !this.checked;

            if (this.checked) {
                deleteBtn.classList.add('enabled');
            } else {
                deleteBtn.classList.remove('enabled');
            }
        });
    }

    // Handle form submission
    if (deleteForm && deleteBtn) {
        deleteBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // Final confirmation dialog
            const confirmMessage = 'Are you absolutely sure you want to delete this user?\n\n' +
                'This action is PERMANENT and IRREVERSIBLE!\n\n' +
                'Type "DELETE" to confirm:';

            const userInput = prompt(confirmMessage);

            if (userInput === 'DELETE') {
                // Show loading state
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                deleteBtn.classList.add('loading');

                // Add a small delay for UX
                setTimeout(() => {
                    deleteForm.submit();
                }, 500);
            } else if (userInput !== null) {
                // User entered something but not "DELETE"
                alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
            }
            // If userInput is null, user clicked cancel - do nothing
        });

        // Handle form submit event for logging
        deleteForm.addEventListener('submit', function (e) {
            console.log('Delete form submission initiated');
            console.log('Form method:', this.method);
            console.log('Form action:', this.action);

            // Add final warning overlay
            showDeletionOverlay();
        });
    }

    // Show warning animations
    animateWarnings();
});

function showDeletionOverlay() {
    // Create overlay for final warning
    const overlay = document.createElement('div');
    overlay.className = 'deletion-overlay';
    overlay.innerHTML = `
        <div class="deletion-overlay-content">
            <div class="deletion-overlay-spinner">
                <i class="fas fa-trash fa-spin"></i>
            </div>
            <h3>Deleting User...</h3>
            <p>Please wait while the user is permanently deleted.</p>
            <div class="deletion-progress-bar">
                <div class="deletion-progress-fill"></div>
            </div>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .deletion-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(220, 53, 69, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        }
        
        .deletion-overlay-content {
            background: white;
            padding: 3rem;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 400px;
        }
        
        .deletion-overlay-spinner {
            font-size: 3rem;
            color: #dc3545;
            margin-bottom: 1rem;
        }
        
        .deletion-overlay-content h3 {
            color: #2c3e50;
            margin-bottom: 0.5rem;
        }
        
        .deletion-overlay-content p {
            color: #6c757d;
            margin-bottom: 2rem;
        }
        
        .deletion-progress-bar {
            width: 100%;
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
        }
        
        .deletion-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #dc3545, #c82333);
            width: 0%;
            animation: fillProgress 3s ease-in-out forwards;
        }
        
        @keyframes fillProgress {
            0% { width: 0%; }
            100% { width: 100%; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);
}

function animateWarnings() {
    // Add pulse animation to warning elements
    const warningElements = document.querySelectorAll('.deletion-warning, .deletion-consequences');

    warningElements.forEach((element, index) => {
        setTimeout(() => {
            element.style.animation = 'fadeInUp 0.6s ease-out forwards';
        }, index * 200);
    });

    // Add stagger animation to consequence items
    const consequenceItems = document.querySelectorAll('.deletion-consequence-item');
    consequenceItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.transition = 'all 0.3s ease-out';

            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 50);
        }, 1000 + (index * 100));
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // ESC key to cancel
    if (e.key === 'Escape') {
        const cancelBtn = document.querySelector('.admin-form-btn-secondary');
        if (cancelBtn) {
            cancelBtn.click();
        }
    }

    // Prevent accidental Enter key submission
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
    }
});

// Add focus management
window.addEventListener('load', function () {
    const checkbox = document.getElementById('confirmDeletion');
    if (checkbox) {
        // Focus on checkbox after page loads
        setTimeout(() => {
            checkbox.focus();
        }, 500);
    }
});
