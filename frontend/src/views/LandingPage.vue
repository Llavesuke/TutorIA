<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSmoothScroll, destroySmoothScroll } from '@/utils/smoothScroll';
import { initSimpleAnimations, cleanupAnimations } from '@/utils/simpleAnimations';
import BackgroundShapes from '@/components/BackgroundShapes.vue';
import SvgBackgroundShapes from '@/components/SvgBackgroundShapes.vue';
import SimpleBackgroundShapes from '@/components/SimpleBackgroundShapes.vue';
import ExactBackgroundShapes from '@/components/ExactBackgroundShapes.vue';
import ExactWaveBackground from '@/components/ExactWaveBackground.vue';
import OriginalSvgBackground from '@/components/OriginalSvgBackground.vue';
import MobileCarousel from '@/components/ui/MobileCarousel.vue';
import FloatingCardsCarousel from '@/components/ui/FloatingCardsCarousel.vue';

// Registrar plugins de GSAP
gsap.registerPlugin(ScrollTrigger);

// References
let lenis = null;
let handleResize = null; // Declare resize handler reference
const isLoaded = ref(false);
const isAnimating = ref(true); // Start with animation active

// Animation persistence system
const ANIMATION_SESSION_KEY = 'tutoria_animations_played';
const animationsPlayed = ref(new Set());

// Initialize animation state from sessionStorage
const initializeAnimationState = () => {
  try {
    const stored = sessionStorage.getItem(ANIMATION_SESSION_KEY);
    if (stored) {
      const playedAnimations = JSON.parse(stored);
      animationsPlayed.value = new Set(playedAnimations);
    }
  } catch (error) {
    console.warn('Failed to load animation state:', error);
    animationsPlayed.value = new Set();
  }
};

// Save animation state to sessionStorage
const saveAnimationState = () => {
  try {
    sessionStorage.setItem(ANIMATION_SESSION_KEY, JSON.stringify([...animationsPlayed.value]));
  } catch (error) {
    console.warn('Failed to save animation state:', error);
  }
};

// Check if animation has been played
const hasAnimationPlayed = (animationId) => {
  return animationsPlayed.value.has(animationId);
};

// Mark animation as played
const markAnimationPlayed = (animationId) => {
  animationsPlayed.value.add(animationId);
  saveAnimationState();
};

// Critical: Ensure all content is visible regardless of animation state
const ensureContentVisibility = () => {
  // Force visibility of all critical elements with enhanced brightness
  const criticalSelectors = [
    'section',
    '.section-title',
    '.section-subtitle',
    '.hero-title',
    '.hero-subtitle',
    '.hero-buttons',
    '.hero-image',
    '.feature-card',
    '.testimonial-card',
    '.fun-learning-card',
    '.btn',
    '.container'
  ];

  criticalSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el) {
        el.style.opacity = '1 !important';
        el.style.visibility = 'visible !important';
        el.style.display = el.style.display || '';
        el.style.filter = 'none'; // Remove any filters that might darken content
        el.style.brightness = '1'; // Ensure normal brightness

        // Remove any transforms that might hide content
        if (el.style.transform && el.style.transform.includes('translateY')) {
          el.style.transform = el.style.transform.replace(/translateY\([^)]*\)/g, 'translateY(0)');
        }

        // Ensure element stays in final position
        el.style.transform = 'none';
      }
    });
  });

  // Ensure sections are properly spaced and visible with enhanced brightness
  const sections = document.querySelectorAll('section');
  sections.forEach((section, index) => {
    section.style.opacity = '1 !important';
    section.style.visibility = 'visible !important';
    section.style.display = 'flex';
    section.style.position = 'relative';
    section.style.zIndex = '1';
    section.style.filter = 'none'; // Remove any dark filters
    section.style.brightness = '1'; // Ensure normal brightness

    // Fix mobile spacing issues
    if (window.innerWidth <= 768) {
      section.style.minHeight = 'auto';
      section.style.padding = '2rem 0';
      section.style.marginBottom = '0';
    }
  });

  // Remove any dark overlays that might be affecting visibility
  const overlays = document.querySelectorAll('.overlay, .dark-overlay, .background-overlay');
  overlays.forEach(overlay => {
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.display = 'none';
    }
  });

  // Ensure text has proper contrast
  const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, .btn');
  textElements.forEach(el => {
    if (el) {
      el.style.filter = 'none';
      el.style.textShadow = 'none';
      // Ensure text is not dimmed
      if (el.style.opacity && parseFloat(el.style.opacity) < 1) {
        el.style.opacity = '1';
      }
    }
  });
};

// Fallback timer to ensure content is always visible
const contentVisibilityFallback = () => {
  setTimeout(() => {
    ensureContentVisibility();
    console.log('Content visibility fallback executed');
  }, 2000); // Execute after 2 seconds regardless of animation state

  // Additional fallback for very slow connections
  setTimeout(() => {
    ensureContentVisibility();
    isLoaded.value = true;
    isAnimating.value = false;
    console.log('Emergency content visibility fallback executed');
  }, 5000);
};

