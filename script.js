// Loading Screen and Initial Setup
// Global variables for landing mode
let isInLandingMode = true;
let exitLandingMode = null;

document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen after page loads
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            // Start main animations after loading screen disappears
            initMainAnimations();
        }, 500);
    }, 1000);

    // Initialize all functionality
    initNavigation();
    initScrollEffects();
    initLayeredParallax();
    initProjectFilters();
    initVideoPlayer();
    initSkillBars();
    initAnimations();
    initCursorTrail();
    initMagneticButtons();
    initAdvancedParallax();
});

// Fixed Hero Landing Screen with Code Forest Exit Effect
function initLayeredParallax() {
    const heroSection = document.querySelector('#hero');
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const codeForest = document.querySelector('.parallax-bg-near');
    const cityBg = document.querySelector('.parallax-bg-far');
    const grungeLayer = document.querySelector('.parallax-bg-mid');
    
    if (!heroSection || !codeForest) {
        console.log('Hero elements not found');
        return;
    }
    
    let scrollActionCount = 0;
    let lastScrollY = 0;
    const maxLandingScrolls = 4; // Stay on landing screen for 4 scroll actions
    
    // Prevent default scrolling during landing mode
    function preventScroll(e) {
        if (isInLandingMode) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
    
    function handleWheelScroll(e) {
        if (!isInLandingMode) {
            // Allow scrolling back up to re-enter landing mode
            if (e.deltaY < 0 && window.pageYOffset <= 100) {
                e.preventDefault();
                enterLandingMode();
                return;
            }
            return;
        }
        
        e.preventDefault();
        
        // Count scroll actions (wheel events)
        if (e.deltaY > 0) { // Scrolling down
            scrollActionCount = Math.min(scrollActionCount + 1, maxLandingScrolls);
        } else { // Scrolling up
            scrollActionCount = Math.max(scrollActionCount - 1, 0);
        }
        
        updateForestEffect();
        
        // Exit landing mode after max scrolls
        if (scrollActionCount >= maxLandingScrolls) {
            exitLandingModeFunction();
        }
    }
    
    function updateForestEffect() {
        const progress = scrollActionCount / maxLandingScrolls;
        
        if (codeForest) {
            // EXPAND the code forest - this creates the "exiting forest" illusion
            // As the image gets larger, less of the branches are visible in the frame
            const scale = 1 + (progress * 2); // Grows from 100% to 300%
            const opacity = Math.max(0.9 - (progress * 0.6), 0.1); // Gradually fade
            
            codeForest.style.transform = `scale(${scale})`;
            codeForest.style.opacity = opacity;
        }
        
        // City background stays COMPLETELY STATIC (never moves)
        if (cityBg) {
            cityBg.style.transform = 'none';
            cityBg.style.opacity = Math.min(0.8 + (progress * 0.3), 1);
        }
        
        // Grunge layer subtle effect
        if (grungeLayer) {
            grungeLayer.style.opacity = Math.max(0.2 - (progress * 0.1), 0.05);
        }
        
        // Title fades during forest exit
        const titleOpacity = Math.max(1 - (progress * 1.2), 0);
        const titleY = progress * 20;
        
        if (heroTitle) {
            heroTitle.style.opacity = titleOpacity;
            heroTitle.style.transform = `translateY(-${titleY}px)`;
        }
        if (heroSubtitle) {
            heroSubtitle.style.opacity = titleOpacity;
            heroSubtitle.style.transform = `translateY(-${titleY}px)`;
        }
        if (scrollIndicator) {
            scrollIndicator.style.opacity = Math.max(1 - (progress * 1.5), 0);
        }
        
        console.log(`Forest exit progress: ${(progress * 100).toFixed(1)}% (${scrollActionCount}/${maxLandingScrolls} scrolls)`);
    }
    
    function exitLandingModeFunction() {
        isInLandingMode = false;
        
        // Transition to About Me section
        if (heroSection) {
            heroSection.style.transition = 'opacity 0.8s ease-out';
            heroSection.style.opacity = '0';
            
            setTimeout(() => {
                heroSection.style.display = 'none';
                document.body.style.overflow = 'auto';
                
                // Scroll to About Me section
                const aboutSection = document.querySelector('.about') || document.querySelector('#about');
                if (aboutSection) {
                    aboutSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                
                console.log('Exited landing mode - scrolled to About Me section');
            }, 800);
        }
        
        // Remove scroll prevention but keep wheel listener for re-entry
        document.removeEventListener('touchmove', preventScroll, { passive: false });
        document.removeEventListener('keydown', preventKeyScroll);
    }
    
    // Assign to global variable for access from navigation
    exitLandingMode = exitLandingModeFunction;
    
    function preventKeyScroll(e) {
        if (isInLandingMode) {
            const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40]; // Space, Page Up/Down, Home, End, Arrow keys
            if (scrollKeys.includes(e.keyCode)) {
                e.preventDefault();
                return false;
            }
        }
    }
    
    function enterLandingMode() {
        scrollActionCount = 0;
        isInLandingMode = true;
        
        if (heroSection) {
            heroSection.style.display = 'flex';
            heroSection.style.opacity = '1';
            heroSection.style.transition = 'opacity 0.5s ease-in';
            document.body.style.overflow = 'hidden';
        }
        
        updateForestEffect();
        
        // Re-add scroll prevention
        document.addEventListener('touchmove', preventScroll, { passive: false });
        document.addEventListener('keydown', preventKeyScroll);
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('Re-entered landing mode');
    }
    
    function resetToLanding() {
        // Allow re-entry when at the top of the page
        if (window.pageYOffset < 50 && !isInLandingMode) {
            enterLandingMode();
        }
    }
    
    // Initialize landing mode
    if (heroSection) {
        document.body.style.overflow = 'hidden'; // Prevent page scrolling initially
        heroSection.style.display = 'flex';
        heroSection.style.opacity = '1';
    }
    
    // Add event listeners
    document.addEventListener('wheel', handleWheelScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('keydown', preventKeyScroll);
    
    // Allow reset when scrolling back to top (keep this listener always active)
    window.addEventListener('scroll', resetToLanding, { passive: true });
    
    // Also listen for scroll up at the top to re-enter landing mode
    window.addEventListener('wheel', (e) => {
        if (!isInLandingMode && e.deltaY < 0 && window.pageYOffset <= 10) {
            enterLandingMode();
        }
    }, { passive: false });
    
    // Initial forest effect
    updateForestEffect();
    
    console.log('Fixed hero landing screen initialized - 4 scrolls to exit, scroll up at top to re-enter');
}

// Main Animations
function initMainAnimations() {
    // Animate text reveals
    setTimeout(() => {
        document.querySelectorAll('.text-reveal').forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('animate');
            }, index * 200);
        });
    }, 500);

    // Start counter animations
    animateCounters();
    
    // Start staggered animations
    setTimeout(() => {
        document.querySelectorAll('.stagger-item').forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 150);
        });
    }, 1500);
}

