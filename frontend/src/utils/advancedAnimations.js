/**
 * Advanced animations for TutorIA landing page
 *
 * This file contains sophisticated animations using GSAP for creating
 * a professional and immersive user experience.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

// Register GSAP plugins
gsap.registerPlugin(
  ScrollTrigger,
  MotionPathPlugin
);

// Custom SplitText implementation (simplified version of GSAP's premium plugin)
class SimpleSplitText {
  constructor(target, options = {}) {
    this.target = typeof target === 'string' ? document.querySelector(target) : target;
    this.options = options;
    this.chars = [];
    this.words = [];
    this.lines = [];

    if (!this.target) return;

    this.split();
  }

  split() {
    const originalHTML = this.target.innerHTML;
    const originalText = this.target.textContent;
    let html = '';

    // Split into lines if needed
    if (this.options.type && this.options.type.includes('lines')) {
      // Wrap each line in a span
      const lineClass = this.options.linesClass || 'split-line';
      const lines = originalText.split('\n');

      lines.forEach(line => {
        if (line.trim() !== '') {
          html += `<span class="${lineClass}">${line}</span>`;
        }
      });

      this.target.innerHTML = html;
      this.lines = Array.from(this.target.querySelectorAll(`.${lineClass}`));
    }

    // Split into words if needed
    if (this.options.type && this.options.type.includes('words')) {
      const wordClass = this.options.wordsClass || 'split-word';
      const elements = this.lines.length ? this.lines : [this.target];

      elements.forEach(element => {
        const text = element.textContent;
        let wordHTML = '';

        text.split(' ').forEach(word => {
          if (word !== '') {
            wordHTML += `<span class="${wordClass}">${word}</span> `;
          }
        });

        element.innerHTML = wordHTML;
      });

      this.words = Array.from(this.target.querySelectorAll(`.${wordClass}`));
    }

    // Split into chars if needed
    if (this.options.type && this.options.type.includes('chars')) {
      const charClass = this.options.charsClass || 'split-char';
      const elements = this.words.length ? this.words : (this.lines.length ? this.lines : [this.target]);

      elements.forEach(element => {
        const text = element.textContent;
        let charHTML = '';

        text.split('').forEach(char => {
          charHTML += `<span class="${charClass}">${char}</span>`;
        });

        element.innerHTML = charHTML;
      });

      this.chars = Array.from(this.target.querySelectorAll(`.${charClass}`));
    }
  }

  revert() {
    if (!this.target) return;

    // Store original content before splitting
    const originalHTML = this.target._originalHTML || this.target.innerHTML;
    this.target.innerHTML = originalHTML;

    this.chars = [];
    this.words = [];
    this.lines = [];
  }
}

// Store animations for cleanup
const animations = {
  timelines: [],
  scrollTriggers: [],
  observers: [],
  splitTexts: []
};

// Make SimpleSplitText available globally
window.SimpleSplitText = SimpleSplitText;

// Animation configuration
const config = {
  duration: {
    fast: 0.5,
    normal: 1.0,
    slow: 1.5,
    verySlow: 2.5
  },
  ease: {
    smooth: "power2.out",
    bounce: "back.out(1.7)",
    elastic: "elastic.out(1, 0.3)",
    slowStart: "power3.inOut",
    textReveal: "power4.out"
  },
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.2
  }
};

/**
 * Initialize all advanced animations
 */
export function initAdvancedAnimations() {
  // Clean up any existing animations
  cleanupAnimations();

  // Initialize background animations
  initOrganicBackgroundAnimations();

  // Initialize text animations
  initAdvancedTextAnimations();

  // Initialize scroll-based animations
  initScrollBasedAnimations();

  // Initialize interactive elements
  initInteractiveElements();

  // Initialize 3D effects
  init3DEffects();

  // Set up resize handler for responsive animations
  window.addEventListener('resize', debounce(handleResize, 200));
}

/**
 * Initialize organic background animations with fluid motion
 */
