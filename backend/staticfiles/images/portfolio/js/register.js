document.addEventListener('DOMContentLoaded', () => {
    function checkAvailability(field, value) {
        if (!value) return;

        fetch(`/ajax/check/?field=${field}&value=${encodeURIComponent(value)}`)
            .then(response => response.json())
            .then(data => {
                const feedback = document.getElementById(`${field}-feedback`);
                if (feedback) {
                    if (data.available) {
                        feedback.textContent = `${field.charAt(0).toUpperCase() + field.slice(1)} is available`;
                        feedback.style.color = 'green';
                    } else {
                        feedback.textContent = `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken`;
                        feedback.style.color = 'red';
                    }
                }
            });
    }

    const usernameInput = document.getElementById('id_username');
    const emailInput = document.getElementById('id_email');

    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            checkAvailability('username', usernameInput.value);
        });
    }

    if (emailInput) {
        emailInput.addEventListener('input', () => {
            checkAvailability('email', emailInput.value);
        });
    }
});
