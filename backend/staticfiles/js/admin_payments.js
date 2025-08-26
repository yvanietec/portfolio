/* Admin Payments JavaScript */
document.addEventListener('DOMContentLoaded', function () {
    initializePaymentsTable();
    initializeBulkActions();
    initializeFilters();
});

function initializePaymentsTable() {
    const table = document.getElementById('paymentsTable');
    const selectAllCheckbox = document.getElementById('selectAll');
    const paymentCheckboxes = document.querySelectorAll('.payment-checkbox');

    // Select all functionality
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            paymentCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateBulkActions();
        });
    }

    // Individual checkbox functionality
    paymentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            updateSelectAllState();
            updateBulkActions();
        });
    });
}

function initializeBulkActions() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');

    function updateBulkActions() {
        const checkedBoxes = document.querySelectorAll('.payment-checkbox:checked');
        const count = checkedBoxes.length;

        if (selectedCount) {
            selectedCount.textContent = count;
        }

        if (bulkActions) {
            bulkActions.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Make updateBulkActions globally available
    window.updateBulkActions = updateBulkActions;
}

function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const paymentCheckboxes = document.querySelectorAll('.payment-checkbox');
    const checkedBoxes = document.querySelectorAll('.payment-checkbox:checked');

    if (selectAllCheckbox) {
        if (checkedBoxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedBoxes.length === paymentCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }
}

function initializeFilters() {
    const filterForm = document.getElementById('paymentFilterForm');
    const searchInput = document.getElementById('searchInput');

    // Auto-submit filter form on input change
    if (filterForm) {
        const filterInputs = filterForm.querySelectorAll('input, select');
        filterInputs.forEach(input => {
            if (input.type !== 'submit') {
                input.addEventListener('change', function () {
                    // Small delay for better UX
                    setTimeout(() => {
                        if (input !== searchInput) {
                            filterForm.submit();
                        }
                    }, 300);
                });
            }
        });

        // Search input with debounce
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', function () {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    // Auto-submit after user stops typing
                    filterForm.submit();
                }, 1000);
            });
        }
    }
}

function refreshPayments() {
    window.location.reload();
}

function exportPayments() {
    const table = document.getElementById('paymentsTable');
    const rows = Array.from(table.querySelectorAll('tbody tr:not(.admin-table-empty)'));

    // Create CSV content
    let csv = 'User,Email,Amount,Invoice Number,Date,Status\n';

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
            const username = cells[1].querySelector('.admin-table-user-name').textContent.trim();
            const email = cells[1].querySelector('.admin-table-user-email').textContent.trim();
            const amount = cells[2].querySelector('.payment-value').textContent.trim();
            const invoice = cells[3].querySelector('.payment-invoice-number').textContent.trim();
            const date = cells[4].querySelector('.admin-table-date').textContent.trim();
            const status = cells[5].textContent.trim();

            csv += `"${username}","${email}","${amount}","${invoice}","${date}","${status}"\n`;
        }
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function viewPaymentDetails(paymentId) {
    // Create modal for payment details
    const modal = document.createElement('div');
    modal.className = 'payment-details-modal';
    modal.innerHTML = `
        <div class="payment-details-overlay">
            <div class="payment-details-content">
                <div class="payment-details-header">
                    <h3><i class="fas fa-file-invoice"></i> Payment Details</h3>
                    <button class="payment-details-close">&times;</button>
                </div>
                <div class="payment-details-body">
                    <div class="payment-details-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading payment details...
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .payment-details-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
        }
        
        .payment-details-overlay {
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        
        .payment-details-content {
            background: white;
            border-radius: 16px;
            max-width: 600px;
            width: 100%;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .payment-details-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem 2rem;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        
        .payment-details-header h3 {
            margin: 0;
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .payment-details-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6c757d;
            padding: 0.25rem;
        }
        
        .payment-details-body {
            padding: 2rem;
            max-height: 60vh;
            overflow-y: auto;
        }
        
        .payment-details-loading {
            text-align: center;
            color: #6c757d;
            padding: 2rem;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // Close modal functionality
    const closeBtn = modal.querySelector('.payment-details-close');
    const overlay = modal.querySelector('.payment-details-overlay');

    function closeModal() {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            closeModal();
        }
    });

    // Simulate loading payment details (replace with actual AJAX call)
    setTimeout(() => {
        const body = modal.querySelector('.payment-details-body');
        body.innerHTML = `
            <div class="payment-detail-item">
                <strong>Payment ID:</strong> ${paymentId}
            </div>
            <div class="payment-detail-item">
                <strong>Status:</strong> <span class="badge badge-success">Completed</span>
            </div>
            <div class="payment-detail-item">
                <strong>Transaction Date:</strong> ${new Date().toLocaleDateString()}
            </div>
            <div class="payment-detail-item">
                <strong>Method:</strong> Online Payment
            </div>
            <div class="payment-detail-item">
                <strong>Gateway:</strong> Razorpay
            </div>
        `;
    }, 1000);
}

function bulkDownload() {
    const checkedBoxes = document.querySelectorAll('.payment-checkbox:checked');
    const paymentIds = Array.from(checkedBoxes).map(checkbox => checkbox.value);

    if (paymentIds.length === 0) {
        alert('Please select payments to download.');
        return;
    }

    // Show loading
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
    btn.disabled = true;

    // Simulate bulk download (replace with actual implementation)
    setTimeout(() => {
        alert(`Downloading ${paymentIds.length} invoices...`);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 2000);
}

function bulkEmail() {
    const checkedBoxes = document.querySelectorAll('.payment-checkbox:checked');
    const paymentIds = Array.from(checkedBoxes).map(checkbox => checkbox.value);

    if (paymentIds.length === 0) {
        alert('Please select payments to email.');
        return;
    }

    if (confirm(`Send invoices via email for ${paymentIds.length} selected payments?`)) {
        // Show loading
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        // Simulate bulk email (replace with actual implementation)
        setTimeout(() => {
            alert(`Emails sent for ${paymentIds.length} invoices!`);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 3000);
    }
}

// Add payment amount styles
document.addEventListener('DOMContentLoaded', function () {
    const style = document.createElement('style');
    style.textContent = `
        .payment-amount {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-weight: 600;
        }
        
        .payment-currency {
            color: #28a745;
            font-size: 0.9rem;
        }
        
        .payment-value {
            color: #2c3e50;
            font-size: 1.1rem;
        }
        
        .payment-invoice {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        
        .payment-invoice-number {
            font-weight: 600;
            color: #2c3e50;
            font-family: monospace;
        }
        
        .payment-invoice-meta {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            color: #6c757d;
            font-size: 0.85rem;
        }
        
        .inline-form {
            display: inline;
        }
        
        .admin-table-action-group {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
    `;
    document.head.appendChild(style);
});
