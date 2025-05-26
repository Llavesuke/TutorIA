<script setup>
// ProfessorFooter component for TutorIA professor dashboard
</script>

<template>
  <footer class="professor-footer">
    <div class="container">
      <div class="footer-logo">
        <img src="@/assets/images/logo_sin_fondo.png" alt="TutorIA Logo" class="logo-image" />
      </div>

      <div class="footer-sections">
        <div class="footer-section about-us">
          <h4>About us</h4>
          <ul>
            <li><a href="#">Terms & conditions</a></li>
            <li><a href="#">Privacy police</a></li>
            <li><a href="#">Who we are?</a></li>
            <li><a href="#">Contact us</a></li>
            <li><a href="#">FAQ</a></li>
          </ul>
        </div>

        <div class="footer-section navigation">
          <h4>Navegation</h4>
          <ul>
            <li><a href="#">Dashboard</a></li>
            <li><a href="#">Students</a></li>
            <li><a href="#">Tutors</a></li>
            <li><a href="#">Reports</a></li>
            <li><a href="#">Settings</a></li>
          </ul>
        </div>

        <div class="footer-section social">
          <h4>Social networks</h4>
          <ul>
            <li><a href="#">Facebook</a></li>
            <li><a href="#">Instagram</a></li>
            <li><a href="#">Youtube</a></li>
            <li><a href="#">Discord</a></li>
            <li><a href="#">X</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <img src="@/assets/images/text_logo.png" alt="TutorIA" class="footer-brand-image" />
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.professor-footer {
  background-color: var(--color-carbon);
  color: var(--color-cashmere);
  padding: 2rem 0;
  font-family: 'Poppins', sans-serif;
  position: relative;
  border-top-left-radius: 50px;
  border-top-right-radius: 50px;
  z-index: 1000;
  margin-top: 2rem; // Añadir margen superior para que se vean los bordes redondeados
  overflow: hidden; // Asegurar que el contenido no sobresalga de los bordes redondeados

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .footer-logo {
    margin-bottom: 1.5rem;

    .logo-image {
      height: 50px;
      width: auto;
    }
  }

  .footer-sections {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 800px;
    margin-bottom: 2rem;
    position: relative;

    &::before, &::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: 4px;
      border-radius: 8px;
    }

    &::before {
      left: 33%;
      background-color: var(--color-deep-koamaru);
      border-top-left-radius: 20px;
      height: 100%;
    }

    &::after {
      right: 33%;
      background-color: var(--color-vivid-orange);
      border-top-right-radius: 20px;
      height: 100%;
    }

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: center;
      gap: 2rem;

      &::before, &::after {
        display: none;
      }
    }
  }

  .footer-section {
    flex: 1;
    padding: 0 1rem;

    h4 {
      color: var(--color-cashmere);
      font-size: 1.1rem;
      margin-bottom: 1.2rem;
      font-weight: var(--font-weight-bold);
      position: relative;
      display: inline-block;
      text-transform: uppercase;

      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        width: 40px;
        height: 3px;
        border-radius: 1.5px;
      }
    }

    &.about-us h4::after {
      background-color: var(--color-deep-green);
    }

    &.navigation h4::after {
      background-color: var(--color-deep-koamaru);
    }

    &.social h4::after {
      background-color: var(--color-vivid-orange);
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        margin-bottom: 0.7rem;

        a {
          color: var(--color-cashmere);
          opacity: 0.7;
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          font-weight: var(--font-weight-medium);

          &:hover {
            color: var(--color-vivid-orange);
            opacity: 1;
          }
        }
      }
    }

    @media (max-width: 768px) {
      text-align: center;
      padding: 0;

      h4::after {
        left: 50%;
        transform: translateX(-50%);
      }
    }
  }

  .footer-bottom {
    margin-top: 1.5rem;
    text-align: center;

    .footer-brand-image {
      height: auto;
      width: 180px;
      display: inline-block;
    }
  }
}
</style>
