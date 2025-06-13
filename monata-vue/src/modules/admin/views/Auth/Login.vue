<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, csrf } from '@/modules/admin/lib/axios'
import { ValidationErrors } from '@/modules/customer/types/auth'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const router = useRouter()
const errors = ref<ValidationErrors>({})
const authStore = useAuthStore()

const handleLogin = async () => {
  try {
    await csrf.get('/sanctum/csrf-cookie')
    await api.post('/login', {
      email: email.value,
      password: password.value
    })

    await authStore.fetchAdmin()
    router.push({ name: 'AdminDashboard' })
  } catch (error: any) {
    if (error.response && error.status === 422) {
      errors.value = error.response.data.errors
    }
    else if (error.response && error.response.status === 401) {
      alert('Invalid credentials')
    } else {
      alert('An error occurred during login. Please try again.')
    }
  }
}
</script>

<template>
  <main>
    <div class="container mt-5 text-dark">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header text-center">
              <h3>Login</h3>
            </div>
            <div class="card-body p-0">
              <form @submit.prevent="handleLogin()" class="w-100">
                <div class="mb-3">
                  <label for="email" class="form-label">Email address</label>
                  <input type="text" class="form-control" id="email" placeholder="Enter your email" v-model="email" />
                  <div v-if="errors.email" class="text-danger small">
                    {{ errors.email[0] }}
                  </div>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input type="password" class="form-control" id="password" placeholder="Enter your password"
                    v-model="password" />
                  <div v-if="errors.password" class="text-danger small">
                    {{ errors.password[0] }}
                  </div>
                </div>
                <button type="submit" class="mb-3 btn btn-primary w-100">Login</button>
                <router-link to="/" class="btn btn-danger w-100">Back</router-link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.admin-login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  font-family: Arial, sans-serif;
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 300px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #555;
}

input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  /* Ensures padding doesn't affect overall width */
}

button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #0056b3;
}
</style>
