// Initialize Lucide Icons
lucide.createIcons();

// Theme Handling
function initTheme() {
    const urlParams = new URLSearchParams(window.location.search);
    const theme = urlParams.get('theme');
    
    if (theme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
}

// Accordion Logic
function initAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const currentItem = header.parentElement;
            const isActive = currentItem.classList.contains('active');
            
            // Close all items
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                currentItem.classList.add('active');
            }
        });
    });
}

// Run initializers
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAccordion();
});
