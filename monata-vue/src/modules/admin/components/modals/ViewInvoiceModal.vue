<script setup>
import { ref, computed, watch, toRefs } from 'vue';
import moment from 'moment';
import { Printer } from 'lucide-vue-next';
import { api } from '../../lib/axios';
import { useToast } from 'vue-toastification';

const props = defineProps({
  show: Boolean,
  bookingData: Object,
});

const emit = defineEmits(['close']);
const toast = useToast();

const detailedBookingInfo = ref(null);
const fetchedInvoiceServices = ref([]);
const isLoading = ref(false);

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  return moment(dateTimeString).format('HH:mm:ss DD/MM/YYYY');
};

const displayBookingId = computed(() => detailedBookingInfo.value?.id || props.bookingData?.id || 'N/A');
const guestNameDisplay = computed(() => detailedBookingInfo.value?.guest_name || props.bookingData?.guest_name || 'N/A');
const guestEmailDisplay = computed(() => detailedBookingInfo.value?.guest_email || props.bookingData?.guest_email || 'N/A');
const guestPhoneDisplay = computed(() => detailedBookingInfo.value?.guest_phone || props.bookingData?.guest_phone || 'N/A');

const checkInDateDisplay = computed(() => {
  const date = detailedBookingInfo.value?.check_in_date || detailedBookingInfo.value?.booking_details?.[0]?.checkin_at;
  return date ? formatDateTime(date) : 'N/A';
});

const checkOutDateDisplay = computed(() => {
  const date = detailedBookingInfo.value?.check_out_date || detailedBookingInfo.value?.booking_details?.[0]?.checkout_at;
  return date ? formatDateTime(date) : 'N/A';
});

const roomNamesDisplay = computed(() => {
  if (detailedBookingInfo.value?.booking_details && detailedBookingInfo.value.booking_details.length > 0) {
    return detailedBookingInfo.value.booking_details.map(detail => detail.room?.name || detail.rooms?.name || 'Không xác định').join(', ');
  }
  return props.bookingData?.room?.name || 'N/A';
});

const totalServiceCost = computed(() => {
  return fetchedInvoiceServices.value.reduce((sum, detail) => {
    return sum + (parseFloat(detail.price) * parseInt(detail.quantity));
  }, 0);
});

const finalTotalAmount = computed(() => {
  return detailedBookingInfo.value?.total_payment || 0;
});

const roomPrice = computed(() => {
  return Number(finalTotalAmount.value || 0) - Number(totalServiceCost.value || 0) + Number(deposit.value || 0);
});

const deposit = computed(() => {
  return detailedBookingInfo.value?.deposit || 0;
})
const fetchFullInvoiceDetails = async (bookingId) => {
  if (!bookingId) return;
  isLoading.value = true;
  try {
    const bookingResponse = await api.get(`/bookings/${bookingId}`);
    detailedBookingInfo.value = bookingResponse.data?.data;

    const servicesResponse = await api.get(`/bookings/${bookingId}/invoice-details`);
    fetchedInvoiceServices.value = servicesResponse.data?.data || [];

  } catch (error) {
    console.error('Error fetching full invoice details:', error);
    const errorMessage = error.response?.data?.message || 'Failed to fetch invoice details.';
    toast.error(errorMessage);

    detailedBookingInfo.value = null;
    fetchedInvoiceServices.value = [];
  } finally {
    isLoading.value = false;
  }
};

watch([() => props.show, () => props.bookingData?.id], ([newShow, newBookingId], [oldShow, oldBookingId]) => {
  if (newShow && newBookingId) {
    fetchFullInvoiceDetails(newBookingId);
  } else if (!newShow) {
    detailedBookingInfo.value = null;
    fetchedInvoiceServices.value = [];
    isLoading.value = false;
    console.log("Modal closed, resetting data.");
  }
}, { immediate: false });

const closeModal = () => {
  emit('close');
};

