// Student Approvals Admin JavaScript
document.addEventListener('DOMContentLoaded', function () {
    initializeStudentApprovals();
});

function initializeStudentApprovals() {
    initializeBulkSelection();
    initializeActionButtons();
    initializeTooltips();
    initializeAnimations();
    initializeConfirmations();
}

// Bulk Selection Functionality
function initializeBulkSelection() {
    const selectAllCheckbox = document.getElementById('select-all');
    const studentCheckboxes = document.querySelectorAll('.student-checkbox');
    const bulkApproveBtn = document.querySelector('.bulk-approve-btn');

    if (!selectAllCheckbox || !studentCheckboxes.length) return;

    // Select/deselect all functionality
    selectAllCheckbox.addEventListener('change', function () {
        const isChecked = this.checked;
        studentCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            updateRowSelection(checkbox.closest('tr'), isChecked);
        });
        updateBulkActionButton();
    });

    // Individual checkbox change
    studentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            updateRowSelection(this.closest('tr'), this.checked);
            updateSelectAllState();
            updateBulkActionButton();
        });
    });

    // Update select-all state based on individual checkboxes
    function updateSelectAllState() {
        const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
        const totalBoxes = studentCheckboxes.length;

        if (checkedBoxes.length === 0) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        } else if (checkedBoxes.length === totalBoxes) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.indeterminate = true;
            selectAllCheckbox.checked = false;
        }
    }

    // Update bulk action button state
    function updateBulkActionButton() {
        const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
        if (bulkApproveBtn) {
            bulkApproveBtn.disabled = checkedBoxes.length === 0;
            bulkApproveBtn.querySelector('.count') &&
                (bulkApproveBtn.querySelector('.count').textContent = `(${checkedBoxes.length})`);
        }
    }

    // Visual feedback for selected rows
    function updateRowSelection(row, isSelected) {
        if (isSelected) {
            row.classList.add('selected-row');
        } else {
            row.classList.remove('selected-row');
        }
    }

    // Initialize bulk button state
    updateBulkActionButton();
}

// Action Button Enhancements
function initializeActionButtons() {
    const actionButtons = document.querySelectorAll('.approval-btn');

    actionButtons.forEach(button => {
        // Add loading state on click
        button.addEventListener('click', function (e) {
            if (this.classList.contains('approval-btn-approve') ||
                this.classList.contains('approval-btn-reject')) {

                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                this.classList.add('approval-loading');

                // Simulate processing (remove this in production)
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('approval-loading');
                }, 2000);
            }
        });

        // Add hover effects
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Confirmation Dialogs
function initializeConfirmations() {
    // Approve confirmation
    document.addEventListener('click', function (e) {
        if (e.target.closest('.approval-btn-approve')) {
            e.preventDefault();
            const button = e.target.closest('.approval-btn-approve');
            const studentName = getStudentNameFromRow(button.closest('tr'));

            showConfirmationModal(
                'Approve Student',
                `Are you sure you want to approve <strong>${studentName}</strong>?`,
                'This will grant them access to the platform.',
                'success',
                () => {
                    window.location.href = button.href;
                }
            );
        }
    });

    // Reject confirmation
    document.addEventListener('click', function (e) {
        if (e.target.closest('.approval-btn-reject')) {
            e.preventDefault();
            const button = e.target.closest('.approval-btn-reject');
            const studentName = getStudentNameFromRow(button.closest('tr'));

            showConfirmationModal(
                'Reject Student',
                `Are you sure you want to reject <strong>${studentName}</strong>?`,
                'This action cannot be undone and will delete their account.',
                'danger',
                () => {
                    window.location.href = button.href;
                }
            );
        }
    });

    // Bulk approve confirmation
    const bulkApproveBtn = document.querySelector('.bulk-approve-btn');
    if (bulkApproveBtn) {
        bulkApproveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const selectedCount = document.querySelectorAll('.student-checkbox:checked').length;

            if (selectedCount === 0) {
                showNotification('Please select at least one student to approve.', 'warning');
                return;
            }

            showConfirmationModal(
                'Bulk Approve Students',
                `Are you sure you want to approve <strong>${selectedCount}</strong> selected students?`,
                'This will grant them all access to the platform.',
                'success',
                () => {
                    this.closest('form').submit();
                }
            );
        });
    }
}

// Helper Functions
function getStudentNameFromRow(row) {
    const nameCell = row.querySelector('.student-name');
    return nameCell ? nameCell.textContent.trim() : 'this student';
}

