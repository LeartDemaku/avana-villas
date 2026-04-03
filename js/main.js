/**
 * AVANA VILLAS - Premium Functionality
 * 
 * 1. Navbar: Sticky & Transparent-to-Solid Transition
 * 2. Mobile Menu: Hamburger Toggle & Swipe Logic
 * 3. Accessibility: ARIA attributes management
 * 4. Animations: Scroll Reveals
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. NAVBAR SCROLL LOGIC
    // -------------------------------------------------------------------------
    const header = document.querySelector('.header');

    const handleScroll = () => {
        const scrollY = window.scrollY;

        // Add .scrolled class when page is scrolled > 50px
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            // Only remove if mobile menu is NOT open (optional, but cleaner)
            if (!document.body.classList.contains('menu-open')) {
                header.classList.remove('scrolled');
            }
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on load to set correct state
    handleScroll();


    // -------------------------------------------------------------------------
    // 2. MOBILE MENU TOGGLE (ROBUST & ACCESSIBLE)
    // -------------------------------------------------------------------------
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const body = document.body;

    // Helper functions defined before usage
    function openMenu() {
        if (!mobileMenu || !hamburger) return;
        
        mobileMenu.classList.add('active');
        mobileMenu.setAttribute('aria-hidden', 'false');
        
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        
        body.style.overflow = 'hidden'; // Prevent background scrolling
        body.classList.add('menu-open');
    }

    function closeMenu() {
        if (!mobileMenu || !hamburger) return;

        mobileMenu.classList.remove('active');
        mobileMenu.setAttribute('aria-hidden', 'true');
        
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        
        body.style.overflow = '';
        body.classList.remove('menu-open');
        
        // Re-check scroll state for header transparency
        handleScroll();
    }

    function toggleMenu() {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    if (hamburger && mobileMenu) {
        // Toggle Button Click
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop event so document click doesn't fire immediately
            toggleMenu();
        });

        // Close on Link Click
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });

        // Close on Outside Click
        document.addEventListener('click', (e) => {
            const isMenuOpen = mobileMenu.classList.contains('active');
            const clickedInsideMenu = mobileMenu.contains(e.target);
            const clickedOnButton = hamburger.contains(e.target);

            if (isMenuOpen && !clickedInsideMenu && !clickedOnButton) {
                closeMenu();
            }
        });

        // Close on Escape Key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    } else {
        console.warn('Mobile menu elements not found in DOM');
    }


    // -------------------------------------------------------------------------
    // 3. SCROLL REVEAL ANIMATIONS
    // -------------------------------------------------------------------------
    const revealElements = document.querySelectorAll('.reveal');

    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Stop observing once revealed for performance
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1, // Trigger when 10% visible
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // -------------------------------------------------------------------------
    // 4. SMOOTH SCROLLING FOR ANCHORS
    // -------------------------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerOffset = 90; // Match CSS header height
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

});
