/**
 * Implementación simplificada de scroll suave con Lenis
 * https://github.com/studio-freight/lenis
 *
 * Características:
 * - Scroll suave optimizado para rendimiento
 * - Navegación por secciones
 * - Integración con GSAP
 */

import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registrar plugins de GSAP
gsap.registerPlugin(ScrollTrigger);

// Configuración optimizada para el comportamiento del scroll (snap perfecto y estable)
const SCROLL_CONFIG = {
  duration: 1.2,             // Duración aumentada para scroll más estable
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing mejorado para snap más suave
  wheelMultiplier: 0.7,      // Sensibilidad reducida para mayor estabilidad
  touchMultiplier: 0.7,      // Sensibilidad reducida para mayor estabilidad
  enableSnapping: true,      // Mantener snap scrolling
  snapDuration: 1.0,         // Duración aumentada para snap más estable
  throttleDelay: 1000 / 90,  // Reducido a 90 FPS para mejor estabilidad
  snapThreshold: 0.2,        // Umbral aumentado para activar snap más fácilmente
  debounceDelay: 50,         // Aumentado para evitar activaciones accidentales
  lockTimeout: 800,          // Tiempo de bloqueo aumentado para evitar rebotes
};

// Estado simplificado del scroll
let scrollState = {
  activeSection: null,       // Sección actualmente activa
  isSnapping: false,         // Si estamos en una animación de snap
};

/**
 * Inicializa Lenis para scroll suave con integración GSAP
 * @returns {Lenis} Instancia de Lenis
 */
export function initSmoothScroll() {
  // Crear instancia de Lenis con opciones optimizadas para snap scroll perfecto y estable
  const lenis = new Lenis({
    duration: SCROLL_CONFIG.duration,
    easing: SCROLL_CONFIG.easing,
    orientation: 'vertical',
    smoothWheel: true,
    smoothTouch: true,
    infinite: false,
    wheelMultiplier: SCROLL_CONFIG.wheelMultiplier,
    touchMultiplier: SCROLL_CONFIG.touchMultiplier,
    syncTouch: true,
    syncTouchLerp: 0.03, // Reducido para mayor estabilidad
    lerp: 0.03, // Reducido para mayor estabilidad
    gestureOrientation: 'vertical',
    normalizeWheel: true, // Normalizar eventos de rueda para consistencia
    smoothWheel: true, // Mantener scroll suave
    wrapper: window, // Especificar el wrapper para mejor control
    content: document.documentElement, // Especificar el contenido para mejor control
  });

  // Configurar detección de secciones activas (sin throttling excesivo)
  let scrollThrottleTimer = null;

  // Optimizar eventos de scroll para mejor rendimiento y navegación
  let lastScrollTime = 0;
  const scrollUpdateInterval = 100; // Intervalo reducido para mejor respuesta

  lenis.on('scroll', (e) => {
    const now = performance.now();

    // Actualizar ScrollTrigger solo cuando sea necesario
    if (now - lastScrollTime > scrollUpdateInterval) {
      // Actualizar ScrollTrigger con menos frecuencia
      ScrollTrigger.update();
      lastScrollTime = now;

      // Detección de sección activa solo cuando no estamos en snap
      if (!scrollState.isSnapping) {
        detectActiveSection();
      }

      // Asegurar que todas las secciones sean visibles
      if (sectionCache) {
        sectionCache.forEach(section => {
          if (section.style.opacity !== '1') {
            section.style.opacity = '1';
            section.style.visibility = 'visible';
          }
        });
      }
    }
  });

  // Integrar con GSAP ticker para actualizaciones suaves
  // Optimizar FPS para mejor rendimiento
  gsap.ticker.fps(60);

  // Función simplificada para actualizar Lenis
  // Eliminamos el throttling manual para evitar problemas de sincronización
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  // Configurar navegación por anclas
  setupAnchorNavigation(lenis);

  // Configurar snap scrolling si está habilitado
  if (SCROLL_CONFIG.enableSnapping) {
    setupSectionSnapping(lenis);
  }

  // Configurar indicador de scroll
  setupScrollIndicator(lenis);

  return lenis;
}

/**
 * Detecta la sección activa basada en la visibilidad (optimizado para rendimiento)
 */
// Cache para secciones
let sectionCache = null;
let lastDetectionTime = 0;

