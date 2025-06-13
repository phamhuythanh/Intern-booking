import { defineStore } from 'pinia'
import { api as apiUser } from '@/modules/customer/lib/axios'
import { api as apiAdmin } from '@/modules/admin/lib/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    type: null,
    user: null,
    userLoaded: false,
  }),

  actions: {
    async fetchUser() {
      try {
        const res = await apiUser.get('/profile', { withCredentials: true })
        this.type = 'user'
        this.user = res.data.data
        this.userLoaded = true
      } catch {
        this.clearUser()
      }
    },

    async fetchAdmin() {
      try {
        const res = await apiAdmin.get('/profile', { withCredentials: true })
        this.type = 'admin'
        this.user = res.data.data
        console.log(this.user.role)

        this.userLoaded = true
      } catch {
        this.clearUser()
      }
    },

    clearUser() {
      this.type = null
      this.user = null
      this.userLoaded = true
    },
  },
})