function showConfirmationModal(title, message, description, type, callback) {
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal-overlay';
    modal.innerHTML = `
        <div class="confirmation-modal">
            <div class="confirmation-header ${type}">
                <h3>${title}</h3>
                <button class="close-modal" onclick="this.closest('.confirmation-modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="confirmation-body">
                <div class="confirmation-message">${message}</div>
                <div class="confirmation-description">${description}</div>
            </div>
            <div class="confirmation-actions">
                <button class="btn-cancel" onclick="this.closest('.confirmation-modal-overlay').remove()">
                    Cancel
                </button>
                <button class="btn-confirm ${type}" onclick="confirmAction()">
                    ${type === 'danger' ? 'Reject' : 'Approve'}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add confirm action
    window.confirmAction = function () {
        callback();
        modal.remove();
        delete window.confirmAction;
    };

    // Close on overlay click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Animate in
    setTimeout(() => modal.classList.add('show'), 10);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        danger: 'exclamation-triangle',
        warning: 'exclamation-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Tooltips
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');

    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const element = e.target;
    const text = element.getAttribute('data-tooltip');

    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = text;

    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';

    element._tooltip = tooltip;
    setTimeout(() => tooltip.classList.add('show'), 10);
}

function hideTooltip(e) {
    const element = e.target;
    if (element._tooltip) {
        element._tooltip.remove();
        delete element._tooltip;
    }
}

// Animations
function initializeAnimations() {
    // Animate stats cards
    const statCards = document.querySelectorAll('.approval-stat-card');
    statCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-in');
    });

    // Animate table sections
    const tableSections = document.querySelectorAll('.approval-table-section');
    tableSections.forEach((section, index) => {
        section.style.animationDelay = `${(index + 1) * 0.2}s`;
        section.classList.add('animate-in');
    });
}

// Search Functionality (if needed in future)
function initializeSearch() {
    const searchInput = document.querySelector('.approval-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('.approval-data-table tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm);
            row.style.display = isVisible ? '' : 'none';
        });

        updateEmptyState();
    });
}

function updateEmptyState() {
    const visibleRows = document.querySelectorAll('.approval-data-table tbody tr[style=""]');
    const emptyState = document.querySelector('.approval-empty-state');

    if (visibleRows.length === 0 && emptyState) {
        emptyState.style.display = 'block';
    } else if (emptyState) {
        emptyState.style.display = 'none';
    }
}

// Export functionality
function exportApprovalData(format = 'csv') {
    const rows = document.querySelectorAll('.approval-data-table tbody tr:not([style*="display: none"])');
    let data = [];

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) { // Skip empty rows
            data.push({
                name: cells[1]?.textContent.trim() || '',
                username: cells[2]?.textContent.trim() || '',
                email: cells[3]?.textContent.trim() || '',
                registeredBy: cells[4]?.textContent.trim() || '',
                registrationDate: cells[5]?.textContent.trim() || ''
            });
        }
    });

    if (format === 'csv') {
        exportToCSV(data, 'student_approvals');
    } else if (format === 'json') {
        exportToJSON(data, 'student_approvals');
    }
}

function exportToCSV(data, filename) {
    const headers = ['Name', 'Username', 'Email', 'Registered By', 'Registration Date'];
    const csvContent = [
        headers.join(','),
        ...data.map(row => [
            `"${row.name}"`,
            `"${row.username}"`,
            `"${row.email}"`,
            `"${row.registeredBy}"`,
            `"${row.registrationDate}"`
        ].join(','))
    ].join('\n');

    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

function exportToJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + A for select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        const selectAllCheckbox = document.getElementById('select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = !selectAllCheckbox.checked;
            selectAllCheckbox.dispatchEvent(new Event('change'));
        }
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        const modal = document.querySelector('.confirmation-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }
});

// Add CSS for modal and notifications
const modalStyles = `
<style>
.confirmation-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.confirmation-modal-overlay.show {
    opacity: 1;
}

.confirmation-modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    transform: translateY(-20px);
    transition: transform 0.3s ease;
}

.confirmation-modal-overlay.show .confirmation-modal {
    transform: translateY(0);
}

.confirmation-header {
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid #dee2e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.confirmation-header.success {
    border-left: 4px solid #28a745;
}

.confirmation-header.danger {
    border-left: 4px solid #dc3545;
}

.confirmation-header h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.3rem;
}

.close-modal {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #6c757d;
    cursor: pointer;
    padding: 0.5rem;
}

.confirmation-body {
    padding: 1.5rem 2rem;
}

.confirmation-message {
    font-size: 1.1rem;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.confirmation-description {
    color: #6c757d;
    font-size: 0.95rem;
}

.confirmation-actions {
    padding: 1rem 2rem 1.5rem;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

.btn-cancel, .btn-confirm {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-cancel {
    background: #6c757d;
    color: white;
}

.btn-cancel:hover {
    background: #5a6268;
}

.btn-confirm.success {
    background: #28a745;
    color: white;
}

.btn-confirm.success:hover {
    background: #218838;
}

.btn-confirm.danger {
    background: #dc3545;
    color: white;
}

.btn-confirm.danger:hover {
    background: #c82333;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 10001;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 400px;
}

.notification.show {
    transform: translateX(0);
}

.notification-success {
    border-left: 4px solid #28a745;
}

.notification-danger {
    border-left: 4px solid #dc3545;
}

.notification-warning {
    border-left: 4px solid #ffc107;
}

.notification-info {
    border-left: 4px solid #17a2b8;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
}

.notification-close {
    background: none;
    border: none;
    color: #6c757d;
    cursor: pointer;
    padding: 0.25rem;
}

.custom-tooltip {
    position: absolute;
    background: #2c3e50;
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.85rem;
    z-index: 10002;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

.custom-tooltip.show {
    opacity: 1;
}

.custom-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #2c3e50;
}

.selected-row {
    background-color: #e3f2fd !important;
}

.animate-in {
    opacity: 0;
    animation: fadeInUp 0.6s ease-out forwards;
}

@keyframes fadeInUp {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
`;

// Add styles to head
document.head.insertAdjacentHTML('beforeend', modalStyles);
