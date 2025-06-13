<template>
  <div>
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Booking List</h6>
      </div>
      <div class="card-body">
        <div class="pb-3">
          <form @submit.prevent="applyFilters">
            <div class="row g-3">
              <div class="col-md-6 col-lg-3">
                <label for="filterName" class="form-label">Guest name:</label>
                <input type="text" class="form-control" id="filterName" v-model="filters.guest_name"
                  placeholder="Enter name" />
              </div>
              <div class="col-md-6 col-lg-3">
                <label for="filterEmail" class="form-label">Guest email:</label>
                <input type="email" class="form-control" id="filterEmail" v-model="filters.guest_email"
                  placeholder="Enter email" />
              </div>
              <div class="col-md-6 col-lg-3">
                <label for="filterPhone" class="form-label">Guest phone:</label>
                <input type="tel" class="form-control" id="filterPhone" v-model="filters.guest_phone"
                  placeholder="Enter phone" />
              </div>
              <div class="col-md-6 col-lg-3">
                <label for="filterStatus" class="form-label">Status:</label>
                <select class="form-select" id="filterStatus" v-model="filters.status">
                  <option value="">--All status--</option>
                  <option :value="1">Pending</option>
                  <option :value="2">Confirmed</option>
                  <option :value="3">Checked In</option>
                  <option :value="4">Checked Out</option>
                  <option :value="5">Cancelled</option>
                  <option :value="6">No Show</option>
                  <option :value="8">Completed</option>
                </select>
              </div>
            </div>
            <div class="d-flex justify-content-end mt-4">
              <button type="button" class="btn btn-secondary me-2" @click="resetFilters">
                Clear
              </button>
              <button type="submit" class="btn btn-primary">Search</button>
            </div>
          </form>
        </div>

        <div class="table-responsive">
          <table class="table table-bordered" width="100%" cellspacing="0">
            <thead>
              <tr>
                <th width="5px">#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Total Payment</th>
                <th>Status</th>
                <th>Created At</th>
                <th width="150px">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(booking, index) in bookings" :key="booking.id">
                <td>{{ index + 1 }}</td>
                <td>{{ booking.guest_name }}</td>
                <td>{{ booking.guest_email }}</td>
                <td>{{ booking.guest_phone }}</td>
                <td>{{ formatCurrency(booking.total_payment) }}</td>
                <td>
                  <button class="btn btn-sm" :class="getButtonClass(booking.status)"
                    @click="booking.status === 1 && confirmBooking(booking.id)" :disabled="booking.status !== 1">
                    {{ getStatusText(booking.status) }}
                  </button>
                </td>
                <td>{{ booking.created_at }}</td>
                <td>
                  <button class="btn btn-primary btn-sm" @click="openBookingDetailModal(booking)">Detail</button>
                  <button v-if="booking.status === 1" type=" button" class="btn btn-danger btn-sm ms-2"
                    @click="cancelBooking(booking.id)">
                    Cancel
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="isTransitioning" class="d-flex justify-content-center align-items-center w-100"
            style="min-height: 500px;">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden"></span>
            </div>
          </div>
        </div>
        <div class="row align-items-center pb-4" v-if="bookings.length > 0">
          <div class="col-md-4">
            <p class="mb-0">Showing {{ pagination.from }} to {{ pagination.to }} of {{ pagination.total }} entries
            </p>
          </div>
          <div class="col-md-8" v-if="pagination.last_page > 1">
            <nav aria-label="Page navigation">
              <ul class="pagination justify-content-md-end mb-0">
                <li v-for="(link, index) in pagination.links" :key="index" class="page-item"
                  :class="{ active: link.active, disabled: !link.url }">
                  <a class="page-link" href="#" v-html="link.label" @click.prevent="goToPage(link.url)"></a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

    </div>
  </div>
  <BookingDetailModal :show="showBookingDetailModal" :booking="selectedBookingDetail" @close="closeBookingDetailModal"
    @booking-confirmed="handleBookingConfirmed" @edit-booking="openEditBookingModal" />

  <EditBookingModal :show="showEditBookingModal" :booking="bookingToEdit" @close="closeEditBookingModal"
    @booking-updated="handleBookingUpdated" />
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { api } from '../lib/axios';
import BookingDetailModal from '../components/modals/Booking/BookingDetailModal.vue';
import EditBookingModal from '../components/modals/Booking/EditBookingModal.vue';

