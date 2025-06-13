import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authenticated: false,
  }),
  actions: {
    login() {
      this.authenticated = true
    },
    logout() {
      this.authenticated = false
    },
  },
  persist: true,
})
