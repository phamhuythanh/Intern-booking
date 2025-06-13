<script setup lang="ts">
import '../assets/scss/main.scss';
import { ref, onMounted, watch } from 'vue';
import { api } from '../lib/axios';
import Header from '@/modules/customer/components/layouts/Header.vue'
import Footer from '@/modules/customer/components/layouts/Footer.vue'
import BookingDetailModal from '@/modules/customer/components/modals/BookingDetailModal.vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const toast = useToast()

// Interfaces
interface User {
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingDetail {
  id: number;
  room_id: number;
  room_name: string;
  room_type: string;
  checkin_at: string;
  checkout_at: string;
  price_per_day: string;
  status: number;
}

interface Booking {
  id: number;
  user_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  note: string;
  deposit: number;
  total_payment: number;
  status: number;
  created_at: string;
  updated_at: string;
  booking_details: BookingDetail[];
}

// User profile state
const user = ref<User>({
  name: '',
  email: '',
  phone: '',
  createdAt: '',
  updatedAt: ''
});
const loading = ref(false);
const error = ref<string | null>(null);

// Profile edit form state
const showEditProfileForm = ref(false);
const editUser = ref<User>({
  name: '',
  email: '',
  phone: '',
  createdAt: '',
  updatedAt: ''
});
const isSubmittingProfile = ref(false);
const profileUpdateError = ref<string | null>(null);
const nameError = ref<string | null>(null);
const emailError = ref<string | null>(null);
const phoneError = ref<string | null>(null);

// Password change form state
const showChangePasswordForm = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isSubmittingPassword = ref(false);
const passwordChangeError = ref<string | null>(null);
const currentPasswordError = ref<string | null>(null);
const newPasswordError = ref<string | null>(null);
const confirmPasswordError = ref<string | null>(null);

// Booking state
const bookings = ref<Booking[]>([]);
const loadingBookings = ref(false);
const bookingError = ref<string | null>(null);
const selectedBooking = ref<Booking | null>(null);
const showBookingDetail = ref(false);
const showEditBookingModal = ref(false);

// Utility functions
const formatDateTime = (dateTimeStr: string): string => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  // Format to dd/MM/yyyy HH:mm
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const formatCurrency = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';

  // Try to parse the value as a number
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue as number)) return String(value);

  // Format with Vietnamese locale for correct separators
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal', // Use decimal style first for correct separators
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericValue as number) + ' VNĐ'; // Add currency symbol manually
};

const getStatusBadgeClass = (status: number) => {
  if (!status) return 'bg-secondary';

  const statusLower = String(status).toLowerCase();
  switch (status) {
    case 1:
      return 'bg-warning text-dark';
    case 2:
      return 'bg-primary text-white';
    case 3:
    case 4:
      return 'bg-info text-white';
    case 5:
      return 'bg-danger text-white';
    case 7:
      return 'bg-info text-white';
  }
};

const getStatusText = (status: number): string => {
  if (!status) return 'Unknown';

  switch (status) {
    case 1:
      return 'pending';
    case 2:
      return 'confirmed';
    case 3:
      return 'check in';
    case 4:
      return 'check out';
    case 5:
      return 'cancelled';
    case 6:
      return 'no show';
    case 7:
      return 'expired';
  }
};

// API calls
const fetchUserData = async (): Promise<void> => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get('/profile');
    const userData = response.data.data;
    user.value = {
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      createdAt: userData.created_at || '',
      updatedAt: userData.updated_at || ''
    };
  } catch (err) {
    console.error('Error fetching user data:', err);
    error.value = 'Login to see your profile.';
  } finally {
    loading.value = false;
  }
};

const fetchBookings = async (): Promise<void> => {
  loadingBookings.value = true;
  bookingError.value = null;

  try {
    const response = await api.get('/bookings-user');
    bookings.value = response.data.data;
  } catch (err) {
    console.error('Error fetching bookings:', err);
    bookingError.value = 'Unable to load booking data. Please try again later.';
  } finally {
    loadingBookings.value = false;
  }
};