// Counter Animation
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
                counter.textContent = target + '+';
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 16);
    });
}

// Cursor Trail Effect
function initCursorTrail() {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    document.body.appendChild(trail);
    
    let mouseX = 0, mouseY = 0;
    let trailX = 0, trailY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function animateTrail() {
        trailX += (mouseX - trailX) * 0.1;
        trailY += (mouseY - trailY) * 0.1;
        
        trail.style.left = trailX - 10 + 'px';
        trail.style.top = trailY - 10 + 'px';
        
        requestAnimationFrame(animateTrail);
    }
    
    animateTrail();
}

// Magnetic Button Effect
function initMagneticButtons() {
    const magneticButtons = document.querySelectorAll('.magnetic-btn');
    
    magneticButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
        });
        
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
        });
    });
}

// Advanced Parallax Effects
function initAdvancedParallax() {
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        // Hero background parallax
        const heroBackground = document.querySelector('.hero-background');
        if (heroBackground) {
            heroBackground.style.transform = `translateY(${rate}px) scale(${1 + scrolled * 0.0002})`;
        }
        
        // Rotate hero logo based on scroll
        const heroLogo = document.querySelector('.hero-logo');
        if (heroLogo) {
            const rotation = scrolled * 0.1;
            heroLogo.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${1 + scrolled * 0.0001})`;
        }
        
        // Parallax for section backgrounds
        document.querySelectorAll('section::before').forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const scrollPercent = (scrolled - sectionTop + window.innerHeight) / (sectionHeight + window.innerHeight);
            
            if (scrollPercent >= 0 && scrollPercent <= 1) {
                const yPos = -(scrolled - sectionTop) * 0.3;
                section.style.transform = `translateY(${yPos}px)`;
            }
        });
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
}

// Navigation
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');

    // Hamburger menu toggle
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // Navbar scroll effect
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScrollTop = scrollTop;
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            
            // Check if it's an external link (contains .html) or starts with http
            if (targetId.includes('.html') || targetId.startsWith('http')) {
                // Allow normal navigation for external links
                return;
            }
            
            e.preventDefault();
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Force exit landing mode when clicking nav links
                if (isInLandingMode) {
                    exitLandingMode();
                    // Wait for hero section to fade out before scrolling
                    setTimeout(() => {
                        const offsetTop = targetSection.offsetTop - 80;
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }, 900); // Wait for fade out animation
                } else {
                    const offsetTop = targetSection.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Scroll Effects and Animations
function initScrollEffects() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Special handling for section headers
                if (entry.target.classList.contains('section-header')) {
                    // Animate the text reveal elements inside
                    const textReveals = entry.target.querySelectorAll('.text-reveal');
                    textReveals.forEach((el, index) => {
                        setTimeout(() => {
                            el.classList.add('animate');
                        }, index * 200);
                    });
                }
                
                // Special handling for staggered items
                if (entry.target.classList.contains('stagger-item')) {
                    const staggerItems = entry.target.parentElement.querySelectorAll('.stagger-item');
                    staggerItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.classList.add('visible');
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .section-header, .stagger-item');
    animatedElements.forEach(el => observer.observe(el));
    
    // Advanced scroll-based animations
    window.addEventListener('scroll', debounce(handleAdvancedScroll, 10));
}

// Advanced scroll handler
function handleAdvancedScroll() {
    const scrolled = window.pageYOffset;
    const windowHeight = window.innerHeight;
    
    // Parallax effect for project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const isVisible = rect.top < windowHeight && rect.bottom > 0;
        
        if (isVisible) {
            const scrollPercent = (windowHeight - rect.top) / (windowHeight + rect.height);
            const yOffset = (scrollPercent - 0.5) * 50;
            card.style.transform = `translateY(${yOffset}px)`;
        }
    });
    
    // Professional items 3D effect
    const professionalItems = document.querySelectorAll('.professional-item');
    professionalItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const isVisible = rect.top < windowHeight && rect.bottom > 0;
        
        if (isVisible) {
            const scrollPercent = (windowHeight - rect.top) / (windowHeight + rect.height);
            const rotateX = (scrollPercent - 0.5) * 10;
            const translateZ = scrollPercent * 20;
            item.style.transform = `translateZ(${translateZ}px) rotateX(${rotateX}deg)`;
        }
    });
}

// Project Filtering
function initProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter projects
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.classList.add('hidden');
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Video Player
function initVideoPlayer() {
    const videoItems = document.querySelectorAll('.video-item');
    const mainVideo = document.getElementById('main-video');

    videoItems.forEach(item => {
        item.addEventListener('click', () => {
            const videoSrc = item.getAttribute('data-src');
            
            // Update active state
            videoItems.forEach(vi => vi.classList.remove('active'));
            item.classList.add('active');
            
            // Change video source
            if (mainVideo && videoSrc) {
                mainVideo.src = videoSrc;
                mainVideo.load(); // Reload the video element
            }
        });
    });
}

// Skill Bars Animation
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillBar = entry.target;
                const width = skillBar.getAttribute('data-width');
                setTimeout(() => {
                    skillBar.style.width = width;
                }, 200);
            }
        });
    }, { threshold: 0.5 });

    skillBars.forEach(bar => skillObserver.observe(bar));
}

// General Animations
function initAnimations() {
    // Add fade-in class to elements that should animate
    const elementsToAnimate = [
        '.section-header',
        '.about-content',
        '.professional-item',
        '.project-card',
        '.skill-category',
        '.video-player-container',
        '.contact-content'
    ];

    elementsToAnimate.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
            el.classList.add('fade-in');
            el.style.transitionDelay = `${index * 0.1}s`;
        });
    });
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Parallax Effect for Hero Section
window.addEventListener('scroll', debounce(() => {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');
    
    if (heroBackground) {
        const speed = scrolled * 0.5;
        heroBackground.style.transform = `translateY(${speed}px)`;
    }
}, 10));

// Smooth scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add scroll to top button
function addScrollToTopButton() {
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '↑';
    scrollButton.className = 'scroll-to-top';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: #64ffda;
        color: #0a0a0a;
        border: none;
        border-radius: 50%;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(100, 255, 218, 0.3);
    `;
    
    document.body.appendChild(scrollButton);
    
    scrollButton.addEventListener('click', scrollToTop);
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollButton.style.opacity = '1';
            scrollButton.style.transform = 'translateY(0)';
        } else {
            scrollButton.style.opacity = '0';
            scrollButton.style.transform = 'translateY(10px)';
        }
    });
}