function initOrganicBackgroundAnimations() {
  // Select all background shapes
  const shapes = document.querySelectorAll('.bg-shapes .shape, .floating-shapes .shape');

  shapes.forEach((shape, index) => {
    // Create unique animation for each shape
    const tl = gsap.timeline({
      repeat: -1,
      yoyo: true,
      defaults: { ease: "sine.inOut" }
    });

    // Random duration between 15-30 seconds for organic feel
    const duration = 15 + (Math.random() * 15);

    // Random starting position
    gsap.set(shape, {
      xPercent: -50 + (Math.random() * 100),
      yPercent: -50 + (Math.random() * 100),
      rotation: Math.random() * 360,
      scale: 0.8 + (Math.random() * 0.4)
    });

    // Create fluid motion path
    tl.to(shape, {
      motionPath: {
        path: createFluidPath(index),
        align: "self",
        autoRotate: false,
        alignOrigin: [0.5, 0.5]
      },
      scale: 0.9 + (Math.random() * 0.3),
      rotation: 360 * (Math.random() > 0.5 ? 1 : -1),
      duration: duration,
      ease: "none"
    });

    // Add subtle pulsing effect
    const pulseTl = gsap.timeline({
      repeat: -1,
      yoyo: true
    });

    pulseTl.to(shape, {
      opacity: 0.7 + (Math.random() * 0.3),
      scale: "-=0.1",
      duration: 2 + (Math.random() * 2),
      ease: "sine.inOut"
    });

    // Store for cleanup
    animations.timelines.push(tl, pulseTl);
  });

  // Create parallax effect for background shapes
  shapes.forEach((shape) => {
    const depth = shape.getAttribute('data-parallax') || 'medium';
    let strength;

    // Set parallax strength based on depth
    switch(depth) {
      case 'deep': strength = 0.3; break;
      case 'medium': strength = 0.2; break;
      case 'light': default: strength = 0.1;
    }

    // Create scroll trigger for parallax
    const trigger = ScrollTrigger.create({
      trigger: shape.closest('section'),
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        // Calculate parallax position
        const yPos = self.progress * 100 * strength * (Math.random() > 0.5 ? 1 : -1);
        const xPos = self.progress * 50 * strength * (Math.random() > 0.5 ? 1 : -1);

        // Apply parallax effect
        gsap.to(shape, {
          y: yPos,
          x: xPos,
          rotation: self.progress * 20 * (Math.random() > 0.5 ? 1 : -1),
          duration: 0.5,
          overwrite: "auto"
        });
      }
    });

    // Store for cleanup
    animations.scrollTriggers.push(trigger);
  });
}

/**
 * Create a fluid SVG path for organic motion
 * @param {number} index - Shape index for variation
 * @returns {string} SVG path
 */
function createFluidPath(index) {
  // Create random control points for bezier curve
  const randomize = () => -50 + Math.random() * 100;

  // Create a closed path with bezier curves
  return `M ${randomize()} ${randomize()}
          C ${randomize()} ${randomize()}, ${randomize()} ${randomize()}, ${randomize()} ${randomize()}
          S ${randomize()} ${randomize()}, ${randomize()} ${randomize()}
          S ${randomize()} ${randomize()}, ${randomize()} ${randomize()}
          S ${randomize()} ${randomize()}, ${randomize()} ${randomize()}
          Z`;
}

/**
 * Initialize advanced text animations
 */
function initAdvancedTextAnimations() {
  // Animate hero title with split text
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    // Split text into lines and chars
    const splitText = new SimpleSplitText(heroTitle, {
      type: "lines,chars",
      linesClass: "split-line",
      charsClass: "split-char"
    });

    // Store for cleanup
    animations.splitTexts.push(splitText);

    // Create timeline for hero title animation
    const tl = gsap.timeline();

    // Animate each character
    if (splitText.chars.length > 0) {
      tl.from(splitText.chars, {
        opacity: 0,
        y: 100,
        stagger: 0.02,
        duration: 1.2,
        ease: config.ease.textReveal
      });
    } else {
      // Fallback if splitting didn't work
      tl.from(heroTitle, {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: config.ease.textReveal
      });
    }

    // Store for cleanup
    animations.timelines.push(tl);
  }

  // Animate section titles when they come into view
  document.querySelectorAll('.section-title').forEach((title) => {
    // Split text
    const splitText = new SimpleSplitText(title, {
      type: "lines,words",
      linesClass: "split-line",
      wordsClass: "split-word"
    });

    // Store for cleanup
    animations.splitTexts.push(splitText);

    // Create scroll trigger
    const trigger = ScrollTrigger.create({
      trigger: title,
      start: "top 80%",
      onEnter: () => {
        // Animate words
        if (splitText.words.length > 0) {
          gsap.from(splitText.words, {
            opacity: 0,
            y: 50,
            stagger: 0.05,
            duration: 1,
            ease: config.ease.textReveal
          });
        } else {
          // Fallback if splitting didn't work
          gsap.from(title, {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: config.ease.textReveal
          });
        }
      },
      once: true
    });

    // Store for cleanup
    animations.scrollTriggers.push(trigger);
  });
}