// Booking handlers
const showBookingDetails = (booking: Booking) => {
  selectedBooking.value = booking;
  showBookingDetail.value = true;
};

const closeBookingDetails = () => {
  selectedBooking.value = null;
  showBookingDetail.value = false;
};

const openEditBookingModal = () => {
  showBookingDetail.value = false;
  showEditBookingModal.value = true;
};

const closeEditBookingModal = () => {
  showEditBookingModal.value = false;
  selectedBooking.value = null;
};

const handleBookingUpdated = () => {
  fetchBookings();
  closeEditBookingModal();
};

// Profile form handlers
const toggleEditProfileForm = (): void => {
  showEditProfileForm.value = !showEditProfileForm.value;

  if (showEditProfileForm.value) {
    editUser.value = { ...user.value };

    if (showChangePasswordForm.value) {
      showChangePasswordForm.value = false;
      resetPasswordForm();
    }
  } else {
    resetProfileForm();
  }
};

const resetProfileForm = (): void => {
  editUser.value = {
    name: '',
    email: '',
    phone: '',
    createdAt: '',
    updatedAt: ''
  };
  profileUpdateError.value = null;
  nameError.value = null;
  emailError.value = null;
  phoneError.value = null;
};

const resetProfileErrors = (): void => {
  profileUpdateError.value = null;
  nameError.value = null;
  emailError.value = null;
  phoneError.value = null;
};

const handleUpdateProfile = async (): Promise<void> => {
  resetProfileErrors();
  isSubmittingProfile.value = true;

  try {
    const response = await api.put('/profile', {
      name: editUser.value.name,
      email: editUser.value.email,
      phone: editUser.value.phone
    });

    authStore.fetchUser();

    toast.success('Profile updated successfully!');

    user.value = {
      ...user.value,
      name: editUser.value.name,
      email: editUser.value.email,
      phone: editUser.value.phone,
      updatedAt: new Date().toISOString()
    };
    toggleEditProfileForm();

  } catch (err: any) {
    console.error('Error updating profile:', err);
    if (err.response) {
      if (err.response.status === 422) {
        profileUpdateError.value = err.response.data.message || 'Please correct the errors below.';
        const errors = err.response.data.errors;
        if (errors) {
          if (errors.name) nameError.value = errors.name[0];
          if (errors.email) emailError.value = errors.email[0];
          if (errors.phone) phoneError.value = errors.phone[0];
        }
      } else {
        profileUpdateError.value = err.response.data || 'Failed to update profile. Please try again.';
      }
    } else {
      profileUpdateError.value = 'A network error occurred. Please try again.';
    }
  } finally {
    isSubmittingProfile.value = false;
  }
};

// Password form handlers
const resetPasswordForm = (): void => {
  currentPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  passwordChangeError.value = null;
  currentPasswordError.value = null;
  newPasswordError.value = null;
  confirmPasswordError.value = null;
};

const toggleChangePasswordForm = (): void => {
  showChangePasswordForm.value = !showChangePasswordForm.value;

  if (showChangePasswordForm.value) {
    if (showEditProfileForm.value) {
      showEditProfileForm.value = false;
      resetProfileForm();
    }
  } else {
    resetPasswordForm();
  }
};

const resetErrors = (): void => {
  passwordChangeError.value = null;
  currentPasswordError.value = null;
  newPasswordError.value = null;
  confirmPasswordError.value = null;
};