// Function to handle internal navigation with smooth scrolling
const handleNavigation = (event, targetId) => {
  event.preventDefault();

  if (!lenis) return;

  // If already animating, ignore
  if (scrollState.isSnapping) return;

  // If it's an empty link or "#", go to the top
  if (targetId === '#' || targetId === '') {
    // Set flag to prevent multiple animations
    scrollState.isSnapping = true;

    // Pause Lenis to prevent conflicts
    lenis.stop();

    // Use GSAP for more precise scrolling
    gsap.to(window, {
      duration: 0.8,
      scrollTo: {
        y: 0,
        autoKill: false
      },
      ease: "power2.inOut",
      onComplete: () => {
        // Reactivate Lenis
        lenis.start();

        // Trigger hero section animations
        const heroSection = document.querySelector('#hero');
        if (heroSection) {
          // Ensure visibility
          heroSection.style.opacity = '1';
          heroSection.style.visibility = 'visible';
          heroSection.classList.add('active');

          // Dispatch event for animations
          const event = new CustomEvent('sectionActivated', {
            detail: { section: heroSection, id: 'hero' }
          });
          document.dispatchEvent(event);

          // Reset flag after a delay
          setTimeout(() => {
            scrollState.isSnapping = false;
          }, 500);
        }
      }
    });
    return;
  }

  // Smooth scroll to the element with enhanced animation
  const targetElement = document.querySelector(targetId);
  if (targetElement) {
    // Set flag to prevent multiple animations
    scrollState.isSnapping = true;

    // Ensure all sections are visible
    document.querySelectorAll('section').forEach(section => {
      section.style.opacity = '1';
      section.style.visibility = 'visible';
    });

    // Animate the clicked element for visual feedback
    if (event.currentTarget) {
      gsap.timeline()
        .to(event.currentTarget, {
          scale: 0.9,
          duration: 0.15,
          ease: "power2.out"
        })
        .to(event.currentTarget, {
          scale: 1.05,
          duration: 0.15,
          ease: "back.out(2)"
        })
        .to(event.currentTarget, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out"
        });
    }

    // Pause Lenis to prevent conflicts
    lenis.stop();

    // Use GSAP for more precise scrolling
    gsap.to(window, {
      duration: 0.8,
      scrollTo: {
        y: targetElement,
        autoKill: false,
        offsetY: 0
      },
      ease: "power2.inOut",
      onStart: () => {
        // Prevenir movimiento horizontal durante el scroll
        document.body.style.overflowX = 'hidden';
      },
      onComplete: () => {
        // Reactivate Lenis
        lenis.start();

        // Restaurar estilos normales
        document.body.style.overflowX = '';

        // Ensure target section is visible
        targetElement.style.opacity = '1';
        targetElement.style.visibility = 'visible';
        targetElement.classList.add('active');

        // Dispatch event for animations
        const event = new CustomEvent('sectionActivated', {
          detail: { section: targetElement, id: targetId.substring(1) }
        });
        document.dispatchEvent(event);

        // Reset flag after a delay
        setTimeout(() => {
          scrollState.isSnapping = false;
        }, 500);
      }
    });
  }
};

// Add scrollState object to track scroll state
const scrollState = {
  isSnapping: false
};

// Journey navigation state
const currentJourneyStep = ref(0);
const journeySteps = ref([]);

// Features data for mobile carousel
const featuresData = ref([
  {
    id: 'personalized-learning',
    icon: 'fas fa-brain',
    title: 'Personalized Learning',
    description: 'AI-powered tutors adapt to each student\'s learning style and pace, providing customized lessons and feedback.',
    class: 'personalized-learning'
  },
  {
    id: 'progress-tracking',
    icon: 'fas fa-chart-line',
    title: 'Progress Tracking',
    description: 'Detailed analytics and insights to monitor student development and identify areas for improvement.',
    class: 'progress-tracking'
  },
  {
    id: 'ethical-ai',
    icon: 'fas fa-shield-alt',
    title: 'Ethical AI',
    description: 'Safe, transparent, and responsible AI designed specifically for educational environments.',
    class: 'ethical-ai'
  }
]);

// Testimonials data for mobile carousel
const testimonialsData = ref([
  {
    id: 'sarah-johnson',
    quote: 'TutorIA has completely transformed how I approach my studies. The AI tutor understands my learning style and provides exactly the support I need when I need it.',
    author: 'Sarah Johnson',
    role: 'University Student',
    avatar: 'fas fa-user-graduate'
  },
  {
    id: 'michael-rodriguez',
    quote: 'As an educator, TutorIA has revolutionized my classroom. The detailed analytics help me identify struggling students early and provide personalized interventions.',
    author: 'Michael Rodriguez',
    role: 'High School Teacher',
    avatar: 'fas fa-chalkboard-teacher'
  },
  {
    id: 'emily-chen',
    quote: 'My students are more engaged than ever! The gamification features and interactive content have made learning exciting and rewarding for everyone.',
    author: 'Emily Chen',
    role: 'Elementary School Principal',
    avatar: 'fas fa-user-tie'
  }
]);

// Fun Learning data for mobile carousel
const funLearningData = ref([
  {
    id: 'interactive-content',
    icon: 'fas fa-laptop-code',
    title: 'Interactive Content',
    description: 'Dynamic lessons with multimedia content, quizzes, and hands-on exercises that keep students motivated and engaged throughout their learning journey.'
  },
  {
    id: 'achievement-system',
    icon: 'fas fa-trophy',
    title: 'Achievement System',
    description: 'Earn badges, points, and unlock new levels as you progress. Celebrate milestones and track your learning achievements in real-time.'
  },
  {
    id: 'collaborative-learning',
    icon: 'fas fa-users',
    title: 'Collaborative Learning',
    description: 'Connect with peers, participate in study groups, and work together on challenging projects while maintaining healthy competition.'
  }
]);

