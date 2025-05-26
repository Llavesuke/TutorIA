/**
 * Utilidad para implementar animaciones avanzadas con GSAP
 * Incluye animaciones de scroll, revelación de elementos, efectos visuales y parallax
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { TextPlugin } from 'gsap/TextPlugin';

// Registrar los plugins de GSAP
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, MotionPathPlugin, TextPlugin);

// Almacenar referencias a las animaciones para limpiarlas después
let animations = [];
let scrollTriggers = [];
let observers = [];
let resizeHandlers = [];

// Configuración global para animaciones
const config = {
  revealDuration: 1.2,
  staggerAmount: 0.15,
  cardAnimationDuration: 0.8,
  parallaxStrength: 0.3,
  floatingShapesSpeed: 20,
  scrollAnimationSmoothness: 0.1,
};

/**
 * Inicializa todas las animaciones de la landing page
 */
export function initSimpleAnimations() {
  // Limpiar animaciones anteriores si existen
  cleanupAnimations();

  // Configurar variables CSS para animaciones
  setupCSSVariables();

  // Inicializar animaciones avanzadas (versiones corregidas)
  initEnhancedHeroAnimations(); // Versión corregida que evita referencias a elementos que ya no existen
  initAdvancedScrollRevealAnimations();
  initEnhancedFeatureCardAnimations();
  initCreativeStackingCardsEffect();
  initAdvancedParallaxEffects();
  initSectionTransitions();
  initScrollProgressIndicator();

  // Configurar observadores para optimizar rendimiento
  setupIntersectionObservers();

  // Manejar cambios de tamaño de ventana
  setupResizeHandlers();
}

/**
 * Configura variables CSS para animaciones
 */
function setupCSSVariables() {
  // Añadir variables CSS al :root para controlar animaciones desde CSS
  const root = document.documentElement;
  root.style.setProperty('--scroll-progress', '0');
  root.style.setProperty('--scroll-direction', '1');
  root.style.setProperty('--animation-speed', config.revealDuration + 's');
  root.style.setProperty('--animation-stagger', config.staggerAmount + 's');
}

/**
 * Configure intersection observers for optimized performance and section-based animations
 */
function setupIntersectionObservers() {
  // Create an observer to activate/deactivate animations based on visibility
  const options = {
    root: null,
    rootMargin: '0px', // No margin - trigger exactly when section is in view
    threshold: 0.5 // Trigger when 50% of the section is visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const section = entry.target;

      // If the element is visible, activate its animations and mark as active
      if (entry.isIntersecting) {
        // Only add active class if not already active (prevents animation repeats)
        if (!section.classList.contains('active')) {
          section.classList.add('active');

          // Trigger section-specific animations
          triggerSectionAnimations(section);

          // Update URL with section ID (without page reload)
          if (section.id) {
            history.replaceState(null, null, `#${section.id}`);
          }

          // Update scroll indicator text to show next section
          updateScrollIndicator(section);
        }
      } else {
        // Only remove active class when scrolling up (to prevent animation repeats)
        if (entry.boundingClientRect.bottom > window.innerHeight) {
          section.classList.remove('active');
        }
      }
    });
  }, options);

  // Observe all sections
  document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
  });

  // Store observer reference for cleanup
  observers.push(observer);

  // Setup click handler for scroll indicator
  setupScrollIndicatorHandler();
}

/**
 * Update scroll indicator text based on current active section
 */
function updateScrollIndicator(currentSection) {
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (!scrollIndicator) return;

  const sections = Array.from(document.querySelectorAll('section'));
  const currentIndex = sections.indexOf(currentSection);
  const nextSection = sections[currentIndex + 1];

  // Update text to show next section or "Top" if at the end
  if (nextSection) {
    scrollIndicator.setAttribute('data-next-section', `#${nextSection.id || ''}`);
    scrollIndicator.querySelector('.scroll-text').textContent = 'Next Section';
  } else {
    scrollIndicator.setAttribute('data-next-section', '#hero');
    scrollIndicator.querySelector('.scroll-text').textContent = 'Back to Top';
  }
}

/**
 * Setup click handler for scroll indicator
 */
