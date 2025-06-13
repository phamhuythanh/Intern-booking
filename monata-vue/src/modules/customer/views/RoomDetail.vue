<script setup lang="ts">
import Footer from '@/modules/customer/components/layouts/Footer.vue'
import Header from '@/modules/customer/components/layouts/Header.vue'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/modules/customer/lib/axios'
import CheckAvailable from '../components/forms/CheckAvailable.vue'

const route = useRoute()
const roomDetails = ref(null)
const currentLargeImage = ref(null)
const currentImageIndex = ref(0)
const isTransitioning = ref(false)
const showCheckAvailable = ref(false)
const selectedRoomType = ref<number | null>(null)
let intervalId = null

const bookingCardRef = ref(null)

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const fetchRoomDetails = async (roomId) => {
  isTransitioning.value = true
  try {
    const response = await api.get(`/rooms/${roomId}`)
    const fetchedData = response.data.data

    if (fetchedData) {
      let displayImages = []

      if (fetchedData.thumbnail_path) {
        displayImages.push({
          id: 'thumbnail_0',
          image_path: fetchedData.thumbnail_path
        })
      }

      if (fetchedData.images && fetchedData.images.length > 0) {
        fetchedData.images.forEach(img => {
          if (!fetchedData.thumbnail_path || img.image_path !== fetchedData.thumbnail_path) {
            displayImages.push(img)
          }
        })
      }

      roomDetails.value = {
        ...fetchedData,
        images: displayImages
      }

      if (roomDetails.value?.images?.length > 0) {
        currentLargeImage.value = roomDetails.value.images[0].image_path
        currentImageIndex.value = 0
        startImageSlider()
      } else {
        currentLargeImage.value = null
        stopImageSlider()
      }
    } else {
      roomDetails.value = null
      currentLargeImage.value = null
      stopImageSlider()
    }
  } catch (error) {
    console.error(`Error fetching details for room ${roomId}:`, error)
    roomDetails.value = null
    currentLargeImage.value = null
    stopImageSlider()
  } finally {
    isTransitioning.value = false
  }
}

const changeLargeImage = (imagePath) => {
  if (isTransitioning.value || currentLargeImage.value === imagePath) {
    return
  }

  isTransitioning.value = true
  const largeImageElement = document.querySelector('.room-large-image')

  if (largeImageElement) {
    largeImageElement.classList.add('fade-out')

    setTimeout(() => {
      currentLargeImage.value = imagePath
      currentImageIndex.value = roomDetails.value.images.findIndex((img) => img.image_path === imagePath)
      largeImageElement.classList.remove('fade-out')
      isTransitioning.value = false
    }, 300)
  } else {
    currentLargeImage.value = imagePath
    currentImageIndex.value = roomDetails.value.images.findIndex((img) => img.image_path === imagePath)
    isTransitioning.value = false
  }
}

const nextImage = () => {
  if (roomDetails.value?.images?.length > 1 && !isTransitioning.value) {
    isTransitioning.value = true
    const largeImageElement = document.querySelector('.room-large-image')
    if (largeImageElement) {
      largeImageElement.classList.add('fade-out')
      setTimeout(() => {
        currentImageIndex.value = (currentImageIndex.value + 1) % roomDetails.value.images.length
        currentLargeImage.value = roomDetails.value.images[currentImageIndex.value].image_path
        largeImageElement.classList.remove('fade-out')
        isTransitioning.value = false
      }, 300)
    } else {
      currentImageIndex.value = (currentImageIndex.value + 1) % roomDetails.value.images.length
      currentLargeImage.value = roomDetails.value.images[currentImageIndex.value].image_path
      isTransitioning.value = false
    }
  }
}

const startImageSlider = () => {
  if (roomDetails.value?.images?.length > 1 && !intervalId) {
    intervalId = setInterval(nextImage, 5000)
  }
}

const stopImageSlider = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const showFloatingBookButton = ref(false)
const handleScroll = () => {
  const scrollPosition = window.scrollY || document.documentElement.scrollTop
  const isDesktop = window.innerWidth >= 992;
  showFloatingBookButton.value = scrollPosition > 300 && !isDesktop;
}

