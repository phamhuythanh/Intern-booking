<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, nextTick, computed, watch } from 'vue'
import { Modal } from 'bootstrap'
import { api } from '@/modules/admin/lib/axios'
import { useToast } from 'vue-toastification'
import CreateRoomModal from '@/modules/admin/components/modals/room/CreateForm.vue'
import EditRoomModal from '@/modules/admin/components/modals/room/EditForm.vue'
import Pagination from '@/modules/admin/components/layouts/Pagination.vue'
import { useAuthStore } from '@/stores/auth'
import { USER_ROLES } from '@/modules/admin/constants';

const authStore = useAuthStore()
const records = ref([])
const roomDetails = ref<any | null>(null)
const currentLargeImage = ref<string | null>(null)
const currentImageIndex = ref(0)
const isTransitioning = ref(true)
const roomDetailsModalInstance = ref<Modal | null>(null)
const createRoomModal = ref(null)
const editRoomModal = ref(null)
const roomToEdit = ref<any | null>(null)
const rooms = ref([])
const roomTypes = ref<any[]>([])
let intervalId: NodeJS.Timeout | null = null

const toast = useToast();

const currentPage = ref(1)
const meta = ref<any | null>(null)

const searchTerm = reactive({
  name: '',
  room_type_id: '',
  status: ''
})

const fetchRooms = async () => {
  try {
    const response = await api.get('/rooms', {
      params: {
        page: currentPage.value
      }
    })
    records.value = response.data.data
    meta.value = response.data.meta
  } catch (error) {
    console.error('Error fetching rooms:', error)
    records.value = []
    meta.value = null
  } finally {
    isTransitioning.value = false
  }
}

const fetchRoomTypes = async () => {
  try {
    const response = await api.get('/room-types')
    roomTypes.value = response.data.data
  } catch (error) {
    console.error('Error fetching room types:', error)
    roomTypes.value = []
  }
}

const fetchRoomDetails = async (roomId: number) => {
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
  }
}

const searchRooms = async () => {
  try {
    const response = await api.get('/rooms', {
      params: {
        ...searchTerm,
      }
    })
    records.value = response.data.data
    meta.value = response.data.meta
  } catch (error) {
    console.error('Error searching rooms:', error)
    records.value = []
    meta.value = null
  }
}

const openRoomDetailsModal = async (room: any) => {
  roomDetails.value = null
  await fetchRoomDetails(room.id)
  if (roomDetails.value) {
    if (roomDetailsModalInstance.value) {
      roomDetailsModalInstance.value.show()
    }
  }
}

const performCloseRoomDetailsModalCleanup = () => {
  roomDetails.value = null
  currentLargeImage.value = null
  currentImageIndex.value = 0
  stopImageSlider()
  isTransitioning.value = false
}

const closeRoomDetailsModal = () => {
  if (roomDetailsModalInstance.value) {
    roomDetailsModalInstance.value.hide()
  } else {
    performCloseRoomDetailsModalCleanup()
  }
}

const openEditRoomModal = async (roomData: any) => {
  const roomToEditData = {
    ...roomData,
    thumbnail: roomData.thumbnail_path,
    existing_images: roomData.images ? [...roomData.images] : [],
    room_type: roomData.room_type_id
  }

  roomToEdit.value = roomToEditData
  closeRoomDetailsModal()
  await nextTick()

  const modalElement = document.getElementById('editRoomModal')

  if (modalElement) {
    if (!editRoomModal.value) {
      editRoomModal.value = new Modal(modalElement)
    }

    editRoomModal.value.show()
  } else {
    console.error("Edit modal element ('editRoomModal') not found after nextTick.")
  }
}

const handleRoomUpdated = (updatedRoomData: any) => {
  const index = records.value.findIndex(r => r.id === updatedRoomData.id)

  if (index !== -1) {
    records.value[index] = { ...records.value[index], ...updatedRoomData }
  }

  fetchRooms()

  if (editRoomModal.value) {
    editRoomModal.value.hide()
  }
}