// Navigate through floating card items
const navigateJourney = (direction) => {
  if (!lenis || journeySteps.value.length === 0) {
    // Initialize floating card items if not already done
    journeySteps.value = [
      document.getElementById('how-it-works-title'),
      document.getElementById('journey-step-1'),
      document.getElementById('journey-step-2'),
      document.getElementById('journey-step-3'),
      document.getElementById('journey-step-4'),
      document.getElementById('journey-step-5'),
      document.getElementById('journey-end')
    ].filter(Boolean); // Filter out null elements

    if (journeySteps.value.length === 0) return;
  }

  // If already animating, ignore
  if (scrollState.isSnapping) return;

  // Determine next item
  let nextStep = currentJourneyStep.value;

  if (direction === 'next') {
    nextStep = Math.min(journeySteps.value.length - 1, currentJourneyStep.value + 1);
  } else if (direction === 'prev') {
    nextStep = Math.max(0, currentJourneyStep.value - 1);
  }

  // If item didn't change, do nothing
  if (nextStep === currentJourneyStep.value) return;

  // Set flag to prevent multiple animations
  scrollState.isSnapping = true;

  // Update current item
  currentJourneyStep.value = nextStep;

  // Navigate to element with enhanced animation
  const targetElement = journeySteps.value[nextStep];
  if (targetElement) {
    // Add visual feedback for the navigation
    gsap.to(targetElement, {
      y: -10,
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(targetElement, {
          y: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.5)"
        });
      }
    });

    // Get the container of the How It Works section
    const container = document.querySelector('#how-it-works .container');
    if (container) {
      // Scroll the container to the target element
      gsap.to(container, {
        duration: 0.6,
        scrollTo: {
          y: targetElement,
          offsetY: -50, // Offset for better visibility
          autoKill: false
        },
        ease: "power2.inOut",
        onComplete: () => {
          // Reset flag after a delay
          setTimeout(() => {
            scrollState.isSnapping = false;
          }, 300);
        }
      });
    } else {
      // Fallback to Lenis if container not found
      lenis.scrollTo(targetElement, {
        offset: -50, // Offset for better visibility
        duration: 0.8,
        lock: true,
        onComplete: () => {
          // Reset flag after a delay
          setTimeout(() => {
            scrollState.isSnapping = false;
          }, 300);
        }
      });
    }
  }
};

// Handle click on the scroll indicator with enhanced animation
const handleScrollIndicatorClick = () => {
  if (!lenis) return;

  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (!scrollIndicator) return;

  // If already animating, ignore
  if (scrollState.isSnapping) return;

  // Set flag to prevent multiple animations
  scrollState.isSnapping = true;

  // Animate the indicator when clicked with better feedback
  gsap.timeline()
    .to(scrollIndicator, {
      scale: 0.8,
      duration: 0.15,
      ease: "power2.out"
    })
    .to(scrollIndicator, {
      scale: 1.1,
      duration: 0.15,
      ease: "back.out(2)"
    })
    .to(scrollIndicator, {
      scale: 1,
      duration: 0.2,
      ease: "power2.out"
    });

  const nextSectionId = scrollIndicator.getAttribute('data-next-section');
  if (nextSectionId) {
    const nextSection = document.querySelector(nextSectionId);
    if (nextSection) {
      // Ensure all sections are visible
      document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '1';
        section.style.visibility = 'visible';
      });

      // Pause Lenis to prevent conflicts
      lenis.stop();

      // Use GSAP for more precise scrolling
      gsap.to(window, {
        duration: 0.8,
        scrollTo: {
          y: nextSection,
          autoKill: false,
          offsetY: 0
        },
        ease: "power2.inOut",
        onStart: () => {
          // Prevenir movimiento horizontal durante el scroll
          document.body.style.overflowX = 'hidden';
        },
        onComplete: () => {
          // Reactivate Lenis
          lenis.start();

          // Restaurar estilos normales
          document.body.style.overflowX = '';

          // Ensure next section is visible
          nextSection.style.opacity = '1';
          nextSection.style.visibility = 'visible';
          nextSection.classList.add('active');

          // Dispatch event for animations
          const event = new CustomEvent('sectionActivated', {
            detail: { section: nextSection, id: nextSectionId.substring(1) }
          });
          document.dispatchEvent(event);

          // Reset flag after a delay
          setTimeout(() => {
            scrollState.isSnapping = false;
          }, 500);
        }
      });
    }
  }
};

