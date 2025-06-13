// import Index from './views/Index.vue'
import Index from '../customer/views/Index.vue'
import Contact from '../customer/views/Contact.vue'
export default [
  {
    path: '/',
    name: 'home',
    component: () => import('./views/Index.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('./views/Profile.vue'),
  },
  {
    path: '/contact',
    component: Contact,
  },
  {
    path: '/rooms/:id',
    name: 'roomDetail',
    component: () => import('./views/RoomDetail.vue'),
  },
  {
    path: '/rooms',
    name: 'rooms',
    component: () => import('./views/Room.vue'),
  }
  ,
  {
    path: '/about',
    name: 'about',
    component: () => import('./views/About.vue'),
  }
]