function setupScrollIndicatorHandler() {
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (!scrollIndicator) return;

  scrollIndicator.addEventListener('click', () => {
    const nextSectionId = scrollIndicator.getAttribute('data-next-section');
    if (nextSectionId) {
      const nextSection = document.querySelector(nextSectionId);
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}

/**
 * Configura manejadores de eventos para cambios de tamaño de ventana
 */
function setupResizeHandlers() {
  // Función para manejar cambios de tamaño
  const handleResize = () => {
    // Refrescar ScrollTriggers
    ScrollTrigger.refresh(true);

    // Ajustar animaciones según el nuevo tamaño
    adjustAnimationsForScreenSize();
  };

  // Añadir evento con debounce para mejor rendimiento
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 200);
  });

  // Guardar referencia para limpieza
  resizeHandlers.push(() => {
    window.removeEventListener('resize', handleResize);
    clearTimeout(resizeTimeout);
  });
}

/**
 * Ajusta animaciones según el tamaño de pantalla
 */
function adjustAnimationsForScreenSize() {
  // Obtener ancho de ventana
  const windowWidth = window.innerWidth;

  // Ajustar intensidad de parallax según tamaño de pantalla
  if (windowWidth < 768) {
    // Móvil: reducir intensidad
    gsap.set('[data-parallax]', { clearProps: 'all' });
  }
}

/**
 * Activa animaciones específicas para una sección
 */
function triggerSectionAnimations(section) {
  // Activar animaciones específicas según la sección
  if (section.classList.contains('hero')) {
    // Animaciones específicas para hero
    initEnhancedHeroAnimations();
  } else if (section.classList.contains('features')) {
    // Animaciones para sección de características
    initEnhancedFeatureCardAnimations(section);
  } else if (section.classList.contains('why-tutoria')) {
    // Animaciones para sección de beneficios
    animateBenefitsList(section);
  } else if (section.classList.contains('fun-learning')) {
    // Animaciones para sección de aprendizaje divertido
    animateFunLearningSection(section);
  }
}

/**
 * Anima las formas flotantes en el fondo con movimientos más orgánicos y sutiles
 * NOTA: Esta función ya no se utiliza porque las formas flotantes fueron reemplazadas
 * por el nuevo componente BackgroundShapes.vue
 */
function initAdvancedFloatingShapes() {
  // Esta función ya no se utiliza
  console.log('initAdvancedFloatingShapes: Esta función ya no se utiliza');
}

/**
 * Genera un path orgánico para animaciones de movimiento
 */
function generateOrganicPath(index) {
  // Crear puntos de control para un movimiento orgánico
  // Usamos SVG path para definir una trayectoria suave
  const size = 30 + (index * 5); // Tamaño del movimiento

  // Crear diferentes patrones según el índice
  switch (index % 4) {
    case 0: // Patrón circular
      return `M0,0 C${size},${-size} ${-size},${size} 0,0`;
    case 1: // Patrón en forma de 8
      return `M0,0 C${size},${-size} ${-size},${-size} 0,0 C${-size},${size} ${size},${size} 0,0`;
    case 2: // Patrón ondulado horizontal
      return `M0,0 C${size/2},${-size} ${size},0 ${size*1.5},${-size/2} C${size*2},${-size} ${size*2.5},0 ${size*3},0`;
    case 3: // Patrón ondulado vertical
      return `M0,0 C${-size},${size/2} 0,${size} ${size/2},${size*1.5} C${size},${size*2} 0,${size*2.5} 0,${size*3}`;
    default:
      return `M0,0 C${size},${-size} ${-size},${size} 0,0`;
  }
}

/**
 * Genera un valor de border-radius aleatorio para formas orgánicas
 */
function getRandomBorderRadius() {
  // Crear valores aleatorios para cada esquina
  const tl = Math.floor(Math.random() * 30 + 40); // Top left: 40-70%
  const tr = Math.floor(Math.random() * 30 + 40); // Top right: 40-70%
  const br = Math.floor(Math.random() * 30 + 40); // Bottom right: 40-70%
  const bl = Math.floor(Math.random() * 30 + 40); // Bottom left: 40-70%

  // Crear valores aleatorios para cada esquina (segundo radio)
  const tl2 = Math.floor(Math.random() * 30 + 40);
  const tr2 = Math.floor(Math.random() * 30 + 40);
  const br2 = Math.floor(Math.random() * 30 + 40);
  const bl2 = Math.floor(Math.random() * 30 + 40);

  // Retornar el valor de border-radius en formato CSS
  return `${tl}% ${tr}% ${br}% ${bl}% / ${tl2}% ${tr2}% ${br2}% ${bl2}%`;
}

/**
 * Función para animar texto sin modificar su estructura HTML
 * Esta versión no modifica el DOM, solo aplica animaciones
 */
