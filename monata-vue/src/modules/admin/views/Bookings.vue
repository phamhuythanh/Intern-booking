<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../lib/axios';
import moment from 'moment';
import 'moment/locale/en-gb';
moment.locale('en-gb');
import { useToast } from 'vue-toastification';

const toast = useToast();

import BookingDetailModal from '../components/modals/Booking/BookingDetailModal.vue';
import CreateBookingModal from '../components/modals/Booking/CreateBookingModal.vue';
import EditBookingModal from '../components/modals/Booking/EditBookingModal.vue';
import InvoiceServiceModal from '../components/modals/InvoiceServiceModal.vue';
import ViewInvoiceModal from '../components/modals/ViewInvoiceModal.vue';

const rawBookings = ref([]);
const dailyRoomBookings = ref({});
const currentMonth = ref(moment().month());
const currentYear = ref(moment().year());
const selectedDate = ref(null);

const showBookingDetailModal = ref(false);
const selectedBookingDetail = ref(null);

const showCreateBookingModal = ref(false);
const showEditBookingModal = ref(false);
const bookingToEdit = ref(null);

const showInvoiceServiceModal = ref(false);
const selectedBookingForInvoice = ref(null);

const isViewInvoiceModalVisible = ref(false);
const bookingDataForInvoiceView = ref(null);

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const fetchBookings = async () => {
  try {
    const response = await api.get(`/bookings`, { params: { month: currentMonth.value + 1, year: currentYear.value } });
    rawBookings.value = response.data?.data || [];
    processBookings(rawBookings.value);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    toast.error('Failed to fetch bookings.');
  }
};

onMounted(() => {
  fetchBookings();
  const today = moment().startOf('day').toISOString();
  selectedDate.value = today;
});

const processBookings = (bookingsData) => {
  const processedBookings = {};
  bookingsData.forEach(booking => {
    if (booking.booking_details && Array.isArray(booking.booking_details)) {
      booking.booking_details.forEach(detail => {
        if (!detail.checkin_at || !detail.checkout_at) {
          console.warn(`Booking detail ID ${detail.id} (Booking ID: ${booking.id}) missing checkin_at or checkout_at, skipping.`);
          return;
        }

        const checkinMoment = moment(detail.checkin_at);
        const checkoutMoment = moment(detail.checkout_at);

        const startDate = checkinMoment.clone().startOf('day');
        const endDate = checkoutMoment.clone().startOf('day');

        const isCheckoutAtMidnight = checkoutMoment.hour() === 0 && checkoutMoment.minute() === 0 && checkoutMoment.second() === 0;
        const lastDayOfBooking = isCheckoutAtMidnight ? endDate.clone().subtract(1, 'day') : endDate;

        let currentDate = startDate.clone();
        while (currentDate.isSameOrBefore(lastDayOfBooking)) {
          const dateKey = currentDate.toISOString();
          if (!processedBookings[dateKey]) {
            processedBookings[dateKey] = {};
          }
          if (!processedBookings[dateKey][detail.room_id]) {
            processedBookings[dateKey][detail.room_id] = [];
          }
          processedBookings[dateKey][detail.room_id].push({
            booking_id: booking.id,
            booking_detail_id: detail.id,
            guest_name: booking.guest_name,
            room_id: detail.room_id,
            room_name: detail.room_name,
            fullBooking: booking
          });
          currentDate.add(1, 'day');
        }
      });
    } else {
      console.log(`Booking ID ${booking.id} skipped due to missing booking_details.`);
    }
  });
  dailyRoomBookings.value = processedBookings;
};

const currentMonthYear = computed(() => {
  return moment().month(currentMonth.value).year(currentYear.value).format('MMMM[ ]YYYY');
});

