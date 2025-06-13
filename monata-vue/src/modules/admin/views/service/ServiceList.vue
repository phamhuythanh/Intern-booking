<template>
  <div>
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
                <input v-model="searchForm.name" type="text" class="form-control form-control-sm"
                  placeholder="Service name ..." />
              </div>
              <div class="col-12 col-md-4 mt-1 mb-1">
                <input v-model="searchForm.price" type="number" class="form-control form-control-sm"
                  placeholder="Service price ..." />
              </div>
              <div class="col-12 col-md-3 mt-1 mb-1">
                <select v-model="searchForm.status" class="custom-select custom-select-sm form-control form-control-sm">
                  <option value="">-- Select status --</option>
                  <option :value="ServiceStatus.Active">Active</option>
                  <option :value="ServiceStatus.Inactive">Inactive</option>
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
                <th>Name</th>
                <th>Price</th>
                <th>Status</th>
                <th v-if="authStore.user.role === USER_ROLES.SUPERADMIN" class="text-center">
                  <button class="btn btn-primary btn-sm" @click="startCreate" v-if="!isCreating">
                    <Plus />
                  </button>
                  <button class="btn btn-secondary btn-sm" @click="cancelCreate" v-else>
                    <X />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isCreating">
                <td class="col-lg-4 col-md-4 col-sm-4">
                  <input v-model="form.name" type="text" class="form-control" :class="{ 'is-invalid': errors.name }" />
                  <div v-if="errors.name" class="invalid-feedback">
                    {{ errors.name[0] }}
                  </div>
                </td>
                <td class="col-lg-4 col-md-4 col-sm-4">
                  <input v-model="form.price" type="number" class="form-control"
                    :class="{ 'is-invalid': errors.price }" />
                  <div v-if="errors.price" class="invalid-feedback">
                    {{ errors.price[0] }}
                  </div>
                </td>
                <td class="col-lg-3 col-md-3 col-sm-3">
                  <select v-model="form.status" class="form-control" :class="{ 'is-invalid': errors.status }">
                    <option :value="ServiceStatus.Active">Active</option>
                    <option :value="ServiceStatus.Inactive">Inactive</option>
                  </select>
                  <div v-if="errors.status" class="invalid-feedback">
                    {{ errors.status[0] }}
                  </div>
                </td>
                <td>
                  <button class="btn btn-success btn-sm mr-1  " @click="handleCreate">
                    <Check />
                  </button>
                  <button class="btn btn-secondary btn-sm" @click="cancelCreate">
                    <X />
                  </button>
                </td>
              </tr>
              <tr v-for="service of services" :key="service.id">
                <td class="col-lg-4 col-md-4 col-sm-4">
                  <template v-if="editingService?.id === service.id">
                    <input v-model="editingService.name" type="text" class="form-control"
                      :class="{ 'is-invalid': errors.name }" />
                    <div v-if="errors.name" class="invalid-feedback">
                      {{ errors.name[0] }}
                    </div>
                  </template>
                  <template v-else>
                    {{ service.name }}
                  </template>
                </td>
                <td class="col-lg-4 col-md-4 col-sm-4">
                  <template v-if="editingService?.id === service.id">
                    <input v-model="editingService.price" type="number" class="form-control"
                      :class="{ 'is-invalid': errors.price }" />
                    <div v-if="errors.price" class="invalid-feedback">
                      {{ errors.price[0] }}
                    </div>
                  </template>
                  <template v-else>
                    {{ formatCurrency(service.price) }}
                  </template>
                </td>
                <td class="col-lg-3 col-md-3 col-sm-3">
                  <template v-if="editingService?.id === service.id">
                    <select v-model="editingService.status" class="form-control"
                      :class="{ 'is-invalid': errors.status }">
                      <option :value="ServiceStatus.Active">Active</option>
                      <option :value="ServiceStatus.Inactive">Inactive</option>
                    </select>
                    <div v-if="errors.status" class="invalid-feedback">
                      {{ errors.status[0] }}
                    </div>
                  </template>
                  <template v-else>
                    <span
                      :class="['status-label badge', service.status === ServiceStatus.Active ? 'btn-success' : 'btn-danger']">
                      {{ service.status === ServiceStatus.Active ? 'Active' : 'Inactive' }}
                    </span>
                  </template>
                </td>
                <td v-if="authStore.user.role === USER_ROLES.SUPERADMIN">
                  <template v-if="editingService?.id === service.id">
                    <button class="btn btn-success btn-sm me-1" @click="handleUpdateService">
                      <Check />
                    </button>
                    <button class="btn btn-secondary btn-sm" @click="cancelEdit">
                      <X />
                    </button>
                  </template>
                  <template v-else>
                    <button class="btn btn-warning btn-sm me-1" @click="startEdit(service)">
                      <SquarePen />
                    </button>
                    <button class="btn btn-danger btn-sm" @click="actionDeleteService(service.id)">
                      <Trash2 />
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <Pagination v-model:currentPage="currentPage" :meta="meta" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useService } from '../../composables/service/Service.service';
import { ServiceStatus } from '../../stores/enum/Service';
import Pagination from '../../components/layouts/Pagination.vue';
import { SquarePen, Trash2, Plus, Check, X } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth'
import { USER_ROLES } from '@/modules/admin/constants';

const authStore = useAuthStore()
const route = useRoute();
const router = useRouter();

const {
  services,
  meta,
  currentPage,
  fetchServices,
  actionDeleteService,
  editingService,
  startEdit,
  cancelEdit,
  handleUpdateService,
  searchForm,
  onSearch,
  syncFormWithQuery,
  form,
  errors,
  isCreating,
  startCreate,
  cancelCreate,
  handleCreate,
  formatCurrency
} = useService();

watch(() => route.query, (newQuery) => {
  fetchServices();
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

.status-label {
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-radius: 0.5rem;
}
</style>
