import type { RouteRecordRaw } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Tables from './views/Tables.vue'
import Properties from './views/Properties.vue'
import AdminLayout from './components/layouts/AdminLayout.vue'
import Bookings from './views/Bookings.vue'
import RoomType from './views/RoomType.vue'
import Rooms from './views/Room.vue'
import Profile from './views/Profile.vue'

import ServiceList from '@/modules/admin/views/service/ServiceList.vue'
import ContactList from '@/modules/admin/views/contact/ContactList.vue'
import UserList from '@/modules/admin/views/user/UserList.vue'
import UserCreate from '@/modules/admin/views/user/UserCreate.vue'
import BookingList from './views/BookingList.vue'
import Adminlist from './views/admin/AdminList.vue'

const adminRoutes: Array<RouteRecordRaw> = [
  {
    path: '/admins',
    component: AdminLayout,
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: Dashboard,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'tables',
        name: 'AdminTables',
        component: Tables,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'properties',
        name: 'AdminProperties',
        component: Properties,
        meta: { requiresAdmin: true, requiresSuperAdmin: true },
      },
      {
        path: 'bookings',
        name: 'AdminBookings',
        component: Bookings,
        meta: { requiresAdmin: true },
      },
      {
        path: 'bookings-list',
        name: 'BookingList',
        component: BookingList,
        meta: { requiresAdmin: true },
      },
      {
        path: 'room-types',
        name: 'AdminRoomTypes',
        component: RoomType,
        meta: { requiresAdmin: true },
      },
      {
        path: '', // Default child route for /admin
        redirect: '/admins/dashboard',
      },
      {
        path: 'services',
        name: 'AdminServiceList',
        component: ServiceList,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'contacts',
        name: 'AdminContactList',
        component: ContactList,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'rooms',
        name: 'Rooms',
        component: Rooms,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'users',
        name: 'AdminUserList',
        component: UserList,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'users/create',
        name: 'AdminUserCreate',
        component: UserCreate,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'admin-accounts',
        name: 'Adminlist',
        component: Adminlist,
        meta: { requiresAuth: true, requiresAdmin: true, requiresSuperAdmin: true },
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: Profile,
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/admins/login',
    name: 'AdminLogin',
    component: () => import('@/modules/admin/views/Auth/Login.vue'),
  },
]

export default adminRoutes