const handleChangePassword = async (): Promise<void> => {
  resetErrors();
  isSubmittingPassword.value = true;

  try {
    await api.post('/change-password', {
      current_password: currentPassword.value,
      new_password: newPassword.value,
      new_password_confirmation: confirmPassword.value
    });

    toast.success("Change password successfully!")
    resetPasswordForm();
    showChangePasswordForm.value = false;
    toggleChangePasswordForm();

  } catch (err: any) {
    console.error('Error changing password:', err);
    if (err.response) {
      if (err.response.status === 422) {
        passwordChangeError.value = err.response.data.message || 'Please correct the errors below.';
        const errors = err.response.data.errors;
        if (errors) {
          if (errors.current_password) currentPasswordError.value = errors.current_password[0];
          if (errors.new_password) newPasswordError.value = errors.new_password[0];
          if (errors.new_password_confirmation) confirmPasswordError.value = errors.new_password_confirmation[0];
        }
      } else if (err.response.status === 400) {
        currentPasswordError.value = 'Current password is incorrect.';
        passwordChangeError.value = err.response.data || 'Current password is incorrect.';
      } else {
        passwordChangeError.value = err.response.data || 'Failed to change password. Please try again.';
      }
    } else {
      passwordChangeError.value = 'A network error occurred. Please try again.';
    }
  } finally {
    isSubmittingPassword.value = false;
  }
};

// Lifecycle hooks
onMounted(async () => {
  await fetchUserData();
  await fetchBookings();

  // const newBooking = localStorage.getItem('newBooking');
  // if (newBooking) {
  //   const bookingData = JSON.parse(newBooking);
  //   const now = new Date().getTime();
  //   if (now - bookingData.timestamp < 5000) {
  //     await fetchBookings();
  //     localStorage.removeItem('newBooking');
  //   }
  // }
});

</script>

