<template>
  <div class="hero-container">
    <LandingHero />
  </div>
</template>

<style scoped>
.hero-container {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 100vh;
  width: 100%;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  /* Background image with gradient overlay */
  background-image: linear-gradient(to bottom, rgba(0, 10, 50, 0.6), rgba(0, 20, 80, 0.8)), url('/window.webp');

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>
