<script setup lang="ts">
// ... các import và props, store, hàm như bạn đã có
import { computed } from 'vue'; // Import computed
import { useAuthStore } from '@/stores/auth';
import { api } from '@/modules/customer/lib/axios'
import { ref, onMounted, onUnmounted } from 'vue'
import CheckAvailable from '../forms/CheckAvailable.vue'
import LoginModal from '@/modules/customer/components/auth/LoginModal.vue'
import RegisterModal from '@/modules/customer/components/auth/RegisterModal.vue'
import { useToast } from 'vue-toastification'
import { useRoute, useRouter } from 'vue-router'
import { ShoppingBasket } from 'lucide-vue-next'
import 'animate.css';

const route = useRoute()
const router = useRouter()
const toast = useToast()
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

const authStore = useAuthStore()
const showModal = ref(false)
const showLoginModal = ref(false)
const showRegisterModal = ref(false)

const openModal = () => {
  showModal.value = true
}

const openLoginModal = () => {
  showRegisterModal.value = false
  showLoginModal.value = true
}

const openRegisterModal = () => {
  showLoginModal.value = false
  showRegisterModal.value = true
}

async function logout() {
  try {
    await api.post(`/logout`)
    toast.success("You had logout!")
    authStore.clearUser()
    router.push('/')
  } catch (error: any) {
    console.error('Logout failed:', error.message)
    alert('Logout failed!')
  }
}
const heroImage = new URL('@/modules/customer/assets/img/slide/slide1.png', import.meta.url).href

const isMenuActive = ref(false)

const toggleMenu = () => {
  isMenuActive.value = !isMenuActive.value
}

const closeMenu = (event: MouseEvent) => {
  const menuToggle = document.querySelector('.menu-toggle')
  const menuMobile = document.querySelector('.menu-mobile')
  
  if (menuToggle && menuMobile) {
    // Kiểm tra xem click có phải từ menu-toggle hoặc menu-mobile không
    const isClickInside = menuToggle.contains(event.target as Node) || 
                         menuMobile.contains(event.target as Node)
    
    if (!isClickInside && isMenuActive.value) {
      isMenuActive.value = false
    }
  }
}

// Thêm event listener khi component được mount
onMounted(() => {
  document.addEventListener('click', closeMenu)
})

// Cleanup event listener khi component unmount
onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

</script>