const scrollToBookingCard = () => {
  if (bookingCardRef.value) {
    bookingCardRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

const handleBookNow = (roomTypeId: number) => {
  selectedRoomType.value = roomTypeId
  showCheckAvailable.value = true
}

onMounted(async () => {
  const roomId = route.params.id
  if (roomId) {
    await fetchRoomDetails(roomId)
  }
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  stopImageSlider()
  window.removeEventListener('scroll', handleScroll)
})


</script>

<template>
  <Header />
  <div class="hero"></div>
  <main class="container mt-5 mb-5">
    <div v-if="isTransitioning" class="d-flex justify-content-center align-items-center w-100"
      style="min-height: 500px;">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden"></span>
      </div>
    </div>
    <div v-if="roomDetails">
      <div class="row">
        <div class="col-lg-8">
          <!-- Image Gallery -->
          <div v-if="roomDetails.images && roomDetails.images.length > 0" class="room-images-container mb-4">
            <img :src="currentLargeImage" :alt="roomDetails.name"
              class="room-large-image img-fluid rounded shadow-sm mb-2">
            <div class="room-thumbnails">
              <img v-for="(image, index) in roomDetails.images" :key="image.id" :src="image.image_path"
                :alt="'Thumbnail ' + (index + 1)" class="room-thumbnail-item img-thumbnail rounded shadow-sm"
                @click="changeLargeImage(image.image_path)"
                :class="{ 'active-thumbnail': currentLargeImage === image.image_path }">
            </div>
          </div>
          <img v-else-if="roomDetails.thumbnail_path" :src="roomDetails.thumbnail_path" :alt="roomDetails.name"
            class="img-fluid mb-3 rounded shadow-sm room-single-thumbnail">

          <div class="mt-4 room-description">
            <p v-html="roomDetails.description"></p>
          </div>
        </div>
        <div class="col-lg-4 room-details-sidebar">
          <div class="p-4 border rounded shadow-sm bg-white sticky-booking-card" ref="bookingCardRef">
            <div class="mb-3">
              <h3 class="mb-1 text-dark">{{ roomDetails.name }}</h3>
              <span class="text-muted small">Room type: {{ roomDetails.room_type }}</span>
            </div>

            <h4 class="mb-4 text-primary">
              <strong>{{ formatCurrency(roomDetails.price) }}</strong> <span
                class="fw-normal fs-6 text-dark-emphasis">/half day</span>
            </h4>

            <ul class="list-group list-group-flush border-top border-bottom mb-4">
              <li v-for="prop in roomDetails.properties" :key="prop.property_id"
                class="list-group-item d-flex justify-content-between align-items-center py-2 px-0 bg-transparent">
                <span class="text-dark">{{ prop.name }}</span>
                <span>{{ prop.value }}</span>
              </li>
            </ul>
            <div class="d-grid gap-2">
              <button class="btn btn-primary btn-lg rounded-pill"
                @click.prevent="handleBookNow(roomDetails.room_type_id)">Book Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <transition name="fade-slide-up">
    <button v-if="showFloatingBookButton && roomDetails" @click="scrollToBookingCard"
      class="btn btn-primary btn-lg rounded-pill floating-book-button d-lg-none">
      Book Now
    </button>
  </transition>

  <CheckAvailable v-model="showCheckAvailable" :initial-room-type="selectedRoomType" />

  <Footer />
</template>

<style scoped>
.hero-overlay {
  height: 150px;
  background-color: black;
}

/* Ensure HTML and Body are not restricting scroll */
html,
body {
  height: 100%;
  /* Ensure html and body take full height */
  overflow-x: hidden;
  /* Prevent horizontal scroll issues */
}

/* Ensure the main content area has enough height for scrolling */
.main-content-area {
  min-height: 120vh;
  /* Adjust this as needed, ensures enough scrollable content */
}

/* Optional: Ensure immediate parent of sticky element does not have overflow: hidden */
.room-detail-wrapper,
.row {
  overflow: visible;
  /* Ensure these do not restrict sticky behavior */
}

.room-images-container {
  margin-bottom: 1rem;
}

.room-large-image {
  width: 100%;
  height: 600px;
  /* Adjust height as needed */
  object-fit: cover;
  opacity: 1;
  transform: scale(1);
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.room-large-image.fade-out {
  opacity: 0;
  transform: scale(0.95);
}

.room-thumbnails {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: start;
  /* Center thumbnails */
}

.room-thumbnail-item {
  width: 100px;
  /* Adjust size as needed */
  height: 75px;
  /* Adjust size as needed */
  object-fit: cover;
  cursor: pointer;
  border: 2px solid #dee2e6;
  padding: 0.25rem;
  background-color: #fff;
  max-width: 100%;
  transition: opacity 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

.room-thumbnail-item:hover {
  opacity: 0.8;
  border-color: #007bff;
}

.active-thumbnail {
  border-color: #007bff !important;
  opacity: 0.9;
}

.room-single-thumbnail {
  max-height: 500px;
  width: 100%;
  object-fit: cover;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .room-large-image {
    height: 250px;
  }

  .room-thumbnail-item {
    width: 80px;
    height: 60px;
  }
}

/* Styles for sticky sidebar and UI enhancements */
.sticky-booking-card {
  position: -webkit-sticky;
  /* For Safari */
  position: sticky;
  top: 20px;
  /* Adjust this value based on fixed header height + desired margin */
  max-height: calc(100vh - 40px);
  /* Ensures it fits viewport, leaving 20px top and bottom margin */
  overflow-y: auto;
  /* Adds scrollbar if content is taller than max-height */
  z-index: 10;
  /* Ensure it stays on top if there are other elements */
}

/* Disable sticky behavior on smaller screens where columns stack */
@media (max-width: 991.98px) {

  /* Bootstrap's 'lg' breakpoint (tablet and down) */
  .sticky-booking-card {
    position: static;
    top: auto;
    max-height: none;
    overflow-y: visible;
  }
}

.room-details-sidebar .text-muted.small {
  /* Styling for "Room type" */
  display: block;
  /* Ensures it takes its own line if needed */
  margin-top: 0.15rem;
}

.room-details-sidebar .list-group-item span.text-dark {
  /* Styling for property names */
  font-weight: 500;
  /* Slightly bolder for better readability */
}

.room-description {
  margin-top: 2rem;
}

/* Fix for images inside v-html content */
.room-description :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1rem auto;
  border-radius: 0.375rem;
  /* Bootstrap's .rounded */
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  /* Subtle shadow */
}

/* Floating Book Now Button Styles */
.floating-book-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.hero {
  background-color: black;
  height: 150px;
}

/* Transition for Floating Button */
.fade-slide-up-enter-active,
.fade-slide-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-up-enter-from,
.fade-slide-up-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
