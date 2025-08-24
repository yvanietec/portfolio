/* Admin Payouts JavaScript */
document.addEventListener('DOMContentLoaded', function () {
    initializePayoutsTable();
    initializeBulkActions();
    initializeFilters();
    addPayoutStyles();
});

function initializePayoutsTable() {
    const table = document.getElementById('payoutsTable');
    const selectAllCheckbox = document.getElementById('selectAll');
    const payoutCheckboxes = document.querySelectorAll('.payout-checkbox');

    // Select all functionality
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            payoutCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateBulkActions();
        });
    }

    // Individual checkbox functionality
    payoutCheckboxes.forEach(checkbox => {
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
        const checkedBoxes = document.querySelectorAll('.payout-checkbox:checked');
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
    const payoutCheckboxes = document.querySelectorAll('.payout-checkbox');
    const checkedBoxes = document.querySelectorAll('.payout-checkbox:checked');

    if (selectAllCheckbox) {
        if (checkedBoxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedBoxes.length === payoutCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }
}

function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const monthFilter = document.getElementById('monthFilter');
    const amountFilter = document.getElementById('amountFilter');
    const rows = document.querySelectorAll('.payout-row');

    function filterPayouts() {
        const searchTerm = searchInput.value.toLowerCase();
        const monthValue = monthFilter.value;
        const amountValue = amountFilter.value;

        rows.forEach(row => {
            const agentName = row.getAttribute('data-agent');
            const amount = parseFloat(row.getAttribute('data-amount'));
            const date = new Date(row.getAttribute('data-date'));
            const today = new Date();

            let matchesSearch = agentName.includes(searchTerm);
            let matchesMonth = true;
            let matchesAmount = true;

            // Month filter
            if (monthValue) {
                switch (monthValue) {
                    case 'this-month':
                        matchesMonth = date.getMonth() === today.getMonth() &&
                            date.getFullYear() === today.getFullYear();
                        break;
                    case 'last-month':
                        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                        matchesMonth = date.getMonth() === lastMonth.getMonth() &&
                            date.getFullYear() === lastMonth.getFullYear();
                        break;
                    case 'last-3-months':
                        const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                        matchesMonth = date >= threeMonthsAgo;
                        break;
                }
            }

            // Amount filter
            if (amountValue) {
                switch (amountValue) {
                    case '0-5000':
                        matchesAmount = amount >= 0 && amount <= 5000;
                        break;
                    case '5000-10000':
                        matchesAmount = amount > 5000 && amount <= 10000;
                        break;
                    case '10000+':
                        matchesAmount = amount > 10000;
                        break;
                }
            }

            row.style.display = matchesSearch && matchesMonth && matchesAmount ? '' : 'none';
        });
    }

    searchInput.addEventListener('input', filterPayouts);
    monthFilter.addEventListener('change', filterPayouts);
    amountFilter.addEventListener('change', filterPayouts);
}

function exportPayouts() {
    const table = document.getElementById('payoutsTable');
    const rows = Array.from(table.querySelectorAll('tbody tr:not(.admin-table-empty):not([style*="display: none"])'));

    // Create CSV content
    let csv = 'Agent,Email,Amount,Paid On,Referrals,Performance\n';

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
            const agent = cells[1].querySelector('.admin-table-user-name').textContent.trim();
            const email = cells[1].querySelector('.admin-table-user-email').textContent.trim();
            const amount = cells[2].querySelector('.payout-value').textContent.trim();
            const paidOn = cells[3].querySelector('.admin-table-date').textContent.trim();
            const referrals = cells[4].querySelector('.payout-referral-count').textContent.trim();
            const performance = cells[5].querySelector('.payout-performance-text').textContent.trim();

            csv += `"${agent}","${email}","${amount}","${paidOn}","${referrals}","${performance}"\n`;
        }
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function generateNewPayouts() {
    if (confirm('Generate new payouts for eligible agents? This will calculate commissions based on recent referrals.')) {
        // Show loading state
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        btn.disabled = true;

        // Simulate payout generation (replace with actual implementation)
        setTimeout(() => {
            alert('New payouts generated successfully!');
            window.location.reload();
        }, 3000);
    }
}

function viewPayoutDetails(payoutId) {
    // Create modal for payout details
    const modal = document.createElement('div');
    modal.className = 'payout-details-modal';
    modal.innerHTML = `
        <div class="payout-details-overlay">
            <div class="payout-details-content">
                <div class="payout-details-header">
                    <h3><i class="fas fa-hand-holding-usd"></i> Payout Details</h3>
                    <button class="payout-details-close">&times;</button>
                </div>
                <div class="payout-details-body">
                    <div class="payout-details-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading payout details...
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal styles
    addModalStyles();
    document.body.appendChild(modal);

    // Close modal functionality
    const closeBtn = modal.querySelector('.payout-details-close');
    const overlay = modal.querySelector('.payout-details-overlay');

    function closeModal() {
        document.body.removeChild(modal);
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            closeModal();
        }
    });

    // Simulate loading payout details
    setTimeout(() => {
        const body = modal.querySelector('.payout-details-body');
        body.innerHTML = `
            <div class="payout-detail-item">
                <strong>Payout ID:</strong> ${payoutId}
            </div>
            <div class="payout-detail-item">
                <strong>Status:</strong> <span class="badge badge-success">Completed</span>
            </div>
            <div class="payout-detail-item">
                <strong>Payment Method:</strong> Bank Transfer
            </div>
            <div class="payout-detail-item">
                <strong>Transaction ID:</strong> TXN${payoutId}${Date.now()}
            </div>
            <div class="payout-detail-item">
                <strong>Commission Rate:</strong> 10%
            </div>
        `;
    }, 1000);
}

function downloadPayoutReport(payoutId) {
    // Simulate report download
    const btn = event.target.closest('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    setTimeout(() => {
        alert(`Downloading payout report for ID: ${payoutId}`);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 2000);
}

function resendPayoutNotification(payoutId) {
    if (confirm('Resend payout notification to the agent?')) {
        const btn = event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        setTimeout(() => {
            alert('Notification sent successfully!');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);
    }
}

function bulkDownloadReports() {
    const checkedBoxes = document.querySelectorAll('.payout-checkbox:checked');
    const payoutIds = Array.from(checkedBoxes).map(checkbox => checkbox.value);

    if (payoutIds.length === 0) {
        alert('Please select payouts to download reports for.');
        return;
    }

    // Show loading
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
    btn.disabled = true;

    setTimeout(() => {
        alert(`Downloading ${payoutIds.length} payout reports...`);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 2000);
}

function bulkNotify() {
    const checkedBoxes = document.querySelectorAll('.payout-checkbox:checked');
    const payoutIds = Array.from(checkedBoxes).map(checkbox => checkbox.value);

    if (payoutIds.length === 0) {
        alert('Please select payouts to send notifications for.');
        return;
    }

    if (confirm(`Send notifications for ${payoutIds.length} selected payouts?`)) {
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        setTimeout(() => {
            alert(`Notifications sent for ${payoutIds.length} payouts!`);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 3000);
    }
}

function addPayoutStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .payout-amount {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-weight: 600;
        }
        
        .payout-currency {
            color: #28a745;
            font-size: 0.9rem;
        }
        
        .payout-value {
            color: #2c3e50;
            font-size: 1.1rem;
        }
        
        .payout-commission {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            color: #6c757d;
            font-size: 0.8rem;
            margin-top: 0.25rem;
        }
        
        .payout-referrals {
            text-align: center;
        }
        
        .payout-referral-count {
            display: block;
            font-size: 1.5rem;
            font-weight: 700;
            color: #2c3e50;
        }
        
        .payout-referral-label {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            color: #6c757d;
            font-size: 0.8rem;
            margin-top: 0.25rem;
        }
        
        .payout-performance {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            align-items: center;
        }
        
        .payout-performance-bar {
            width: 60px;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .payout-performance-fill {
            height: 100%;
            background: linear-gradient(90deg, #dc3545, #ffc107, #28a745);
            transition: width 0.3s ease;
        }
        
        .payout-performance-text {
            font-size: 0.8rem;
            font-weight: 600;
            color: #6c757d;
        }
        
        .admin-table-footer {
            margin-top: 2rem;
            text-align: center;
        }
    `;
    document.head.appendChild(style);
}

function addModalStyles() {
    if (document.getElementById('payoutModalStyles')) return;

    const style = document.createElement('style');
    style.id = 'payoutModalStyles';
    style.textContent = `
        .payout-details-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
        }
        
        .payout-details-overlay {
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        
        .payout-details-content {
            background: white;
            border-radius: 16px;
            max-width: 600px;
            width: 100%;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .payout-details-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem 2rem;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        
        .payout-details-header h3 {
            margin: 0;
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .payout-details-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6c757d;
            padding: 0.25rem;
        }
        
        .payout-details-body {
            padding: 2rem;
            max-height: 60vh;
            overflow-y: auto;
        }
        
        .payout-details-loading {
            text-align: center;
            color: #6c757d;
            padding: 2rem;
        }
        
        .payout-detail-item {
            padding: 0.75rem 0;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .payout-detail-item:last-child {
            border-bottom: none;
        }
    `;
    document.head.appendChild(style);
}
