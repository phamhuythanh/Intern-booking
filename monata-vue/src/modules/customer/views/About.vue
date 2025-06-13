<script setup>
import { ref, onMounted } from 'vue';
import Footer from '../components/layouts/Footer.vue';
import Header from '../components/layouts/Header.vue';

import 'animate.css';

const heroImage = new URL('@/modules/customer/assets/img/slide/contact.png', import.meta.url).href
const storyImage = new URL('@/modules/customer/assets/img/rooms/1.png', import.meta.url).href

onMounted(() => {
  console.log('AboutUsPage mounted!');
});
</script>

<template>
  <Header />
  <div class="about-page-container container-fluid p-0">

    <section class="hero-section text-white text-center d-flex align-items-center justify-content-center"
      :style="{ backgroundImage: 'url(' + heroImage + ')' }">
      <div class="hero-overlay"></div>
      <div class="container position-relative z-1">
        <h1 class="display-3 fw-bold mb-3 animate__animated animate__fadeInDown">
          Discover Our Story
        </h1>
        <p class="lead mb-4 animate__animated animate__fadeInUp">
          At Montana, we create unforgettable lodging experiences.
        </p>
        <router-link to="/rooms" class="btn btn-primary btn-lg animate__animated animate__zoomIn">
          Booking room now <i class="bi bi-arrow-right-short"></i>
        </router-link>
      </div>
    </section>

    <section class="story-mission-section py-5 bg-light">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-lg-6 mb-4 mb-lg-0 animate__animated animate__fadeInLeft">
            <img :src="storyImage" alt="Câu chuyện của chúng tôi" class="img-fluid rounded shadow-lg">
          </div>
          <div class="col-lg-6 animate__animated animate__fadeInRight">
            <h2 class="display-5 fw-bold mb-4 text-primary">Our Mission </h2>
            <p class="lead">
              Montana was created with the mission of connecting travelers with the best hotels and
              destinations around the world. We believe that every trip is a journey of discovery, and finding the
              perfect place to stay is the key to unlocking unforgettable experiences.
            </p>
            <p>
              We are committed to providing a simple, reliable, and transparent online booking platform that makes it
              easy for everyone to search, compare, and book their ideal hotel — tailored to every need and budget.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="why-choose-us-section py-5">
      <div class="container">
        <h2 class="display-5 fw-bold text-center mb-5 text-secondary animate__animated animate__fadeInUp">
          Why Choose Montana?
        </h2>
        <div class="row text-center">
          <div class="col-md-4 mb-4 animate__animated animate__fadeInUp animate__delay-1s">
            <div class="feature-card p-4 rounded shadow-sm h-100">
              <i class="bi bi-globe-americas display-4 text-primary mb-3"></i>
              <h4 class="fw-bold mb-3">Global Reach</h4>
              <p>
                Access thousands of hotels, resorts, apartments, and villas worldwide. Unlimited choices from major
                hotel chains to unique boutique properties.
              </p>
            </div>
          </div>
          <div class="col-md-4 mb-4 animate__animated animate__fadeInUp animate__delay-2s">
            <div class="feature-card p-4 rounded shadow-sm h-100">
              <i class="bi bi-shield-check display-4 text-success mb-3"></i>
              <h4 class="fw-bold mb-3">Safe & Easy Booking</h4>
              <p>
                Secure online booking system, user-friendly interface, and fast, transparent payment process.
              </p>
            </div>
          </div>
          <div class="col-md-4 mb-4 animate__animated animate__fadeInUp animate__delay-3s">
            <div class="feature-card p-4 rounded shadow-sm h-100">
              <i class="bi bi-star-fill display-4 text-warning mb-3"></i>
              <h4 class="fw-bold mb-3">Best Prices & Exclusive Deals</h4>
              <p>
                We’re committed to offering the most competitive rates and exclusive promotions only available on
                Montana.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="cta-section py-5 bg-primary text-white text-center">
      <div class="container">
        <h2 class="display-5 fw-bold mb-4 animate__animated animate__fadeInDown">
          Start Your Journey Today!
        </h2>
        <p class="lead mb-4 animate__animated animate__fadeInUp">
          With Montana, every trip becomes easier and more memorable.
        </p>
        <router-link to="/rooms" class="btn btn-light btn-lg animate__animated animate__zoomIn">
          Explore Rooms Now <i class="bi bi-search"></i>
        </router-link>
      </div>
    </section>
  </div>
  <Footer />
</template>

<style scoped>
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");

.about-page-container {
  overflow-x: hidden;
}

.hero-section {
  min-height: 500px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 0;
}

.hero-section h1,
.hero-section p {
  position: relative;
  z-index: 1;
}

.hero-section .btn {
  border-radius: 50px;
  padding: 12px 30px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.hero-section .btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

section {
  padding: 80px 0;
}

.story-mission-section img {
  max-width: 100%;
  height: auto;
}

.feature-card {
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.feature-card i {
  color: var(--bs-primary);
}

.our-team-section .card {
  transition: transform 0.2s ease-in-out;
}

.our-team-section .card:hover {
  transform: translateY(-5px);
}

.our-team-section .card-img-top {
  border: 4px solid var(--bs-light);
}

.cta-section {
  background-color: var(--bs-primary);
}

.cta-section .btn {
  border-radius: 50px;
  padding: 12px 30px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.cta-section .btn:hover {
  background-color: var(--bs-secondary);
  color: var(--bs-white);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

:root {
  --bs-primary: #007bff;
  --bs-secondary: #6c757d;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .hero-section {
    min-height: 400px;
  }

  .hero-section h1 {
    font-size: 2.5rem;
  }

  .hero-section p {
    font-size: 1.1rem;
  }

  section {
    padding: 60px 0;
  }
}
</style>