function animateTextWithoutSplitting(element, options = {}) {
  if (!element) return null;

  // Opciones por defecto
  const defaultOptions = {
    duration: 1.2,
    y: 30,
    ease: "back.out(1.7)",
    stagger: 0.05
  };

  // Combinar opciones
  const animOptions = { ...defaultOptions, ...options };

  // Crear una animación simple pero atractiva
  return gsap.from(element, {
    opacity: 0,
    y: animOptions.y,
    duration: animOptions.duration,
    ease: animOptions.ease
  });
}

/**
 * Anima los elementos del hero section con efectos atractivos sin modificar la estructura HTML
 */
function initEnhancedHeroAnimations() {
  // Timeline principal con configuración avanzada
  const heroTl = gsap.timeline({
    defaults: {
      ease: "power3.out",
      duration: 1.2
    }
  });

  // Animación para el título con efecto de entrada atractivo
  const titleElement = document.querySelector('.hero-title');
  if (titleElement) {
    // Asegurar que el título sea visible
    titleElement.style.opacity = '1';
    titleElement.style.visibility = 'visible';

    // Animación simple y directa para el título
    // Primero, asegurar que el título sea completamente visible
    gsap.set(titleElement, {
      opacity: 1,
      visibility: 'visible',
      y: 0
    });

    // Obtener las líneas del título
    const titleLines = titleElement.querySelectorAll('.split-line');

    // Asegurar que las líneas sean visibles
    gsap.set(titleLines, {
      opacity: 1,
      visibility: 'visible',
      y: 0
    });

    // Destacar "AI Tutors" con color naranja
    const highlightElement = titleElement.querySelector('.highlight');
    if (highlightElement) {
      gsap.set(highlightElement, {
        color: 'var(--color-vivid-orange)',
        fontWeight: 900
      });
    }

    // Animación mejorada para el título (sin manipulación del DOM)
    heroTl.from(titleLines, {
      opacity: 0,
      y: 50,
      duration: 0.8,
      stagger: 0.2,
      ease: "back.out(1.7)" // Efecto de rebote más atractivo
    });
  }

  // Animación para el subtítulo con efecto de entrada atractivo
  const subtitleElement = document.querySelector('.hero-subtitle');
  if (subtitleElement) {
    // Asegurar que el subtítulo sea visible
    subtitleElement.style.opacity = '1';
    subtitleElement.style.visibility = 'visible';

    // Animar el subtítulo con un efecto de entrada simple (sin ningún glow)
    heroTl.from(subtitleElement, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out", // Efecto más suave y profesional
      delay: 0.2, // Pequeño retraso para que aparezca después del título
      onComplete: () => {
        // Destacar palabras clave una por una (sin efectos glow)
        const strongElements = subtitleElement.querySelectorAll('strong');
        if (strongElements.length > 0) {
          // Asegurar que las palabras clave tengan el color correcto sin animación
          gsap.set(strongElements, {
            color: 'var(--color-vivid-orange)',
            fontWeight: 700
          });
        }
      }
    }, "-=0.2");
  }

  // Preparar los botones para la animación
  gsap.set('.hero-buttons', { overflow: 'hidden' });
  gsap.set('.hero-buttons .btn', {
    opacity: 0,
    y: 80,
    scale: 0.8,
    transformOrigin: "center bottom"
  });

  // Animar contenedor de botones primero
  heroTl.from('.hero-buttons', {
    width: 0,
    opacity: 0,
    duration: 0.6,
    ease: "power2.out"
  }, "-=0.3");

  // Animar botones con efecto de deslizamiento desde abajo
  heroTl.to('.hero-buttons .btn', {
    opacity: 1,
    y: 0,
    scale: 1,
    stagger: 0.15, // Tiempo entre cada botón
    duration: 0.8,
    ease: "back.out(1.7)", // Efecto de rebote más natural
    clearProps: "transform", // Limpiar propiedades para que los hover funcionen correctamente
    onComplete: () => {
      // Añadir efecto de escala sutil al primer botón para llamar la atención (sin glow)
      gsap.to('.hero-buttons .btn-primary', {
        scale: 1.05,
        duration: 0.5,
        repeat: 1,
        yoyo: true,
        ease: "power2.inOut"
      });
    }
  }, "-=0.4");

  // Animar imagen del héroe con efecto 3D mejorado
  heroTl.from('.hero-image', {
    scale: 0.7,
    opacity: 0,
    y: 50,
    rotationY: 25,
    duration: 1.4,
    ease: "back.out(1.7)"
  }, "-=1.2");

  // Guardar la animación
  animations.push(heroTl);
}

/**
 * Configura efectos de parallax para la sección hero
 * Versión simplificada que evita referencias a elementos que ya no existen
 */
