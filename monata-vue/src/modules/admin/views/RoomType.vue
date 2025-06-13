<script setup>
import { ref, onMounted, computed } from 'vue';
import { Modal } from 'bootstrap';
import { Plus, SquarePen, Trash2, X } from 'lucide-vue-next';
import { useToast } from 'vue-toastification'
import { api } from '../lib/axios'
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';
import { useAuthStore } from '@/stores/auth'
import { USER_ROLES } from '@/modules/admin/constants';

const authStore = useAuthStore()
const toast = useToast()
const roomTypes = ref([]);
const isEditing = ref(false);
const isTransitioning = ref(true);
const currentRoomType = ref({
  id: null,
  name: '',
  price: '',
  properties: [],
});
let roomTypeModal = null;

const propertyToAdd = ref(null);

const propertiesList = ref([]);

const fetchProperties = async () => {
  try {
    const response = await api.get(`/properties`, { params: { per_page: 1000 } });
    propertiesList.value = response.data?.data || [];
  } catch (error) {
    propertiesList.value = [];
  } finally {
    isTransitioning.value = false;
  }
};

const fetchRoomTypes = async () => {
  try {
    const response = await api.get(`/room-types`);
    roomTypes.value = (response.data?.data || []).map(item => ({
      ...item,
      price: parseFloat(item.price),
      properties: item.properties || [],
    }));
  } catch (error) {
    roomTypes.value = [];
  }
};

onMounted(() => {
  fetchRoomTypes();
  fetchProperties();
  roomTypeModal = new Modal(document.getElementById('roomTypeModal'), {
    backdrop: 'static',
    keyboard: false
  });
});