// Inicializar scroll suave y animaciones básicas (optimizado para rendimiento)
onMounted(() => {
  // Prevenir scroll durante la carga
  document.body.style.overflow = 'hidden';

  // Marcar como animando para prevenir interacciones
  isAnimating.value = true;

  // Initialize animation persistence system
  initializeAnimationState();

  // CRITICAL: Start content visibility fallback immediately
  contentVisibilityFallback();

  // Ensure immediate content visibility for mobile
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      ensureContentVisibility();
    }, 100);
  }

  // Add periodic check to ensure elements stay in final position
  const positionLockInterval = setInterval(() => {
    // Lock all animated elements in their final position
    document.querySelectorAll('[data-animated], [data-transition-setup], [data-fallback-animated]').forEach(element => {
      element.style.opacity = '1';
      element.style.visibility = 'visible';
      element.style.transform = 'none';
    });

    // Lock all text elements
    document.querySelectorAll('.section-title, .section-subtitle, .hero-title, .hero-subtitle, h1, h2, h3, h4, h5, h6, p').forEach(element => {
      element.style.opacity = '1';
      element.style.visibility = 'visible';
      element.style.transform = 'none';
    });

    // Lock all cards
    document.querySelectorAll('.feature-card, .step-card, .testimonial-card, .fun-learning-card').forEach(card => {
      card.style.opacity = '1';
      card.style.visibility = 'visible';
      card.style.transform = 'none';
    });
  }, 1000); // Check every second

  // Clear interval after 30 seconds to avoid performance issues
  setTimeout(() => {
    clearInterval(positionLockInterval);
  }, 30000);

  // Añadir barra de progreso de scroll
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress-bar';
  document.body.appendChild(progressBar);

  // Inicializar Lenis para scroll suave
  lenis = initSmoothScroll();

  // Inicializar elementos de tarjetas flotantes para navegación progresiva
  setTimeout(() => {
    // Asegurar que la sección "How It Works" sea visible y tenga el estilo correcto
    const howItWorksSection = document.getElementById('how-it-works');
    if (howItWorksSection) {
      howItWorksSection.style.opacity = '1';
      howItWorksSection.style.visibility = 'visible';
      howItWorksSection.style.display = 'flex';
      howItWorksSection.style.zIndex = '10';
      howItWorksSection.style.overflow = 'visible';
      howItWorksSection.style.height = '100vh';
      howItWorksSection.style.minHeight = '100vh';
      howItWorksSection.style.backgroundColor = 'transparent'; // Fondo transparente como las demás secciones

      // Asegurar que el contenedor tenga scroll interno
      const container = howItWorksSection.querySelector('.container');
      if (container) {
        container.style.height = '100%';
        container.style.overflowY = 'auto';
        container.style.overflowX = 'hidden';
      }
    }

    // Inicializar los pasos de la sección
    journeySteps.value = [
      document.getElementById('how-it-works-title'),
      document.getElementById('journey-step-1'),
      document.getElementById('journey-step-2'),
      document.getElementById('journey-step-3'),
      document.getElementById('journey-step-4'),
      document.getElementById('journey-step-5'),
      document.getElementById('journey-end')
    ].filter(Boolean); // Filtrar elementos nulos

    // Inicializar animaciones de las tarjetas flotantes
    const floatingCards = document.querySelectorAll('[data-animation="float-reveal"]');
    floatingCards.forEach((card, index) => {
      // Asegurar que las tarjetas sean visibles
      card.style.opacity = '1';
      card.style.visibility = 'visible';

      setTimeout(() => {
        card.classList.add('animated');
      }, 100 + (index * 100)); // Escalonar las animaciones (más rápido)
    });
  }, 300); // Reducir el tiempo de espera

  // Optimización: Inicializar animaciones básicas con un pequeño retraso
  // para permitir que la página se cargue primero
  setTimeout(() => {
    // Inicializar animaciones avanzadas
    initSimpleAnimations();

    // Aplicar animación atractiva al subtítulo del hero section
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
      // Check if hero animation has been played
      const heroAnimationId = 'hero-subtitle';

      if (hasAnimationPlayed(heroAnimationId)) {
        // If animation was already played, just ensure visibility
        heroSubtitle.style.opacity = '1';
        heroSubtitle.style.visibility = 'visible';
        heroSubtitle.style.transform = 'none';
      } else {
        // Mark animation as played
        markAnimationPlayed(heroAnimationId);

        // Asegurar que el texto sea visible
        heroSubtitle.style.opacity = '1';
        heroSubtitle.style.visibility = 'visible';

        // Animación de entrada atractiva
        gsap.from(heroSubtitle, {
          opacity: 0,
          y: 30,
          duration: 1.2,
          ease: "back.out(1.7)",
          onComplete: () => {
            // Destacar palabras clave con una animación sutil
            const keywords = ['TutorIA', 'AI-powered', 'personalized', 'ethical', 'accessible'];

            // No se aplica ningún efecto de brillo o glow al texto
          }
        });
      }
    }

    // Mecanismo de respaldo para asegurar que el hero section siempre sea visible
    setTimeout(() => {
      // Forzar visibilidad del hero section y sus elementos
      const heroSection = document.querySelector('#hero');
      if (heroSection) {
        heroSection.style.opacity = '1';
        heroSection.style.visibility = 'visible';

        // Forzar visibilidad del título
        const titleElement = heroSection.querySelector('.hero-title');
        if (titleElement) {
          titleElement.style.opacity = '1';
          titleElement.style.visibility = 'visible';
          titleElement.style.transform = 'translateY(0)';
        }

        // Forzar visibilidad del subtítulo
        const subtitleElement = heroSection.querySelector('.hero-subtitle');
        if (subtitleElement) {
          subtitleElement.style.opacity = '1';
          subtitleElement.style.visibility = 'visible';
          subtitleElement.style.transform = 'translateY(0)';
        }

        // Forzar visibilidad de los botones
        const buttons = heroSection.querySelectorAll('.btn');
        buttons.forEach(btn => {
          btn.style.opacity = '1';
          btn.style.visibility = 'visible';
        });

        // Forzar visibilidad de la imagen
        const heroImage = heroSection.querySelector('.hero-image');
        if (heroImage) {
          heroImage.style.opacity = '1';
          heroImage.style.visibility = 'visible';
        }
      }
    }, 2000); // Esperar 2 segundos para asegurar que las animaciones hayan tenido tiempo de ejecutarse
  }, 100);

  // Optimización: Usar requestAnimationFrame para preparar elementos
  requestAnimationFrame(() => {
    // Preparar elementos para animaciones de entrada (reducido para mejor rendimiento)
    gsap.set('section', { opacity: 0 });
    gsap.set('.hero-title, .section-title', { opacity: 0, y: 20 });
    gsap.set('.hero-subtitle, .section-subtitle', { opacity: 0, y: 10 });
    gsap.set('.feature-card, .step-card, .testimonial-card', { opacity: 0 });
    gsap.set('.btn', { opacity: 0 });

    // Asegurar que todas las secciones sean visibles desde el inicio
    document.querySelectorAll('section').forEach(section => {
      section.classList.add('active');
      section.style.opacity = '1';
      section.style.visibility = 'visible';
      section.style.display = 'flex';

      // Aplicar estilos para snap scrolling
      section.style.scrollSnapAlign = 'start';
      section.style.scrollSnapStop = 'always';
      section.style.transform = 'translateZ(0)';
      section.style.backfaceVisibility = 'hidden';
      section.style.willChange = 'transform, opacity';
      section.style.minHeight = '100vh';
      section.style.height = '100vh';

      // Asegurar que la sección "how-it-works" tenga mayor z-index y configuración especial
      if (section.id === 'how-it-works') {
        section.style.zIndex = '10';
        section.style.backgroundColor = 'transparent'; // Fondo transparente como las demás secciones

        // Asegurar que el contenedor tenga scroll interno
        const container = section.querySelector('.container');
        if (container) {
          container.style.height = '100%';
          container.style.overflowY = 'auto';
          container.style.overflowX = 'hidden';
          container.style.webkitOverflowScrolling = 'touch';
        }
      }
    });

    // Secuencia de animación de entrada optimizada
    const tl = gsap.timeline({
      onComplete: () => {
        // Activar todas las secciones para asegurar visibilidad
        document.querySelectorAll('section').forEach(section => {
          section.classList.add('active');
          section.style.opacity = '1';
          section.style.visibility = 'visible';
          section.style.display = 'flex';

          // Aplicar estilos para snap scrolling
          section.style.scrollSnapAlign = 'start';
          section.style.scrollSnapStop = 'always';
          section.style.transform = 'translateZ(0)';
          section.style.backfaceVisibility = 'hidden';
          section.style.willChange = 'transform, opacity';

          // Asegurar que la sección "how-it-works" tenga mayor z-index y configuración especial
          if (section.id === 'how-it-works') {
            section.style.zIndex = '10';
            section.style.backgroundColor = 'transparent'; // Fondo transparente como las demás secciones

            // Asegurar que el contenedor tenga scroll interno
            const container = section.querySelector('.container');
            if (container) {
              container.style.height = '100%';
              container.style.overflowY = 'auto';
              container.style.overflowX = 'hidden';
              container.style.webkitOverflowScrolling = 'touch';
            }
          }
        });

        // Asegurar que el scroll indicator esté visible y centrado
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
          scrollIndicator.style.opacity = '1';
          scrollIndicator.style.visibility = 'visible';
          scrollIndicator.style.left = '50%';
          scrollIndicator.style.transform = 'translateX(-50%)';
        }

        // Actualizar estados
        isLoaded.value = true;
        isAnimating.value = false;

        // Permitir scroll
        document.body.style.overflow = '';

        // Aplicar scroll-snap a la landing page
        document.querySelector('.landing-page').style.scrollSnapType = 'y mandatory';
      }
    });

    // Animaciones simplificadas y optimizadas
    tl.to('.landing-page', { opacity: 1, duration: 0.4 })
      .to('#hero', { opacity: 1, duration: 0.4 })
      .to('.hero-title', {
        opacity: 1,
        duration: 0.1, // Duración mínima, solo para hacerlo visible
        onComplete: () => {
          // Usar la nueva función de animación avanzada para el título
          const titleElement = document.querySelector('.hero-title');
          if (titleElement) {
            // Asegurar visibilidad básica
            titleElement.style.opacity = '1';
            titleElement.style.visibility = 'visible';
          }
        }
      })
      .to('.hero-subtitle', {
        opacity: 1,
        duration: 0.1, // Duración mínima, solo para hacerlo visible
        onComplete: () => {
          // Asegurar que el subtítulo siempre sea visible
          const subtitleElement = document.querySelector('.hero-subtitle');
          if (subtitleElement) {
            subtitleElement.style.opacity = '1';
            subtitleElement.style.visibility = 'visible';
          }
        }
      }, '-=0.1')
      .to('.btn', { opacity: 1, duration: 0.4 }, '-=0.2')
      .to('.hero-image', { opacity: 1, duration: 0.4 }, '-=0.2');

    // Configurar ScrollTrigger para secciones con un pequeño retraso
    // para asegurar que la página esté completamente cargada
    setTimeout(() => {
      setupScrollTriggers();
    }, 200);

    // Add window resize handler to ensure content visibility
    handleResize = () => {
      // Ensure content is visible on resize
      setTimeout(() => {
        ensureContentVisibility();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
  });
});

