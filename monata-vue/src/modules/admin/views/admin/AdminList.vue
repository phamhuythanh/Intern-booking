<template>
    <div>
        <div class="card shadow mb-4">
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Admin List</h6>
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
                            <div class="col-12 col-md-6 col-lg-3 mt-1 mb-1">
                                <input v-model="searchForm.name" type="text" class="form-control form-control-sm"
                                    placeholder="Admin name ..." />
                            </div>
                            <div class="col-12 col-md-6 col-lg-3 mt-1 mb-1">
                                <input v-model="searchForm.email" type="text" class="form-control form-control-sm"
                                    placeholder="Admin email ..." />
                            </div>
                            <div class="col-12 col-md-6 col-lg-3 mt-1 mb-1">
                                <input v-model="searchForm.phone" type="text" inputmode="numeric"
                                    class="form-control form-control-sm" placeholder="Admin phone ..." />
                            </div>
                            <div class="col-12 col-lg-1 mt-1 mb-1">
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
                                <th>Email</th>
                                <th>Phone</th>
                                <th class="text-center">
                                    <button @click="showCreateModal = true" class="btn btn-primary btn-sm">
                                        <Plus />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="admin of admins" :key="admin.id">
                                <td class="col-lg-3 col-md-3 col-sm-3">
                                    <template v-if="editingAdmin?.id === admin.id">
                                        <input v-model="editingAdmin.name" type="text" class="form-control"
                                            :class="{ 'is-invalid': errors.name }" />
                                        <div v-if="errors.name" class="invalid-feedback">
                                            {{ errors.name[0] }}
                                        </div>
                                    </template>
                                    <template v-else>
                                        {{ admin.name }}
                                    </template>
                                </td>
                                <td class="col-lg-3 col-md-3 col-sm-3">
                                    <template v-if="editingAdmin?.id === admin.id">
                                        <input v-model="editingAdmin.email" type="email" class="form-control"
                                            :class="{ 'is-invalid': errors.email }" />
                                        <div v-if="errors.email" class="invalid-feedback">
                                            {{ errors.email[0] }}
                                        </div>
                                    </template>
                                    <template v-else>
                                        {{ admin.email }}
                                    </template>
                                </td>
                                <td class="col-lg-3 col-md-3 col-sm-3">
                                    <template v-if="editingAdmin?.id === admin.id">
                                        <input v-model="editingAdmin.phone" type="text" inputmode="numeric"
                                            class="form-control" :class="{ 'is-invalid': errors.phone }" />
                                        <div v-if="errors.phone" class="invalid-feedback">
                                            {{ errors.phone[0] }}
                                        </div>
                                    </template>
                                    <template v-else>
                                        {{ admin.phone }}
                                    </template>
                                </td>
                                <td>
                                    <template v-if="editingAdmin?.id === admin.id">
                                        <button class="btn btn-success btn-sm me-1" @click="handleUpdateAdmin">
                                            <Check />
                                        </button>
                                        <button class="btn btn-secondary btn-sm" @click="cancelEdit">
                                            <X />
                                        </button>
                                    </template>
                                    <template v-else>
                                        <button class="btn btn-warning btn-sm me-1" @click="startEdit(admin)">
                                            <SquarePen />
                                        </button>
                                        <button v-if="admin.role !== 'superadmin'" class="btn btn-danger btn-sm"
                                            @click="actionDeleteAdmin(admin.id)">
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
        <AdminCreate v-model="showCreateModal" @created="fetchAdmins" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdmin } from '../../composables/admin/Admin.service';
import Pagination from '../../components/layouts/Pagination.vue';
import { SquarePen, Trash2, Plus, Check, X } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import AdminCreate from './AdminCreate.vue';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const {
    admins,
    meta,
    currentPage,
    searchForm,
    onSearch,
    syncFormWithQuery,
    fetchAdmins,
    actionDeleteAdmin,
    errors,
    updateAdmin,
    editingAdmin,
    startEdit,
    cancelEdit,
    handleUpdateAdmin
} = useAdmin();

const showCreateModal = ref(false)

watch(() => route.query, (newQuery) => {
    fetchAdmins();
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
