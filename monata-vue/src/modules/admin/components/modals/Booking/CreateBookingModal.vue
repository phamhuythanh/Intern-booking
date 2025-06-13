<script setup>
import { ref, watch } from 'vue';
import { api } from '@/modules/admin/lib/axios';
import moment from 'moment';
import { useToast } from 'vue-toastification';

import FlatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';

const toast = useToast();

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  initialCheckinDate: {
    type: String, // ISOString
    default: null
  }
});

const emit = defineEmits(['close', 'bookingCreated']);

const newBooking = ref({
  booker_id: null,
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  deposit: 0,
  note: '',
  booking_details: []
});

const availabilityCheck = ref({
  checkin_at: moment().startOf('day').format('YYYY-MM-DDTHH:mm'),
  checkout_at: moment().startOf('day').add(1, 'day').format('YYYY-MM-DDTHH:mm'),
});

const availableRoomsForSelection = ref([]);
const selectedAvailableRoomIds = ref([]);
const validationErrors = ref({});

const flatpickrConfig = {
  minDate: "today",
  enableTime: true,
  noCalendar: false,
  dateFormat: "Y-m-d H:i",
  time_24hr: true,
  defaultHour: 12,
  defaultMinute: 0,
  allowInput: true,
};


const formatCurrency = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-GB', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' VNĐ';
};