// Configurar ScrollTrigger para cada sección (optimizado para rendimiento)
function setupScrollTriggers() {
  // Usar IntersectionObserver para mejor rendimiento si está disponible
  if (window.IntersectionObserver && !window._sectionAnimationObserver) {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15 // Umbral reducido para mejor rendimiento
    };

    window._sectionAnimationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const section = entry.target;
          const sectionId = section.id || 'unknown-section';
          const animationId = `section-${sectionId}`;

          // CRITICAL: Always ensure content is visible first
          section.style.opacity = '1';
          section.style.visibility = 'visible';
          section.style.display = section.style.display || 'flex';

          // Check if this section's animation has already been played
          if (hasAnimationPlayed(animationId)) {
            // If animation was already played, just ensure all elements are visible
            const titleElement = section.querySelector('.section-title');
            const subtitleElement = section.querySelector('.section-subtitle');
            const cards = section.querySelectorAll('.feature-card, .step-card, .testimonial-card, .fun-learning-card');

            [titleElement, subtitleElement, ...cards].forEach(el => {
              if (el) {
                el.style.opacity = '1';
                el.style.visibility = 'visible';
                el.style.transform = 'none';
                el.style.display = el.style.display || '';
              }
            });

            return;
          }

          // Mark animation as played
          markAnimationPlayed(animationId);

          // For mobile devices, skip animations and just show content
          if (window.innerWidth <= 768) {
            const titleElement = section.querySelector('.section-title');
            const subtitleElement = section.querySelector('.section-subtitle');
            const cards = section.querySelectorAll('.feature-card, .step-card, .testimonial-card, .fun-learning-card');

            [titleElement, subtitleElement, ...cards].forEach(el => {
              if (el) {
                el.style.opacity = '1';
                el.style.visibility = 'visible';
                el.style.transform = 'none';
                el.style.display = el.style.display || '';
              }
            });

            return;
          }

          // Only animate on desktop devices
          try {
            // Animar sección
            if (section.style.opacity !== '1') {
              gsap.to(section, {
                opacity: 1,
                duration: 0.4,
                onComplete: () => {
                  // Ensure visibility after animation
                  section.style.opacity = '1';
                  section.style.visibility = 'visible';
                }
              });
            }

            // Animar elementos dentro de la sección (optimizado)
            requestAnimationFrame(() => {
              // Animar título
              const titleElement = section.querySelector('.section-title');
              if (titleElement) {
                gsap.to(titleElement, {
                  opacity: 1,
                  y: 0,
                  duration: 0.4,
                  onComplete: () => {
                    titleElement.style.opacity = '1';
                    titleElement.style.visibility = 'visible';
                  }
                });
              }

              // Animar subtítulo
              const subtitleElement = section.querySelector('.section-subtitle');
              if (subtitleElement) {
                gsap.to(subtitleElement, {
                  opacity: 1,
                  y: 0,
                  duration: 0.4,
                  onComplete: () => {
                    subtitleElement.style.opacity = '1';
                    subtitleElement.style.visibility = 'visible';
                  }
                });
              }

              // Animar tarjetas con menos carga y mejor rendimiento
              const cards = section.querySelectorAll('.feature-card, .step-card, .testimonial-card, .fun-learning-card');
              if (cards.length > 0) {
                gsap.to(cards, {
                  opacity: 1,
                  y: 0,
                  stagger: 0.03,
                  duration: 0.3,
                  clearProps: "transform",
                  onComplete: () => {
                    // Ensure all cards are visible after animation
                    cards.forEach(card => {
                      card.style.opacity = '1';
                      card.style.visibility = 'visible';
                    });
                  }
                });
              }
            });
          } catch (error) {
            console.warn('Animation failed, ensuring content visibility:', error);
            // Fallback: ensure all content is visible if animation fails
            ensureContentVisibility();
          }

          // Dejar de observar esta sección una vez animada
          window._sectionAnimationObserver.unobserve(section);
        }
      });
    }, options);

    // Observar todas las secciones excepto la primera (hero)
    const sections = document.querySelectorAll('section');
    for (let i = 1; i < sections.length; i++) {
      window._sectionAnimationObserver.observe(sections[i]);

      // Asegurar que la sección sea visible inicialmente
      gsap.set(sections[i], { opacity: 1 });
    }

    return;
  }

  // Fallback al método tradicional si IntersectionObserver no está disponible
  gsap.utils.toArray('section').forEach((section, i) => {
    // Saltar la primera sección (hero) que ya tiene animación
    if (i === 0) return;

    // Asegurar que la sección sea visible inicialmente
    gsap.set(section, { opacity: 1 });

    // Crear ScrollTrigger para esta sección (optimizado)
    ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      onEnter: () => {
        // Animar entrada de la sección
        gsap.to(section, {
          opacity: 1,
          duration: 0.4
        });

        // Animar elementos dentro de la sección
        const titleElements = section.querySelector('.section-title');
        if (titleElements) {
          gsap.to(titleElements, {
            opacity: 1,
            y: 0,
            duration: 0.4
          });
        }

        const subtitleElements = section.querySelector('.section-subtitle');
        if (subtitleElements) {
          gsap.to(subtitleElements, {
            opacity: 1,
            y: 0,
            duration: 0.4
          });
        }

        // Animar tarjetas con menos carga
        const cards = section.querySelectorAll('.feature-card, .step-card, .testimonial-card, .fun-learning-card');
        if (cards.length > 0) {
          gsap.to(cards, {
            opacity: 1,
            y: 0,
            stagger: 0.03,
            duration: 0.3,
            clearProps: "transform"
          });
        }
      },
      once: true
    });
  });
}

