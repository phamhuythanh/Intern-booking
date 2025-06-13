<script setup lang="ts">
import { reactive, ref } from 'vue'
import { api, csrf } from '@/modules/customer/lib/axios'
import type { RegisterForm, ValidationErrors } from '@/modules/customer/types/auth'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'switchToLogin'])

const authStore = useAuthStore()
const toast = useToast()
const errors = ref<ValidationErrors>({})
const registerForm = reactive<RegisterForm>({
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
})

function closeModal() {
  emit('update:modelValue', false)
}

async function register() {
  errors.value = {}

  try {
    await csrf.get('/sanctum/csrf-cookie')
    await api.post(`/register`, registerForm)
    await authStore.fetchUser()

    toast.success('Register succsessfully!')
    closeModal()
  } catch (error: any) {
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors
    } else {
      toast.error('Register fail!')
      console.error('Register failed:', error.message)
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content card text-dark">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h4 class="mb-0">Create Account</h4>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="card-body">
            <form @submit.prevent="register()">
              <div class="mb-3">
                <label for="name-register" class="form-label">Name</label>
                <input type="text" class="form-control" id="name-register" placeholder="Enter your name"
                  v-model="registerForm.name" />
                <div v-if="errors.name" class="text-danger small mt-1">
                  {{ errors.name[0] }}
                </div>
              </div>
              <div class="mb-3">
                <label for="email-register" class="form-label">Email address</label>
                <input type="text" class="form-control" id="email-register" placeholder="Enter your email"
                  v-model="registerForm.email" />
                <div v-if="errors.email" class="text-danger small mt-1">
                  {{ errors.email[0] }}
                </div>
              </div>
              <div class="mb-3">
                <label for="phone-register" class="form-label">Phone</label>
                <input type="text" class="form-control" id="phone-register" placeholder="Enter your phone number"
                  v-model="registerForm.phone" />
                <div v-if="errors.phone" class="text-danger small mt-1">
                  {{ errors.phone[0] }}
                </div>
              </div>
              <div class="mb-3">
                <label for="password-register" class="form-label">Password</label>
                <input type="password" class="form-control" id="password-register" placeholder="Enter your password"
                  v-model="registerForm.password" />
                <div v-if="errors.password" class="text-danger small mt-1">
                  {{ errors.password[0] }}
                </div>
              </div>
              <div class="mb-3">
                <label for="password_confirmation-register" class="form-label">Confirm Password</label>
                <input type="password" class="form-control" id="password_confirmation-register"
                  placeholder="Confirm your password" v-model="registerForm.password_confirmation" />
              </div>
              <div class="mb-3 text-center">
                <small>Already have an account?
                  <a href="#" @click.prevent="$emit('switchToLogin')">Login now</a></small>
              </div>
              <button type="submit" class="btn btn-primary w-100">Register</button>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Same styles as LoginModal.vue */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-content.card {
  padding: 0;
}

.modal-content .card-header {
  padding: 1rem 1.5rem;
}

.modal-content .card-body {
  padding: 1.5rem;
}

/* Modal transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