const changeLargeImage = (imagePath: string) => {
  if (isTransitioning.value || currentLargeImage.value === imagePath) {
    return
  }

  isTransitioning.value = true
  const largeImageElement = document.querySelector('.room-large-image')

  if (largeImageElement) {
    largeImageElement.classList.add('fade-out')

    setTimeout(() => {
      currentLargeImage.value = imagePath
      currentImageIndex.value = roomDetails.value.images.findIndex((img: any) => img.image_path === imagePath)
      largeImageElement.classList.remove('fade-out')
      isTransitioning.value = false
    }, 300)
  } else {
    currentLargeImage.value = imagePath
    currentImageIndex.value = roomDetails.value.images.findIndex((img: any) => img.image_path === imagePath)
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

const openCreateRoomModal = () => {
  if (!createRoomModal.value) {
    createRoomModal.value = new Modal(document.getElementById('createRoomModal'))
  }
  createRoomModal.value.show()
}

const handleRoomCreated = (newRoomData: any) => {
  console.log('Phòng mới đã được tạo ở component cha:', newRoomData)
  rooms.value.push(newRoomData)
  fetchRooms()
}

const deleteRoom = async (roomId: number) => {
  if (!confirm('Are you sure you want to delete this room?')) {
    return; // User cancelled
  }

  try {
    await api.delete(`/rooms/${roomId}`);
    toast.success('Room deleted successfully!');
    fetchRooms(); // Reload room list after deletion
    closeRoomDetailsModal(); // Close the details modal if open
  } catch (error) {
    const message = error?.response?.data?.message || 'Something went wrong.';
    toast.error(message);
  }
};

const displayedRoomTypeName = computed(() => {
  if (roomDetails.value && roomDetails.value.room_type_id && roomTypes.value.length > 0) {
    const foundType = roomTypes.value.find(rt => rt.id === roomDetails.value.room_type_id)
    return foundType ? foundType.name : roomDetails.value.room_type_id
  }
  return roomDetails.value?.room_type_id || ''
})

const resetFilter = () => {
  searchTerm.name = ''
  searchTerm.room_type_id = ''
  searchTerm.status = ''
}

watch(currentPage, () => {
  if (Object.values(searchTerm).some(val => val !== '')) {
    searchRooms()
  } else {
    fetchRooms()
  }
})

watch(searchTerm, () => {
  currentPage.value = 1
  searchRooms()
}, { deep: true })

onMounted(() => {
  fetchRooms()
  fetchRoomTypes()
  const createModalElement = document.getElementById('createRoomModal')
  if (createModalElement) {
    createRoomModal.value = new Modal(createModalElement)
  }

  const roomDetailsModalElement = document.getElementById('roomDetailsModal')
  if (roomDetailsModalElement) {
    roomDetailsModalInstance.value = new Modal(roomDetailsModalElement)
    roomDetailsModalElement.addEventListener('hidden.bs.modal', () => {
      performCloseRoomDetailsModalCleanup()
    })
  }
})

onUnmounted(() => {
  stopImageSlider()
  if (createRoomModal.value && typeof createRoomModal.value.dispose === 'function') {
    createRoomModal.value.dispose()
  }
  if (editRoomModal.value && typeof editRoomModal.value.dispose === 'function') {
    editRoomModal.value.dispose()
  }
  if (roomDetailsModalInstance.value && typeof roomDetailsModalInstance.value.dispose === 'function') {
    roomDetailsModalInstance.value.dispose()
  }
})
</script>

<template>
  <div>
    <div>
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">Manage Rooms</h6>
        </div>
        <div class="card-body">
          <div class="mb-3 d-flex justify-content-between flex-column flex-md-row">
            <button v-if="authStore.user.role === USER_ROLES.SUPERADMIN" class=" btn btn-primary text-truncate"
              @click="openCreateRoomModal">New Room</button>
            <form @submit.prevent="searchRooms"
              class="d-md-inline-block form-inline ml-md-3 my-2 my-md-0 mw-100  navbar-search">
              <div class="input-group d-flex">
                <div class="input-group-prepend">
                  <button class="btn btn-primary" type="submit">
                    <i class="fa-solid fa-filter"></i>
                  </button>
                </div>
                <select v-model="searchTerm.room_type_id" class="form-select">
                  <option value="">--All type--</option>
                  <option v-for="type in roomTypes" :key="type.id" :value="type.id">{{ type.name }}
                  </option>
                </select>
                <select class="form-select" id="status" v-model="searchTerm.status">
                  <option value="">--All status--</option>
                  <option value="1">Active</option>
                  <option value="2">Inactive</option>
                </select>
                <input v-model="searchTerm.name" type="text" class="form-control" placeholder="Name..."
                  aria-label="Search" aria-describedby="basic-addon2">
                <button class="btn btn-outline-secondary" type="button" @click="resetFilter">
                  <i class="fa-solid fa-rotate-left"></i>
                </button>
              </div>
            </form>
          </div>

          <create-room-modal modalId="createRoomModal" modalTitle="New Room" @room-created="handleRoomCreated" />
          <edit-room-modal v-if="roomToEdit" :modalId="'editRoomModal'" :modalTitle="'Edit Room'"
            :initialRoomData="roomToEdit" @room-updated="handleRoomUpdated" :roomTypesApiUrl="'/room-types'" />
          <div v-if="isTransitioning" class="d-flex justify-content-center align-items-center w-100"
            style="min-height: 500px;">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden"></span>
            </div>
          </div>
          <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
            <div v-for="room in records" :key="room.id" class="col mb-4 room-card" @click="openRoomDetailsModal(room)">
              <div class="card shadow-sm">
                <div class="row g-0 flex-column flex-md-row">
                  <div class="col-md-7">
                    <img :src="room.thumbnail_path" :alt="room.name"
                      class="img-fluid rounded-start rounded-2 shadow-sm room-thumbnail"
                      style="object-fit: cover; height: 150px;">
                  </div>
                  <div class="col-md-5 p-0">
                    <div class="card-body pl-3">
                      <h5 class="card-title">{{ room.name }}</h5>
                      <p class="card-text text-truncate">{{ room.room_type }}</p>
                      <p class="card-text">
                        <span :class="{
                          'status-label badge bg-success text-white': room.status === 1,
                          'badge bg-secondary text-white': room.status === 2
                        }">
                          {{ room.status === 1 ? 'Active' : 'Inactive' }}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Pagination v-if="meta" v-model:currentPage="currentPage" :meta="meta" />

          <div class="modal fade " id="roomDetailsModal" tabindex="-1" aria-labelledby="roomDetailsModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-xl-custom modal-dialog-scrollable">
              <div class="modal-content shadow">
                <div class="modal-header justify-content-center align-items-center">
                  <h5 class="modal-title" id="roomDetailsModalLabel" v-if="roomDetails">
                    Room {{ roomDetails.name }} - {{ displayedRoomTypeName }}
                    <span
                      :class="{ 'badge bg-success text-white': roomDetails.status === 1, 'badge bg-secondary text-white': roomDetails.status !== 1 }">
                      {{ roomDetails.status === 1 ? 'Active' : 'Inactive' }}
                    </span>
                  </h5>
                </div>
                <div class="modal-body modal-body-scrollable" v-if="roomDetails">
                  <div v-if="roomDetails.images && roomDetails.images.length > 0" class="room-images-container">
                    <img :src="currentLargeImage" :alt="roomDetails.name"
                      class="room-large-image img-fluid rounded-2 shadow-sm mb-2">
                    <div class="room-thumbnails">
                      <img v-for="(image, index) in roomDetails.images" :key="image.id" :src="image.image_path"
                        :alt="'Thumbnail ' + (index + 1)" class="room-thumbnail-item img-thumbnail rounded-2 shadow-sm"
                        @click="changeLargeImage(image.image_path)"
                        :class="{ 'active-thumbnail': currentLargeImage === image.image_path }">
                    </div>
                  </div>
                  <img v-else-if="roomDetails.thumbnail_path" :src="roomDetails.thumbnail_path" :alt="roomDetails.name"
                    class="img-fluid mb-3 rounded-2 shadow-sm room-single-thumbnail">
                  <h4>Description</h4>
                  <div v-html="roomDetails.description" class="room-description"></div>
                </div>
                <div class="modal-footer justify-content-between">
                  <div>
                    <button v-if="authStore.user.role === USER_ROLES.SUPERADMIN" type="button" class="btn btn-danger"
                      @click="deleteRoom(roomDetails.id)">Delete</button>
                  </div>
                  <div>
                    <button v-if="authStore.user.role === USER_ROLES.SUPERADMIN" type="button"
                      class="btn btn-primary me-3" @click="openEditRoomModal(roomDetails)">Edit</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
                      @click="closeRoomDetailsModal">Close</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-card {
  cursor: pointer;
}

.room-description {
  margin-top: 2rem;
}

.room-description :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1rem auto;
  border-radius: 0.375rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.room-thumbnail {
  object-fit: contain;
  height: 100%;
  width: 100%;
}

.modal-xl-custom {
  max-width: 1200px;
  width: 100%;
}

.room-images-container {
  margin-bottom: 1rem;
}

.room-large-image {
  width: 100%;
  height: 600px;
  object-fit: cover;
  opacity: 1;
  transform: scale(1);
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.badge {
  padding: 0.5em 0.75em;
  border-radius: 0.25rem;
}

.status-label.bg-success {
  background-color: #198754 !important;
  color: white;
}

.badge.bg-primary {
  background-color: #0d6efd !important;
  color: white;
}

.badge.bg-warning {
  background-color: #ffc107 !important;
  color: black;
}

.badge.bg-info {
  background-color: #0dcaf0 !important;
  color: white;
}

.badge.bg-secondary {
  background-color: #6c757d !important;
  color: white;
}

.room-large-image.fade-out {
  opacity: 0;
  transform: scale(0.95);
}

.room-thumbnails {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.room-thumbnail-item {
  width: 160px;
  height: 90px;
  object-fit: cover;
  cursor: pointer;
  border: 1px solid #dee2e6;
  padding: 0.25rem;
  background-color: #fff;
  max-width: 100%;
  transition: opacity 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

.room-thumbnail-item:hover {
  opacity: 0.8;
  border-color: #007bff;
}

a .active-thumbnail {
  border-color: #007bff !important;
  opacity: 0.9;
}

.room-single-thumbnail {
  max-height: 500px;
  width: 100%;
  object-fit: cover;
}

.modal-body-scrollable {
  max-height: calc(100vh - 200px);
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.modal-body-scrollable::-webkit-scrollbar {
  display: none;
}
</style>
