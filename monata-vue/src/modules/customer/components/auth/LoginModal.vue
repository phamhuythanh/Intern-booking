<script setup lang="ts">
import { reactive, ref } from 'vue'
import { api, csrf } from '@/modules/customer/lib/axios'
import type { LoginForm, ValidationErrors } from '@/modules/customer/types/auth'
import { useToast } from 'vue-toastification'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth';

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'login-success'): void
  (e: 'switchToRegister'): void
}>()

const toast = useToast()
const errors = ref<ValidationErrors>({})
const loginForm = reactive<LoginForm>({
  email: '',
  password: '',
})

function closeModal() {
  emit('update:modelValue', false)
}

async function login() {
  errors.value = {}

  try {
    await csrf.get('/sanctum/csrf-cookie')
    await api.post(`/login`, loginForm)
    await authStore.fetchUser()

    loginForm.email = ''
    loginForm.password = ''
    toast.success('Login successfully!')
    closeModal()
  } catch (error: any) {
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors
    } else if (error.response?.status === 401) {
      errors.value = { form: ['Email or password is not valid.'] }
      toast.error('Email or password is not valid.')
    } else if (error.response?.status === 423) {
      errors.value = { form: ['Account is locked.'] }
      toast.error('Account is locked.')
    } else {
      console.error('Login failed:', error.message)
      toast.error('Login failed!')
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
            <h4 class="mb-0">Sign In</h4>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="card-body">
            <form @submit.prevent="login()">
              <div v-if="errors.form" class="alert alert-danger small p-2 mb-3">
                {{ errors.form[0] }}
              </div>
              <div class="mb-3">
                <label for="email-login" class="form-label">Email address</label>
                <input type="text" class="form-control" id="email-login" placeholder="Enter your email"
                  v-model="loginForm.email" />
                <div v-if="errors.email" class="text-danger small mt-1">
                  {{ errors.email[0] }}
                </div>
              </div>
              <div class="mb-3">
                <label for="password-login" class="form-label">Password</label>
                <input type="password" class="form-control" id="password-login" placeholder="Enter your password"
                  v-model="loginForm.password" />
                <div v-if="errors.password" class="text-danger small mt-1">
                  {{ errors.password[0] }}
                </div>
              </div>
              <div class="mb-3 text-center">
                <small>Don't have an account?
                  <a href="#" @click.prevent="$emit('switchToRegister')">Register now</a></small>
              </div>
              <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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