/**
 * Initialize scroll-based animations
 */
function initScrollBasedAnimations() {
  // Animate elements with data-animation attribute
  document.querySelectorAll('[data-animation]').forEach((element) => {
    const animationType = element.getAttribute('data-animation');

    // Create scroll trigger
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top 80%",
      onEnter: () => {
        // Apply animation based on type
        switch(animationType) {
          case 'reveal':
            gsap.fromTo(element,
              { y: 100, opacity: 0 },
              { y: 0, opacity: 1, duration: config.duration.normal, ease: config.ease.smooth }
            );
            break;
          case 'fade':
            gsap.fromTo(element,
              { opacity: 0 },
              { opacity: 1, duration: config.duration.normal, ease: config.ease.smooth }
            );
            break;
          case 'scale':
            gsap.fromTo(element,
              { scale: 0.5, opacity: 0 },
              { scale: 1, opacity: 1, duration: config.duration.normal, ease: config.ease.bounce }
            );
            break;
          case 'float':
            gsap.fromTo(element,
              { y: 100, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: config.duration.normal,
                ease: config.ease.bounce,
                onComplete: () => {
                  // Add floating animation
                  const floatTl = gsap.timeline({
                    repeat: -1,
                    yoyo: true
                  });

                  floatTl.to(element, {
                    y: '-=20',
                    duration: 2,
                    ease: "sine.inOut"
                  });

                  // Store for cleanup
                  animations.timelines.push(floatTl);
                }
              }
            );
            break;
          default:
            gsap.fromTo(element,
              { y: 50, opacity: 0 },
              { y: 0, opacity: 1, duration: config.duration.normal, ease: config.ease.smooth }
            );
        }
      },
      once: true
    });

    // Store for cleanup
    animations.scrollTriggers.push(trigger);
  });
}

/**
 * Initialize interactive elements
 */
function initInteractiveElements() {
  // Add hover animations to buttons (only if not already initialized)
  document.querySelectorAll('.btn:not([data-hover-initialized])').forEach((button) => {
    button.setAttribute('data-hover-initialized', 'true');

    button.addEventListener('mouseenter', () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.3,
        ease: config.ease.bounce
      });
    });

    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.3,
        ease: config.ease.smooth
      });
    });
  });
}

/**
 * Initialize 3D effects
 */
function init3DEffects() {
  // Add 3D tilt effect to cards
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xPercent = x / rect.width;
      const yPercent = y / rect.height;

      const rotateX = 10 * (0.5 - yPercent);
      const rotateY = -10 * (0.5 - xPercent);

      gsap.to(card, {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        duration: 0.5,
        ease: "power2.out"
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: "power2.out"
      });
    });
  });
}

/**
 * Handle resize events for responsive animations
 */
function handleResize() {
  // Update ScrollTrigger
  ScrollTrigger.refresh();

  // Reinitialize split text animations
  animations.splitTexts.forEach((splitText) => {
    splitText.revert();
  });

  // Clear split texts array
  animations.splitTexts.length = 0;

  // Reinitialize text animations
  initAdvancedTextAnimations();
}

/**
 * Debounce function to limit how often a function can be called
 */
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Clean up all animations
 */
export function cleanupAnimations() {
  // Kill all timelines
  animations.timelines.forEach((timeline) => {
    timeline.kill();
  });

  // Kill all scroll triggers
  animations.scrollTriggers.forEach((trigger) => {
    trigger.kill();
  });

  // Revert all split texts
  animations.splitTexts.forEach((splitText) => {
    splitText.revert();
  });

  // Clear arrays
  animations.timelines.length = 0;
  animations.scrollTriggers.length = 0;
  animations.observers.length = 0;
  animations.splitTexts.length = 0;
}