const toast = useToast();
const bookings = ref([]);
const pagination = ref({});

const showBookingDetailModal = ref(false);
const selectedBookingDetail = ref(null);
const showEditBookingModal = ref(false);
const bookingToEdit = ref(null);
const isTransitioning = ref(true)
const filters = reactive({
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  status: '',
});

const fetchBookings = async (page = 1) => {
  try {
    const response = await api.get('/bookings', {
      params: {
        page: page,
        ...filters
      }
    });
    bookings.value = response.data.data;
    pagination.value = response.data.meta;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    toast.error('Failed to fetch bookings.');
  } finally {
    isTransitioning.value = false
  }
};

const goToPage = async (url) => {
  if (!url) return

  const pageParam = new URL(url).searchParams.get('page')
  await fetchBookings(pageParam)
}

const getStatusText = (status) => {
  switch (status) {
    case 1:
      return 'PENDING';
    case 2:
      return 'CONFIRMED';
    case 3:
      return 'CHECKED IN';
    case 4:
      return 'CHECKED OUT';
    case 5:
      return 'CANCELLED';
    case 6:
      return 'NO SHOW';
    case 8:
      return 'COMPLETED';

    default:
      return 'Unknown';
  }
};

const getButtonClass = (status) => {
  switch (status) {
    case 1: return 'btn-outline-secondary';
    case 2: return 'btn-outline-primary';
    case 3: return 'btn-outline-success';
    case 4: return 'btn-outline-warning';
    case 5: return 'btn-outline-danger';
    case 6: return 'btn-outline-info';
    case 7: return 'btn-outline-ligh';
    case 8: return 'btn-outline-dark';
  }
};

const confirmBooking = async (bookingId) => {
  const confirmed = confirm('Are you sure you want to confirm this booking?');
  if (!confirmed) return;
  try {
    await api.post(`/bookings/${bookingId}/confirm`);
    toast.success('Booking confirmed successfully!');
    await fetchBookings(pagination.value.current_page || 1);
  } catch (error) {
    console.error('Error confirming booking:', error);
    toast.error(error.response?.data?.message || 'Failed to confirm booking.');
  }
};

const cancelBooking = async (bookingId) => {
  const confirmed = confirm('Are you sure you want to cancel this booking?');
  if (!confirmed) return;
  try {
    await api.post(`/bookings/${bookingId}/cancelled`);
    toast.success('Booking cancelled successfully!');
    await fetchBookings(pagination.value.current_page || 1);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    toast.error(error.response?.data?.message || 'Failed to cancel booking.');
  }
};

const openBookingDetailModal = (booking) => {
  selectedBookingDetail.value = booking;
  showBookingDetailModal.value = true;
};

const closeBookingDetailModal = () => {
  showBookingDetailModal.value = false;
  selectedBookingDetail.value = null;
};

const handleBookingConfirmed = async () => {
  const currentBookingId = selectedBookingDetail.value?.id;
  await fetchBookings(pagination.value.current_page);
  if (currentBookingId) {
    const updatedBooking = bookings.value.find(b => b.id === currentBookingId);
    if (updatedBooking) {
      selectedBookingDetail.value = updatedBooking;
    } else {
      closeBookingDetailModal();
    }
  }
};

const openEditBookingModal = (booking) => {
  bookingToEdit.value = booking;
  showEditBookingModal.value = true;
};

const closeEditBookingModal = () => {
  showEditBookingModal.value = false;
  bookingToEdit.value = null;
};

const handleBookingUpdated = () => {
  fetchBookings(pagination.value.current_page);
  closeEditBookingModal();
};

const applyFilters = () => {
  fetchBookings(1);
  toast.success('Filters applied.');
};

const resetFilters = () => {
  filters.guest_name = '';
  filters.guest_email = '';
  filters.guest_phone = '';
  filters.status = '';
  fetchBookings(1);
  toast.info('Clear filters.');
};
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-GB', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' VNĐ';
};

onMounted(() => {
  fetchBookings();
});
</script>

<style scoped>
.form-label {
  font-weight: bold;
}

.table th,
.table td {
  vertical-align: middle;
}

.table tbody tr:hover {
  background-color: #f5f5f5;
}
</style>