function detectActiveSection() {
  // Usar caché de secciones si existe
  if (!sectionCache) {
    sectionCache = Array.from(document.querySelectorAll('section[id]'));
  }

  // Si no hay secciones, salir temprano
  if (sectionCache.length === 0) return;

  // Optimización: Almacenar altura de viewport
  const viewportHeight = window.innerHeight;

  // Optimización: Usar IntersectionObserver si está disponible
  if (window.IntersectionObserver && !window._sectionObserver) {
    // Crear observer una sola vez
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: [0.1, 0.2, 0.3, 0.4, 0.5]
    };

    let maxVisibility = 0;
    let mostVisibleSection = null;

    window._sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxVisibility) {
          maxVisibility = entry.intersectionRatio;
          mostVisibleSection = entry.target;
        }
      });

      // Actualizar sección activa si encontramos una
      if (mostVisibleSection && mostVisibleSection !== scrollState.activeSection) {
        updateActiveSection(mostVisibleSection);
      }
    }, options);

    // Observar todas las secciones
    sectionCache.forEach(section => {
      window._sectionObserver.observe(section);
    });

    return;
  }

  // Fallback al método tradicional si IntersectionObserver no está disponible
  let currentSection = null;
  let maxVisibility = 0;

  // Usar un bucle for tradicional para mejor rendimiento
  for (let i = 0; i < sectionCache.length; i++) {
    const section = sectionCache[i];
    const rect = section.getBoundingClientRect();

    // Cálculos simplificados para mejor rendimiento
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(viewportHeight, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibilityRatio = visibleHeight / viewportHeight;

    if (visibilityRatio > 0.2 && visibilityRatio > maxVisibility) {
      maxVisibility = visibilityRatio;
      currentSection = section;
    }
  }

  if (currentSection && currentSection !== scrollState.activeSection) {
    updateActiveSection(currentSection);
  }
}

// Función separada para actualizar la sección activa (mejora rendimiento y navegación)
function updateActiveSection(currentSection) {
  // Actualizar sección activa
  if (scrollState.activeSection) {
    scrollState.activeSection.classList.remove('active');
  }

  // Asegurar que la sección sea visible con optimizaciones anti-flickering
  currentSection.style.opacity = '1';
  currentSection.style.visibility = 'visible';
  currentSection.style.display = 'flex';
  currentSection.classList.add('active');

  // Optimizaciones para prevenir flickering
  currentSection.style.willChange = 'transform';
  currentSection.style.transform = 'translateZ(0)';
  currentSection.style.backfaceVisibility = 'hidden';

  // Optimizaciones específicas para la sección CTA
  if (currentSection.id === 'cta') {
    currentSection.style.zIndex = '10';

    // Simplificado para evitar flickering
    const ctaContent = currentSection.querySelector('.cta-content');
    if (ctaContent) {
      ctaContent.style.opacity = '1';
      ctaContent.style.visibility = 'visible';
    }
  }

  scrollState.activeSection = currentSection;

  // Asegurar que todas las secciones anteriores también sean visibles
  if (sectionCache) {
    const currentIndex = sectionCache.indexOf(currentSection);
    for (let i = 0; i <= currentIndex; i++) {
      if (sectionCache[i]) {
        sectionCache[i].style.opacity = '1';
        sectionCache[i].style.visibility = 'visible';
        sectionCache[i].style.display = 'flex';

        // Aplicar optimizaciones anti-flickering a todas las secciones
        sectionCache[i].style.willChange = 'transform';
        sectionCache[i].style.transform = 'translateZ(0)';
        sectionCache[i].style.backfaceVisibility = 'hidden';
      }
    }
  }

  // Disparar evento personalizado para activar animaciones
  // Usar requestAnimationFrame para mejor rendimiento
  requestAnimationFrame(() => {
    const event = new CustomEvent('sectionActivated', {
      detail: { section: currentSection, id: currentSection.id }
    });
    document.dispatchEvent(event);
  });

  // Actualizar URL sin recargar la página (solo si es necesario)
  if (currentSection.id && window.location.hash !== `#${currentSection.id}`) {
    // Usar setTimeout para no bloquear el hilo principal
    setTimeout(() => {
      history.replaceState(null, null, `#${currentSection.id}`);
    }, 0);
  }

  // Actualizar el indicador de scroll para mostrar la siguiente sección
  // Usar requestAnimationFrame para mejor rendimiento
  requestAnimationFrame(() => {
    updateScrollIndicator(currentSection);
  });
}
// Función para actualizar el indicador de scroll
function updateScrollIndicator(currentSection) {
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (!scrollIndicator) return;

  const sections = sectionCache || Array.from(document.querySelectorAll('section[id]'));
  const currentIndex = sections.indexOf(currentSection);
  const nextSection = sections[currentIndex + 1];

  // Actualizar texto para mostrar la siguiente sección o "Volver arriba" si estamos al final
  if (nextSection) {
    scrollIndicator.setAttribute('data-next-section', `#${nextSection.id || ''}`);
    scrollIndicator.querySelector('.scroll-text').textContent = 'Next Section';
  } else {
    scrollIndicator.setAttribute('data-next-section', '#hero');
    scrollIndicator.querySelector('.scroll-text').textContent = 'Back to Top';
  }
}