function setupHeroParallaxEffects() {
  // Crear efecto de parallax para elementos con atributo data-parallax
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  parallaxElements.forEach((element) => {
    // Obtener el tipo de parallax
    const type = element.getAttribute('data-parallax');
    let strength = 0.1; // Valor por defecto

    // Ajustar la intensidad según el tipo
    if (type === 'medium') strength = 0.2;
    if (type === 'deep') strength = 0.3;

    // Crear un ScrollTrigger para el elemento
    const trigger = ScrollTrigger.create({
      trigger: element.closest('section') || element,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        // Calcular la posición basada en el progreso del scroll
        const progress = self.progress;

        // Aplicar transformación
        gsap.to(element, {
          y: progress * 100 * strength,
          duration: 0.1,
          ease: "none"
        });
      }
    });

    // Guardar para limpieza
    scrollTriggers.push(trigger);
  });
}

/**
 * Initialize advanced scroll reveal animations optimized for snap scrolling
 */
function initAdvancedScrollRevealAnimations() {
  // Configure animations for elements with data-animation="reveal" attribute
  const revealElements = document.querySelectorAll('[data-animation="reveal"]');

  revealElements.forEach((element, index) => {
    // Create a ScrollTrigger for each element
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top 80%", // Trigger slightly earlier
      onEnter: () => {
        // Only animate if parent section is active or becoming active
        const parentSection = element.closest('section');
        if (!parentSection || parentSection.classList.contains('active')) {
          animateElement(element, index);
        }
      },
      onEnterBack: () => {
        // Re-animate when scrolling back up
        const parentSection = element.closest('section');
        if (!parentSection || parentSection.classList.contains('active')) {
          animateElement(element, index);
        }
      },
      once: false // Allow re-animation when scrolling back
    });

    scrollTriggers.push(trigger);
  });

  // Add event listeners to animate elements when their section becomes active
  document.querySelectorAll('section').forEach(section => {
    section.addEventListener('animationstart', () => {
      const elements = section.querySelectorAll('[data-animation="reveal"]');
      elements.forEach((element, index) => {
        // Small delay between elements for staggered effect
        setTimeout(() => {
          animateElement(element, index);
        }, index * 100);
      });
    });
  });
}

/**
 * Animate an element based on its type
 */
function animateElement(element, index) {
  // Reset any existing animations
  gsap.set(element, { clearProps: "all" });

  // Determine animation type based on element
  if (element.classList.contains('section-title')) {
    // Special animation for section titles
    gsap.fromTo(element,
      {
        y: 50,
        opacity: 0,
        rotationX: -10,
        transformOrigin: "0% 50% -50"
      },
      {
        y: 0,
        opacity: 1,
        rotationX: 0,
        duration: config.revealDuration,
        ease: "back.out(1.7)"
      }
    );
  } else if (element.classList.contains('hero-title')) {
    // Hero titles are handled in their own function
    return;
  } else {
    // Standard animation for other elements
    gsap.fromTo(element,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: config.revealDuration * 0.8,
        delay: index * 0.05, // Small delay for staggered effect
        ease: "power2.out"
      }
    );
  }
}

/**
 * Anima la lista de beneficios en la sección Why TutorIA
 */
function animateBenefitsList(section) {
  // Seleccionar los elementos de la lista
  const benefitItems = section.querySelectorAll('.benefit-item');

  // Timeline para la animación
  const benefitsTl = gsap.timeline({
    scrollTrigger: {
      trigger: section.querySelector('.benefits-list'),
      start: "top 80%",
      end: "bottom 70%",
      toggleActions: "play none none reverse"
    }
  });

  // Animar cada elemento de la lista con un efecto escalonado
  benefitsTl.from(benefitItems, {
    x: -50,
    opacity: 0,
    stagger: 0.15,
    duration: 0.7,
    ease: "back.out(1.4)",
    clearProps: "transform"
  });

  // Animar los iconos de check con un efecto de rebote
  const checkIcons = section.querySelectorAll('.check-icon');
  benefitsTl.from(checkIcons, {
    scale: 0,
    opacity: 0,
    stagger: 0.1,
    duration: 0.5,
    ease: "back.out(2)",
    clearProps: "transform"
  }, "-=0.5");

  // Guardar la animación
  animations.push(benefitsTl);

  // Animar las insignias con efecto de flotación
  animateBadges(section);
}

/**
 * Anima las insignias en la sección Why TutorIA
 */
