<script setup>
import { ref, onMounted, nextTick, reactive, watch } from 'vue'
import { X, Save, SquarePen, Plus, Trash2 } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import debounce from 'lodash/debounce'
import { csrf, api } from '../lib/axios'

const records = ref([])
const editingRecord = ref(null)
const creatingRecord = ref(null)
const errorMessages = ref({})
const newInputRef = ref(null)
const pagination = ref({})
const toast = useToast()
const isTransitioning = ref(true)
const queryParams = reactive({
  page: 1,
  per_page: 10,
  keyword: ''
})

const fetchData = async (page = 1) => {
  queryParams.page = page
  try {
    const response = await api.get(`/properties`, {
      params: queryParams
    })
    console.log(response)
    records.value = response.data?.data || []
    pagination.value = response.data?.meta || {}
    errorMessages.value = {}
  } catch (error) {
    console.error('Error fetching data', error)
    errorMessages.value = { global: 'Failed to fetch properties. Please try again later.' }
    records.value = []
  } finally {
    isTransitioning.value = false
  }
}

const debouncedFetch = debounce(() => fetchData(1), 300)

watch(() => queryParams.keyword, () => {
  debouncedFetch()
})

const goToPage = (url) => {
  if (!url) return
  const match = url.match(/page=(\d+)/)
  const page = match ? parseInt(match[1]) : 1
  fetchData(page)
}

const startEditing = (record) => {
  editingRecord.value = { ...record }
  errorMessages.value[record.id] = ''
}

const cancelEditing = () => {
  if (editingRecord.value) {
    delete errorMessages.value[editingRecord.value.id]
  }
  editingRecord.value = null
}

const saveRecord = async () => {
  if (!editingRecord.value) return

  try {
    const response = await api.put(`/properties/${editingRecord.value.id}`, {
      name: editingRecord.value.name
    })

    const index = records.value.findIndex(r => r.id === editingRecord.value.id)
    if (index !== -1) {
      records.value[index] = { ...response.data.data }
    }

    delete errorMessages.value[editingRecord.value.id]
    editingRecord.value = null
    toast.success('Update record successfully!')
  } catch (error) {
    console.error('Error saving record', error)
    const errors = error.response?.data?.errors
    errorMessages.value[editingRecord.value.id] = errors?.name?.[0] || 'Failed to save.'
  }
}

const deleteRecord = async (id) => {
  if (!confirm('Are you sure you want to delete this record?')) return

  try {
    await api.delete(`/properties/${id}`)
    const isLastItemOnPage = records.value.length === 1 && pagination.value.current_page > 1
    const nextPage = isLastItemOnPage ? pagination.value.current_page - 1 : pagination.value.current_page
    await fetchData(nextPage)
    delete errorMessages.value[id]
    toast.success('Delete record successfully!')
  } catch (error) {
    console.error('Error deleting record:', error)
    errorMessages.value[id] = 'Property is exists'
    toast.error('Error!')
  }
}

const startCreating = async () => {
  creatingRecord.value = { name: '' }

  await nextTick()
  if (newInputRef.value) {
    newInputRef.value.focus()
  }
}

const cancelCreating = () => {
  creatingRecord.value = null
  delete errorMessages.value.new
}

const createRecord = async () => {
  try {
    await api.post(`/properties`, {
      name: creatingRecord.value.name
    })
    creatingRecord.value = ''
    delete errorMessages.value.new
    await fetchData(1)
    toast.success('Created successfully!')
  } catch (error) {
    console.error('Error creating record:', error)
    const errors = error.response?.data?.errors
    errorMessages.value.new = errors?.name?.[0] || 'Failed to create.'
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="card shadow mb-4">
    <div class="card-header py-3 d-flex justify-content-between align-items-center">
      <h6 class="m-0 font-weight-bold text-primary">Manage Properties</h6>
    </div>
    <div class="card-body">
      <div class="mb-3 text-end">
        <form class="property-search-form">
          <div class="input-group">
            <input v-model="queryParams.keyword" type="text" class="form-control property-search-input"
              placeholder="Search for..." aria-label="Search" />
            <div class="input-group-append">
              <span class="input-group-text bg-primary text-white">
                <i class="fas fa-search fa-sm"></i>
              </span>
            </div>
          </div>
        </form>
      </div>
      <div class="table-responsive mt-3">
        <table class="table table-bordered" width="100%" cellspacing="0">
          <thead>
            <tr>
              <th width="5%">
                <div class="text-center">#</div>
              </th>
              <th>Name</th>
              <th width="10%" class="text-center">
                <button class="btn btn-primary btn-sm" @click="startCreating" v-if="!creatingRecord">
                  <Plus />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="creatingRecord">
              <td></td>
              <td>
                <input type="text" v-model="creatingRecord.name" class="form-control" ref="newInputRef" />
                <div v-if="errorMessages.new" class="text-danger mt-1" style="font-size: 0.95em;">
                  {{ errorMessages.new }}
                </div>
              </td>
              <td>
                <button class="btn btn-success btn-sm mr-1" @click="createRecord">
                  <Save />
                </button>
                <button class="btn btn-secondary btn-sm" @click="cancelCreating">
                  <X />
                </button>
              </td>
            </tr>

            <tr v-for="(record, index) in records" :key="record.id">
              <td>
                <div class="text-center">
                  {{ index + 1 }}
                </div>
              </td>
              <td>
                <template v-if="editingRecord && editingRecord.id === record.id">
                  <input type="text" v-model="editingRecord.name" class="form-control" />
                </template>
                <template v-else>
                  {{ record.name }}
                </template>
                <div v-if="errorMessages[record.id]" class="text-danger mt-1" style="font-size: 0.95em;">
                  {{ errorMessages[record.id] }}
                </div>
              </td>
              <td>
                <template v-if="editingRecord && editingRecord.id === record.id">
                  <button class="btn btn-success btn-sm mr-1" @click="saveRecord">
                    <Save />
                  </button>
                  <button class="btn btn-secondary btn-sm" @click="cancelEditing">
                    <X />
                  </button>
                </template>
                <template v-else>
                  <div class="text-center">
                    <button class="btn btn-warning btn-sm mr-1" @click="startEditing(record)">
                      <SquarePen />
                    </button>
                    <button class="btn btn-danger btn-sm" @click="deleteRecord(record.id)">
                      <Trash2 />
                    </button>
                  </div>
                </template>
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
      <div class="row align-items-center pt-3 pb-3" v-if="pagination.total > 0">
        <div class="col-md-4">
          <p class="mb-0">Showing {{ pagination.from }} to {{ pagination.to }} of {{ pagination.total }}
            entries
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
      <div v-if="errorMessages.global" class="alert alert-danger mt-3">
        {{ errorMessages.global }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.property-search-form {
  max-width: 350px;
  margin-left: auto;
}

.property-search-input {
  border-radius: 0.35rem 0 0 0.35rem;
  box-shadow: 0 2px 6px rgba(78, 115, 223, 0.08);
  transition: border-color 0.2s;
}

.property-search-input:focus {
  border-color: #224abe;
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(160, 184, 255, 0.15);
}

.input-group-text.bg-primary {
  border-radius: 0 0.35rem 0.35rem 0;
  border: none;
}
</style>