<template>
  <nav class="main-navbar navbar-absolute">
    <div class="container-fluid">
      
      <div class="row align-items-center">
        <div class="col-lg-5 d-none d-lg-flex justify-content-center"
        :class="route.name === 'home' ? 'animate__animated animate__fadeInLeft' : ''">
          <ul class="navbar-nav d-flex flex-row">
            <li class="nav-item mx-2">
              <a class="nav-link" :class="{ 'active': route.name === 'home' }">
                <router-link to="/" class="text-light">Home</router-link>
              </a>
            </li>
            <li class="nav-item mx-2" :class="{ 'active-under': route.name === 'rooms' }">
              <a class="nav-link">
                <router-link to="/rooms" class="text-light">Rooms</router-link>
              </a>
            </li>
            <li class="nav-item mx-2" :class="{ 'active-under': route.name === 'about' }">
              <a class="nav-link">
                <router-link to="/about" class="text-light">About</router-link>
              </a>
            </li>
            <li class="nav-item mx-2" :class="{ 'active-under': route.name === 'contact' }">
              <a class="nav-link">
                <router-link to="/contact" class="text-light">Contact</router-link>
              </a>
            </li>
          </ul>
        </div>

        <div class="col-2 col-lg-2  text-center"
        :class="route.name === 'home' ? 'animate__animated animate__fadeInDown' : ''">
          <img src="@/modules/customer/assets/img/logo.png" alt="motana logo" class="img-fluid" />
        </div>
        <div class="col-lg-5 d-none d-lg-flex justify-content-center align-items-center "
        :class="route.name === 'home' ? 'animate__animated animate__fadeInRight' : ''">
          <div>
            <span v-if="authStore.type === 'user'">
              <router-link to="/profile" class="text-light">{{ authStore.user.name }}</router-link>
              <span> | </span>
              <a href="#" @click.prevent="logout()" class="text-light">logout</a>
            </span>
            <a v-else href="#" @click.prevent="openLoginModal" class="nav-item text-decoration-none text-light">
              Login to your account
            </a>
            <button class="nav-booking btn btn-primary ms-3" @click="openModal">
              Book A Room
            </button>
          </div>
        </div>
        <div class="menu-mobile" :class="{ 'active': isMenuActive }">
          <ul id="nav-mobile-menu">
            <li class="nav-mobile-home">
              <div class="menu-close" @click="toggleMenu"><i class="fa-solid fa-xmark"></i></div>
              <router-link to="/" @click="toggleMenu">Home</router-link>
            </li>
            <li class="nav-mobile">
              <router-link to="/rooms" @click="toggleMenu">Rooms</router-link>
            </li>
            <li class="nav-mobile">
              <router-link to="/about" @click="toggleMenu">About</router-link>
            </li>
            <li class="nav-mobile">
              <router-link to="/contact" @click="toggleMenu">Contact</router-link>
            </li>
            <span v-if="authStore.type === 'user'">
              <li class="nav-mobile">
                <router-link to="/profile" class="text-light">{{ authStore.user.name }} </router-link>
              </li>
              <li class="nav-mobile">
                <a href="#" @click.prevent="logout()" class="text-light">Logout</a>
              </li>
            </span>
            <li class="nav-mobile" v-else>
              <a href="#" @click.prevent="openLoginModal" class="nav-item text-decoration-none text-light">
                Login to your account
              </a>
            </li>
          </ul>
        </div>
        <div class="col-8 d-flex d-lg-none justify-content-end" 
        :class="route.name === 'home' ? 'animate__animated animate__fadeInRight' : ''">
          <button class="nav-booking btn btn-primary ms-3" @click="openModal">
              Book A Room
            </button>
        </div>
        <div class="col-2 d-flex d-lg-none justify-content-end  menu-toggle"
        :class="route.name === 'home' ? 'animate__animated animate__fadeInRight' : ''" @click="toggleMenu"><i class="fa-solid fa-bars"></i></div>
      </div>
    </div>
  </nav>

  <CheckAvailable v-model="showModal" />
  <LoginModal v-model="showLoginModal" @switchToRegister="openRegisterModal" />
  <RegisterModal v-model="showRegisterModal" @switchToLogin="openLoginModal" />
</template>

<style scoped>
/* Navbar styles */
.main-navbar {
  width: 100%;
  z-index: 10;
  /* Đảm bảo navbar luôn ở trên cùng */
  padding-top: 20px;
  /* Khoảng cách từ trên cùng */
  color: white;
  /* Đảm bảo chữ trên navbar trắng */
  transition: background-color 0.3s ease;
  /* Hiệu ứng chuyển đổi màu nền */
}

.navbar-absolute {
  position: absolute;
  /* Áp dụng position: absolute chỉ khi ở trang chủ */
  top: 0;
  left: 0;
  background-color: transparent;
  /* Nền trong suốt khi ở trang chủ */
}

.container-fluid {
  overflow-x: hidden;
  overflow-y: hidden;
}

/* Kiểu dáng cho active-under */
.nav-item .nav-link .router-link-exact-active,
.nav-item .nav-link.active-under {
  position: relative;
}

.nav-item .nav-link .router-link-exact-active::after,
.nav-item .nav-link.active-under::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -5px;
  /* Điều chỉnh vị trí của gạch chân */
  width: 100%;
  height: 2px;
  background-color: white;
  /* Màu của gạch chân */
}

.nav-link .text-light {
  color: white !important;
  /* Đảm bảo màu chữ của router-link là trắng */
}

/* Hero styles (chỉ ảnh hưởng khi isHomePage là true) */
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

/* Các kiểu dáng khác */
.nav-booking {
  cursor: pointer;
}
</style>