// Limpiar cuando el componente se desmonta (optimizado para mejor limpieza de recursos)
onBeforeUnmount(() => {
  // Eliminar barra de progreso de scroll
  const progressBar = document.querySelector('.scroll-progress-bar');
  if (progressBar) {
    progressBar.remove();
  }

  // Remove resize handler
  window.removeEventListener('resize', handleResize);

  // Limpiar IntersectionObserver si existe
  if (window._sectionAnimationObserver) {
    window._sectionAnimationObserver.disconnect();
    window._sectionAnimationObserver = null;
  }

  // Limpiar todos los ScrollTriggers
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  ScrollTrigger.clearMatchMedia();

  // Limpiar animaciones GSAP de manera más eficiente
  gsap.killTweensOf('*');

  // Destruir Lenis
  destroySmoothScroll(lenis);
  lenis = null;

  // Limpiar animaciones
  cleanupAnimations();

  // Limpiar timers pendientes
  const timers = window.setTimeout(() => {}, 0);
  for (let i = 0; i < timers; i++) {
    window.clearTimeout(i);
  }

  // Restaurar el overflow del body
  document.body.style.overflow = '';

  // Sugerir recolección de basura
  setTimeout(() => {
    if (window.gc) window.gc();
  }, 100);
});
</script>

<template>
  <div class="landing-page">
    <!-- Componentes de fondo (solo uno visible a la vez) -->
    <BackgroundShapes v-if="false" />
    <SvgBackgroundShapes v-if="false" />
    <SimpleBackgroundShapes v-if="false" />
    <ExactBackgroundShapes v-if="false" />
    <ExactWaveBackground v-if="false" />
    <OriginalSvgBackground />

    <!-- Capa oscura para reducir el brillo -->
    <div class="dark-overlay"></div>

    <!-- Loader overlay -->
    <div class="loader-overlay" v-if="isAnimating">
      <div class="loader-content">
        <div class="loader-spinner"></div>
        <div class="loader-text">Loading experience...</div>
      </div>
    </div>

    <!-- Scroll indicator (centrado) -->
    <div class="scroll-indicator" v-if="isLoaded" @click="handleScrollIndicatorClick" data-next-section="#features">
      <div class="scroll-arrow">
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="scroll-text">Next Section</div>
    </div>

    <!-- Enhanced Hero Section -->
    <section id="hero" class="hero">
      <div class="container">
        <div class="hero-content" data-parallax="light">
          <h1 class="hero-title" data-animation="reveal">
            <span class="split-line">Revolutionize Learning with</span>
            <span class="highlight split-line">AI Tutors</span>
          </h1>
          <p class="hero-subtitle" data-reveal="up" style="opacity: 1 !important; visibility: visible !important; text-shadow: none !important;">
            <strong>TutorIA</strong> is revolutionizing education with <strong>AI-powered</strong> personalized learning.
            Our platform empowers students and teachers with <strong>ethical</strong> AI guidance,
            creating a more effective, engaging, and <strong>accessible</strong> educational experience for everyone.
          </p>
          <div class="hero-buttons" data-reveal-group="up">
            <router-link to="/get-started" class="btn btn-primary btn-lg" data-reveal-item>
              <i class="fas fa-rocket"></i> Get Started Free
            </router-link>
            <a href="#features" class="btn btn-outline btn-lg" data-reveal-item @click.prevent="handleNavigation($event, '#features')">
              <i class="fas fa-info-circle"></i> Learn More
            </a>
          </div>
        </div>

        <div class="hero-image" data-animation="float">
          <div class="tutor-mascot">
            <!-- Using the new logo as mascot -->
            <img src="@/assets/images/logo_sin_fondo.png" alt="TutorIA Logo" class="tutoria-logo" />
          </div>
        </div>
      </div>

      <!-- Decorative elements for enhanced visuals -->
      <div class="hero-decorations">
        <div class="decoration-circle" data-parallax="deep"></div>
        <div class="decoration-dots"></div>
        <div class="decoration-line"></div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="container">
        <h2 class="section-title" data-animation="reveal">Why Choose TutorIA?</h2>
        <p class="section-subtitle" data-animation="reveal">Our platform offers unique benefits for both students and educators</p>

        <MobileCarousel
          :items="featuresData"
          grid-class="features-grid"
          :show-indicators="true"
          :show-arrows="false"
        >
          <template #default="{ item }">
            <div v-if="item" class="feature-card" :class="item.class || ''" data-animation="card">
              <div class="feature-icon">
                <i :class="item.icon" aria-hidden="true"></i>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </template>
        </MobileCarousel>
      </div>
    </section>

    <!-- How It Works Section (Floating Cards Design) -->
    <section id="how-it-works" class="how-it-works">
      <div class="container">
        <h2 class="section-title" data-animation="reveal" id="how-it-works-title">How TutorIA Works</h2>
        <p class="section-subtitle" data-animation="reveal">Your path to educational excellence in 5 simple steps</p>

        <FloatingCardsCarousel :auto-play="true" :auto-play-interval="5000">
          <!-- Desktop Floating Cards Layout -->
          <div class="floating-cards-container">
            <!-- Step 1: Create Profile -->
            <div class="floating-card" id="journey-step-1" data-animation="float-reveal">
              <div class="card-number">1</div>
              <div class="card-content">
                <div class="card-icon orange-gradient">
                  <i class="fas fa-user-plus"></i>
                </div>
                <h3>Create Your Profile</h3>
                <p>Tell us about your learning goals and preferences to get a fully personalized experience.</p>
              </div>
              <div class="card-glow orange-glow"></div>
            </div>

            <!-- Step 2: Choose Subjects -->
            <div class="floating-card" id="journey-step-2" data-animation="float-reveal">
              <div class="card-number">2</div>
              <div class="card-content">
                <div class="card-icon green-gradient">
                  <i class="fas fa-book"></i>
                </div>
                <h3>Choose Your Subjects</h3>
                <p>Explore our extensive library of subjects and specialized topics designed to match your learning pace.</p>
              </div>
              <div class="card-glow green-glow"></div>
            </div>

            <!-- Step 3: Meet AI Tutor -->
            <div class="floating-card" id="journey-step-3" data-animation="float-reveal">
              <div class="card-number">3</div>
              <div class="card-content">
                <div class="card-icon purple-gradient">
                  <i class="fas fa-robot"></i>
                </div>
                <h3>Meet Your AI Tutor</h3>
                <p>Connect with your personalized AI tutor that adapts to your unique learning style.</p>
              </div>
              <div class="card-glow purple-glow"></div>
            </div>

            <!-- Step 4: Interactive Learning -->
            <div class="floating-card" id="journey-step-4" data-animation="float-reveal">
              <div class="card-number">4</div>
              <div class="card-content">
                <div class="card-icon orange-gradient">
                  <i class="fas fa-laptop"></i>
                </div>
                <h3>Interactive Learning</h3>
                <p>Engage with dynamic content, exercises, and real-time feedback for effective learning.</p>
              </div>
              <div class="card-glow orange-glow"></div>
            </div>

            <!-- Step 5: Track Progress -->
            <div class="floating-card" id="journey-step-5" data-animation="float-reveal">
              <div class="card-number">5</div>
              <div class="card-content">
                <div class="card-icon green-gradient">
                  <i class="fas fa-chart-line"></i>
                </div>
                <h3>Track Your Progress</h3>
                <p>Monitor your improvement with detailed analytics and achievement milestones.</p>
              </div>
              <div class="card-glow green-glow"></div>
            </div>

            <!-- Hidden element for scroll targeting -->
            <div id="journey-end" style="display: none;"></div>
          </div>
        </FloatingCardsCarousel>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section id="testimonials" class="testimonials">
      <div class="container">
        <h2 class="section-title" data-animation="reveal">What Our Users Say</h2>
        <p class="section-subtitle" data-animation="reveal">Success stories from students and educators</p>

        <MobileCarousel
          :items="testimonialsData"
          grid-class="testimonials-grid"
          :show-indicators="true"
          :show-arrows="false"
          :auto-play="true"
          :auto-play-interval="6000"
        >
          <template #default="{ item }">
            <div v-if="item" class="testimonial-card" data-animation="card">
              <div class="testimonial-content">
                <i class="fas fa-quote-left quote-icon"></i>
                <p>{{ item.quote }}</p>
              </div>
              <div class="testimonial-author">
                <div class="author-avatar">
                  <i :class="item.avatar"></i>
                </div>
                <div class="author-info">
                  <h4>{{ item.author }}</h4>
                  <p>{{ item.role }}</p>
                </div>
              </div>
            </div>
          </template>
        </MobileCarousel>
      </div>
    </section>

    <!-- Fun Learning Section -->
    <section id="fun-learning" class="fun-learning">
      <div class="container">
        <h2 class="section-title" data-animation="reveal">Learning Has Never Been This Fun!</h2>
        <p class="section-subtitle" data-animation="reveal">Engage with interactive content and earn rewards</p>

        <MobileCarousel
          :items="funLearningData"
          grid-class="fun-learning-grid"
          :show-indicators="true"
          :show-arrows="false"
        >
          <template #default="{ item }">
            <div v-if="item" class="fun-learning-card" data-animation="card">
              <div class="card-icon">
                <i :class="item.icon"></i>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </template>
        </MobileCarousel>
      </div>
    </section>

    <!-- Final CTA Section (Enhanced) -->
    <section id="cta" class="cta-section">
      <div class="container">
        <div class="cta-content" data-animation="reveal">
          <h2>Ready to Transform Your Learning Experience?</h2>
          <p>Join thousands of students and educators who are already revolutionizing their educational journey with TutorIA's personalized AI tutoring platform. Start your free trial today and discover the future of education.</p>
          <div class="cta-buttons">
            <router-link to="/get-started" class="btn btn-primary btn-lg">
              <i class="fas fa-rocket"></i> Start Free Trial
            </router-link>
            <a href="#features" class="btn btn-secondary btn-lg" @click.prevent="handleNavigation($event, '#features')">
              <i class="fas fa-info-circle"></i> Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss">
