<script setup>
// Footer component for TutorIA application
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h4>TutorIA</h4>
          <p>Revolucionando el aprendizaje con tutores virtuales impulsados por IA.</p>
          <div class="social-links">
            <a href="#" aria-label="Facebook"><i class="fab fa-facebook"></i></a>
            <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
            <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>
          </div>
        </div>
        
        <div class="footer-section">
          <h4>Enlaces</h4>
          <ul>
            <li><a href="#features">Características</a></li>
            <li><a href="#how-it-works">Cómo Funciona</a></li>
            <li><a href="#why-tutoria">Por Qué TutorIA</a></li>
            <li><a href="#contact">Contacto</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><a href="/terms">Términos de Servicio</a></li>
            <li><a href="/privacy">Política de Privacidad</a></li>
            <li><a href="/cookies">Política de Cookies</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Contacto</h4>
          <ul>
            <li>Email: info@tutoria.com</li>
            <li>Teléfono: +34 123 456 789</li>
            <li>Dirección: Calle Principal 123, Madrid</li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; {{ new Date().getFullYear() }} TutorIA. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.footer {
  background-color: var(--color-carbon-variant);
  padding: var(--spacing-xl) 0 var(--spacing-md);
  color: var(--color-text-light);
  
  .footer-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
    
    @media (min-width: 576px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (min-width: 992px) {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  .footer-section {
    h4 {
      color: var(--color-cashmere);
      font-size: 1.25rem;
      margin-bottom: var(--spacing-md);
      font-weight: var(--font-weight-bold);
    }
    
    p {
      margin-bottom: var(--spacing-md);
      line-height: 1.6;
    }
    
    ul {
      li {
        margin-bottom: var(--spacing-sm);
        
        a {
          color: var(--color-text-light);
          text-decoration: none;
          transition: color var(--transition-normal);
          
          &:hover {
            color: var(--color-vivid-orange);
          }
        }
      }
    }
    
    .social-links {
      display: flex;
      gap: var(--spacing-md);
      margin-top: var(--spacing-md);
      
      a {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--color-text);
        transition: all var(--transition-normal);
        
        &:hover {
          background-color: var(--color-vivid-orange);
          color: white;
        }
      }
    }
  }
  
  .footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: var(--spacing-md);
    text-align: center;
    font-size: 0.875rem;
  }
}
</style>