<template>
  <Header />
  <div class="hero"></div>
  <main class="bg-body-tertiary">
    <div class="container py-5">
      <div v-if="loading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>
      <div v-else class="row">
        <div class="col-lg-4">
          <div class="card mb-4 shadow-sm">
            <div class="card-body text-center">
              <img src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp" alt="avatar"
                class="rounded-circle img-fluid" style="width: 150px;">
              <h5 class="my-3">{{ user.name }}</h5>
              <p class="text-muted mb-1">{{ user.email }}</p>
              <p class="text-muted mb-4">{{ user.phone }}</p>
            </div>
          </div>
        </div>
        <div class="col-lg-8">
          <!-- Edit Profile Form -->
          <div v-if="showEditProfileForm" class="card mb-4 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Edit Profile Information</h5>
              <hr>
              <form @submit.prevent="handleUpdateProfile" novalidate>
                <div class="mb-3">
                  <label for="name" class="form-label">Full Name</label>
                  <input type="text" class="form-control" :class="{ 'is-invalid': nameError }" id="name"
                    v-model="editUser.name" required>
                  <div v-if="nameError" class="invalid-feedback">
                    {{ nameError }}
                  </div>
                </div>
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" class="form-control" :class="{ 'is-invalid': emailError }" id="email"
                    v-model="editUser.email" required>
                  <div v-if="emailError" class="invalid-feedback">
                    {{ emailError }}
                  </div>
                </div>
                <div class="mb-3">
                  <label for="phone" class="form-label">Phone</label>
                  <input type="tel" class="form-control" :class="{ 'is-invalid': phoneError }" id="phone"
                    v-model="editUser.phone" required>
                  <div v-if="phoneError" class="invalid-feedback">
                    {{ phoneError }}
                  </div>
                </div>
                <div v-if="profileUpdateError && !nameError && !emailError && !phoneError"
                  class="alert alert-danger mt-3" role="alert">
                  {{ profileUpdateError }}
                </div>
                <div class="mt-3">
                  <button type="submit" class="btn btn-primary me-2" :disabled="isSubmittingProfile">
                    <span v-if="isSubmittingProfile" class="spinner-border spinner-border-sm" role="status"
                      aria-hidden="true"></span>
                    {{ isSubmittingProfile ? 'Updating...' : 'Update Profile' }}
                  </button>
                  <button type="button" @click="toggleEditProfileForm" class="btn btn-outline-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Change Password Form -->
          <div v-else-if="showChangePasswordForm" class="card mb-4 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Change Password</h5>
              <hr>
              <form @submit.prevent="handleChangePassword" novalidate>
                <div class="mb-3">
                  <label for="currentPassword" class="form-label">Current Password</label>
                  <input type="password" class="form-control" :class="{ 'is-invalid': currentPasswordError }"
                    id="currentPassword" v-model="currentPassword" required>
                  <div v-if="currentPasswordError" class="invalid-feedback">
                    {{ currentPasswordError }}
                  </div>
                </div>
                <div class="mb-3">
                  <label for="newPassword" class="form-label">New Password</label>
                  <input type="password" class="form-control" :class="{ 'is-invalid': newPasswordError }"
                    id="newPassword" v-model="newPassword" required>
                  <div v-if="newPasswordError" class="invalid-feedback">
                    {{ newPasswordError }}
                  </div>
                </div>
                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Confirm New Password</label>
                  <input type="password" class="form-control" :class="{ 'is-invalid': confirmPasswordError }"
                    id="confirmPassword" v-model="confirmPassword" required>
                  <div v-if="confirmPasswordError" class="invalid-feedback">
                    {{ confirmPasswordError }}
                  </div>
                </div>
                <div v-if="passwordChangeError && !currentPasswordError && !newPasswordError && !confirmPasswordError"
                  class="alert alert-danger mt-3" role="alert">
                  {{ passwordChangeError }}
                </div>
                <div class="mt-3">
                  <button type="submit" class="btn btn-primary me-2" :disabled="isSubmittingPassword">
                    <span v-if="isSubmittingPassword" class="spinner-border spinner-border-sm" role="status"
                      aria-hidden="true"></span>
                    {{ isSubmittingPassword ? 'Submitting...' : 'Submit Change' }}
                  </button>
                  <button type="button" @click="toggleChangePasswordForm" class="btn btn-outline-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Profile Details -->
          <div v-else class="card mb-4 shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="card-title mb-0">Profile Details</h5>
                <div>
                  <button type="button" class="btn btn-primary btn-sm me-1" @click="toggleEditProfileForm">
                    Edit Profile
                  </button>
                  <button type="button" class="btn btn-outline-primary btn-sm" @click="toggleChangePasswordForm">
                    Change Password
                  </button>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-sm-3">
                  <p class="mb-0">Full Name</p>
                </div>
                <div class="col-sm-9">
                  <p class="text-muted mb-0">{{ user.name }}</p>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-sm-3">
                  <p class="mb-0">Email</p>
                </div>
                <div class="col-sm-9">
                  <p class="text-muted mb-0">{{ user.email }}</p>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-sm-3">
                  <p class="mb-0">Phone</p>
                </div>
                <div class="col-sm-9">
                  <p class="text-muted mb-0">{{ user.phone }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking History Section -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-white">
              <h5 class="card-title mb-0">Booking History</h5>
            </div>
            <div class="card-body">
              <div v-if="loadingBookings" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>

              <div v-else-if="bookingError" class="alert alert-danger">
                {{ bookingError }}
              </div>

              <div v-else-if="bookings.length === 0" class="text-center py-4">
                <p class="text-muted mb-0">You haven't made any bookings yet.</p>
              </div>

              <div v-else class="booking-list">
                <div v-for="booking in bookings" :key="booking.id" class="booking-item">
                  <div class="card h-100">
                    <div class="card-body d-flex flex-column">
                      <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="status-badge" :class="getStatusBadgeClass(booking.status)">
                          {{ getStatusText(booking.status) }}
                        </span>
                        <button class="btn btn-outline-primary btn-sm" @click="showBookingDetails(booking)">
                          <i class="fas fa-eye me-1"></i>
                          View details
                        </button>
                      </div>

                      <div class="flex-grow-1">
                        <p class="mb-1"><strong>Booking code:</strong> #{{ booking.id }}</p>
                        <p class="mb-0"><strong>Rooms booked:</strong> {{ booking.booking_details.length }}</p>
                        <p class="mb-0" v-if="booking.deposit"><strong>Deposit:</strong> {{
                          formatCurrency(booking.deposit) }}</p>
                        <p class="mb-0"><strong>Total payment:</strong> {{ formatCurrency(booking.total_payment) }}</p>
                      </div>
                      <div class="mt-2 text-muted small">
                        <i class="far fa-calendar-alt me-1"></i> Booking date: {{ formatDateTime(booking.created_at) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Booking Detail Modal -->
  <div v-if="showBookingDetail && selectedBooking" class="modal-overlay" @click="closeBookingDetails">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h5 class="modal-title">
          Booking details #{{ selectedBooking.id }}
          <span class="status-badge ms-2" :class="getStatusBadgeClass(selectedBooking.status)">
            {{ getStatusText(selectedBooking.status) }}
          </span>
        </h5>
        <button type="button" class="btn-close" @click="closeBookingDetails"></button>
      </div>
      <div class="modal-body">
        <div class="row mb-4">
          <div class="col-md-6">
            <h6 class="mb-3">Booking information</h6>
            <p class="mb-1"><strong>Booking date:</strong> {{ formatDateTime(selectedBooking.created_at) }}</p>
            <p class="mb-0"><strong>Note:</strong> {{ selectedBooking.note }}</p>
          </div>
        </div>

        <div class="booking-details">
          <h6 class="mb-3">Room details</h6>
          <div class="table-responsive">
            <table class="table table-bordered">
              <thead class="table-light">
                <tr>
                  <th>Room</th>
                  <th>Room type</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="detail in selectedBooking.booking_details" :key="detail.id">
                  <td>{{ detail.room_name }}</td>
                  <td>{{ detail.room_type }}</td>
                  <td>{{ formatDateTime(detail.checkin_at) }}</td>
                  <td>{{ formatDateTime(detail.checkout_at) }}</td>
                  <td>{{ formatCurrency(detail.price_per_day) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="closeBookingDetails">Close</button>
        <button v-if="selectedBooking?.status === 1" type="button" class="btn btn-primary" @click="openEditBookingModal">
          Edit
        </button>
      </div>
    </div>
  </div>

  <!-- Booking Detail Modal -->
  <BookingDetailModal
    v-if="showEditBookingModal && selectedBooking"
    :show="showEditBookingModal"
    :booking="selectedBooking"
    @close="closeEditBookingModal"
    @bookingUpdated="handleBookingUpdated"
  />

  <Footer />
</template>

<style scoped>
.hero {
  height: 150px;
  background-color: black;
}

/* Booking List Styles */
.booking-list {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  padding: 1rem 0;
}

.booking-item .card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: none;
  transition: all 0.3s ease;
}

.booking-item .card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.booking-item .card-body {
  padding: 1.25rem;
}

.status-badge {
  padding: 0.4em 0.8em;
  font-weight: 500;
  border-radius: 15px;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 90px;
  text-align: center;
}

.booking-date {
  font-size: 0.85rem;
  color: #6c757d;
}

.booking-actions .btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 5px;
}

.booking-item p {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.booking-item p strong {
  min-width: 100px;
  display: inline-block;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.booking-details {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.25rem;
  margin-top: 1rem;
}

.booking-details h6 {
  color: #212529;
  font-weight: 600;
  margin-bottom: 1rem;
}

.table {
  margin-bottom: 0;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.table th {
  font-weight: 600;
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  padding: 0.75rem;
  font-size: 0.9rem;
  color: #495057;
}

.table td {
  padding: 0.75rem;
  vertical-align: middle;
  font-size: 0.9rem;
  color: #212529;
  border-bottom: 1px solid #dee2e6;
}

.table tr:last-child td {
  border-bottom: none;
}

.table-responsive {
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .booking-list {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .modal-body {
    padding: 0.75rem;
  }

  .booking-details {
    padding: 1rem;
  }

  .table th,
  .table td {
    padding: 0.5rem;
    font-size: 0.85rem;
  }

  .booking-item p strong {
    min-width: 80px;
  }
}
</style>
