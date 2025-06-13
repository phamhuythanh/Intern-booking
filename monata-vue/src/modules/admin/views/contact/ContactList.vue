<template>
  <div>
    <!-- Toast thông báo -->
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999">
      <div id="successToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header bg-success text-white">
          <i class="fas fa-check-circle me-2"></i>
          <strong class="me-auto">Thông báo</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body bg-white">
          Gửi phản hồi thành công!
        </div>
      </div>
    </div>
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Service List</h6>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-lg-2 col-md-2 col-sm-2 mt-1 mb-1">
            <div class="dataTables_length" id="dataTable_length">
              <label>Show
                <select v-model="searchForm.per_page" @change="onSearch" name="dataTable_length"
                  aria-controls="dataTable"
                  class="select-per-page custom-select custom-select-sm form-control form-control-sm">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select> entries
              </label>
            </div>
          </div>
          <div class="col-lg-10 col-md-10 col-sm-10 mt-3 mb-1">
            <form @submit.prevent="onSearch" class="row g-3 align-items-center">
              <div class="col-12 col-md-4 mt-1 mb-1">
                <input v-model="searchForm.guest_name" type="text" class="form-control form-control-sm"
                  placeholder="Guest_name ..." />
              </div>
              <div class="col-12 col-md-4 mt-1 mb-1">
                <input v-model="searchForm.guest_email" type="text" class="form-control form-control-sm"
                  placeholder="Guest_email ..." />
              </div>
              <div class="col-12 col-md-3 mt-1 mb-1">
                <select v-model="searchForm.status" class="custom-select custom-select-sm form-control form-control-sm">
                  <option value="">-- Select status --</option>
                  <option :value="ContactStatus.Unresponse">Unresponse</option>
                  <option :value="ContactStatus.Response">Response</option>
                </select>
              </div>
              <div class="col-12 col-md-1 mt-1 mb-1">
                <button type="submit" class="btn btn-primary btn-sm">
                  <i class="fa-solid fa-magnifying-glass me-1"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-bordered row-5" id="dataTable" width="100%" cellspacing="0">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Guest Email</th>
                <th>Status</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contact of contacts" :key="contact.id">
                <td class="col-lg-2 col-md-2 col-sm-2">{{ contact.guest_name }}</td>
                <td class="col-lg-2 col-md-2 col-sm-2">{{ contact.guest_email }}</td>
                <td class="col-lg-1 col-md-1 col-sm-1">
                  <span
                    :class="['status-label badge', contact.status === ContactStatus.Response ? 'btn-success' : 'btn-warning']">
                    {{ contact.status === ContactStatus.Response ? 'Response' : 'Unresponse' }}
                  </span>
                </td>
                <td class="col-lg-1 col-md-1 col-sm-1 text-center">
                  <button class="btn btn-info btn-sm" @click="showContactModal(contact)" title="Show Contact Detail">
                    <Eye />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <Pagination v-model:currentPage="currentPage" :meta="meta" />
    <ContactShow :is-open="isContactModalOpen" :contact="selectedContact" @close="closeContactModal"
      @reply-sent="handleReplySent" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useContact } from '../../composables/contact/Contact.service';
import { ContactStatus } from '../../stores/enum/Contact';
import Pagination from '../../components/layouts/Pagination.vue';
import { Eye } from 'lucide-vue-next';
import ContactShow from './ContactShow.vue';
import { Toast } from 'bootstrap';

const route = useRoute();
const router = useRouter();

const {
  contacts,
  meta,
  currentPage,
  searchForm,
  onSearch,
  syncFormWithQuery,
  fetchContacts,
  isContactModalOpen,
  selectedContact,
  showContactModal,
  closeContactModal,
} = useContact();

watch(() => route.query, (newQuery) => {
  fetchContacts();
  syncFormWithQuery();
}, { immediate: true, deep: true });

watch(currentPage, (newPage) => {
  router.push({
    query: {
      ...route.query,
      page: newPage.toString(),
    },
  });
});

onMounted(() => {
  syncFormWithQuery();
});

const handleReplySent = (success: boolean) => {
  if (success) {
    fetchContacts();

    const toastEl = document.getElementById('successToast');
    if (toastEl) {
      const toast = new Toast(toastEl, {
        autohide: true,
        delay: 3000,
        animation: true
      });
      toast.show();
    }
  }
};

</script>

<style scoped>
.form-control {
  width: 100%;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}

.form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, .25);
}

.select-per-page {
  width: 60px;
  display: inline-block;
}

.toast-container {
  right: 0;
  top: 0;
  margin-right: 1rem;
  margin-top: 1rem;
}

.toast {
  min-width: 300px;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  border: none;
  margin-left: auto;
}

.toast-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1rem;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

.toast-body {
  padding: 1rem;
  color: #333;
}

.btn-close-white {
  filter: brightness(0) invert(1);
  opacity: 0.8;
}

.btn-close-white:hover {
  opacity: 1;
}

.toast.showing {
  opacity: 0;
}

.toast.show {
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.toast.hide {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.status-label {
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-radius: 0.5rem;
}
</style>