/**
 * Configura la navegación por anclas
 * @param {Lenis} lenis - Instancia de Lenis
 */
function setupAnchorNavigation(lenis) {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();

      // Obtener ID del elemento destino
      const targetId = this.getAttribute('href');

      // Si ya estamos en una animación, ignorar
      if (scrollState.isSnapping) return;

      // Si es un enlace vacío o "#", scroll al inicio
      if (targetId === '#' || targetId === '') {
        lenis.scrollTo(0, {
          duration: SCROLL_CONFIG.duration,
          lock: true
        });
        return;
      }

      // Encontrar elemento destino
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Scroll al destino
        lenis.scrollTo(targetElement, {
          offset: 0,
          duration: SCROLL_CONFIG.duration,
          lock: true
        });
      }
    });
  });
}

/**
 * Configura el snap scrolling para navegación por secciones (optimizado)
 * @param {Lenis} lenis - Instancia de Lenis
 */
function setupSectionSnapping(lenis) {
  // Usar caché de secciones si existe
  const sections = sectionCache || Array.from(document.querySelectorAll('section[id]'));

  // Guardar en caché para reutilizar
  if (!sectionCache) {
    sectionCache = sections;
  }

  // Asegurar que todas las secciones sean visibles y correctamente configuradas
  sections.forEach(section => {
    // Asegurar visibilidad
    section.style.opacity = '1';
    section.style.visibility = 'visible';
    section.style.display = 'flex';

    // Aplicar altura mínima a todas las secciones, incluyendo "How It Works"
    section.style.minHeight = '100vh';
    section.style.height = '100vh';

    section.style.position = 'relative';
    section.style.zIndex = '5';
    section.classList.add('active');

    // Optimizaciones para prevenir flickering
    section.style.willChange = 'transform';
    section.style.transform = 'translateZ(0)';
    section.style.backfaceVisibility = 'hidden';

    // Todas las secciones tienen el mismo z-index base

    // Optimizaciones específicas para la sección CTA
    if (section.id === 'cta') {
      section.style.zIndex = '10';
      section.style.transform = 'translateZ(0)';
      section.style.willChange = 'transform';
      section.style.backfaceVisibility = 'hidden';
      section.style.perspective = '1000px';
    }
  });

  // Variables para throttling
  let wheelThrottleTimer = null;
  let lastWheelTime = 0;

  // Configurar evento de rueda para snap scrolling perfecto
  let wheelTimeout = null;
  let isScrolling = false;

  // Ya no hay variables para el scroll progresivo en How It Works

  window.addEventListener('wheel', (e) => {
    // Si ya estamos en una animación, ignorar completamente
    if (scrollState.isSnapping || isScrolling) {
      e.preventDefault();
      return;
    }

    // Usar debounce para evitar múltiples eventos de rueda
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
      isScrolling = false;
    }, SCROLL_CONFIG.lockTimeout);

    // Ignorar eventos pequeños (umbral reducido para mejor respuesta)
    if (Math.abs(e.deltaY) < 5) return;

    // Determinar dirección
    const direction = e.deltaY > 0 ? 1 : -1;

    // Encontrar sección actual
    const currentSection = scrollState.activeSection;
    if (!currentSection) {
      // Si no hay sección activa, usar la primera sección visible
      const visibleSections = sections.filter(section => {
        const rect = section.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });

      if (visibleSections.length > 0) {
        scrollState.activeSection = visibleSections[0];
      } else {
        return; // No hay secciones visibles
      }
    }

    // Ya no hay manejo especial para la sección How It Works
    // Tratamos todas las secciones de la misma manera

    // Encontrar índice de la sección actual
    const currentIndex = sections.indexOf(scrollState.activeSection);
    const targetIndex = currentIndex + direction;

    // Si el índice objetivo es válido
    if (targetIndex >= 0 && targetIndex < sections.length) {
      // Cancelar cualquier throttle pendiente
      if (wheelThrottleTimer) {
        clearTimeout(wheelThrottleTimer);
      }

      // Establecer flag de snapping
      scrollState.isSnapping = true;

      // Asegurar que la sección actual esté visible
      if (scrollState.activeSection) {
        scrollState.activeSection.style.opacity = '1';
        scrollState.activeSection.classList.add('active');
      }

      // Preparar la sección objetivo antes de la animación
      sections[targetIndex].style.opacity = '1';
      sections[targetIndex].style.visibility = 'visible';
      sections[targetIndex].style.display = 'flex';
      sections[targetIndex].classList.add('active');

      // Usar GSAP para un scroll más preciso y controlado (sin movimiento lateral)
      gsap.to(window, {
        duration: SCROLL_CONFIG.snapDuration,
        scrollTo: {
          y: sections[targetIndex],
          autoKill: false,
          offsetY: 0
        },
        ease: "power2.inOut",
        onStart: () => {
          // Pausar Lenis durante la animación GSAP
          lenis.stop();

          // Prevenir movimiento horizontal durante el scroll
          document.body.style.overflowX = 'hidden';

          // Fijar el ancho para evitar cambios durante el scroll
          const currentWidth = document.documentElement.clientWidth;
          document.documentElement.style.width = `${currentWidth}px`;

          // Asegurar que todas las secciones sean visibles con optimizaciones anti-flickering
          sections.forEach(section => {
            section.style.opacity = '1';
            section.style.visibility = 'visible';
            // Prevenir movimiento horizontal en secciones
            section.style.transform = 'translateZ(0)';
            section.style.maxWidth = '100%';
            section.style.willChange = 'transform';
            section.style.backfaceVisibility = 'hidden';

            // Optimizaciones específicas para la sección CTA
            if (section.id === 'cta') {
              section.style.zIndex = '10';

              // Simplificado para evitar flickering
              const ctaContent = section.querySelector('.cta-content');
              if (ctaContent) {
                ctaContent.style.opacity = '1';
                ctaContent.style.visibility = 'visible';
              }
            }
          });
        },
        onComplete: () => {
          // Reactivar Lenis después de la animación
          lenis.start();

          // Restaurar estilos normales
          document.body.style.overflowX = '';
          document.documentElement.style.width = '';

          // Activar la sección objetivo
          sections[targetIndex].classList.add('active');

          // Actualizar la sección activa
          updateActiveSection(sections[targetIndex]);

          // Disparar evento personalizado para activar animaciones
          const event = new CustomEvent('sectionActivated', {
            detail: { section: sections[targetIndex], id: sections[targetIndex].id }
          });
          document.dispatchEvent(event);

          // Verificar que el scroll haya llegado correctamente a la sección
          const targetRect = sections[targetIndex].getBoundingClientRect();
          if (Math.abs(targetRect.top) > 50) {
            // Si no llegó correctamente, intentar de nuevo con un scroll directo
            window.scrollTo({
              top: window.pageYOffset + targetRect.top,
              behavior: 'auto'
            });
          }

          // Resetear flag después de un retraso adecuado
          wheelThrottleTimer = setTimeout(() => {
            scrollState.isSnapping = false;
            isScrolling = false;
            wheelThrottleTimer = null;
          }, SCROLL_CONFIG.lockTimeout); // Usar el tiempo de bloqueo configurado
        }
      });
    }
  }, { passive: false });

  // La función handleHowItWorksScroll ha sido eliminada ya que no hay pasos en esa sección

  // La función isElementInViewport ha sido eliminada ya que no se utiliza

  // Configurar eventos de teclado para navegación con flechas
  window.addEventListener('keydown', (e) => {
    // Si ya estamos en una animación, ignorar
    if (scrollState.isSnapping) return;

    let direction = 0;

    // Determinar dirección basada en la tecla
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      direction = -1;
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      direction = 1;
    } else {
      return; // No es una tecla de navegación
    }

    // Encontrar sección actual
    const currentSection = scrollState.activeSection;
    if (!currentSection) return;

    // Encontrar índice de la sección actual
    const currentIndex = sections.indexOf(currentSection);
    const targetIndex = currentIndex + direction;

    // Si el índice objetivo es válido
    if (targetIndex >= 0 && targetIndex < sections.length) {
      // Establecer flag de snapping
      scrollState.isSnapping = true;

      // Asegurar que la sección actual esté visible
      if (scrollState.activeSection) {
        scrollState.activeSection.style.opacity = '1';
        scrollState.activeSection.classList.add('active');
      }

      // Asegurar que la sección objetivo esté visible
      sections[targetIndex].style.opacity = '1';
      sections[targetIndex].classList.add('active');

      // Usar GSAP para un scroll más preciso y controlado (teclas, sin movimiento lateral)
      gsap.to(window, {
        duration: SCROLL_CONFIG.snapDuration,
        scrollTo: {
          y: sections[targetIndex],
          autoKill: false,
          offsetY: 0
        },
        ease: "power2.inOut",
        onStart: () => {
          // Pausar Lenis durante la animación GSAP
          lenis.stop();

          // Prevenir movimiento horizontal durante el scroll
          document.body.style.overflowX = 'hidden';

          // Fijar el ancho para evitar cambios durante el scroll
          const currentWidth = document.documentElement.clientWidth;
          document.documentElement.style.width = `${currentWidth}px`;

          // Asegurar que todas las secciones sean visibles con optimizaciones anti-flickering
          sections.forEach(section => {
            section.style.opacity = '1';
            section.style.visibility = 'visible';
            // Prevenir movimiento horizontal en secciones
            section.style.transform = 'translateZ(0)';
            section.style.maxWidth = '100%';
            section.style.willChange = 'transform';
            section.style.backfaceVisibility = 'hidden';

            // Optimizaciones específicas para la sección CTA
            if (section.id === 'cta') {
              section.style.zIndex = '10';

              // Simplificado para evitar flickering
              const ctaContent = section.querySelector('.cta-content');
              if (ctaContent) {
                ctaContent.style.opacity = '1';
                ctaContent.style.visibility = 'visible';
              }
            }
          });
        },
        onComplete: () => {
          // Reactivar Lenis después de la animación
          lenis.start();

          // Restaurar estilos normales
          document.body.style.overflowX = '';
          document.documentElement.style.width = '';

          // Activar la sección objetivo
          sections[targetIndex].classList.add('active');

          // Actualizar la sección activa
          updateActiveSection(sections[targetIndex]);

          // Disparar evento personalizado para activar animaciones
          const event = new CustomEvent('sectionActivated', {
            detail: { section: sections[targetIndex], id: sections[targetIndex].id }
          });
          document.dispatchEvent(event);

          // Resetear flag después de un retraso adecuado
          setTimeout(() => {
            scrollState.isSnapping = false;
          }, SCROLL_CONFIG.lockTimeout);
        }
      });
    }
  });
}

