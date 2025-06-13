<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { api } from '../../lib/axios';
import { useToast } from 'vue-toastification';
import moment from 'moment';
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';
import { Trash2 } from 'lucide-vue-next';

const props = defineProps({
  show: Boolean,
  booking: Object,
});

const emit = defineEmits(['close', 'invoice-updated']);

const toast = useToast();

const invoiceDetails = ref([]);
const availableServices = ref([]);
const isLoading = ref(false);
const selectedServiceId = ref(null);

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  return moment(dateTimeString).format('HH:mm:ss DD/MM/YYYY');
};

const fetchAvailableServices = async () => {
  try {
    const response = await api.get(`/services`);
    availableServices.value = response.data?.data || [];
  } catch (error) {
    console.error('Error fetching available services:', error);
    toast.error('Don\'t have available services.');
  }
};

const fetchInvoiceDetails = async (bookingId) => {
  if (!bookingId) return;
  isLoading.value = true;
  try {
    const response = await api.get(`/bookings/${bookingId}/invoice-details`);
    invoiceDetails.value = response.data?.data || [];
  } catch (error) {
    if (error.response && error.response.status === 404) {
      invoiceDetails.value = [];
    } else {
      console.error('Error fetching invoice details:', error);
      invoiceDetails.value = [];
      toast.error('Don\'t have available services.');
    }
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.booking, (newBooking) => {
  if (newBooking && newBooking.id && props.show) {
    fetchInvoiceDetails(newBooking.id);
  } else if (!props.show) {
    invoiceDetails.value = [];
    selectedServiceId.value = null;
  }
}, { immediate: true, deep: true });

watch(() => props.show, (newVal) => {
  if (newVal && props.booking && props.booking.id) {
    fetchInvoiceDetails(props.booking.id);
    if (availableServices.value.length === 0) {
      fetchAvailableServices();
    }
  } else if (!newVal) {
    invoiceDetails.value = [];
    selectedServiceId.value = null;
  }
});

const addServiceToInvoice = () => {
  if (!selectedServiceId.value) {
    toast.warn('Please select a service.');
    return;
  }
  const serviceToAdd = availableServices.value.find(s => s.id === selectedServiceId.value);
  if (serviceToAdd) {
    invoiceDetails.value.push({
      id: null,
      client_temp_id: Date.now() + Math.random(),
      service_id: serviceToAdd.id,
      name: serviceToAdd.name,
      price: serviceToAdd.price,
      quantity: 1,
      added_this_session_at: new Date(),
    });
    selectedServiceId.value = null;
  }
};

const removeServiceFromInvoice = async (detail, index) => {
  const confirmation = confirm(`Are you sure you want to remove "${detail.name}" from the invoice?`);
  if (!confirmation) return;

  if (detail.id) {
    try {
      await api.delete(`/bookings/${props.booking.id}/invoice-details/${detail.id}`);
      toast.success(`Deleted "${detail.name}".`);
      invoiceDetails.value.splice(index, 1);
      emit('invoice-updated');
    } catch (error) {
      console.error('Error deleting service from invoice:', error);
      toast.error(`Failed to delete "${detail.name}".`);
    }
  } else {
    invoiceDetails.value.splice(index, 1);
    toast.info(`Removed "${detail.name}" (chưa lưu).`);
  }
};

const saveInvoice = async () => {
  if (!props.booking || !props.booking.id) {
    toast.error('No booking found.');
    return;
  }
  isLoading.value = true;
  try {
    const payload = {
      invoice_details: invoiceDetails.value.map(d => ({
        id: d.id,
        service_id: d.service_id,
        quantity: d.quantity,
      })),
    };
    const response = await api.post(`/bookings/${props.booking.id}/invoice-details`, payload);
    invoiceDetails.value = response.data?.invoice_details || [];
    toast.success('Invoice saved!');
    emit('invoice-updated');
    closeModal();
  } catch (error) {
    console.error('Error saving invoice:', error);
    const errorMessage = error.response?.data?.message || 'Failed to save invoice.';
    toast.error(errorMessage);
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  emit('close');
};

const totalAmount = computed(() => {
  return invoiceDetails.value.reduce((sum, detail) => {
    return sum + (parseFloat(detail.price) * parseInt(detail.quantity));
  }, 0);
});

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-GB', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' VNĐ';
};

onMounted(() => {
  fetchAvailableServices();
});

const handleCheckout = async () => {
  if (!props.booking || !props.booking.id) {
    toast.error('No booking found.');
    return;
  }

  if (![4, 8].includes(props.booking.status)) {
    toast.error('Booking is not ready for final checkout. Please ensure all rooms are checked out first.');
    return;
  }

  const confirmation = confirm('Are you sure you want to check out?');
  if (!confirmation) {
    return;
  }

  isLoading.value = true;
  try {
    const payload = {
      invoice_details: invoiceDetails.value.map(d => ({
        id: d.id,
        service_id: d.service_id,
        quantity: d.quantity,
      })),
    };
    const invoiceSaveResponse = await api.post(`/bookings/${props.booking.id}/invoice-details`, payload);
    invoiceDetails.value = invoiceSaveResponse.data?.invoice_details || [];

    await api.post(`/bookings/${props.booking.id}/check-out`);

    toast.success('Checkout successful!');
    emit('invoice-updated');
    closeModal();

  } catch (error) {
    console.error('Error checking out:', error);
    const errorMessage = error.response?.data?.message || 'Failed to check out.';
    toast.error(errorMessage);
  } finally {
    isLoading.value = false;
  }
};

</script>

<template>
  <div v-if="show" class="modal fade show d-block" tabindex="-1" aria-labelledby="invoiceServiceModalLabel"
    aria-hidden="true" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="invoiceServiceModalLabel"><strong>Service</strong></h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div v-if="isLoading" class="text-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div v-else>
            <div class="mb-3">
              <div>
                <p class="mb-1"><strong>Guest:</strong> {{ booking?.guest_name || 'N/A' }}</p>
                <p class="mb-1"><strong>Email:</strong> {{ booking?.guest_email || 'N/A' }}</p>
                <p class="mb-1"><strong>Phone number:</strong> {{ booking?.guest_phone || 'N/A' }}</p>
                <p class="mb-1"><strong>Estimated room rate:</strong> {{ formatCurrency(booking?.total_payment) }}</p>
              </div>
            </div>
            <hr />
            <div class="row mb-3 align-items-end">
              <div class="col-md-8">
                <label for="serviceSelect" class="form-label">Select service:</label>
                <v-select id="serviceSelect" label="name" :options="availableServices" :reduce="service => service.id"
                  v-model="selectedServiceId" placeholder="Search" class="form-control-vue-select">
                  <template #option="option">
                    {{ option.name }} - {{ formatCurrency(option.price) }}
                  </template>
                  <template #selected-option="option">
                    {{ option.name }} - {{ formatCurrency(option.price) }} VND
                  </template>
                </v-select>
              </div>
              <div class="col-md-4">
                <button class="btn btn-success w-100 mt-auto" @click="addServiceToInvoice"
                  :disabled="!selectedServiceId">
                  <i class="fas fa-plus"></i> Add
                </button>
              </div>
            </div>

            <h6>List of services:</h6>
            <div v-if="invoiceDetails.length === 0" class="alert alert-info">
              No services have been added.
            </div>
            <table v-else class="table table-sm table-bordered">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style="width: 150px;">Unit Price</th>
                  <th style="width: 120px;">Quantity</th>
                  <th style="width: 180px;">Time</th>
                  <th style="width: 150px;">Total</th>
                  <th style="width: 100px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(detail, index) in invoiceDetails" :key="detail.id || detail.client_temp_id">
                  <td>{{ detail.name }}</td>
                  <td>{{ parseFloat(detail.price)?.toLocaleString() }} VND</td>
                  <td>
                    <input type="number" class="form-control form-control-sm" v-model.number="detail.quantity" min="1"
                      @change="detail.quantity = Math.max(1, detail.quantity || 1)">
                  </td>
                  <td>
                    {{ detail.added_this_session_at ? formatDateTime(detail.added_this_session_at) : (detail.created_at
                      ?
                      formatDateTime(detail.created_at) : 'N/A') }}
                  </td>
                  <td>{{ (parseFloat(detail.price) * parseInt(detail.quantity))?.toLocaleString() }} VND</td>
                  <td class="text-center">
                    <button class="btn btn-danger btn-sm" @click="removeServiceFromInvoice(detail, index)">
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="text-end fw-bold">Total amount:</td>
                  <td colspan="2" class="fw-bold">{{ formatCurrency(totalAmount) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
          <button type="button" class="btn btn-primary" @click="saveInvoice"
            :disabled="isLoading || invoiceDetails.length === 0">
            <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Save
          </button>
          <button type="button" class="btn btn-success" @click="handleCheckout"
            :disabled="isLoading || !props.booking || ![4, 8].includes(props.booking.status)">
            <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Check out
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-dialog {
  max-width: 1000px;
}

.table th,
.table td {
  vertical-align: middle;
}

.form-control-vue-select :deep(.vs__dropdown-toggle) {
  border-color: #ced4da;
  border-radius: 0.25rem;
  min-height: calc(1.5em + 0.75rem + 2px);
  display: flex;
  align-items: center;
}

.form-control-vue-select.is-invalid :deep(.vs__dropdown-toggle) {
  border-color: #dc3545;
}

.form-control-vue-select :deep(.vs__search::placeholder),
.form-control-vue-select :deep(.vs__search) {
  margin-top: 0;
  padding-left: 0.1rem;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 1rem;
  line-height: 1.5;
  height: calc(1.5em + 0.75rem - 4px);
}

.form-control-vue-select :deep(.vs__selected) {
  margin: 0;
  padding: 0 0.25rem 0 0.1rem;
  font-size: 1rem;
  line-height: 1.5;
  max-width: calc(100% - 30px);
}

.form-control-vue-select :deep(.vs__actions) {
  padding: 0 6px 0 3px;
  align-self: center;
}

.form-control-vue-select :deep(.vs__clear),
.form-control-vue-select :deep(.vs__open-indicator) {
  fill: #495057;
}

.form-control-vue-select {
  padding: 0;
  line-height: normal;
}
</style>
