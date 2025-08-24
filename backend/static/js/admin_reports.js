// Admin Reports JavaScript
document.addEventListener('DOMContentLoaded', function () {
    initializeReports();
});

function initializeReports() {
    initializeCharts();
    initializeExportButtons();
    initializeTooltips();
}

// Chart Initialization
function initializeCharts() {
    initializePaymentChart();
    initializeAgentChart();
    initializeActivityChart();
}

function initializePaymentChart() {
    const chartElement = document.getElementById('paymentChart');
    if (!chartElement) return;

    // Get data from template variables (passed as JSON)
    const chartLabels = window.chartLabels || [];
    const chartValues = window.chartValues || [];

    const ctx = chartElement.getContext('2d');
    const paymentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Payments (₹)',
                data: chartValues,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#764ba2',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#495057',
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(44, 62, 80, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return `₹${context.parsed.y.toLocaleString('en-IN')}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6c757d',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6c757d',
                        font: {
                            size: 12
                        },
                        callback: function (value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });

    // Make chart responsive
    window.addEventListener('resize', function () {
        paymentChart.resize();
    });
}

function initializeAgentChart() {
    const agentChartElement = document.getElementById('agentChart');
    if (!agentChartElement) return;

    const agentData = window.agentChartData || [];

    const ctx = agentChartElement.getContext('2d');
    const agentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: agentData.map(item => item.name),
            datasets: [{
                data: agentData.map(item => item.referrals),
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#f5576c',
                    '#4facfe'
                ],
                borderWidth: 3,
                borderColor: '#fff',
                hoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#495057',
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(44, 62, 80, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} referrals (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 2000
            }
        }
    });
}

function initializeActivityChart() {
    const activityChartElement = document.getElementById('activityChart');
    if (!activityChartElement) return;

    const activityData = window.activityChartData || [];

    const ctx = activityChartElement.getContext('2d');
    const activityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: activityData.map(item => item.date),
            datasets: [{
                label: 'New Users',
                data: activityData.map(item => item.users),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false
            }, {
                label: 'New Portfolios',
                data: activityData.map(item => item.portfolios),
                backgroundColor: 'rgba(118, 75, 162, 0.8)',
                borderColor: '#764ba2',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#495057',
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(44, 62, 80, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6c757d',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6c757d',
                        font: {
                            size: 12
                        },
                        stepSize: 1
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Export Functionality
function initializeExportButtons() {
    const exportButtons = document.querySelectorAll('.export-btn');

    exportButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const exportType = this.dataset.export;
            const exportFormat = this.dataset.format || 'csv';

            handleExport(exportType, exportFormat);
        });
    });
}

function handleExport(type, format) {
    // Show loading state
    showExportLoading(type);

    // Simulate export process (replace with actual export logic)
    setTimeout(() => {
        switch (type) {
            case 'agents':
                exportAgentData(format);
                break;
            case 'payments':
                exportPaymentData(format);
                break;
            case 'activity':
                exportActivityData(format);
                break;
            default:
                console.warn('Unknown export type:', type);
        }
        hideExportLoading(type);
    }, 1500);
}

function exportAgentData(format) {
    const agentRows = document.querySelectorAll('.top-agents-table tbody tr');
    const data = [];

    agentRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            data.push({
                agent: cells[0].textContent.trim(),
                referrals: cells[1].textContent.trim()
            });
        }
    });

    if (format === 'csv') {
        exportToCSV(data, 'top_agents', ['Agent', 'Total Referrals']);
    } else {
        exportToJSON(data, 'top_agents');
    }
}

function exportPaymentData(format) {
    // Get payment data from chart
    const labels = window.chartLabels || [];
    const values = window.chartValues || [];

    const data = labels.map((label, index) => ({
        week: label,
        amount: values[index] || 0
    }));

    if (format === 'csv') {
        exportToCSV(data, 'weekly_payments', ['Week', 'Amount (₹)']);
    } else {
        exportToJSON(data, 'weekly_payments');
    }
}

function exportActivityData(format) {
    const activityData = window.activityChartData || [];

    if (format === 'csv') {
        exportToCSV(activityData, 'daily_activity', ['Date', 'New Users', 'New Portfolios']);
    } else {
        exportToJSON(activityData, 'daily_activity');
    }
}

function exportToCSV(data, filename, headers) {
    if (!data.length) {
        showNotification('No data available for export', 'warning');
        return;
    }

    const csvHeaders = headers || Object.keys(data[0]);
    const csvContent = [
        csvHeaders.join(','),
        ...data.map(row =>
            csvHeaders.map(header => {
                const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const value = row[key] || row[Object.keys(row).find(k => k.toLowerCase().includes(key))] || '';
                return `"${value}"`;
            }).join(',')
        )
    ].join('\n');

    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    showNotification(`${filename}.csv exported successfully!`, 'success');
}

function exportToJSON(data, filename) {
    if (!data.length) {
        showNotification('No data available for export', 'warning');
        return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
    showNotification(`${filename}.json exported successfully!`, 'success');
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

// Loading States
function showExportLoading(type) {
    const button = document.querySelector(`[data-export="${type}"]`);
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
    }
}

function hideExportLoading(type) {
    const button = document.querySelector(`[data-export="${type}"]`);
    if (button) {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || '<i class="fas fa-download"></i> Export';
    }
}

// Notifications
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
        warning: 'exclamation-triangle',
        error: 'times-circle',
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

// Refresh Data
function refreshReportData() {
    showNotification('Refreshing report data...', 'info');

    // Simulate data refresh (replace with actual API call)
    setTimeout(() => {
        showNotification('Report data refreshed successfully!', 'success');
        // Reinitialize charts with new data
        initializeCharts();
    }, 2000);
}

// Print Reports
function printReport() {
    // Hide unnecessary elements for printing
    const elementsToHide = document.querySelectorAll('.btn, .action-group, .admin-sidebar');
    elementsToHide.forEach(el => el.style.display = 'none');

    window.print();

    // Restore elements after printing
    setTimeout(() => {
        elementsToHide.forEach(el => el.style.display = '');
    }, 1000);
}
