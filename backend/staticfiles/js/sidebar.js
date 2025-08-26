/* Sidebar Navigation JavaScript */

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Sidebar navigation loaded');
    initializeSidebar();
});

function initializeSidebar() {
    console.log('🔧 Initializing sidebar functionality...');

    const sidebar = document.querySelector('.form-sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const overlay = document.querySelector('.sidebar-overlay');
    const mainContent = document.querySelector('.form-main-content');
    const layoutContainer = document.querySelector('.form-layout-container');

    if (!sidebar) {
        console.warn('⚠️ Sidebar element not found');
        return;
    }

    // Initialize sidebar state
    initializeSidebarState();

    // Setup event listeners
    setupSidebarEventListeners();

    // Setup responsive behavior
    setupResponsiveBehavior();

    // Setup keyboard navigation
    setupKeyboardNavigation();

    console.log('✅ Sidebar initialized successfully');

    function initializeSidebarState() {
        // Check if we're on mobile
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            sidebar.classList.add('collapsed');
            if (layoutContainer) {
                layoutContainer.classList.add('sidebar-collapsed');
            }
        } else {
            // On desktop, sidebar should be visible by default
            sidebar.classList.remove('collapsed');
            if (layoutContainer) {
                layoutContainer.classList.remove('sidebar-collapsed');
            }
        }

        // Set initial ARIA attributes
        updateAriaAttributes();
    }

    function setupSidebarEventListeners() {
        // Toggle button click
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleSidebar();
            });
        }

        // Overlay click to close sidebar
        if (overlay) {
            overlay.addEventListener('click', function () {
                closeSidebar();
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function (e) {
            const isMobile = window.innerWidth <= 768;
            if (isMobile && sidebar && !sidebar.contains(e.target) && !toggleBtn?.contains(e.target)) {
                if (sidebar.classList.contains('active')) {
                    closeSidebar();
                }
            }
        });

        // Handle navigation links
        const navLinks = sidebar.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                // On mobile, close sidebar after navigation
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    setTimeout(() => closeSidebar(), 100);
                }

                // Update active state
                updateActiveNavItem(this);
            });
        });
    }

    function setupResponsiveBehavior() {
        let resizeTimeout;

        window.addEventListener('resize', function () {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function () {
                const isMobile = window.innerWidth <= 768;

                if (isMobile) {
                    // On mobile, hide sidebar by default
                    sidebar.classList.add('collapsed');
                    sidebar.classList.remove('active');
                    if (overlay) overlay.classList.remove('active');
                    if (layoutContainer) layoutContainer.classList.add('sidebar-collapsed');
                } else {
                    // On desktop, show sidebar
                    sidebar.classList.remove('collapsed', 'active');
                    if (overlay) overlay.classList.remove('active');
                    if (layoutContainer) layoutContainer.classList.remove('sidebar-collapsed');
                }

                updateAriaAttributes();
            }, 150);
        });
    }

    function setupKeyboardNavigation() {
        // Escape key to close sidebar
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                closeSidebar();
            }
        });

        // Tab navigation within sidebar
        const focusableElements = sidebar.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');

        if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            sidebar.addEventListener('keydown', function (e) {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        // Shift + Tab
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        // Tab
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            });
        }
    }

    function toggleSidebar() {
        const isMobile = window.innerWidth <= 768;
        const isActive = sidebar.classList.contains('active');

        if (isMobile) {
            if (isActive) {
                closeSidebar();
            } else {
                openSidebar();
            }
        } else {
            // On desktop, toggle collapsed state
            const isCollapsed = sidebar.classList.contains('collapsed');
            if (isCollapsed) {
                openSidebar();
            } else {
                collapseSidebar();
            }
        }
    }

    function openSidebar() {
        const isMobile = window.innerWidth <= 768;

        sidebar.classList.remove('collapsed');

        if (isMobile) {
            sidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
        }

        if (layoutContainer) {
            layoutContainer.classList.remove('sidebar-collapsed');
        }

        updateAriaAttributes();

        // Focus first focusable element
        const firstFocusable = sidebar.querySelector('.nav-link');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }

        console.log('📂 Sidebar opened');
    }

    function closeSidebar() {
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            sidebar.classList.add('collapsed');
        }

        if (layoutContainer) {
            layoutContainer.classList.add('sidebar-collapsed');
        }

        updateAriaAttributes();

        // Return focus to toggle button
        if (toggleBtn) {
            toggleBtn.focus();
        }

        console.log('📁 Sidebar closed');
    }

    function collapseSidebar() {
        sidebar.classList.add('collapsed');
        if (layoutContainer) {
            layoutContainer.classList.add('sidebar-collapsed');
        }
        updateAriaAttributes();
        console.log('📁 Sidebar collapsed');
    }

    function updateAriaAttributes() {
        const isVisible = !sidebar.classList.contains('collapsed') || sidebar.classList.contains('active');

        sidebar.setAttribute('aria-hidden', !isVisible);

        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', isVisible);
            toggleBtn.setAttribute('aria-label', isVisible ? 'Close navigation' : 'Open navigation');
        }
    }

    function updateActiveNavItem(clickedLink) {
        // Remove active class from all nav items
        const navItems = sidebar.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        // Add active class to parent nav item
        const parentNavItem = clickedLink.closest('.nav-item');
        if (parentNavItem) {
            parentNavItem.classList.add('active');
        }
    }

    // Public methods for external use
    window.SidebarAPI = {
        open: openSidebar,
        close: closeSidebar,
        toggle: toggleSidebar,
        isOpen: () => !sidebar.classList.contains('collapsed') || sidebar.classList.contains('active')
    };
}

// Progress bar animation
function animateProgressBar() {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        const targetWidth = progressFill.style.width;
        progressFill.style.width = '0%';

        setTimeout(() => {
            progressFill.style.width = targetWidth;
        }, 500);
    }
}

// Initialize progress animation when page loads
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(animateProgressBar, 1000);
});

// Smooth scroll for anchor links within sidebar
document.addEventListener('DOMContentLoaded', function () {
    const anchorLinks = document.querySelectorAll('.nav-link[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Auto-collapse sidebar on mobile after successful form submission
document.addEventListener('DOMContentLoaded', function () {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', function () {
            const isMobile = window.innerWidth <= 768;
            if (isMobile && window.SidebarAPI) {
                setTimeout(() => {
                    window.SidebarAPI.close();
                }, 1000);
            }
        });
    });
});

console.log('✅ Sidebar JavaScript loaded successfully');
