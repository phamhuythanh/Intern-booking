<template>
  <header class="hero" :style="{ backgroundImage: `url(${heroImage})` }">
    <div class="hero-content">
      <h1 class="animate__animated animate__fadeInLeft">{{ title }}</h1>
      <p class="animate__animated animate__fadeInRight">{{ description }}</p>
    </div>
  </header>
  <section class="section-about container mt-5">
    <div class="section-about-start">
      <a class="section-about-title blue">
        <router-link to="/about">About me</router-link>
      </a>
      <h3 class="section-about-heading black">
        A Luxuries Hotel with Nature
      </h3>
      <p class="section-about-text gray">
        Suscipit libero pretium nullam potenti. Interdum, blandit phasellus
        consectetuer dolor ornare dapibus enim ut tincidunt rhoncus tellus
        sollicitudin pede nam maecenas, dolor sem. Neque sollicitudin enim.
        Dapibus lorem feugiat facilisi faucibus et. Rhoncus.
      </p>
      <a href="#" class="text-decor-none gray active-under">Learn More</a>
    </div>
    <div class="section-about-end">
      <div class="about-item">
        <img class="item-img" src="@/modules/customer/assets/img/about/about_1.png" alt="about us" srcset="" />
      </div>
      <div class="about-item">
        <img class="item-img item-img-bot" src="@/modules/customer/assets/img/about/about_2.png" alt="about us"
          srcset="" />
      </div>
    </div>
  </section>
  <section class="section-ouroffer container">
    <div class="section-heading">
      <p class="section-ouroffer-title blue">Our Offers</p>
      <h3 class="section-ouroffer-heading">Ongoing Offers</h3>
    </div>
    <div class="section-ouroffer-offers container">
      <div class="row">
        <div v-for="offer in roomTypeOffers" :key="offer.id" class="col-12 col-xl-4 col-md-4 offer">
          <img class="offer-img" :src="offer.image" alt="our offer" />
          <div class="offer-info">
            <h3 class="offer-heading">
              {{ offer.name }}
            </h3>
            <ul class="offer-descriptions gray">
              <li class="offer-description" v-for="property in offer.properties" :key="property.property_id">{{
                property.name }}: {{ property.value }}</li>
            </ul>
            <a class="section-ouroffer-booking text-decor-none" href="#" @click.prevent="handleBookNow(offer.id)">
              Book Now
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="section-video mt-5">
    <video class="section-video-img" src="@/modules/customer/assets/video/monata.mp4" autoplay loop muted playsinline>
      Your browser does not support the video tag.
    </video>
  </section>
  <section class="container section-food mt-5">
    <div class="section-food-start">
      <div class="about-item">
        <img class="item-img" src="@/modules/customer/assets/img/about/1.png" alt="about us" srcset="" />
      </div>
      <div class="about-item">
        <img class="item-img item-img-bot" src="@/modules/customer/assets/img/about/2.png" alt="about us" srcset="" />
      </div>
    </div>
    <div class="section-food-end">
      <p class="section-food-title blue">Delicious Food</p>
      <h3 class="section-food-heading black">
        We Serve Fresh and Delicious Food
      </h3>
      <p class="section-food-text gray">
        Suscipit libero pretium nullam potenti. Interdum, blandit phasellus
        consectetuer dolor ornare dapibus enim ut tincidunt rhoncus tellus
        sollicitudin pede nam maecenas, dolor sem. Neque sollicitudin enim.
        Dapibus lorem feugiat facilisi faucibus et. Rhoncus.
      </p>
      <a href="#" class="gray active-under text-decor-none">Learn More</a>
    </div>
  </section>
  <section class="section-featured">
    <div class="section-featured-head">
      <p class="section-featured-title blue">Featured Rooms</p>
      <h3 class="section-featured-heading">Choose a Better Room</h3>
    </div>
    <div class="section-featured-offers">
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else-if="error" class="text-center py-5 text-danger">
        {{ error }}
      </div>
      <template v-else>
        <div class="row">
          <div v-for="roomType in roomTypeBetters" :key="roomType.id" class="col-12 col-md-6 single_rooms">
            <div class="room_thumb">
              <img :src="roomType.image" :alt="roomType.name">
              <div class="room_heading d-flex justify-content-between align-items-center">
                <div class="room_heading_inner">
                  <span>From {{ formatPrice(roomType.price) }}/night</span>
                  <h3>{{ roomType.name }}</h3>
                </div>
                <a href="#" class="line-button" @click.prevent="handleBookNow(roomType.id)">book now</a>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
  <section class="section-qa container mt-5">
    <div class="section-qa-box">
      <p class="section-qa-text black">For Reservation 0r Query?</p>
      <a class="section-qa-link text-decor-none" href="#">+10 576 377 4789</a>
    </div>
  </section>
  <section class="section-other mt-5">
    <img class="section-other-img" src="@/modules/customer/assets/img/instagram/1.png" alt="other" />
    <img class="section-other-img" src="@/modules/customer/assets/img/instagram/2.png" alt="other" />
    <img class="section-other-img" src="@/modules/customer/assets/img/instagram/3.png" alt="other" />
    <img class="section-other-img" src="@/modules/customer/assets/img/instagram/4.png" alt="other" />
    <img class="section-other-img" src="@/modules/customer/assets/img/instagram/5.png" alt="other" />
  </section>
  <CheckAvailable v-model="showCheckAvailable" :initial-room-type="selectedRoomType" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../lib/axios'