/**
 * Configura el indicador de scroll
 * @param {Lenis} lenis - Instancia de Lenis
 */
function setupScrollIndicator(lenis) {
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (!scrollIndicator) return;

  // Añadir animación simple al indicador
  gsap.to(scrollIndicator, {
    y: 5,
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  // Manejar clic en el indicador con mejor feedback visual y navegación mejorada
  scrollIndicator.addEventListener('click', () => {
    // Si ya estamos en una animación, ignorar
    if (scrollState.isSnapping) return;

    // Obtener ID de la sección destino
    const nextSectionId = scrollIndicator.getAttribute('data-next-section');
    if (!nextSectionId) return;

    // Encontrar sección destino
    const nextSection = document.querySelector(nextSectionId);
    if (!nextSection) return;

    // Establecer flag de snapping
    scrollState.isSnapping = true;

    // Asegurar que la sección destino esté completamente visible
    nextSection.style.opacity = '1';
    nextSection.style.visibility = 'visible';
    nextSection.style.display = 'flex';
    nextSection.classList.add('active');

    // Animar el indicador al hacer clic con feedback más visible
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

    // Usar GSAP para un scroll más preciso y controlado (indicador, sin movimiento lateral)
    gsap.to(window, {
      duration: SCROLL_CONFIG.snapDuration,
      scrollTo: {
        y: nextSection,
        autoKill: false,
        offsetY: 0
      },
      ease: "power2.inOut",
      onStart: () => {
        // Pausar Lenis durante la animación GSAP
        lenis.stop();

        // Prevenir movimiento horizontal durante el scroll
        document.body.style.overflowX = 'hidden';

        // Fijar el ancho para evitar cambios durante el scroll
        const currentWidth = document.documentElement.clientWidth;
        document.documentElement.style.width = `${currentWidth}px`;

        // Asegurar que todas las secciones sean visibles con optimizaciones anti-flickering
        const sections = sectionCache || Array.from(document.querySelectorAll('section[id]'));
        sections.forEach(section => {
          section.style.opacity = '1';
          section.style.visibility = 'visible';
          // Prevenir movimiento horizontal en secciones
          section.style.transform = 'translateZ(0)';
          section.style.maxWidth = '100%';
          section.style.willChange = 'transform';
          section.style.backfaceVisibility = 'hidden';

          // Optimizaciones específicas para la sección CTA
          if (section.id === 'cta') {
            section.style.zIndex = '10';

            // Simplificado para evitar flickering
            const ctaContent = section.querySelector('.cta-content');
            if (ctaContent) {
              ctaContent.style.opacity = '1';
              ctaContent.style.visibility = 'visible';
            }
          }
        });
      },
      onComplete: () => {
        // Reactivar Lenis después de la animación
        lenis.start();

        // Restaurar estilos normales
        document.body.style.overflowX = '';
        document.documentElement.style.width = '';

        // Activar la sección objetivo
        nextSection.classList.add('active');

        // Actualizar la sección activa
        updateActiveSection(nextSection);

        // Asegurar que todas las secciones anteriores estén visibles
        const sections = sectionCache || Array.from(document.querySelectorAll('section[id]'));
        const nextIndex = sections.indexOf(nextSection);

        for (let i = 0; i <= nextIndex; i++) {
          sections[i].style.opacity = '1';
          sections[i].style.visibility = 'visible';
        }

        // Verificar que el scroll haya llegado correctamente a la sección
        const targetRect = nextSection.getBoundingClientRect();
        if (Math.abs(targetRect.top) > 50) {
          // Si no llegó correctamente, intentar de nuevo con un scroll directo
          window.scrollTo({
            top: window.pageYOffset + targetRect.top,
            behavior: 'auto'
          });
        }

        // Disparar evento personalizado para activar animaciones
        const event = new CustomEvent('sectionActivated', {
          detail: { section: nextSection, id: nextSectionId.substring(1) }
        });
        document.dispatchEvent(event);

        // Resetear flag después de un retraso adecuado
        setTimeout(() => {
          scrollState.isSnapping = false;
        }, SCROLL_CONFIG.lockTimeout);
      }
    });
  });
}

/**
 * Destruye la instancia de Lenis y limpia todos los eventos y recursos
 * @param {Lenis} lenis - Instancia de Lenis a destruir
 */
export function destroySmoothScroll(lenis) {
  if (!lenis) return;

  // Eliminar ticker de GSAP
  gsap.ticker.remove(lenis.raf);

  // Limpiar IntersectionObserver si existe
  if (window._sectionObserver) {
    window._sectionObserver.disconnect();
    window._sectionObserver = null;
  }

  // Limpiar caché de secciones
  if (sectionCache) {
    sectionCache = null;
  }

  // Eliminar event listeners de manera más efectiva
  // Nota: No podemos eliminar listeners anónimos, pero podemos limpiar referencias

  // Resetear estado
  scrollState = {
    activeSection: null,
    isSnapping: false
  };

  // Limpiar timers pendientes
  if (typeof window._scrollTimers !== 'undefined') {
    window._scrollTimers.forEach(timer => clearTimeout(timer));
    window._scrollTimers = [];
  }

  // Destruir instancia de Lenis
  lenis.destroy();

  // Forzar recolección de basura
  setTimeout(() => {
    // Sugerir al navegador que ejecute la recolección de basura
    if (window.gc) window.gc();
  }, 100);
}


