document.addEventListener('DOMContentLoaded', function () {
    const aiBtn = document.getElementById('ai-suggest-btn');
    const aiRegenerateBtn = document.getElementById('ai-regenerate-btn');
    const summaryField = document.querySelector('.portfolio-textarea');
    const suggestionsList = document.getElementById('ai-suggestions-list');

    // Check if elements exist
    if (!aiBtn || !summaryField || !suggestionsList) {
        console.error('Required elements not found for AI suggestions');
        return;
    }

    function fetchSuggestions() {
        aiBtn.disabled = true;
        aiRegenerateBtn.disabled = true;
        aiBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...';
        aiRegenerateBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Regenerating...';
        suggestionsList.style.display = 'none';
        suggestionsList.innerHTML = '';

        // Get current portfolio ID from URL
        const urlParts = window.location.pathname.split('/');
        const portfolioId = urlParts[urlParts.length - 2]; // Get the ID before the last slash

        // Prepare request data
        const requestData = {
            content: summaryField.value || ''
        };

        // Fetch suggestions from backend
        fetch(`/summary/${portfolioId}/suggest/`, {
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
                    displaySuggestions(data.suggestions);
                } else {
                    // Fallback to sample suggestions if backend fails
                    displaySuggestions([
                        "Experienced software developer with 3+ years of expertise in Python, JavaScript, and React. Passionate about creating user-friendly applications and solving complex problems through innovative coding solutions.",
                        "Dedicated computer science graduate with strong analytical skills and hands-on experience in web development. Seeking opportunities to apply my technical knowledge and contribute to meaningful projects.",
                        "Results-driven professional with a background in data analysis and machine learning. Skilled in Python, SQL, and statistical modeling, with a proven track record of delivering actionable insights."
                    ]);
                }
            })
            .catch(error => {
                console.error('Error fetching suggestions:', error);
                // Fallback to sample suggestions
                displaySuggestions([
                    "Experienced software developer with 3+ years of expertise in Python, JavaScript, and React. Passionate about creating user-friendly applications and solving complex problems through innovative coding solutions.",
                    "Dedicated computer science graduate with strong analytical skills and hands-on experience in web development. Seeking opportunities to apply my technical knowledge and contribute to meaningful projects.",
                    "Results-driven professional with a background in data analysis and machine learning. Skilled in Python, SQL, and statistical modeling, with a proven track record of delivering actionable insights."
                ]);
            })
            .finally(() => {
                // Reset button states
                aiBtn.disabled = false;
                aiBtn.innerHTML = '<i class="fas fa-magic"></i> AI Suggest';
                if (aiRegenerateBtn) {
                    aiRegenerateBtn.disabled = false;
                    aiRegenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerate';
                }
            });
    }

    function displaySuggestions(suggestions) {
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
                summaryField.value = suggestion;
                summaryField.style.height = 'auto';
                summaryField.style.height = summaryField.scrollHeight + 'px';
                // Hide suggestions after selection
                suggestionsList.style.display = 'none';
            };
            chip.onkeydown = function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    summaryField.value = suggestion;
                    summaryField.style.height = 'auto';
                    summaryField.style.height = summaryField.scrollHeight + 'px';
                    suggestionsList.style.display = 'none';
                    e.preventDefault();
                }
            };
            suggestionsList.appendChild(chip);
        });
        suggestionsList.style.display = 'block';
        if (aiRegenerateBtn) {
            aiRegenerateBtn.style.display = 'inline-block';
        }
    }

    aiBtn.addEventListener('click', function () {
        fetchSuggestions();
    });
    aiRegenerateBtn.addEventListener('click', function () {
        fetchSuggestions();
    });
});