// Initialize scroll to top button
addScrollToTopButton();

// Typing Effect for Hero Title (Optional Enhancement)
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Contact Form Handling (if you want to add a contact form later)
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            // Since this is a static GitHub Pages site, you could integrate with:
            // - Formspree
            // - Netlify Forms
            // - EmailJS
            // For now, just show a success message
            
            showNotification('Thank you for your message! I\'ll get back to you soon.', 'success');
            contactForm.reset();
        });
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#64ffda' : '#ff6b6b'};
        color: ${type === 'success' ? '#0a0a0a' : '#ffffff'};
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize contact form if it exists
initContactForm();

// Performance optimization: Lazy loading for images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Error handling for missing videos or images
function handleMediaErrors() {
    const videos = document.querySelectorAll('video');
    const images = document.querySelectorAll('img');
    
    videos.forEach(video => {
        video.addEventListener('error', (e) => {
            console.warn('Video failed to load:', video.src);
            video.style.display = 'none';
        });
    });
    
    images.forEach(img => {
        img.addEventListener('error', (e) => {
            console.warn('Image failed to load:', img.src);
            img.style.opacity = '0.5';
            img.alt = 'Image not available';
        });
    });
}

// Initialize error handling
handleMediaErrors();

// Browser compatibility check
function checkBrowserSupport() {
    const isModernBrowser = 'IntersectionObserver' in window && 
                           'fetch' in window && 
                           'CSS' in window && 
                           CSS.supports('display', 'grid');
    
    if (!isModernBrowser) {
        console.warn('Some features may not work in this browser. Please update for the best experience.');
    }
}

checkBrowserSupport();

// Export functions for potential external use
window.portfolioFunctions = {
    scrollToTop,
    showNotification,
    typeWriter
};
