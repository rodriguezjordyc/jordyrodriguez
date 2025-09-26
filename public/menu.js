// Mobile menu functionality with error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('nav');
        const overlay = document.querySelector('.menu-overlay');
        const navLinks = document.querySelectorAll('nav a');

        // Safety check for required elements
        if (!menuToggle || !nav || !overlay) {
            console.warn('Menu elements not found, mobile menu disabled');
            return;
        }

    // Toggle menu when hamburger is clicked
    menuToggle.addEventListener('click', function() {
        nav.classList.toggle('active');
        overlay.classList.toggle('active', nav.classList.contains('active'));
    });

    // Close menu when overlay is clicked
    overlay.addEventListener('click', function() {
        nav.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            nav.classList.remove('active');
            overlay.classList.remove('active');
        });
    });

    } catch (error) {
        console.error('Error initializing mobile menu:', error);
    }
}); 