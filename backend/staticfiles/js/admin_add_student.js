    // Simple frontend validation for admin add student form
    document.addEventListener('DOMContentLoaded', function () {
        const form = document.getElementById('adminAddStudentForm');
        if (!form) return;
        form.addEventListener('submit', function (e) {
            let valid = true;
            form.querySelectorAll('input').forEach(function (input) {
                if (!input.checkValidity()) {
                    input.classList.add('is-invalid');
                    valid = false;
                } else {
                    input.classList.remove('is-invalid');
                }
            });
            if (!valid) {
                e.preventDefault();
            }
        });
        form.querySelectorAll('input').forEach(function (input) {
            input.addEventListener('input', function () {
                if (input.checkValidity()) {
                    input.classList.remove('is-invalid');
                }
            });
        });

        // Username AJAX availability check
        const usernameInput = document.getElementById('id_username');
        const usernameFeedback = document.getElementById('username-availability');
        let usernameTimeout = null;
        if (usernameInput && usernameFeedback) {
            usernameInput.addEventListener('input', function () {
                const value = this.value.trim();
                usernameFeedback.textContent = '';
                usernameFeedback.className = 'field-feedback';
                if (value.length < 3) {
                    return;
                }
                clearTimeout(usernameTimeout);
                usernameTimeout = setTimeout(function () {
                    fetch('/ajax/check/?field=username&value=' + encodeURIComponent(value))
                        .then(response => response.json())
                        .then(data => {
                            if (data.available) {
                                usernameFeedback.textContent = 'Username is available';
                                usernameFeedback.style.color = 'green';
                            } else {
                                usernameFeedback.textContent = data.error ? data.error : 'Username is already taken';
                                usernameFeedback.style.color = 'red';
                            }
                        })
                        .catch(() => {
                            usernameFeedback.textContent = 'Could not check username';
                            usernameFeedback.style.color = 'orange';
                        });
                }, 400);
            });
        }

        // Email AJAX availability check
        const emailInput = document.getElementById('id_email');
        const emailFeedback = document.getElementById('email-availability');
        let emailTimeout = null;
        if (emailInput && emailFeedback) {
            emailInput.addEventListener('input', function () {
                const value = this.value.trim();
                emailFeedback.textContent = '';
                emailFeedback.className = 'field-feedback';
                if (value.length < 5 || value.indexOf('@') === -1) {
                    return;
                }
                clearTimeout(emailTimeout);
                emailTimeout = setTimeout(function () {
                    fetch('/ajax/check/?field=email&value=' + encodeURIComponent(value))
                        .then(response => response.json())
                        .then(data => {
                            if (data.available) {
                                emailFeedback.textContent = 'Email is available';
                                emailFeedback.style.color = 'green';
                            } else {
                                emailFeedback.textContent = data.error ? data.error : 'Email is already registered';
                                emailFeedback.style.color = 'red';
                            }
                        })
                        .catch(() => {
                            emailFeedback.textContent = 'Could not check email';
                            emailFeedback.style.color = 'orange';
                        });
                }, 400);
            });
        }
    });