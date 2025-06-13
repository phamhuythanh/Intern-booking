import { createRouter, createWebHistory } from 'vue-router'
import customerRouter from '../modules/customer/router'
import adminRoutes from '@/modules/admin/router'
import { useAuthStore } from '@/stores/auth'
import Errors from '@/views/Errors.vue'
import NotFound from '@/views/NotFound.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...customerRouter,
    ...adminRoutes,
    {
      path: '/error-403',
      name: 'Error403',
      component: Errors,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFound,
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  if (!auth.userLoaded) {
    if (to.path.startsWith('/admin')) {
      await auth.fetchAdmin()
    } else {
      await auth.fetchUser()
    }
  }

  if (to.meta.requiresAuth && !auth.user) {
    return next({ name: 'AdminLogin' })
  }

  if (to.meta.requiresAdmin && auth.type !== 'admin') {
    return next({ name: 'AdminLogin' })
  }

  if (to.meta.requiresSuperAdmin && auth.user.role !== 'superadmin') {
    return next({ name: 'Error403' })
  }

  if (to.meta.requiresUser && auth.type !== 'user') {
    return next({ name: 'Error403' })
  }

  next()
})

export default router