import CheckAvailable from '../forms/CheckAvailable.vue'

interface Property {
  property_id: number
  name: string
  value: string
}

interface RoomType {
  id: number
  name: string
  price: string
  properties: Property[]
  image: string
}

interface ApiResponse {
  roomTypeOffers: RoomType[]
  roomTypeBetters: RoomType[]
}

const roomTypeBetters = ref<RoomType[]>([])
const roomTypeOffers = ref<RoomType[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showCheckAvailable = ref(false)
const selectedRoomType = ref<number | null>(null)

const formatPrice = (price: string) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(parseFloat(price))
}

const fetchRoomTypes = async () => {
  try {
    isLoading.value = true
    error.value = null
    const response = await api.get<ApiResponse>('/user-home')
    roomTypeBetters.value = response.data.roomTypeBetters
    roomTypeOffers.value = response.data.roomTypeOffers
  } catch (err: any) {
    console.error('Error fetching room data:', err)
    error.value = 'Unable to load room data. Please try again later!'
  } finally {
    isLoading.value = false
  }
}

const handleBookNow = (roomTypeId: number) => {
  selectedRoomType.value = roomTypeId
  showCheckAvailable.value = true
}

onMounted(() => {
  fetchRoomTypes()
})

const props = defineProps({
  bgClass: {
    type: String,
    default: '1'
  },
  title: {
    type: String,
    default: 'Montana Resort'
  },
  description: {
    type: String,
    default: 'Unlock to enjoy the view of Martine'
  }
})
const heroImage = new URL('@/modules/customer/assets/img/slide/slide1.png', import.meta.url).href

</script>

<style scoped>
.spinner-border {
  width: 3rem;
  height: 3rem;
}

.room-properties {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
  font-size: 14px;
  color: #fff;
}

.room-properties li {
  margin-bottom: 5px;
  position: relative;
  z-index: 8;
}

.room-properties li:last-child {
  margin-bottom: 0;
}

.hero {
  background-size: cover;
  background-position: center;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
}

.hero-content {
  z-index: 5;
}

.hero-content h1 {
  font-size: 3.5rem;
  margin-bottom: 15px;
}

.hero-content p {
  font-size: 1.5rem;
}

.offer-img {
  width: 100%;
  height: 300px;
}

@media (min-width: 768px) and (max-width: 1200px) {
  .hero-content h1 {
    font-size: 2.5rem;
  }

  .hero-content p {
    font-size: 1.25rem;
  }

  .offer-img {
    height: 200px;
  }
}

@media (max-width: 767px) {
  .hero-content h1 {
    font-size: 2rem;
  }

  .hero-content p {
    font-size: 1rem;
  }
}

/* Các kiểu dáng khác */
.nav-booking {
  cursor: pointer;
}

.section-ouroffer-booking,
.line-button {
  cursor: pointer;
}

.section-ouroffer-booking:hover,
.line-button:hover {
  opacity: 0.8;
}

.section-ouroffer-booking,
.line-button {
  cursor: pointer;
}

.section-ouroffer-booking:hover,
.line-button:hover {
  opacity: 0.8;
}

.room_thumb {
  width: 110%;
}
</style>
