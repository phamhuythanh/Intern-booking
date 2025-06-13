<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import RevenueChart from '@/modules/admin/components/RevenueChart.vue';
import moment from 'moment';
import { ChartData } from 'chart.js';
import { api } from '@/modules/admin/lib/axios';

const revenueType = ref('day');
const rawData = ref<any[]>([]);
const isTransitioning = ref(true);
const getRevenue = async (type: string) => {
  try {
    const response = await api.get('/revenue', { params: { type } });
    rawData.value = response.data;
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    rawData.value = [];
  } finally {
    isTransitioning.value = false;
  }
};

const setRevenueType = (type: string) => {
  revenueType.value = type;
  getRevenue(type);
}

const chartData = computed<ChartData<'line'>>(() => {
  if (!rawData.value || rawData.value.length === 0) {
    return { labels: [], datasets: [] };
  }

  const labels = rawData.value.map(item => item.revenue_date || item.revenue_week || item.revenue_month);
  const data = rawData.value.map(item => item.revenue);

  return {
    labels,
    datasets: [
      {
        label: 'Revenue',
        backgroundColor: 'rgba(78, 115, 223, 0.05)',
        borderColor: 'rgba(78, 115, 223, 1)',
        pointRadius: 3,
        pointBackgroundColor: "rgba(78, 115, 223, 1)",
        pointBorderColor: "rgba(78, 115, 223, 1)",
        pointHoverRadius: 3,
        pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
        pointHoverBorderColor: "rgba(78, 115, 223, 1)",
        pointHitRadius: 10,
        pointBorderWidth: 2,
        data: data,
      },
    ],
  };
});

const roomCheckouts = ref<any[]>([]);
const contacts = ref<any[]>([]);
const users = ref<any[]>([]);
const bookings = ref<any[]>([]);

const fetchRoomCheckouts = async () => {
  try {
    const response = await api.get('/get-today-checkout-rooms');
    roomCheckouts.value = response.data;
  } catch (error) {
    console.error('Error fetching room checkouts:', error);
    roomCheckouts.value = [];
  }
};

const fetchContact = async () => {
  try {
    const response = await api.get('/count-contacts');
    contacts.value = response.data;
  } catch (error) {
    console.error('Error fetching count contact', error);
  }
};

const fetchUsers = async () => {
  try {
    const response = await api.get('/count-users');
    users.value = response.data;
  } catch (error) {
    console.error('Error fetching count users:', error);
  }
};

const fetchBookings = async () => {
  try {
    const response = await api.get('/count-bookings');
    bookings.value = response.data;
  } catch (error) {
    console.error('Error fetching count users:', error);
  } finally {
    isTransitioning.value = false;
  }
};

const formatDate = (dateString: string | null, format = 'DD-MM-YYYY HH:mm') => {
  if (!dateString) return '';
  return moment(dateString).format(format);
};

const getStatusText = (status: number) => {
  switch (status) {
    case 1: return 'PENDING';
    case 2: return 'CHECKED IN';
    case 3: return 'CHECKED OUT';
    default: return 'UNKNOWN';
  }
};

const getBadgeClass = (status: number) => {
  switch (status) {
    case 1: return 'bg-secondary';
    case 2: return 'bg-primary';
    case 3: return 'bg-success';
    default: return 'bg-dark';
  }
};

onMounted(() => {
  getRevenue(revenueType.value);
  fetchRoomCheckouts();
  fetchContact();
  fetchUsers();
  fetchBookings();
});
</script>

<template>
  <div class="row">
    <div class="col-xl-8 col-lg-7">
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 class="m-0 font-weight-bold text-primary">Revenue Overview</h6>
          <div class="btn-group" role="group" aria-label="Revenue type">
            <button type="button" class="btn btn-sm btn-outline-primary" :class="{ 'active': revenueType === 'day' }"
              @click="setRevenueType('day')">Day</button>
            <button type="button" class="btn btn-sm btn-outline-primary" :class="{ 'active': revenueType === 'week' }"
              @click="setRevenueType('week')">Week</button>
            <button type="button" class="btn btn-sm btn-outline-primary" :class="{ 'active': revenueType === 'month' }"
              @click="setRevenueType('month')">Month</button>
          </div>
        </div>
        <div class="card-body">
          <div class="chart-area" style="height: 320px;">
            <div v-if="isTransitioning" class="d-flex justify-content-center align-items-center w-100"
              style="min-height: 500px;">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden"></span>
              </div>
            </div>
            <RevenueChart v-if="chartData.datasets.length" :chart-data="chartData" />
          </div>
        </div>
      </div>
    </div>
    <div class="col-xl-4 col-lg-5">
      <div class="row">
        <div class="col-xl-12 col-md-6 mb-4">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Users</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ users }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-users fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-12 col-md-6 mb-4">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Pending Requests</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ contacts }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-comments fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-12 col-md-6 mb-4">
          <div class="card border-left-secondary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-secondary text-uppercase mb-1">
                    Pending Bookings</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ bookings }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-list fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <div class="card shadow mb-4">
    <div class="card-header py-3">
      <h6 class="m-0 font-weight-bold text-primary">Bookings Day</h6>
    </div>
    <div class="card-body">
      <div class="table-responsive">
        <table class="table table-bordered" id="dataTable" width="100%" cellspacing="0">
          <thead>
            <tr>
              <th width="5%">#</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Room</th>
              <th>Check-in At</th>
              <th>Check-out At</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(roomCheckout, index) in roomCheckouts" :key="roomCheckout.id">
              <td>{{ index + 1 }}</td>
              <td>{{ roomCheckout.guest_name }}</td>
              <td>{{ roomCheckout.guest_phone }} </td>
              <td>{{ roomCheckout.room_name }}</td>
              <td>{{ formatDate(roomCheckout.checkin_at, 'HH:mm DD-MM-YYYY') }}</td>
              <td>{{ formatDate(roomCheckout.checkout_at, 'HH:mm DD-MM-YYYY') }}</td>
              <td>
                <span :class="['badge', getBadgeClass(roomCheckout.status), 'badge-custom-size']">
                  {{ getStatusText(roomCheckout.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.badge-custom-size {
  padding: 0.5em 0.8em;
  min-width: 100px;
  text-align: center;
  display: inline-block;
  border-radius: .35rem;
}
</style>