const printInvoice = () => {
  const printableArea = document.getElementById('printable-invoice-area');
  if (printableArea) {
    const printContents = printableArea.innerHTML;
    const originalContents = document.body.innerHTML;

    const iframe = document.createElement('iframe');
    iframe.style.height = '0';
    iframe.style.width = '0';
    iframe.style.position = 'absolute';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    iframe.contentDocument.write('<html><head><title>Print Invoice</title>');

    Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach(styleEl => {
      iframe.contentDocument.head.appendChild(styleEl.cloneNode(true));
    });
    iframe.contentDocument.write('</head><body>');
    iframe.contentDocument.write(printContents);
    iframe.contentDocument.write('</body></html>');
    iframe.contentDocument.close();

    iframe.onload = function () {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    };
  } else {
    window.print();
  }
};

watch(() => props.bookingData, (newVal, oldVal) => {
}, { deep: true, immediate: true });

</script>

<template>
  <div v-if="show" class="modal fade show d-block" tabindex="-1" aria-labelledby="viewInvoiceModalLabel"
    aria-hidden="true" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="viewInvoiceModalLabel">Booking Invoice</h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body" id="printable-invoice-area">
          <div v-if="isLoading" class="text-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading...</p>
          </div>
          <div v-else-if="!detailedBookingInfo && !isLoading">
            <p>No invoice found.</p>
          </div>
          <div v-else>
            <div class="customer-info mb-4">
              <div>
                <p><strong>Guest:</strong> {{ guestNameDisplay }}</p>
                <p><strong>Email:</strong> {{ guestEmailDisplay }}</p>
                <p><strong>Phone number:</strong> {{ guestPhoneDisplay }}</p>
                <p><strong>Check in:</strong> {{ checkInDateDisplay }}</p>
                <p><strong>Check out:</strong> {{ checkOutDateDisplay }}</p>
              </div>
            </div>

            <div class="payment-details">
              <h6 class="mb-3 text-uppercase text"><strong>Payment Details</strong></h6>

              <div v-if="fetchedInvoiceServices.length > 0">
                <p><strong>Services used</strong></p>
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th class="text-center">Quantity</th>
                      <th class="text-end">Unit price</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="service in fetchedInvoiceServices" :key="service.id || service.service_id">
                      <td>{{ service.name || service.service?.name }}</td>
                      <td class="text-center">{{ service.quantity }}</td>
                      <td class="text-end">{{ formatCurrency(service.price || service.service?.price) }}</td>
                      <td class="text-end">{{ formatCurrency((service.price || service.service?.price) *
                        service.quantity) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="text-end fw-bold">Total service amount:</td>
                      <td class="text-end fw-bold">{{ formatCurrency(totalServiceCost) }}</td>
                    </tr>
                  </tfoot>

                </table>
              </div>
              <div v-else>
                <p><em>No services used</em></p>
              </div>
              <hr />
              <div class="row mb-2">
                <div class="col-8"><strong>Room rate:</strong></div>
                <div class="col-4 text-end">{{ formatCurrency(roomPrice) }}</div>
              </div>
              <div class="row mb-2">
                <div class="col-8"><strong>Deposit:</strong></div>
                <div class="col-4 text-end">- {{ formatCurrency(deposit) }}</div>
              </div>
              <div class="row mb-2">
                <div class="col-8"><strong>Service:</strong></div>
                <div class="col-4 text-end">+ {{ formatCurrency(totalServiceCost) }}</div>
              </div>
              <hr class="my-2">
              <div class="row mt-3">
                <div class="col-8 h5"><strong>Total payment:</strong></div>
                <div class="col-4 text-end h5">{{ formatCurrency(finalTotalAmount) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            Close
          </button>
          <button type="button" class="btn btn-primary" @click="printInvoice"
            :disabled="isLoading || !detailedBookingInfo">
            <Printer class="me-1" size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-dialog {
  max-width: 800px;
}

.table th,
.table td {
  vertical-align: middle;
}

.customer-info p,
.payment-details p {
  margin-bottom: 0.5rem;
}

@media print {
  body * {
    visibility: hidden;
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

  .modal-content {
    box-shadow: none !important;
    border: none !important;
  }

  .modal-header,
  .modal-footer {
    display: none !important;
  }
}
</style>