const calendarDays = computed(() => {
  const startOfMonth = moment().month(currentMonth.value).year(currentYear.value).startOf('month');
  const endOfMonth = moment().month(currentMonth.value).year(currentYear.value).endOf('month');
  const startDay = startOfMonth.clone().startOf('isoWeek');
  const endDay = endOfMonth.clone().endOf('isoWeek');

  const days = [];
  let day = moment(startDay);

  while (day.isSameOrBefore(endDay)) {
    days.push({
      date: day.toISOString(),
      dayOfMonth: day.date(),
      isCurrentMonth: day.month() === currentMonth.value,
    });
    day.add(1, 'day');
  }
  return days;
});

const getDailyBookedRooms = (date) => {
  const dateKey = moment(date).startOf('day').toISOString();
  const roomsBookedOnDate = dailyRoomBookings.value[dateKey];
  if (!roomsBookedOnDate) {
    return [];
  }
  return Object.values(roomsBookedOnDate).flat().sort((a, b) => a.room_id - b.room_id);
};

const isToday = (date) => {
  return moment(date).isSame(moment(), 'day');
};

const isSelectedDay = (date) => {
  return selectedDate.value && moment(date).isSame(moment(selectedDate.value), 'day');
};

const selectDay = (date) => {
  selectedDate.value = moment(date).startOf('day').toISOString();
};

const formattedSelectedDate = computed(() => {
  return selectedDate.value ? moment(selectedDate.value).format('DD MMMM[ ]YYYY') : '';
});

const bookedRoomsForSelectedDay = computed(() => {
  const uniqueBookings = new Map();
  getDailyBookedRooms(selectedDate.value).forEach(roomBooking => {
    uniqueBookings.set(roomBooking.booking_id, roomBooking.fullBooking);
  });
  return Array.from(uniqueBookings.values());
});

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  selectedDate.value = null;
  fetchBookings();
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  selectedDate.value = null;
  fetchBookings();
};

