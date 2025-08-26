    document.addEventListener('DOMContentLoaded', function () {
        const suggestBtns = document.querySelectorAll('.suggest-hobby-btn');
        suggestBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const formId = btn.getAttribute('data-form-id');
                const input = document.getElementById('id_hobbies-' + formId + '-name');
                const suggestionDiv = document.getElementById('hobby-suggestion-' + formId);
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Suggesting...';
                suggestionDiv.style.display = 'none';
                fetch(window.location.pathname.replace(/\/$/, '') + '/suggest/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: JSON.stringify({ content: input.value })
                })
                    .then(response => response.json())
                    .then(data => {
                        suggestionDiv.innerHTML = '';
                        if (data.suggestions && Array.isArray(data.suggestions)) {
                            // Show suggestions as clickable chips/buttons
                            data.suggestions.forEach(function (hobby) {
                                const chip = document.createElement('button');
                                chip.type = 'button';
                                chip.className = 'btn btn-sm btn-outline-primary m-1 hobby-chip';
                                chip.textContent = hobby;
                                chip.onclick = function () {
                                    // If input is empty, just set; else, append with comma
                                    if (!input.value) {
                                        input.value = hobby;
                                    } else {
                                        // Avoid duplicate hobbies
                                        let hobbies = input.value.split(',').map(h => h.trim()).filter(Boolean);
                                        if (!hobbies.includes(hobby)) {
                                            hobbies.push(hobby);
                                            input.value = hobbies.join(', ');
                                        }
                                    }
                                };
                                suggestionDiv.appendChild(chip);
                            });
                            suggestionDiv.style.display = 'block';
                            suggestionDiv.classList.remove('text-danger');
                            suggestionDiv.classList.add('text-success');
                        } else if (data.error) {
                            suggestionDiv.textContent = data.error;
                            suggestionDiv.style.display = 'block';
                            suggestionDiv.classList.remove('text-success');
                            suggestionDiv.classList.add('text-danger');
                        }
                    })
                    .catch(() => {
                        suggestionDiv.textContent = 'Could not get suggestion.';
                        suggestionDiv.style.display = 'block';
                        suggestionDiv.classList.remove('text-success');
                        suggestionDiv.classList.add('text-danger');
                    })
                    .finally(() => {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-magic"></i> Suggest';
                    });
            });
        });
    });
