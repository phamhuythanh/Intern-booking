<script setup lang="ts">
import { computed } from 'vue'

interface Room {
    id: number
    name: string
    room_type: string
    price: string
    thumbnail_path: string
}

interface FormData {
  checkin_at: string
  checkout_at: string
}

const formatDisplayDateTime = (dateTimeStr: string): string => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const formatPrice = (price: string) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(parseFloat(price))
}

const props = defineProps<{
  modelValue: boolean
  selectedRooms: Room[]
  formData: FormData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm-booking'): void
}>()

const isModalOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const totalAmount = computed(() => {
  const checkinDate = new Date(props.formData.checkin_at);
  const checkoutDate = new Date(props.formData.checkout_at);

  // Calculate the difference in milliseconds
  const timeDiff = checkoutDate.getTime() - checkinDate.getTime();

  // Convert milliseconds to hours
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  // Calculate 12-hour periods, rounded up
  const twelveHourPeriods = Math.ceil(hoursDiff / 12);

  // Calculate sum of room prices
  const totalRoomPrice = props.selectedRooms.reduce((sum, room) => sum + parseFloat(room.price), 0);

  // Total amount = rounded up 12-hour periods * total room price
  return twelveHourPeriods * totalRoomPrice;
});

const confirmBooking = () => {
  emit('confirm-booking');
};

const closeModal = () => {
  isModalOpen.value = false;
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content card text-dark">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h4 class="mb-0">Confirm booking</h4>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="card-body">
            <h5>Booking information</h5>
            <p><strong>Check-in:</strong> {{ formatDisplayDateTime(formData.checkin_at) }}</p>
            <p><strong>Check-out:</strong> {{ formatDisplayDateTime(formData.checkout_at) }}</p>
            
            <h6 class="mt-4 mb-3">You have selected {{selectedRooms.length}} rooms:</h6>
            <ul class="list-group mb-4">
              <li class="list-group-item d-flex justify-content-between align-items-center"
                  v-for="room in selectedRooms" :key="room.id">
                Room {{ room.name }} ({{ room.room_type }}) - {{ formatPrice(room.price) }}
              </li>
            </ul>

            <h5 class="text-end"><strong>Total payment:</strong> {{ formatPrice(totalAmount.toString()) }}</h5>

            <p class="text-muted small mt-4">Please review the information carefully before confirming.</p>

            <div class="d-grid gap-2 mt-4">
              <button type="button" class="btn btn-primary" @click="confirmBooking">Confirm Booking</button>
              <button type="button" class="btn btn-outline-secondary" @click="closeModal">Cancle</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  width: 100%;
  max-width: 500px; /* Adjust max-width as needed */
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-content.card {
  padding: 0;
}

.modal-content .card-header {
  padding: 1rem 1.5rem;
}

.modal-content .card-body {
  padding: 1.5rem;
}

/* Modal transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.list-group-item {
  font-size: 0.95rem;
}
</style> 