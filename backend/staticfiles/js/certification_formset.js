// Handles dynamic add/remove for certification formset

document.addEventListener('DOMContentLoaded', function () {
    console.log('Certification formset JavaScript loaded');

    const addBtn = document.getElementById('add-certification');
    const formsContainer = document.querySelector('.portfolio-form-content');
    const totalForms = document.querySelector('input[name$="-TOTAL_FORMS"]');

    console.log('Certification formset elements:', {
        addBtn: addBtn,
        formsContainer: formsContainer,
        totalForms: totalForms
    });

    if (!addBtn || !formsContainer || !totalForms) {
        console.log('Certification formset elements not found');
        return;
    }

    // Add scroll to top button
    function addScrollToTopButton() {
        // Remove existing button if any
        const existingBtn = document.querySelector('.scroll-to-top-btn');
        if (existingBtn) existingBtn.remove();

        const scrollBtn = document.createElement('button');
        scrollBtn.type = 'button';
        scrollBtn.className = 'scroll-to-top-btn';
        scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #8b5cf6;
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            opacity: 1;
        `;

        scrollBtn.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        document.body.appendChild(scrollBtn);
        console.log('Scroll to top button added');
    }

    function reindexForms() {
        console.log('Reindexing certification forms');
        const cards = formsContainer.querySelectorAll('.portfolio-form-section');
        console.log('Found certification cards:', cards.length);

        cards.forEach((card, idx) => {
            // Update card title
            const cardTitle = card.querySelector('.portfolio-section-title');
            if (cardTitle) cardTitle.textContent = `Certification #${idx + 1}`;

            // Update all fields
            card.querySelectorAll('input, select, textarea, label').forEach(function (el) {
                // Name
                if (el.name) {
                    el.name = el.name.replace(/-\d+-/, `-${idx}-`);
                }
                // ID
                if (el.id) {
                    el.id = el.id.replace(/_\d+_/, `_${idx}_`);
                }
                // For
                if (el.htmlFor) {
                    el.htmlFor = el.htmlFor.replace(/_\d+_/, `_${idx}_`);
                }
            });

            // Check if form has data and show/hide remove button accordingly
            updateRemoveButtonVisibility(card);
        });
        totalForms.value = cards.length;
        console.log('Total forms updated to:', totalForms.value);
    }

    function updateRemoveButtonVisibility(card) {
        const removeBtn = card.querySelector('.remove-entry, .remove-btn');
        if (!removeBtn) return;

        // Check if any field in this card has meaningful data
        const hasData = Array.from(card.querySelectorAll('input, select, textarea')).some(function (el) {
            if (el.type === 'checkbox' || el.type === 'radio') {
                return el.checked;
            } else if (el.type === 'hidden') {
                return false; // Ignore hidden fields
            } else if (el.tagName === 'SELECT') {
                // For select elements, check if a meaningful option is selected
                const value = el.value;
                // Ignore default/placeholder values
                if (value === '' || value === 'August' || value === '2025' ||
                    value === 'January' || value === 'February' || value === 'March' ||
                    value === 'April' || value === 'May' || value === 'June' ||
                    value === 'July' || value === 'September' || value === 'October' ||
                    value === 'November' || value === 'December') {
                    return false;
                }
                return true;
            } else {
                // For text inputs and textareas, check if they have meaningful content
                const value = el.value.trim();
                // Ignore placeholder text and empty values
                if (value === '' || value === el.placeholder ||
                    value === 'e.g. AWS Certified Solutions Architect' ||
                    value === 'e.g. Amazon Web Services' ||
                    value === 'Briefly describe what this certification covers and its significance.') {
                    return false;
                }
                return true;
            }
        });

        // Show remove button only if form has meaningful data
        if (hasData) {
            removeBtn.style.display = '';
            removeBtn.style.opacity = '1';
        } else {
            removeBtn.style.display = 'none';
            removeBtn.style.opacity = '0';
        }
    }

    addBtn.addEventListener('click', function () {
        console.log('Add certification button clicked');
        const formCount = parseInt(totalForms.value);
        const lastForm = formsContainer.querySelector('.portfolio-form-section:last-child');
        const newForm = lastForm.cloneNode(true);

        // Clear values
        newForm.querySelectorAll('input, select, textarea').forEach(function (el) {
            if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = false;
            } else if (el.type !== 'hidden') {
                el.value = '';
            }
        });

        // Add fade-in animation for new form
        newForm.style.opacity = '0';
        newForm.style.transform = 'translateY(20px)';
        newForm.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

        formsContainer.appendChild(newForm);

        // Ensure new form starts with hidden remove button
        const newRemoveBtn = newForm.querySelector('.remove-entry, .remove-btn');
        if (newRemoveBtn) {
            newRemoveBtn.style.display = 'none';
            newRemoveBtn.style.opacity = '0';
        }

        // Initialize auto-resize for new form's textareas
        const newTextareas = newForm.querySelectorAll('textarea.portfolio-textarea');
        newTextareas.forEach(textarea => {
            autoResizeTextarea(textarea);
            textarea.addEventListener('input', function () {
                autoResizeTextarea(this);
            });
            textarea.addEventListener('focus', function () {
                autoResizeTextarea(this);
            });
        });

        reindexForms();

        // Trigger animation
        setTimeout(() => {
            newForm.style.opacity = '1';
            newForm.style.transform = 'translateY(0)';
        }, 10);

        // Add scroll to top button immediately when we have multiple forms
        if (formsContainer.querySelectorAll('.portfolio-form-section').length > 1) {
            addScrollToTopButton();
        }

        // Scroll to show the new form
        setTimeout(() => {
            newForm.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    });

    formsContainer.addEventListener('click', function (e) {
        if (e.target.closest('.remove-entry, .remove-btn')) {
            console.log('Remove certification button clicked');
            const card = e.target.closest('.portfolio-form-section');
            const totalCards = formsContainer.querySelectorAll('.portfolio-form-section').length;

            if (totalCards > 1) {
                // Add fade-out animation before removing
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'translateX(-20px)';

                setTimeout(() => {
                    card.remove();
                    reindexForms();

                    // Remove scroll to top button if only one form remains
                    if (formsContainer.querySelectorAll('.portfolio-form-section').length === 1) {
                        const scrollBtn = document.querySelector('.scroll-to-top-btn');
                        if (scrollBtn) {
                            scrollBtn.remove();
                            console.log('Scroll to top button removed');
                        }
                    }
                }, 300);
            } else {
                // Show a subtle message that at least one certification entry is required
                const btn = e.target.closest('.remove-entry, .remove-btn');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-info-circle"></i> At least one entry required';
                btn.style.background = 'rgba(59, 130, 246, 0.1)';
                btn.style.color = '#2563eb';
                btn.style.borderColor = '#93c5fd';

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.color = '';
                    btn.style.borderColor = '';
                }, 2000);
            }
        }
    });

    // Add event listeners to monitor form data changes
    function addFormDataListeners() {
        formsContainer.addEventListener('input', function (e) {
            const card = e.target.closest('.portfolio-form-section');
            if (card) {
                updateRemoveButtonVisibility(card);
            }
        });

        formsContainer.addEventListener('change', function (e) {
            const card = e.target.closest('.portfolio-form-section');
            if (card) {
                updateRemoveButtonVisibility(card);
            }
        });
    }

    // Auto-expanding textarea functionality
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // Initialize auto-resize for all textareas
    function initializeAutoResize() {
        const textareas = document.querySelectorAll('textarea.portfolio-textarea');
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
    }

    // Initial setup
    reindexForms();
    addFormDataListeners();
    initializeAutoResize();

    // Ensure the first form also starts with hidden remove button
    const firstForm = formsContainer.querySelector('.portfolio-form-section');
    if (firstForm) {
        const firstRemoveBtn = firstForm.querySelector('.remove-entry, .remove-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'none';
            firstRemoveBtn.style.opacity = '0';
        }
    }
});
