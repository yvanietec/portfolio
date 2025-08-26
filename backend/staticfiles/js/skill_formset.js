// Handles dynamic add/remove for skill formset

document.addEventListener('DOMContentLoaded', function () {
    console.log('Skill formset JavaScript loaded');

    const addBtn = document.getElementById('add-skill');
    const formsContainer = document.querySelector('.portfolio-form-content');
    const totalForms = document.querySelector('input[name$="-TOTAL_FORMS"]');

    console.log('Skill formset elements:', {
        addBtn: addBtn,
        formsContainer: formsContainer,
        totalForms: totalForms
    });

    // Debug: Check if button exists and has event listeners
    if (addBtn) {
        console.log('Add button found:', addBtn);
        console.log('Add button type:', addBtn.type);
        console.log('Add button disabled:', addBtn.disabled);
    } else {
        console.error('Add button not found!');
        return;
    }

    if (!formsContainer) {
        console.error('Forms container not found!');
        return;
    }

    if (!totalForms) {
        console.error('Total forms input not found!');
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
        console.log('Reindexing skill forms');
        const cards = formsContainer.querySelectorAll('.portfolio-form-section');
        console.log('Found skill cards:', cards.length);

        cards.forEach((card, idx) => {
            // Update card title
            const cardTitle = card.querySelector('.portfolio-section-title');
            if (cardTitle) cardTitle.textContent = `Skill #${idx + 1}`;

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
                if (value === '' || value === 'Beginner' || value === 'Intermediate' || value === 'Advanced' || value === 'Expert') {
                    return false;
                }
                return true;
            } else {
                // For text inputs and textareas, check if they have meaningful content
                const value = el.value.trim();
                // Ignore placeholder text and empty values
                if (value === '' || value === el.placeholder ||
                    value === 'e.g., Python, JavaScript, Leadership') {
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

    // Debug: Test if event listener is being attached
    console.log('About to attach click event listener to add button');

    addBtn.addEventListener('click', function (e) {
        console.log('Add skill button clicked!');
        e.preventDefault(); // Prevent any default behavior

        const formCount = parseInt(totalForms.value);
        console.log('Current form count:', formCount);

        const lastForm = formsContainer.querySelector('.portfolio-form-section:last-child');
        console.log('Last form found:', lastForm);

        if (!lastForm) {
            console.error('No last form found to clone!');
            return;
        }

        const newForm = lastForm.cloneNode(true);
        console.log('New form cloned:', newForm);

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
        console.log('New form appended to container');

        // Ensure new form starts with hidden remove button
        const newRemoveBtn = newForm.querySelector('.remove-entry, .remove-btn');
        if (newRemoveBtn) {
            newRemoveBtn.style.display = 'none';
            newRemoveBtn.style.opacity = '0';
        }

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

    console.log('Click event listener attached to add button');

    formsContainer.addEventListener('click', function (e) {
        if (e.target.closest('.remove-entry, .remove-btn')) {
            console.log('Remove skill button clicked');
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
                // Show a subtle message that at least one skill entry is required
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

    // Initial setup
    console.log('Running initial setup...');
    reindexForms();
    addFormDataListeners();

    // Ensure the first form also starts with hidden remove button
    const firstForm = formsContainer.querySelector('.portfolio-form-section');
    if (firstForm) {
        const firstRemoveBtn = firstForm.querySelector('.remove-entry, .remove-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'none';
            firstRemoveBtn.style.opacity = '0';
        }
    }

    console.log('Skill formset JavaScript initialization complete');
});
