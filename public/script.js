
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('resumeForm');
    const fileInput = document.getElementById('resumeFile');
    const submitBtn = document.querySelector('.generate-btn');
    const fileLabel = document.querySelector('.file-input-text');
    const loadingModal = document.getElementById('loadingModal');

    // Handle file selection
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const fileName = this.files[0].name;
            fileLabel.textContent = fileName;
            submitBtn.disabled = false;
        } else {
            fileLabel.textContent = 'Choose PDF file';
            submitBtn.disabled = true;
        }
    });

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('resume', fileInput.files[0]);

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        loadingModal.style.display = 'block';

        try {
            // Upload and process resume
            const response = await fetch('/api/upload-resume', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();

            if (result.success) {
                // Generate portfolio
                const portfolioResponse = await fetch('/api/generate-portfolio', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(result.data)
                });

                if (portfolioResponse.ok) {
                    const portfolioResult = await portfolioResponse.json();
                    
                    if (portfolioResult.success) {
                        // Use session-based URLs
                        const portfolioUrl = `/portfolio/preview`;
                        const downloadUrl = `/api/download-portfolio`;
                        
                        // Show success message with options
                        const message = `Portfolio generated successfully!\n\nClick OK to preview, or use the download link to save the complete website to your computer.`;
                        
                        if (confirm(message)) {
                            // Open portfolio in new tab
                            window.open(portfolioUrl, '_blank');
                        }
                        
                        // Create download link
                        const downloadLink = document.createElement('a');
                        downloadLink.href = downloadUrl;
                        downloadLink.download = `portfolio-website.html`;
                        downloadLink.textContent = 'Download Complete Portfolio Website';
                        downloadLink.style.cssText = `
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #667eea;
                            color: white;
                            padding: 12px 20px;
                            border-radius: 8px;
                            text-decoration: none;
                            font-weight: 600;
                            z-index: 10000;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                        `;
                        
                        document.body.appendChild(downloadLink);
                        
                        // Remove download link after 10 seconds
                        setTimeout(() => {
                            if (downloadLink.parentNode) {
                                downloadLink.parentNode.removeChild(downloadLink);
                            }
                        }, 10000);
                        
                    } else {
                        throw new Error('Portfolio generation failed');
                    }
                } else {
                    throw new Error('Portfolio generation failed');
                }
            } else {
                throw new Error(result.error || 'Processing failed');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        } finally {
            // Hide loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            loadingModal.style.display = 'none';
        }
    });
});
