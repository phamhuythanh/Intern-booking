<script setup>
import { ref, computed, watch } from 'vue';
import moment from 'moment';
import { useToast } from 'vue-toastification';
import ViewInvoiceModal from '../ViewInvoiceModal.vue';
import { api } from '@/modules/admin/lib/axios';

const toast = useToast();

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  booking: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'bookingConfirmed', 'editBooking']);

const selectedBookingDetail = ref(props.booking);
const isViewInvoiceModalVisible = ref(false);
const bookingDataForInvoice = ref(null);

watch(() => props.booking, (newVal) => {
  selectedBookingDetail.value = newVal;
}, { deep: true });

watch(() => props.show, (newValue) => {
  if (newValue) {
    document.body.classList.add('modal-open-custom');
  } else {
    document.body.classList.remove('modal-open-custom');
  }
});

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-GB', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' VNĐ';
};

const formatDate = (dateString, format = 'DD-MM-YYYY') => {
  if (!dateString) return '';
  return moment(dateString).format(format);
};

const getStatusText = (status) => {
  switch (status) {
    case 1: return 'Pending';
    case 2: return 'Confirmed';
    case 3: return 'Checked In';
    case 4: return 'Checked Out';
    case 5: return 'Cancelled';
    case 6: return 'No Show';
    default: return 'UNDEFINED';
  }
};

const getDetailStatusText = (status) => {
  switch (status) {
    case 1: return 'Pending';
    case 2: return 'Checked In';
    case 3: return 'Checked Out';
    default: return 'UNDEFINED';
  }
};

const close = () => {
  emit('close');
};

const confirmBooking = async (bookingId) => {
  if (confirm('Are you sure you want to confirm this booking?')) {
    try {
      await api.post(`/bookings/${bookingId}/confirm`);
      toast.success('Booking confirmed successfully!');
      emit('bookingConfirmed');
      close();
    } catch (error) {
      console.error('Error confirming booking:', error.response?.data || error.message);
      toast.error('Failed to confirm booking: ' + (error.response?.data?.message || 'Unknown error.'));
    }
  }
};

const editBooking = () => {
  emit('editBooking', selectedBookingDetail.value);
  close();
};

const openViewInvoice = () => {
  if (selectedBookingDetail.value && (selectedBookingDetail.value.status === 3 || selectedBookingDetail.value.status === 4)) {
    bookingDataForInvoice.value = selectedBookingDetail.value;
    isViewInvoiceModalVisible.value = true;
  } else {
    toast.warn('Error');
  }
};

const closeViewInvoiceModal = () => {
  isViewInvoiceModalVisible.value = false;
  bookingDataForInvoice.value = null;
};

const checkInRoom = async (bookingId, detailId) => {
  if (confirm('Are you sure you want to check in this room?')) {
    try {
      await api.post(`/bookings/${bookingId}/check-in`, { ids: [detailId] });
      toast.success('Room checked in successfully!');
      emit('bookingConfirmed'); // To trigger data refresh in parent
    } catch (error) {
      console.error('Error checking in room:', error.response?.data || error.message);
      toast.error('Failed to check in room: ' + (error.response?.data?.message || 'Unknown error.'));
    }
  }
};

const checkOutRoom = async (bookingId, detail) => {
  if (confirm('Are you sure you want to check out this room?')) {
    try {
      await api.post(`/bookings/${bookingId}/check-out-room`, { room_id: detail.room_id });
      toast.success('Room checked out successfully!');
      emit('bookingConfirmed'); // To trigger data refresh in parent
    } catch (error) {
      console.error('Error checking out room:', error.response?.data || error.message);
      toast.error('Failed to check out room: ' + (error.response?.data?.message || 'Unknown error.'));
    }
  }
};

const cancelBooking = async (bookingId) => {
  if (confirm('Are you sure want to cancel this booking?')) {
    try {
      await api.post(`/bookings/${bookingId}/cancelled`);
      toast.success('Booking cancelled successfully!');
      emit('bookingConfirmed');
      close();
    } catch (error) {
      console.error('Error cancelling booking:', error.response?.data || error.message);
      toast.error('Failed to cancel booking: ' + (error.response?.data?.message || 'Unknown error.'));
    }
  }
};
</script>

<template>
  <div v-if="show" class="modal-overlay" @click="close">
    <div class="modal-dialog modal-xl modal-dialog-scrollable" @click.stop="">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">Booking Detail</h5>
        </div>
        <div class="modal-body" v-if="selectedBookingDetail">
          <p><strong>Guest:</strong> {{ selectedBookingDetail.guest_name }}</p>
          <p><strong>Email:</strong> {{ selectedBookingDetail.guest_email }}</p>
          <p><strong>Phone:</strong> {{ selectedBookingDetail.guest_phone }}</p>
          <p><strong>Total price:</strong> {{ formatCurrency(selectedBookingDetail.total_payment) }}</p>
          <p><strong>Deposit:</strong> {{ formatCurrency(selectedBookingDetail.deposit) || ' 0 VNĐ' }}
          </p>
          <p><strong>Status:</strong> {{ getStatusText(selectedBookingDetail.status) }}</p>
          <p><strong>Note:</strong> {{ selectedBookingDetail.notes || '' }}</p>

          <h6 class="mt-4">Booked Rooms:</h6>
          <div class="table-responsive">
            <table class="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Room type</th>
                  <th>Half day price</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="detail in selectedBookingDetail.booking_details" :key="detail.id">
                  <td>{{ detail.room_name }}</td>
                  <td>{{ detail.room_type }}</td>
                  <td>{{ formatCurrency(detail.price_per_day) }}</td>
                  <td>{{ formatDate(detail.checkin_at, 'HH:mm DD-MM-YYYY') }}</td>
                  <td>{{ formatDate(detail.checkout_at, 'HH:mm DD-MM-YYYY') }}</td>
                  <td>{{ getDetailStatusText(detail.status) }}</td>
                  <td>
                    <button
                      v-if="(selectedBookingDetail.status === 2 || selectedBookingDetail.status === 3) && detail.status === 1"
                      class="btn btn-sm btn-success" @click="checkInRoom(selectedBookingDetail.id, detail.id)">
                      Check In Room
                    </button>
                    <button v-if="detail.status === 2" class="btn btn-sm btn-warning"
                      @click="checkOutRoom(selectedBookingDetail.id, detail)">
                      Check Out Room
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close">Close</button>
          <button v-if="selectedBookingDetail?.status === 1" type="button" class="btn btn-success"
            @click="confirmBooking(selectedBookingDetail.id)">Confirm Booking</button>
          <button
            v-if="selectedBookingDetail?.status !== 4 && selectedBookingDetail?.status !== 5 && selectedBookingDetail?.status !== 6 && selectedBookingDetail?.status !== 8"
            type="button" class="btn btn-primary" @click="editBooking">Edit</button>
          <button v-if="selectedBookingDetail?.status === 1" type="button" class="btn btn-danger"
            @click="cancelBooking(selectedBookingDetail.id)">Cancel</button>
          <!-- <button v-if="selectedBookingDetail?.status === 8" type="button" class="btn btn-info"
            @click="openViewInvoice">Invoice</button> -->
        </div>
      </div>
    </div>
  </div>
  <ViewInvoiceModal :show="isViewInvoiceModalVisible" :booking-data="bookingDataForInvoice"
    @close="closeViewInvoiceModal" />
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
