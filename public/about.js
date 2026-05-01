/**
 * about.js
 * 
 * Features:
 * - Icon Initialization: Sets up Lucide icons for UI elements.
 * - Theme Handling: Loads the saved theme from localStorage (e.g., solarized-dark, light) and applies it to the document to maintain user preference.
 * - Fade-in Animations: Sets up an Intersection Observer to trigger fade-in animations when elements with the '.fade-in' class scroll into view.
 */

// Initialize Lucide Icons
lucide.createIcons();

// Theme Handling
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'solarized-dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
}

// Fade-in Intersection Observer
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });
}

// Run initializers
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAnimations();
});
