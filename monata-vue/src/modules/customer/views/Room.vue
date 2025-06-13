<script setup>
import Header from '@/modules/customer/components/layouts/Header.vue';
import Footer from '@/modules/customer/components/layouts/Footer.vue';
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/modules/customer/lib/axios';
import { CircleArrowLeft, CircleArrowRight, Trash2 } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const rooms = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Pagination state variables
const currentPage = ref(parseInt(route.query.page) || 1);
const perPage = ref(6);
const totalRooms = ref(0);
const totalPages = ref(0);

const fetchRooms = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const { checkin_at, checkout_at, roomType } = route.query;

    const params = {
      page: currentPage.value,
      per_page: perPage.value,
    };
    if (checkin_at) params.checkin_at = checkin_at;
    if (checkout_at) params.checkout_at = checkout_at;
    if (roomType) params.room_type_id = roomType;

    const response = await api.get('/rooms', { params });
    rooms.value = response.data.data;
    totalRooms.value = response.data.meta.total;
    totalPages.value = response.data.meta.last_page;

  } catch (err) {
    console.error('Error fetching rooms:', err);
    error.value = 'Unable to load rooms. Please try again later!';
    rooms.value = [];
    totalRooms.value = 0;
    totalPages.value = 0;
  } finally {
    isLoading.value = false;
  }
};

// Function to change the current page
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    router.push({ query: { ...route.query, page: page } });
  }
};

watch(
  () => route.query,
  () => {
    currentPage.value = parseInt(route.query.page) || 1;
    fetchRooms();
  },
  { immediate: true }
);

</script>

<template>
  <div class="bg-dark">
    <Header />
  </div>
  <div class="hero bg-black"> </div>
  <main>
    <div class="container my-3 mt-5">
      <div v-if="isLoading" class="d-flex justify-content-center align-items-center w-100" style="min-height: 500px;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p>Loading...</p>
      </div>
      <div class="row">
        <div v-for="room in rooms" @click="$router.push({ name: 'roomDetail', params: { id: room.id } })"
          class="col-md-4 mb-5">
          <div class="p-0">
            <img :src="room.thumbnail_path" alt="" class="rom-thumbnail">
            <div class="p-1">
              <p class="mb-1 text-truncate">Room {{ room.name }} - {{ room.room_type }} </p>
              <ul class="list mb-0">
                <li v-for="property in room.properties" class="mb-1">{{ property.value }} {{ property.name }}</li>
              </ul>
            </div>
            <button class="btn btn-primary w-100">Book Now</button>
          </div>
        </div>
      </div>
      <!-- Pagination controls -->
      <nav v-if="totalPages > 1" aria-label="Page navigation">
        <ul class="pagination justify-content-center">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">
              <CircleArrowLeft />
            </a>
          </li>
          <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
            <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">
              <CircleArrowRight />
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </main>
  <Footer />
</template>

<style scoped>
.hero {
  height: 150px;
}

main {
  min-height: 1000px;
}

.rom-thumbnail {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.border-none {
  border: none;
}

.pagination .page-item .page-link {
  border-radius: 50%;
  margin: 0 5px;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  line-height: 1;
}

.pagination .page-item.disabled .page-link {
  pointer-events: none;
}

#printable-invoice-area,
#printable-invoice-area * {
  visibility: visible;
}

#printable-invoice-area {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
}

.pagination .page-item:first-child .page-link,
.pagination .page-item:last-child .page-link {
  font-size: 6em;
  font-weight: bold;
  text-indent: 0;
  overflow: visible;
  position: static;
}

.pagination .page-item .page-link svg {
  width: 100%;
  height: 100%;
}
</style>
