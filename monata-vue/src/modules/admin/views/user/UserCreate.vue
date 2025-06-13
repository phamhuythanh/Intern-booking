<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content card shadow rounded-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h4 class="mb-0">Create User</h4>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="card-body p-4">
            <form class="row g-3" @submit.prevent="handleSubmit">
              <div class="col-md-6">
                <label class="form-label d-flex">Name</label>
                <input 
                  type="text" 
                  class="form-control"
                  :class="{ 'is-invalid': errors.name }"
                  name="name" 
                  v-model="formCreate.name" 
                  placeholder="Enter name..."
                >
                <div v-if="errors.name" class="invalid-feedback">{{ errors.name[0] }}</div>
              </div>

              <div class="col-md-6">
                <label class="form-label d-flex">Email</label>
                <input 
                  type="email" 
                  class="form-control"
                  :class="{ 'is-invalid': errors.email }"
                  name="email" 
                  v-model="formCreate.email" 
                  placeholder="Enter email..."
                >
                <div v-if="errors.email" class="invalid-feedback">{{ errors.email[0] }}</div>
              </div>

              <div class="col-md-6">
                <label class="form-label d-flex">Phone</label>
                <input 
                  type="text" 
                  class="form-control"
                  :class="{ 'is-invalid': errors.phone }"
                  inputmode="numeric"
                  name="phone" 
                  v-model="formCreate.phone" 
                  placeholder="Enter phone number..."
                >
                <div v-if="errors.phone" class="invalid-feedback">{{ errors.phone[0] }}</div>
              </div>

              <div class="col-md-6">
                <label class="form-label d-block d-flex">Status</label>
                <div class="d-flex">
                  <div class="form-check form-check-inline">
                    <input 
                      class="form-check-input" 
                      type="radio" 
                      name="status" 
                      id="status_active" 
                      :value="UserStatus.Active"
                      v-model="formCreate.status"
                    >
                    <label class="form-check-label" for="status_active">Active</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input 
                      class="form-check-input" 
                      type="radio" 
                      name="status" 
                      id="status_blocked" 
                      :value="UserStatus.Blocked"
                      v-model="formCreate.status"
                    >
                    <label class="form-check-label" for="status_blocked">Blocked</label>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label d-flex">Password</label>
                <input 
                  type="password" 
                  class="form-control"
                  :class="{ 'is-invalid': errors.password }"
                  v-model="formCreate.password" 
                  placeholder="Enter password..."
                >
                <div v-if="errors.password" class="invalid-feedback">{{ errors.password[0] }}</div>
              </div>

              <div class="col-md-6">
                <label class="form-label d-flex">Confirm Password</label>
                <input 
                  type="password" 
                  class="form-control"
                  :class="{ 'is-invalid': errors.password_confirmation }"
                  v-model="formCreate.password_confirmation" 
                  placeholder="Confirm password..."
                >
                <div v-if="errors.password_confirmation" class="invalid-feedback">{{ errors.password_confirmation[0] }}</div>
              </div>

              <div class="col-12 text-end mt-4">
                <button type="button" class="btn btn-secondary me-2" @click="closeModal">Cancel</button>
                <button type="submit" class="btn btn-primary px-5 py-2" :disabled="isLoading">
                  {{ isLoading ? 'Creating...' : 'Create User' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { UserStatus } from '../../stores/enum/User'
import { useUser } from "../../composables/user/User.service"
import { watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created'): void
}>()

const {
  formCreate,
  errors,
  handleCreate,
  isLoading
} = useUser()

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  const success = await handleCreate()
  if (success) {
    emit('created')
    closeModal()
  }
}

watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    formCreate.value = {
      name: '',
      email: '',
      phone: '',
      status: UserStatus.Active,
      password: '',
      password_confirmation: ''
    }
    Object.keys(errors).forEach(key => {
      errors[key] = []
    })
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-content {
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.invalid-feedback {
  display: block;
}

.text-muted {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