/* BRAND COLOR IMPLEMENTATION - Direct component styles for maximum specificity */

// TESTIMONIAL CARDS - Brand color rotation
.testimonial-card {
  // Orange cards (1st, 4th, 7th, etc.)
  &:nth-child(3n+1) {
    background: linear-gradient(135deg, #e6531d, #d14a1a) !important;
    border-top: 4px solid #e6531d !important;
    color: white !important;

    .testimonial-content p,
    .testimonial-author .author-info h4,
    .testimonial-author .author-info p {
      color: white !important;
    }

    .testimonial-author .author-avatar {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
    }

    .quote-icon {
      color: rgba(255, 255, 255, 0.9) !important;
    }
  }

  // Green cards (2nd, 5th, 8th, etc.)
  &:nth-child(3n+2) {
    background: linear-gradient(135deg, #007142, #005a35) !important;
    border-top: 4px solid #007142 !important;
    color: white !important;

    .testimonial-content p,
    .testimonial-author .author-info h4,
    .testimonial-author .author-info p {
      color: white !important;
    }

    .testimonial-author .author-avatar {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
    }

    .quote-icon {
      color: rgba(255, 255, 255, 0.9) !important;
    }
  }

  // Purple cards (3rd, 6th, 9th, etc.)
  &:nth-child(3n+3) {
    background: linear-gradient(135deg, #34307b, #2a2562) !important;
    border-top: 4px solid #34307b !important;
    color: white !important;

    .testimonial-content p,
    .testimonial-author .author-info h4,
    .testimonial-author .author-info p {
      color: white !important;
    }

    .testimonial-author .author-avatar {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
    }

    .quote-icon {
      color: rgba(255, 255, 255, 0.9) !important;
    }
  }
}

// FUN LEARNING CARDS - Brand color rotation
.fun-learning-card {
  // Orange cards (1st, 4th, 7th, etc.)
  &:nth-child(3n+1) {
    background: linear-gradient(135deg, #e6531d, #d14a1a) !important;
    border-top: 4px solid #e6531d !important;
    color: white !important;

    .card-icon {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
    }

    h3, p {
      color: white !important;
    }
  }

  // Green cards (2nd, 5th, 8th, etc.)
  &:nth-child(3n+2) {
    background: linear-gradient(135deg, #007142, #005a35) !important;
    border-top: 4px solid #007142 !important;
    color: white !important;

    .card-icon {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
    }

    h3, p {
      color: white !important;
    }
  }

  // Purple cards (3rd, 6th, 9th, etc.)
  &:nth-child(3n+3) {
    background: linear-gradient(135deg, #34307b, #2a2562) !important;
    border-top: 4px solid #34307b !important;
    color: white !important;

    .card-icon {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
    }

    h3, p {
      color: white !important;
    }
  }
}

// CARD ICONS - Force white color
.card-icon {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.2) !important;

  i {
    color: white !important;
  }
}

// HOW IT WORKS ICONS - Force white color
.how-it-works {
  .card-icon {
    color: white !important;

    i {
      color: white !important;
    }
  }
}
</style>
