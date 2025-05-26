/**
 * Advanced scroll effects for TutorIA landing page
 *
 * This file contains sophisticated scroll-based effects using GSAP and Lenis
 * for creating a professional and immersive user experience.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, Observer);

// Store effects for cleanup
const effects = {
  scrollTriggers: [],
  timelines: [],
  observers: []
};

// Configuration
const config = {
  parallaxStrength: 0.3,
  stickyDuration: 200,
  revealDistance: 100,
  scrollSpeed: {
    slow: 0.5,
    normal: 1,
    fast: 1.5
  }
};

/**
 * Initialize all scroll effects
 */
export function initScrollEffects() {
  // Clean up any existing effects
  cleanupEffects();

  // Initialize parallax effects
  initParallaxEffects();

  // Initialize reveal effects
  initRevealEffects();

  // Initialize sticky elements
  initStickyElements();

  // Initialize horizontal scroll sections
  initHorizontalScrollSections();

  // Initialize scroll-triggered animations
  initScrollTriggeredAnimations();

  // Initialize scroll progress indicators
  initScrollProgressIndicators();
}

/**
 * Initialize parallax effects for depth and dimension
 */
function initParallaxEffects() {
  // Apply parallax to elements with data-parallax attribute
  document.querySelectorAll('[data-parallax]').forEach((element) => {
    // Get parallax strength from attribute or use default
    const strength = parseFloat(element.getAttribute('data-parallax')) || config.parallaxStrength;

    // Create scroll trigger
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        // Calculate parallax position
        const yPos = (self.start - self.scroll) * strength;

        // Apply transform
        gsap.to(element, {
          y: yPos,
          ease: "none",
          overwrite: "auto"
        });
      }
    });

    // Store for cleanup
    effects.scrollTriggers.push(trigger);
  });

  // Apply multi-layer parallax to sections with data-parallax-bg
  document.querySelectorAll('[data-parallax-bg]').forEach((section) => {
    // Get all parallax layers
    const layers = section.querySelectorAll('.parallax-layer');

    layers.forEach((layer, index) => {
      // Calculate strength based on layer index (deeper layers move slower)
      const strength = config.parallaxStrength * (1 - (index / layers.length));

      // Create scroll trigger
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          // Calculate parallax position
          const progress = self.progress;
          const yPos = progress * 100 * strength;

          // Apply transform
          gsap.to(layer, {
            y: yPos,
            ease: "none",
            overwrite: "auto"
          });
        }
      });

      // Store for cleanup
      effects.scrollTriggers.push(trigger);
    });
  });
}

/**
 * Initialize reveal effects for elements as they scroll into view
 */
function initRevealEffects() {
  // Apply reveal effect to elements with data-reveal attribute
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    // Get reveal direction from attribute or default to "up"
    const direction = element.getAttribute('data-reveal') || 'up';

    // Set initial state
    let fromVars = { opacity: 0 };

    // Set direction-specific properties
    switch(direction) {
      case 'up':
        fromVars.y = config.revealDistance;
        break;
      case 'down':
        fromVars.y = -config.revealDistance;
        break;
      case 'left':
        fromVars.x = config.revealDistance;
        break;
      case 'right':
        fromVars.x = -config.revealDistance;
        break;
      case 'scale':
        fromVars.scale = 0.8;
        break;
    }

    // Set initial state
    gsap.set(element, fromVars);

    // Create scroll trigger
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top 85%",
      onEnter: () => {
        // Animate to revealed state
        gsap.to(element, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power2.out"
        });
      },
      once: true
    });

    // Store for cleanup
    effects.scrollTriggers.push(trigger);
  });

  // Apply staggered reveal to groups with data-reveal-group
  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    // Get all items in the group
    const items = group.querySelectorAll('[data-reveal-item]');

    // Get reveal direction from attribute or default to "up"
    const direction = group.getAttribute('data-reveal-group') || 'up';

    // Set initial state for all items
    let fromVars = { opacity: 0 };

    // Set direction-specific properties
    switch(direction) {
      case 'up':
        fromVars.y = config.revealDistance;
        break;
      case 'down':
        fromVars.y = -config.revealDistance;
        break;
      case 'left':
        fromVars.x = config.revealDistance;
        break;
      case 'right':
        fromVars.x = -config.revealDistance;
        break;
      case 'scale':
        fromVars.scale = 0.8;
        break;
    }

    // Set initial state
    gsap.set(items, fromVars);

    // Create scroll trigger
    const trigger = ScrollTrigger.create({
      trigger: group,
      start: "top 85%",
      onEnter: () => {
        // Animate items with stagger
        gsap.to(items, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 1,
          stagger: 0.1,
          ease: "power2.out"
        });
      },
      once: true
    });

    // Store for cleanup
    effects.scrollTriggers.push(trigger);
  });
}