function animateBadges(section) {
  // Seleccionar las insignias
  const badges = section.querySelectorAll('.badge');

  // Timeline para la animación inicial
  const badgesTl = gsap.timeline({
    scrollTrigger: {
      trigger: section.querySelector('.badges-container'),
      start: "top 70%",
      end: "bottom 20%",
      toggleActions: "play none none reverse"
    }
  });

  // Animar cada insignia con un efecto de entrada
  badgesTl.from(badges, {
    y: 100,
    x: (i) => i % 2 === 0 ? -50 : 50,
    opacity: 0,
    rotation: (i) => i % 2 === 0 ? -15 : 15,
    stagger: 0.2,
    duration: 1,
    ease: "back.out(1.7)",
  });

  // Guardar la animación
  animations.push(badgesTl);

  // Añadir animación continua de flotación para cada insignia
  badges.forEach((badge, index) => {
    const floatTl = gsap.timeline({
      repeat: -1,
      yoyo: true,
      delay: index * 0.3
    });

    floatTl.to(badge, {
      y: "-=15",
      x: index % 2 === 0 ? "-=10" : "+=10",
      rotation: index % 2 === 0 ? "-=3" : "+=3",
      duration: 2 + (index * 0.5),
      ease: "sine.inOut"
    }).to(badge, {
      y: "+=15",
      x: index % 2 === 0 ? "+=10" : "-=10",
      rotation: index % 2 === 0 ? "+=3" : "-=3",
      duration: 2 + (index * 0.5),
      ease: "sine.inOut"
    });

    // Guardar la animación
    animations.push(floatTl);
  });
}

/**
 * Configura animaciones avanzadas para las tarjetas de características
 * Versión mejorada con efectos más impactantes y coloridos
 */
