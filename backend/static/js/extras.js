            document.addEventListener('DOMContentLoaded', function () {
                // File upload display
                document.querySelectorAll('input[type="file"]').forEach(input => {
                    input.addEventListener('change', function () {
                        const fileName = this.files[0] ? this.files[0].name : 'Upload your resume';
                        this.nextElementSibling.querySelector('.file-upload-text').textContent = fileName;
                    });
                });
            });