watch(() => props.show, async (newValue) => {
  if (newValue) {
    document.body.classList.add('modal-open-custom');
    resetForm();
    if (props.initialCheckinDate) {
      availabilityCheck.value.checkin_at = moment(props.initialCheckinDate).startOf('day').format('YYYY-MM-DDTHH:mm');
      availabilityCheck.value.checkout_at = moment(props.initialCheckinDate).add(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm');
    }
    // await checkRoomAvailability();
  } else {
    document.body.classList.remove('modal-open-custom');
  }
});

watch(() => availabilityCheck.value.checkin_at, () => {
  // selectedAvailableRoomIds.value = [];
  // newBooking.value.booking_details = [];
});
watch(() => availabilityCheck.value.checkout_at, () => {
  // selectedAvailableRoomIds.value = [];
  // newBooking.value.booking_details = [];
});

const resetForm = () => {
  newBooking.value = {
    booker_id: null,
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    deposit: 0,
    note: '',
    booking_details: []
  };
  availabilityCheck.value = {
    checkin_at: moment().startOf('day').format('YYYY-MM-DDTHH:mm'),
    checkout_at: moment().startOf('day').add(1, 'day').format('YYYY-MM-DDTHH:mm'),
  };
  availableRoomsForSelection.value = [];
  selectedAvailableRoomIds.value = [];
  validationErrors.value = {};
};

const close = () => {
  emit('close');
};

const handleModalClickOutside = (event) => {
  if (event.target.classList.contains('modal-overlay')) {
    close();
  }
};

const checkRoomAvailability = async () => {
  validationErrors.value = {}; // Clear previous validation errors

  if (!availabilityCheck.value.checkin_at) {
    validationErrors.value.checkin_at = ['Please enter a check-in time.'];
  }
  if (!availabilityCheck.value.checkout_at) {
    validationErrors.value.checkout_at = ['Please enter a check-out time.'];
  }
  if (validationErrors.value.checkin_at || validationErrors.value.checkout_at) {
    return;
  }

  const now = moment();
  const checkin = moment(availabilityCheck.value.checkin_at);
  const checkout = moment(availabilityCheck.value.checkout_at);

  if (checkin.isSameOrBefore(now)) {
    validationErrors.value.checkin_at = ['Check-in time must be in the future.'];
    return;
  }
  if (checkin.isSameOrAfter(checkout)) {
    validationErrors.value.checkout_at = ['Check-out time must be after check-in time.'];
    return;
  }

  try {
    const formattedCheckin = moment(availabilityCheck.value.checkin_at).format('YYYY-MM-DD HH:mm');
    const formattedCheckout = moment(availabilityCheck.value.checkout_at).format('YYYY-MM-DD HH:mm');

    const response = await api.post(`/bookings/check-room-availability`, {
      checkin_at: formattedCheckin,
      checkout_at: formattedCheckout,
    });
    availableRoomsForSelection.value = response.data?.data || [];
    selectedAvailableRoomIds.value = selectedAvailableRoomIds.value.filter(id =>
      availableRoomsForSelection.value.some(room => room.id === id)
    );

    if (availableRoomsForSelection.value.length === 0) {
      validationErrors.value.general = ['No available rooms for the selected period.'];
    } else {
      toast.success(`Found ${availableRoomsForSelection.value.length} available rooms.`);
    }
    updateBookingDetailsFromSelection();
  } catch (error) {
    console.error('Error checking room availability:', error.response?.data || error.message);
    validationErrors.value.general = ['Failed to check room availability. Please try again.'];
    availableRoomsForSelection.value = [];
    selectedAvailableRoomIds.value = [];
    newBooking.value.booking_details = [];
  }
};

const updateBookingDetailsFromSelection = () => {
  newBooking.value.booking_details = selectedAvailableRoomIds.value.map(roomId => {
    const room = availableRoomsForSelection.value.find(r => r.id === roomId);
    const oldDetail = newBooking.value.booking_details.find(d => d.room_id === roomId);
    return {
      room_id: roomId,
      checkin_at: oldDetail ? oldDetail.checkin_at : availabilityCheck.value.checkin_at,
      checkout_at: oldDetail ? oldDetail.checkout_at : availabilityCheck.value.checkout_at,
      room_name: room ? `Room ${room.id} (${room.room_type || 'N/A'})` : `Room ${roomId}`
    };
  });
};

watch(selectedAvailableRoomIds, updateBookingDetailsFromSelection, { deep: true });

function getRoomDetail(roomId) {
  let detail = newBooking.value.booking_details.find(d => d.room_id === roomId);
  if (!detail && selectedAvailableRoomIds.value.includes(roomId)) {
    detail = {
      room_id: roomId,
      checkin_at: availabilityCheck.value.checkin_at,
      checkout_at: availabilityCheck.value.checkout_at,
      room_name: ''
    };
    newBooking.value.booking_details.push(detail);
  }
  return detail || { room_id: roomId, checkin_at: availabilityCheck.value.checkin_at, checkout_at: availabilityCheck.value.checkout_at, room_name: '' };
}

const createBooking = async () => {
  validationErrors.value = {};
  const selectedRoomIdsSet = new Set(selectedAvailableRoomIds.value);
  const currentlyAvailableRoomIdsSet = new Set(availableRoomsForSelection.value.map(room => room.id));

  for (const selectedId of selectedRoomIdsSet) {
    if (!currentlyAvailableRoomIdsSet.has(selectedId)) {
      toast.error(`Room ${selectedId} is no longer available for the selected period. Please check again!`);
      return;
    }
  }

  const now = moment();
  for (const detail of newBooking.value.booking_details) {
    const checkin = moment(detail.checkin_at);
    const checkout = moment(detail.checkout_at);
    if (checkin.isSameOrBefore(now)) {
      toast.error('Check-in time for all rooms must be in the future.');
      return;
    }
    if (checkin.isSameOrAfter(checkout)) {
      toast.error('Check-out time must be after check-in time for all rooms.');
      return;
    }
  }

  const finalBookingDetails = newBooking.value.booking_details.map(detail => ({
    room_id: detail.room_id,
    checkin_at: moment(detail.checkin_at).format('YYYY-MM-DD HH:mm'),
    checkout_at: moment(detail.checkout_at).format('YYYY-MM-DD HH:mm'),
  }));

  try {
    const payload = {
      ...newBooking.value,
      booking_details: finalBookingDetails
    };

    const response = await api.post(`/bookings`, payload);
    toast.success('Booking created successfully!');
    emit('bookingCreated');
    close();
  } catch (error) {
    if (error.response && error.response.status === 422) {
      validationErrors.value = error.response.data.errors || {};
      toast.error('Please enter valid details!');
    } else {
      console.error('Error creating booking:', error.response?.data || error.message);
      toast.error('Failed to create booking: ' + (error.response?.data?.message || 'Unknown error.'));
    }
  }
};
</script>

<template>
  <div v-if="show" class="modal-overlay" @click="handleModalClickOutside">
    <div class="modal-dialog modal-xl modal-dialog-scrollable" @click.stop="">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">Create New Booking</h5>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createBooking">
            <div class="row">
              <div class="mb-3 col-md-6">
                <label for="guestName" class="form-label">Guest Name:</label>
                <input type="text" class="form-control" id="guestName" v-model="newBooking.guest_name" required>
                <div v-if="validationErrors.guest_name" class="text-danger small">
                  {{ validationErrors.guest_name[0] }}
                </div>
              </div>
              <div class="mb-3 col-md-6">
                <label for="guestEmail" class="form-label">Guest Email:</label>
                <input type="email" class="form-control" id="guestEmail" v-model="newBooking.guest_email">
                <div v-if="validationErrors.guest_email" class="text-danger small">
                  {{ validationErrors.guest_email[0] }}
                </div>
              </div>
            </div>
            <div class="row">
              <div class="mb-3 col-6">
                <label for="guestPhone" class="form-label">Phone Number:</label>
                <input type="text" class="form-control" id="guestPhone" v-model="newBooking.guest_phone" required>
                <div v-if="validationErrors.guest_phone" class="text-danger small">
                  {{ validationErrors.guest_phone[0] }}
                </div>
              </div>
              <div class="mb-3 col-6">
                <label for="deposit" class="form-label">Deposit Amount:</label>
                <input type="number" class="form-control" id="deposit" v-model="newBooking.deposit" min="0">
                <div v-if="validationErrors.deposit" class="text-danger small">
                  {{ validationErrors.deposit[0] }}
                </div>
              </div>
            </div>
            <div class="mb-3">
              <label for="note" class="form-label">Note:</label>
              <textarea class="form-control" id="note" v-model="newBooking.note"></textarea>
              <div v-if="validationErrors.note" class="text-danger small">
                {{ validationErrors.note[0] }}
              </div>
            </div>

            <hr>
            <h6>Check Room Availability:</h6>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="checkinAvailability" class="form-label">Check-in Time:</label>
                <FlatPickr id="checkinAvailability" v-model="availabilityCheck.checkin_at" :config="flatpickrConfig"
                  class="form-control" required />
                <div v-if="validationErrors.checkin_at" class="text-danger small">
                  {{ validationErrors.checkin_at[0] }}
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <label for="checkoutAvailability" class="form-label">Check-out Time:</label>
                <FlatPickr id="checkoutAvailability" @on-change="checkRoomAvailability"
                  v-model="availabilityCheck.checkout_at" :config="flatpickrConfig" class="form-control" required />
                <div v-if="validationErrors.checkout_at" class="text-danger small">
                  {{ validationErrors.checkout_at[0] }}
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-info btn-sm mb-3" @click="checkRoomAvailability">Check
              Availability</button>
            <div v-if="validationErrors.general" class="text-danger small">
              {{ validationErrors.general[0] }}
            </div>

            <hr>
            <h6>Select Rooms for This Booking:</h6>
            <div v-if="availableRoomsForSelection.length > 0" class="table-responsive">
              <table class="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Room Name</th>
                    <th>Room Type</th>
                    <th>Price half day of room</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="room in availableRoomsForSelection" :key="room.id">
                    <td class="text-center align-middle">
                      <input type="checkbox" :id="`room-checkbox-${room.id}`" :value="room.id"
                        v-model="selectedAvailableRoomIds">
                    </td>
                    <td>{{ room.name || `Room ${room.id}` }}</td>
                    <td>{{ room.room_type }}</td>
                    <td>{{ formatCurrency(room.price) }}</td>
                    <td>
                      <FlatPickr :id="`room-checkin-${room.id}`" v-model="getRoomDetail(room.id).checkin_at"
                        :config="flatpickrConfig" class="form-control"
                        :disabled="!selectedAvailableRoomIds.includes(room.id)" />
                    </td>
                    <td>
                      <FlatPickr :id="`room-checkout-${room.id}`" v-model="getRoomDetail(room.id).checkout_at"
                        :config="flatpickrConfig" class="form-control"
                        :disabled="!selectedAvailableRoomIds.includes(room.id)" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <p class="text-muted">You have selected <b>{{ selectedAvailableRoomIds.length }}</b> rooms.</p>
            </div>
            <div v-else class="alert alert-warning mt-2">
              Please check room availability before create booking.
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
          <button type="submit" class="btn btn-primary" @click="createBooking">
            Create Booking
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  overflow-y: auto;
}

.modal-dialog {
  position: relative;
  pointer-events: none;
  margin: 1.75rem auto;
  max-width: 90%;
  width: 90%;
}

.modal-dialog.modal-xl {
  max-width: 1200px;
}

.modal-dialog-scrollable {
  display: flex;
  max-height: calc(100vh - 3.5rem);
}

.modal-content {
  pointer-events: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: inherit;
  overflow: hidden;
}

.modal-header {
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  flex-shrink: 0;
}

.modal-title {
  margin-bottom: 0;
  line-height: 1.5;
}

.modal-body {
  padding: 15px;
  overflow-y: auto;
  flex-grow: 1;
}

.modal-footer {
  padding: 15px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background-color: #f8f9fa;
  flex-shrink: 0;
}

.modal-footer .btn {
  min-width: 80px;
}

.btn-close {
  box-sizing: content-box;
  width: 1em;
  height: 1em;
  padding: 0.25em;
  color: #000;
  border: 0;
  border-radius: 0.25rem;
  opacity: 0.5;
  filter: invert(1) grayscale(100%) brightness(200%);
}

.btn-close:hover {
  color: #000;
  opacity: 0.75;
}
</style>