function initEnhancedFeatureCardAnimations(section) {
  // Si se proporciona una sección específica, seleccionar solo las tarjetas de esa sección
  const container = section || document;

  // Seleccionar todas las tarjetas con atributo data-animation="card" o clase feature-card
  const cards = container.querySelectorAll('[data-animation="card"], .feature-card, .fun-learning-card, .testimonial-card');

  if (cards.length === 0) return;

  // Timeline para la animación con ScrollTrigger mejorado
  const cardsTl = gsap.timeline({
    scrollTrigger: {
      trigger: cards.length > 0 ? cards[0].parentElement : null,
      start: "top 80%",
      end: "bottom 50%",
      toggleActions: "play none none reverse"
    }
  });

  // Preparar las tarjetas para la animación
  gsap.set(cards, {
    opacity: 0,
    y: 150,
    scale: 0.8,
    transformOrigin: "center bottom"
  });

  // Animar cada tarjeta con un efecto escalonado más impactante
  cardsTl.to(cards, {
    opacity: 1,
    y: 0,
    scale: 1,
    rotation: (i) => i % 2 === 0 ? -2 : 2, // Rotación sutil alternada
    stagger: {
      amount: 0.8, // Tiempo total para animar todas las tarjetas (más largo)
      from: "start", // Comenzar desde la primera tarjeta
      ease: "power3.out" // Easing más pronunciado para el escalonamiento
    },
    duration: config.cardAnimationDuration * 1.2, // Duración ligeramente más larga
    ease: "elastic.out(1, 0.5)", // Efecto elástico para más impacto
    clearProps: "rotation,scale" // Limpiar propiedades para que los hover funcionen correctamente
  });

  // Animar los elementos internos de cada tarjeta individualmente
  cards.forEach((card, index) => {
    // Seleccionar elementos internos
    const icon = card.querySelector('.feature-icon, .card-icon, .card-image');
    const title = card.querySelector('h3');
    const text = card.querySelector('p');

    // Timeline para esta tarjeta específica
    const cardElementsTl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });

    // Animar icono con efecto de rotación y rebote
    if (icon) {
      cardElementsTl.from(icon, {
        scale: 0,
        opacity: 0,
        rotation: 180,
        duration: 0.8,
        delay: 0.2 + (index * 0.05),
        ease: "elastic.out(1.2, 0.5)",
        clearProps: "rotation,scale"
      });

      // Añadir brillo al icono
      const iconGlow = document.createElement('div');
      iconGlow.className = 'icon-glow';
      iconGlow.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: inherit;
        pointer-events: none;
        background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
        opacity: 0;
      `;

      if (icon.style.position !== 'absolute') {
        icon.style.position = 'relative';
      }

      icon.appendChild(iconGlow);

      cardElementsTl.to(iconGlow, {
        opacity: 0.7,
        duration: 0.5,
        yoyo: true,
        repeat: 1
      });
    }

    // Animar título con efecto de deslizamiento
    if (title) {
      cardElementsTl.from(title, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        delay: 0.1,
        ease: "power3.out"
      }, "-=0.4");
    }

    // Animar texto con efecto de aparición gradual
    if (text) {
      cardElementsTl.from(text, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.3");
    }
  });

  // Guardar la animación
  animations.push(cardsTl);

  // Configurar interacciones al hacer hover mejoradas
  setupEnhancedCardHoverEffects(cards);
}

/**
 * Configura efectos de hover mejorados para las tarjetas
 */
function setupEnhancedCardHoverEffects(cards) {
  cards.forEach(card => {
    // Crear animaciones para hover con efectos más pronunciados
    card.addEventListener('mouseenter', () => {
      // Detectar el color principal de la tarjeta para el efecto de brillo
      let glowColor = "rgba(255,255,255,0.2)";

      if (card.classList.contains('personalized-learning') ||
          card.classList.contains('gamification') ||
          card.querySelector('.feature-icon.orange')) {
        glowColor = "rgba(230, 83, 29, 0.3)"; // Naranja
      } else if (card.classList.contains('progress-tracking') ||
                card.querySelector('.feature-icon.green')) {
        glowColor = "rgba(0, 113, 66, 0.3)"; // Verde
      } else if (card.classList.contains('ethical-ai') ||
                card.classList.contains('ai-powered') ||
                card.querySelector('.feature-icon.purple')) {
        glowColor = "rgba(52, 48, 123, 0.3)"; // Púrpura
      }

      // Efecto principal de elevación
      gsap.to(card, {
        y: -20,
        scale: 1.05,
        boxShadow: `0 30px 60px rgba(0, 0, 0, 0.3), 0 0 30px ${glowColor}`,
        duration: 0.4,
        ease: "power2.out"
      });

      // Animar el icono dentro de la tarjeta
      const icon = card.querySelector('.feature-icon, .card-icon, .card-image');
      if (icon) {
        gsap.to(icon, {
          scale: 1.15,
          rotation: 10,
          duration: 0.5,
          ease: "back.out(1.7)"
        });

        // Añadir efecto de brillo al icono
        const iconGlow = icon.querySelector('.icon-glow');
        if (iconGlow) {
          gsap.to(iconGlow, {
            opacity: 0.8,
            duration: 0.3
          });
        }
      }

      // Animar el título con un ligero cambio de color
      const title = card.querySelector('h3');
      if (title) {
        gsap.to(title, {
          scale: 1.05,
          color: "#FEF0D1",
          duration: 0.3,
          ease: "power1.out"
        });
      }
    });

    card.addEventListener('mouseleave', () => {
      // Restaurar estado normal con transición suave
      gsap.to(card, {
        y: 0,
        scale: 1,
        boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)",
        duration: 0.4,
        ease: "power2.out"
      });

      // Restaurar el icono
      const icon = card.querySelector('.feature-icon, .card-icon, .card-image');
      if (icon) {
        gsap.to(icon, {
          scale: 1,
          rotation: 0,
          duration: 0.4,
          ease: "back.out(1.7)"
        });

        // Restaurar brillo del icono
        const iconGlow = icon.querySelector('.icon-glow');
        if (iconGlow) {
          gsap.to(iconGlow, {
            opacity: 0,
            duration: 0.3
          });
        }
      }

      // Restaurar el título
      const title = card.querySelector('h3');
      if (title) {
        gsap.to(title, {
          scale: 1,
          color: "", // Restaurar color original
          duration: 0.3,
          ease: "power1.out"
        });
      }
    });
  });
}

// Esta función ha sido reemplazada por setupEnhancedCardHoverEffects
// Se mantiene por compatibilidad con código existente
function setupCardHoverEffects(cards) {
  // Redirigir a la nueva función mejorada
  setupEnhancedCardHoverEffects(cards);
}

/**
 * Anima la sección de aprendizaje divertido
 */
function animateFunLearningSection(section) {
  // Animar las tarjetas con un efecto escalonado
  initEnhancedFeatureCardAnimations(section);

  // Animar el botón CTA
  const cta = section.querySelector('.cta-button');
  if (cta) {
    const ctaTl = gsap.timeline({
      scrollTrigger: {
        trigger: cta,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });

    ctaTl.from(cta, {
      y: 30,
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      ease: "back.out(1.7)"
    });

    // Añadir efecto de pulsación
    ctaTl.to(cta, {
      scale: 1.05,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    }, "+=0.5");

    // Guardar la animación
    animations.push(ctaTl);
  }
}

/**
 * Implementa un efecto creativo de apilamiento de tarjetas al hacer scroll
 */
function initCreativeStackingCardsEffect() {
  // Seleccionar las secciones que contienen tarjetas con clase stack-element
  const sections = document.querySelectorAll('.features, .fun-learning');

  sections.forEach(section => {
    const cards = section.querySelectorAll('.stack-element');

    if (cards.length > 0) {
      // Crear un ScrollTrigger avanzado para el efecto de apilamiento
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 30%",
        end: "bottom -10%", // Extender más allá del final de la sección
        scrub: 0.8, // Suavizado para el efecto
        onUpdate: (self) => {
          // Calcular el progreso del scroll
          const progress = self.progress;
          const direction = self.direction > 0 ? 1 : -1; // 1 = hacia abajo, -1 = hacia arriba

          // Actualizar variable CSS para otros efectos
          document.documentElement.style.setProperty('--scroll-direction', direction);

          // Aplicar transformaciones a las tarjetas basadas en el progreso
          cards.forEach((card, index) => {
            // Determinar si la tarjeta va a la izquierda o derecha
            const isLeft = index % 2 === 0;

            // Calcular la posición final de cada tarjeta con valores más extremos
            const xPos = isLeft
              ? -30 - (index * 10) - (window.innerWidth * 0.05)
              : 30 + (index * 10) + (window.innerWidth * 0.05);

            const yPos = 20 + (index * 15) + (window.innerHeight * 0.05);
            const rotation = isLeft ? -8 - (index * 3) : 8 + (index * 3);
            const scale = 0.9 - (index * 0.05);
            const opacity = 1 - (index * 0.15) - (progress * 0.3);

            // Umbral de activación ajustado para un efecto más gradual
            const threshold = 0.6;

            // Aplicar transformación con una transición más suave
            if (progress > threshold) {
              // Normalizar el progreso para el efecto de apilamiento
              const stackProgress = Math.min(1, (progress - threshold) / (1 - threshold));

              // Aplicar transformación con GSAP
              gsap.to(card, {
                x: xPos * stackProgress,
                y: yPos * stackProgress,
                rotation: rotation * stackProgress,
                scale: Math.max(0.6, scale),
                opacity: Math.max(0.4, opacity),
                boxShadow: `0 ${10 + (stackProgress * 20)}px ${30 + (stackProgress * 30)}px rgba(0, 0, 0, ${0.2 + (stackProgress * 0.1)})`,
                duration: 0.2,
                ease: "power2.out",
                zIndex: 100 - index
              });
            } else {
              // Restaurar posición original con una animación suave
              gsap.to(card, {
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1,
                opacity: 1,
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)",
                duration: 0.3,
                ease: "back.out(1.2)",
                zIndex: 1
              });
            }
          });
        }
      });

      // Guardar para limpieza
      scrollTriggers.push(trigger);
    }
  });
}

/**
 * Implementa transiciones entre secciones
 */
function initSectionTransitions() {
  // Seleccionar todas las secciones
  const sections = document.querySelectorAll('section');

  // Crear transiciones entre secciones (solo una vez)
  sections.forEach((section, index) => {
    if (index === 0) return; // Omitir la primera sección

    // Check if section has already been processed
    if (section.hasAttribute('data-transition-setup')) {
      return;
    }
    section.setAttribute('data-transition-setup', 'true');

    // Crear un ScrollTrigger para la transición que solo se ejecuta una vez
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 80%",
      toggleActions: "play none none none", // Only play once
      onEnter: () => {
        // Simple fade-in that locks the section in final position
        gsap.to(section, {
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => {
            // Lock section in final position
            section.style.opacity = '1';
            section.style.transform = 'none';
            section.style.visibility = 'visible';
          }
        });
      }
    });

    // Guardar para limpieza
    scrollTriggers.push(trigger);
  });
}

/**
 * Implementa efectos avanzados de parallax para elementos de fondo
 */
function initAdvancedParallaxEffects() {
  // Parallax para las formas de fondo en todas las secciones
  const sections = document.querySelectorAll('section');

  sections.forEach(section => {
    // Seleccionar las formas de fondo en esta sección
    const shapesContainer = section.querySelector('.bg-shapes, .floating-shapes');
    if (!shapesContainer) return;

    const shapes = shapesContainer.querySelectorAll('.shape');
    if (shapes.length === 0) return;

    // Crear un ScrollTrigger para el efecto de parallax
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;

        // Aplicar transformaciones a cada forma
        shapes.forEach((shape, index) => {
          // Calcular movimiento personalizado para cada forma
          // Usar valores diferentes según la posición para crear un efecto más orgánico
          const depth = 0.5 + (index * 0.1); // Factor de profundidad
          const yMove = (index % 2 === 0 ? 1 : -1) * progress * 150 * depth;
          const xMove = (index % 2 === 0 ? -1 : 1) * progress * 80 * depth;
          const rotationAmount = (index % 2 === 0 ? -1 : 1) * progress * 10 * depth;
          const scaleChange = 1 - (progress * 0.1 * depth);

          // Aplicar transformación con GSAP
          gsap.to(shape, {
            y: yMove,
            x: xMove,
            rotation: rotationAmount,
            scale: scaleChange,
            opacity: 1 - (progress * 0.3 * depth),
            duration: 0.1,
            ease: "none"
          });
        });
      }
    });

    // Guardar para limpieza
    scrollTriggers.push(trigger);
  });
}

/**
 * Implementa un indicador de progreso de scroll y mejora la experiencia de scroll continuo
 */
function initScrollProgressIndicator() {
  // Crear el indicador de progreso
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress-bar';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 4px;
    width: 0%;
    background: linear-gradient(90deg, #00B86B, #FF5C28);
    z-index: 1000;
    transform-origin: left;
    transition: transform 0.1s linear;
  `;
  document.body.appendChild(progressBar);

  // Crear un ScrollTrigger para actualizar el progreso
  const trigger = ScrollTrigger.create({
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      // Actualizar la anchura de la barra de progreso
      gsap.to(progressBar, {
        width: `${self.progress * 100}%`,
        duration: 0.1,
        ease: "none"
      });

      // Actualizar variable CSS para otros efectos
      document.documentElement.style.setProperty('--scroll-progress', self.progress.toFixed(3));
    }
  });

  // Activar la primera sección al cargar
  const firstSection = document.querySelector('section');
  if (firstSection) {
    firstSection.classList.add('active');
  }

  // Configurar animaciones para elementos que deben aparecer/desaparecer con el scroll
  setupScrollBasedAnimations();

  // Guardar para limpieza
  scrollTriggers.push(trigger);

  // Guardar referencia para eliminar el elemento al limpiar
  const cleanupFunction = () => {
    if (progressBar.parentNode) {
      progressBar.parentNode.removeChild(progressBar);
    }
  };

  // Añadir a la lista de limpieza
  resizeHandlers.push(cleanupFunction);
}