const getStatusText = (status) => {
  switch (status) {
    case 1: return 'Pending';
    case 2: return 'Confirmed';
    case 3: return 'Checked In';
    case 4: return 'Checked Out';
    case 5: return 'Cancelled';
    case 6: return 'No Show';
    case 7: return 'Expired';
    case 8: return 'Completed';
  }
};
const getBadgeClass = (status) => {
  switch (status) {
    case 1: return 'bg-secondary'; // PENDING
    case 2: return 'bg-primary';   // CONFIRMED
    case 3: return 'bg-success';   // CHECKED IN
    case 4: return 'bg-info';   // CANCELLED
    case 5: return 'bg-danger';    // NO SHOW
    case 6: return 'bg-warning';      // CHECKED OUT
    case 7: return 'bg-light';
    case 8: return 'bg-dark'   // Others
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
  await fetchBookings();
  if (currentBookingId) {
    const updatedBooking = rawBookings.value.find(b => b.id === currentBookingId);
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
  fetchBookings();
  closeEditBookingModal();
};

const openCreateBookingModal = () => {
  showCreateBookingModal.value = true;
};

const closeCreateBookingModal = () => {
  showCreateBookingModal.value = false;
};

const handleBookingCreated = () => {
  fetchBookings();
};

const openInvoiceServiceModal = (booking) => {
  selectedBookingForInvoice.value = booking;
  showInvoiceServiceModal.value = true;
};

const closeInvoiceServiceModal = () => {
  showInvoiceServiceModal.value = false;
  selectedBookingForInvoice.value = null;
};

const handleInvoiceUpdated = () => {
  fetchBookings();
};

const openViewInvoiceModal = (booking) => {
  if (booking && (booking.status === 3 || booking.status === 4 || booking.status === 8)) {
    bookingDataForInvoiceView.value = booking;
    isViewInvoiceModalVisible.value = true;
  } else {
    toast.warn('Không thể xem hóa đơn cho các đặt phòng chưa check-in hoặc không ở trạng thái phù hợp.');
  }
};

const closeViewInvoiceModal = () => {
  isViewInvoiceModalVisible.value = false;
  bookingDataForInvoiceView.value = null;
};

const confirmBooking = async (bookingId) => {
  if (confirm('Are you sure you want to confirm this booking?')) {
    try {
      await api.post(`/bookings/${bookingId}/confirm`);
      toast.success('Booking confirmed successfully!');
      await fetchBookings();
    } catch (error) {
      console.error('Error confirming booking:', error.response?.data || error.message);
      toast.error('Failed to confirm booking: ' + (error.response?.data?.message || 'Unknown error.'));
    }
  }
};

const guestNoShow = async (bookingId) => {
  if (confirm('Are you sure want to mark this booking as no show?')) {
    try {
      await api.post(`/bookings/${bookingId}/no-show`);
      toast.success('Booking confirmed successfully!');
      await fetchBookings();
    } catch (error) {
      console.error('Error confirming booking:', error.response?.data || error.message);
      toast.error('Failed to confirm booking: ' + (error.response?.data?.message || 'Unknown error.'));
    }
  }
};

const cancelBooking = async (bookingId) => {
  if (confirm('Are you sure want to cancel this booking?')) {
    try {
      await api.post(`/bookings/${bookingId}/cancelled`);
      toast.success('Booking cancelled successfully!');
      await fetchBookings();
    } catch (error) {
      console.error('Error confirming booking:', error.response?.data || error.message);
      toast.error('Failed to confirm booking: ' + (error.response?.data?.message || 'Unknown error.'));
    }
  }
};

const deleteBooking = async (bookingId) => {
  if (confirm('Are you sure want to delete this booking?')) {
    try {
      await api.delete(`/bookings/${bookingId}`);
      toast.success('Booking deleted successfully!');
      await fetchBookings();
    } catch (error) {
      console.error('Error deleted booking:', error.response?.data || error.message);
      toast.error('Failed to deleted booking: ' + (error.response?.data?.message || 'Unknown error.'));
    }
  }
};
</script>

<template>
  <div class="card shadow mb-4">
    <div class="card-header py-3 d-flex justify-content-between align-items-center">
      <h6 class="m-0 font-weight-bold text-primary">Manage Bookings</h6>
      <button class="btn btn-primary" @click="openCreateBookingModal">Create New Booking</button>
    </div>
    <div class="card-body">
      <div class="table-responsive">
        <div class="card">
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <button class="btn btn-light" @click="prevMonth">&lt; Prev</button>
            <h3>{{ currentMonthYear }}</h3>
            <button class="btn btn-light" @click="nextMonth">Next &gt;</button>
          </div>
          <div class="card-body">
            <div class="calendar-grid">
              <div v-for="dayName in dayNames" :key="dayName" class="calendar-header-day">
                {{ dayName }}
              </div>
              <div v-for="day in calendarDays" :key="day.date"
                :class="['calendar-day', { 'current-month': day.isCurrentMonth, 'today': isToday(day.date), 'selected-day': isSelectedDay(day.date) }]"
                @click="selectDay(day.date)">
                <div class="day-number">{{ day.dayOfMonth }}</div>
                <div class="room-summary mt-2">
                  <span v-for="roomBooking in getDailyBookedRooms(day.date)" :key="roomBooking.booking_detail_id"
                    class="badge text-white me-1" :class="getBadgeClass(roomBooking.fullBooking?.status)"
                    :title="`Room ${roomBooking.room_name} (${roomBooking.guest_name})`"
                    @click.stop="openBookingDetailModal(roomBooking.fullBooking)">
                    {{ roomBooking.room_name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedDate" class="card mt-4">
          <div class="card-header bg-secondary text-white">
            <h3>Booking for: {{ formattedSelectedDate }}</h3>
          </div>
          <div class="card-body">
            <div v-if="bookedRoomsForSelectedDay.length > 0">
              <div v-for="booking in bookedRoomsForSelectedDay" :key="booking.id" class="card mb-3">
                <div class="card-body">
                  <p class="card-text">
                    Guest: <strong>{{ booking.guest_name }}</strong>
                  </p>
                  <p class="card-text">
                    Email: <strong>{{ booking.guest_email }}</strong>
                  </p>
                  <p class="card-text">
                    Phone: <strong>{{ booking.guest_phone }}</strong>
                  </p>
                  <p class="card-text">
                    Status: <span :class="['badge', getBadgeClass(booking.status), 'badge-custom-size']">{{
                      getStatusText(booking.status)
                      }}</span>
                  </p>
                  <button v-if="booking.status === 1" class="btn btn-primary btn-sm mr-2"
                    @click="confirmBooking(booking.id)">Confirm</button>
                  <button v-if="booking.status === 2 || booking.status === 3 || booking.status === 4"
                    class="btn btn-warning btn-sm mr-2" @click="openInvoiceServiceModal(booking)">Services</button>
                  <button class="btn btn-primary btn-sm" @click="openBookingDetailModal(booking)">Detail</button>
                  <button v-if="booking.status === 8" type=" button" class="btn btn-success btn-sm ms-2"
                    @click="openViewInvoiceModal(booking)">Invoice</button>
                  <!-- <button v-if="booking.status === 2" type=" button" class="btn btn-info btn-sm ms-2"
                    @click="guestNoShow(booking.id)">No Show</button> -->
                  <button v-if="booking.status === 1" type=" button" class="btn btn-danger btn-sm ms-2"
                    @click="cancelBooking(booking.id)">Cancel</button>
                  <button v-if="booking.status === 5" type=" button" class="btn btn-danger btn-sm ms-2"
                    @click="deleteBooking(booking.id)">Detele</button>
                </div>
              </div>
            </div>
            <p v-else class="text-muted">No booking.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <BookingDetailModal :show="showBookingDetailModal" :booking="selectedBookingDetail" @close="closeBookingDetailModal"
    @booking-confirmed="handleBookingConfirmed" @edit-booking="openEditBookingModal" />

  <CreateBookingModal :show="showCreateBookingModal" :initial-checkin-date="selectedDate"
    @close="closeCreateBookingModal" @booking-created="handleBookingCreated" />

  <EditBookingModal :show="showEditBookingModal" :booking="bookingToEdit" @close="closeEditBookingModal"
    @booking-updated="handleBookingUpdated" />

  <InvoiceServiceModal :show="showInvoiceServiceModal" :booking="selectedBookingForInvoice"
    @close="closeInvoiceServiceModal" @invoice-updated="handleInvoiceUpdated" />

  <ViewInvoiceModal :show="isViewInvoiceModalVisible" :booking-data="bookingDataForInvoiceView"
    @close="closeViewInvoiceModal" />
</template>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  border: 1px solid #ccc;
  border-radius: 5px;
  overflow: hidden;
}

.calendar-header-day {
  background-color: #f8f9fa;
  padding: 10px;
  text-align: center;
  font-weight: bold;
  border-bottom: 1px solid #eee;
}

.calendar-day {
  min-height: 120px;
  padding: 10px;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  cursor: pointer;
  background-color: #fff;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.calendar-day:hover {
  background-color: #f0f0f0;
}

.calendar-day.current-month {
  background-color: #fff;
}

.calendar-day:not(.current-month) {
  background-color: #e9ecef;
  color: #6c757d;
}

.calendar-day.today {
  background-color: #e0f2f7;
  border: 2px solid #007bff;
}

.calendar-day.selected-day {
  background-color: #d1ecf1;
  border: 2px solid #17a2b8;
}

.day-number {
  font-weight: bold;
  font-size: 1.2em;
  margin-bottom: 5px;
}

.room-summary {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.room-summary .badge {
  padding: 0.4em 0.6em;
  font-size: 0.75em;
  border-radius: 0.25rem;
  cursor: pointer;
}

.card-header h3 {
  margin: 0;
}

.badge-custom-size {
  padding: 0.5em 0.8em;
  min-width: 100px;
  text-align: center;
  display: inline-block;
  border-radius: .35rem;
}
</style>
