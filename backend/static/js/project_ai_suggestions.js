document.addEventListener('DOMContentLoaded', function () {
    // Get current portfolio ID from URL
    const urlParts = window.location.pathname.split('/');
    const portfolioId = urlParts[urlParts.length - 2]; // Get the ID before the last slash

    // Add event listeners to all AI suggestion buttons
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('ai-suggest-btn') || e.target.closest('.ai-suggest-btn')) {
            const button = e.target.classList.contains('ai-suggest-btn') ? e.target : e.target.closest('.ai-suggest-btn');
            const formIndex = button.getAttribute('data-form-index');
            handleProjectSuggestion(button, formIndex);
        }
    });

    function handleProjectSuggestion(button, formIndex) {
        const formSection = button.closest('.portfolio-form-section');
        const suggestionsList = formSection.querySelector('.ai-suggestions-list');
        const descriptionField = formSection.querySelector('textarea[name*="description"]');
        const titleField = formSection.querySelector('input[name*="title"]');
        const projectTypeField = formSection.querySelector('select[name*="project_type"]');
        const technologiesField = formSection.querySelector('input[name*="technologies_used"]');

        // Disable button and show loading
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...';
        suggestionsList.style.display = 'none';
        suggestionsList.innerHTML = '';

        // Prepare request data
        const requestData = {
            title: titleField ? titleField.value : '',
            project_type: projectTypeField ? projectTypeField.value : '',
            technologies: technologiesField ? technologiesField.value : '',
            description: descriptionField ? descriptionField.value : ''
        };

        // Fetch suggestions from backend
        fetch(`/projects/${portfolioId}/suggest-description/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify(requestData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.suggestions && data.suggestions.length > 0) {
                    displayProjectSuggestions(suggestionsList, descriptionField, data.suggestions);
                } else {
                    // Fallback suggestions
                    displayProjectSuggestions(suggestionsList, descriptionField, [
                        "Developed a comprehensive project that demonstrates technical skills and problem-solving abilities. The project showcases proficiency in modern development practices and attention to detail.",
                        "Built an innovative solution using current technologies and best practices. This project highlights the ability to work independently and deliver high-quality results.",
                        "Created a functional application that addresses real-world challenges. The project demonstrates strong analytical skills and technical implementation capabilities."
                    ]);
                }
            })
            .catch(error => {
                console.error('Error fetching project suggestions:', error);
                // Fallback suggestions
                displayProjectSuggestions(suggestionsList, descriptionField, [
                    "Developed a comprehensive project that demonstrates technical skills and problem-solving abilities. The project showcases proficiency in modern development practices and attention to detail.",
                    "Built an innovative solution using current technologies and best practices. This project highlights the ability to work independently and deliver high-quality results.",
                    "Created a functional application that addresses real-world challenges. The project demonstrates strong analytical skills and technical implementation capabilities."
                ]);
            })
            .finally(() => {
                // Reset button state
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-magic"></i> AI Suggest';
            });
    }

    function displayProjectSuggestions(suggestionsList, descriptionField, suggestions) {
        suggestionsList.innerHTML = '';
        suggestions.forEach(function (suggestion) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'portfolio-btn portfolio-btn-secondary portfolio-spacing-sm';
            chip.style.margin = '0.25rem';
            chip.setAttribute('aria-label', 'AI suggestion: ' + suggestion);
            chip.textContent = suggestion.substring(0, 50) + '...';
            chip.title = suggestion; // Show full text on hover
            chip.onclick = function () {
                descriptionField.value = suggestion;
                descriptionField.style.height = 'auto';
                descriptionField.style.height = descriptionField.scrollHeight + 'px';
                // Hide suggestions after selection
                suggestionsList.style.display = 'none';
            };
            chip.onkeydown = function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    descriptionField.value = suggestion;
                    descriptionField.style.height = 'auto';
                    descriptionField.style.height = descriptionField.scrollHeight + 'px';
                    suggestionsList.style.display = 'none';
                    e.preventDefault();
                }
            };
            suggestionsList.appendChild(chip);
        });
        suggestionsList.style.display = 'block';
    }
});