/**
 * Configura animaciones basadas en el scroll para elementos específicos
 */
function setupScrollBasedAnimations() {
  // Seleccionar todos los elementos con atributo data-animation
  const animatedElements = document.querySelectorAll('[data-animation]');

  animatedElements.forEach((element) => {
    const animationType = element.getAttribute('data-animation');

    // Check if element has already been animated
    if (element.hasAttribute('data-animated')) {
      // Ensure element stays in final position
      element.style.opacity = '1';
      element.style.transform = 'none';
      element.style.visibility = 'visible';
      return;
    }

    // Crear un ScrollTrigger específico según el tipo de animación
    if (animationType === 'reveal' || animationType === 'card') {
      ScrollTrigger.create({
        trigger: element,
        start: "top 80%",
        toggleActions: "play none none none", // Only play once, never reverse
        onEnter: () => {
          // Mark as animated to prevent re-animation
          element.setAttribute('data-animated', 'true');

          gsap.to(element, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
              // Lock element in final position
              element.style.opacity = '1';
              element.style.transform = 'none';
              element.style.visibility = 'visible';
            }
          });
        }
      });
    }
  });
}

/**
 * Limpia todas las animaciones, ScrollTriggers, observadores y manejadores de eventos
 */
export function cleanupAnimations() {
  // Matar todas las animaciones
  animations.forEach(animation => {
    if (animation) {
      animation.kill();
    }
  });

  // Matar todos los ScrollTriggers
  scrollTriggers.forEach(trigger => {
    if (trigger) {
      trigger.kill();
    }
  });

  // Desconectar todos los observadores
  observers.forEach(observer => {
    if (observer && observer.disconnect) {
      observer.disconnect();
    }
  });

  // Ejecutar funciones de limpieza para manejadores de eventos
  resizeHandlers.forEach(handler => {
    if (typeof handler === 'function') {
      handler();
    }
  });

  // Limpiar los arrays
  animations = [];
  scrollTriggers = [];
  observers = [];
  resizeHandlers = [];

  // Limpiar variables CSS
  const root = document.documentElement;
  root.style.removeProperty('--scroll-progress');
  root.style.removeProperty('--scroll-direction');

  // Eliminar cualquier elemento creado dinámicamente
  const progressBar = document.querySelector('.scroll-progress-bar');
  if (progressBar && progressBar.parentNode) {
    progressBar.parentNode.removeChild(progressBar);
  }
}