/**
 * Initialize sticky elements for professional UI effects
 */
function initStickyElements() {
  // Apply sticky effect to elements with data-sticky attribute
  document.querySelectorAll('[data-sticky]').forEach((element) => {
    // Get sticky options
    const start = element.getAttribute('data-sticky-start') || 'top top';
    const end = element.getAttribute('data-sticky-end') || `+=${config.stickyDuration}`;

    // Create scroll trigger
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: start,
      end: end,
      pin: true,
      pinSpacing: true
    });

    // Store for cleanup
    effects.scrollTriggers.push(trigger);
  });
}

/**
 * Initialize horizontal scroll sections
 */
function initHorizontalScrollSections() {
  // Apply horizontal scroll to sections with data-horizontal-scroll
  document.querySelectorAll('[data-horizontal-scroll]').forEach((section) => {
    // Get the container that will move horizontally
    const container = section.querySelector('.horizontal-container');
    if (!container) return;

    // Calculate the width of the container
    const width = container.scrollWidth;

    // Set container width
    gsap.set(container, { width: width });

    // Create timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${width}`,
        scrub: true,
        pin: true,
        anticipatePin: 1
      }
    });

    // Animate container horizontally
    tl.to(container, {
      x: -width + window.innerWidth,
      ease: "none"
    });

    // Store for cleanup
    effects.timelines.push(tl);
  });
}

/**
 * Initialize scroll-triggered animations
 */
function initScrollTriggeredAnimations() {
  // Apply scroll-triggered animations to elements with data-scroll-anim
  document.querySelectorAll('[data-scroll-anim]').forEach((element) => {
    // Get animation type
    const animType = element.getAttribute('data-scroll-anim');

    // Create timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start: "top 80%",
        end: "bottom 20%",
        scrub: true
      }
    });

    // Apply animation based on type
    switch(animType) {
      case 'rotate':
        tl.to(element, {
          rotation: 360,
          ease: "none"
        });
        break;
      case 'scale':
        tl.fromTo(element,
          { scale: 0.8 },
          { scale: 1, ease: "none" }
        );
        break;
      case 'fade':
        tl.fromTo(element,
          { opacity: 0 },
          { opacity: 1, ease: "none" }
        );
        break;
      case 'blur':
        tl.fromTo(element,
          { filter: 'blur(10px)' },
          { filter: 'blur(0px)', ease: "none" }
        );
        break;
      default:
        // Default animation
        tl.fromTo(element,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, ease: "none" }
        );
    }

    // Store for cleanup
    effects.timelines.push(tl);
  });
}

/**
 * Initialize scroll progress indicators
 */
function initScrollProgressIndicators() {
  // Create main scroll progress indicator
  const progressBar = document.querySelector('.scroll-progress-bar');
  if (progressBar) {
    // Create scroll trigger
    const trigger = ScrollTrigger.create({
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        // Update progress bar width
        gsap.to(progressBar, {
          width: `${self.progress * 100}%`,
          duration: 0.1,
          ease: "none"
        });
      }
    });

    // Store for cleanup
    effects.scrollTriggers.push(trigger);
  }

  // Create section progress indicators
  document.querySelectorAll('[data-section-progress]').forEach((section) => {
    // Find progress indicator
    const indicator = section.querySelector('.section-progress');
    if (!indicator) return;

    // Create scroll trigger
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        // Calculate section progress
        const progress = self.progress;

        // Update indicator
        gsap.to(indicator, {
          width: `${progress * 100}%`,
          duration: 0.1,
          ease: "none"
        });
      }
    });

    // Store for cleanup
    effects.scrollTriggers.push(trigger);
  });
}

/**
 * Clean up all effects
 */
export function cleanupEffects() {
  // Kill all scroll triggers
  effects.scrollTriggers.forEach((trigger) => {
    trigger.kill();
  });

  // Kill all timelines
  effects.timelines.forEach((timeline) => {
    timeline.kill();
  });

  // Kill all observers
  effects.observers.forEach((observer) => {
    observer.kill();
  });

  // Clear arrays
  effects.scrollTriggers.length = 0;
  effects.timelines.length = 0;
  effects.observers.length = 0;
}