const formatCurrency = (value) => {
  if (!value) return '0';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

const openAddModal = () => {
  isEditing.value = false;
  currentRoomType.value = {
    id: null,
    name: '',
    price: '',
    properties: [],
  };
  roomTypeModal.show();
};

const editRoomType = (roomType) => {
  isEditing.value = true;
  const uniqueProps = [];
  const seen = new Set();
  (roomType.properties || []).forEach(prop => {
    if (!seen.has(prop.property_id)) {
      uniqueProps.push({
        property_id: prop.property_id,
        value: prop.value
      });
      seen.add(prop.property_id);
    }
  });
  currentRoomType.value = {
    id: roomType.id,
    name: roomType.name,
    price: roomType.price,
    properties: uniqueProps
  };
  roomTypeModal.show();
};

const saveRoomType = async () => {
  try {
    const payload = {
      name: currentRoomType.value.name,
      price: currentRoomType.value.price,
      properties: currentRoomType.value.properties
        .filter(p => p.property_id && p.value !== '')
        .map(p => ({
          property_id: Number(p.property_id),
          value: p.value
        }))
    };
    if (isEditing.value) {
      await api.put(`/room-types/${currentRoomType.value.id}`, payload);
    } else {
      await api.post(`/room-types`, payload);
    }
    await fetchRoomTypes();
    roomTypeModal.hide();
    toast.success('Room type saved successfully!');
  } catch (error) {
    toast.error('Failed to save room type!');
  }
};

const deleteRoomType = async (id) => {
  if (confirm('Are you sure you want to delete this room type?')) {
    try {
      await api.delete(`/room-types/${id}`);
      await fetchRoomTypes();
      toast.success('Room type deleted successfully!');
    } catch (error) {
      toast.error('Don\'t delete this room type!');
      console.error('Error deleting room type:', error);
    }
  }
};

const selectableProperties = computed(() => {
  if (!propertiesList.value || !currentRoomType.value) return [];
  const addedPropertyIds = new Set(currentRoomType.value.properties.map(p => p.property_id));
  return propertiesList.value.filter(p => !addedPropertyIds.has(p.id));
});

const handlePropertySelected = (selectedPropertyId) => {
  if (selectedPropertyId) {
    const propertyExists = currentRoomType.value.properties.some(p => p.property_id === selectedPropertyId);
    if (!propertyExists) {
      currentRoomType.value.properties.push({ property_id: selectedPropertyId, value: '' });
    }
    propertyToAdd.value = null;
  }
};

const removeProperty = (index) => {
  const confirmation = confirm(`Are you sure you want to remove this property?`);
  if (!confirmation) return;

  currentRoomType.value.properties.splice(index, 1);
};

const closeModal = () => {
  if (roomTypeModal) roomTypeModal.hide();
};
</script>

<template>
  <div class="card shadow mb-4">
    <div class="card-header py-3">
      <h6 class="m-0 font-weight-bold text-primary">Manage Room Types</h6>
    </div>
    <div class="card-body">
      <div class="table-responsive">
        <table class="table table-hover table-bordered align-middle">
          <thead>
            <tr>
              <th width="5%" scope="col" class="text-center">#</th>
              <th scope="col">Name</th>
              <th scope="col">Price</th>
              <th scope="col">Properties</th>
              <th v-if="authStore.user.role === USER_ROLES.SUPERADMIN" width="10%" class="text-center">
                <button class="btn btn-primary btn-sm" @click="openAddModal">
                  <Plus />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(roomType, index) in roomTypes" :key="roomType.id">
              <td class="text-center">{{ index + 1 }}</td>
              <td>{{ roomType.name }}</td>
              <td>{{ formatCurrency(roomType.price) }}</td>
              <td>
                <ul class="list-unstyled mb-0">
                  <li v-for="(prop, index) in roomType.properties" :key="index">
                    <strong>
                      {{
                        propertiesList.find(p => p.id === (prop.property_id || prop.id))?.name || prop.name || 'N/A'
                      }}:
                    </strong>
                    {{ prop.value }}
                  </li>
                </ul>
              </td>
              <td v-if="authStore.user.role === USER_ROLES.SUPERADMIN" class="text-center">
                <button class="btn btn-warning btn-sm mr-1" @click="editRoomType(roomType)">
                  <SquarePen />
                </button>
                <button class="btn btn-danger btn-sm" @click="deleteRoomType(roomType.id)">
                  <Trash2 />
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
    </div>

    <!-- Modal -->
    <div class="modal fade" id="roomTypeModal" tabindex="-1" aria-labelledby="roomTypeModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="roomTypeModalLabel">{{ isEditing ? 'Edit room type' : 'Add room type' }}
            </h5>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveRoomType">
              <div class="mb-3">
                <label for="roomTypeName" class="form-label">Room type</label>
                <input type="text" class="form-control" id="roomTypeName" v-model="currentRoomType.name" required>
              </div>
              <div class="mb-3">
                <label for="roomTypePrice" class="form-label">Price</label>
                <input type="number" class="form-control" id="roomTypePrice" v-model="currentRoomType.price" required
                  min="0">
              </div>

              <h6 class="mt-4 mb-3">Properties of room type:</h6>

              <!-- New v-select for adding properties -->
              <div class="mb-3">
                <label class="form-label mb-1">Add Property</label>
                <v-select class="bg-white" v-model="propertyToAdd" :options="selectableProperties" label="name"
                  :reduce="property => property.id" placeholder="Search and add a property..."
                  @update:modelValue="handlePropertySelected" :clearable="true"
                  :disabled="selectableProperties.length === 0">
                  <template #no-options>
                    <div>All properties have been added.</div>
                  </template>
                </v-select>
              </div>

              <!-- List of added properties - Table format -->
              <div v-if="currentRoomType.properties.length > 0" class="mt-3 table-responsive">
                <table class="table table-sm table-bordered table-hover align-middle">
                  <thead class="table-light">
                    <tr>
                      <th scope="col">Property Name</th>
                      <th scope="col">Value</th>
                      <th scope="col" class="text-center" style="width: 10%;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(prop, index) in currentRoomType.properties" :key="prop.property_id">
                      <td>
                        {{propertiesList.find(p => p.id === prop.property_id)?.name || 'Property'}}
                      </td>
                      <td>
                        <input type="text" class="form-control form-control-sm" v-model="prop.value"
                          placeholder="Enter value" required>
                      </td>
                      <td class="text-center">
                        <button type="button" class="btn btn-danger btn-sm p-1" @click="removeProperty(index)">
                          <Trash2 />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-muted mt-3 text-center p-3 border rounded">
                No properties added yet. Select a property from the dropdown above to add it.
              </div>

              <div class="modal-footer mt-4">
                <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
                <button type="submit" class="btn btn-primary">
                  <i class="bi bi-save"></i> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
