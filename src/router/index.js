import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/Stores/useAuthStore'
import { canAccessRoute } from '@/utils/permissions'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../views/MASTER/MasterDashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/RegisterUser',
      component: () => import('../views/MASTER/RegisterUser.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/FinanceModule',
      component: () => import('../views/MASTER/FinanceModule.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/InvoicesSchool',
      component: () => import('../views/MASTER/InvoicesSchool.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/Receipts',
      component: () => import('../views/MASTER/Receipts.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/MessagesToSchools',
      component: () => import('../views/MASTER/MessagesToSchools.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/CallLog',
      component: () => import('../views/MASTER/CallLog.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/Contacts',
      component: () => import('../views/MASTER/Contacts.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/allSchools',
      component: () => import('../views/MASTER/AllSchools.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/ActivationStatus',
      component: () => import('../views/MASTER/ActivationStatus.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/activatedSchools',
      component: () => import('../views/MASTER/ActivatedSchools.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/expiredSchools',
      component: () => import('../views/MASTER/ExpiredSchools.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/no-access',
      component: () => import('../views/MASTER/NoAccess.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      component: () => import('../components/Authentication/Login.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // User rights: if route requires specific roles, check access
  if (requiresAuth && to.path !== '/no-access') {
    const userRoles = authStore.roles || []
    const userPrivs = authStore.priviledges || []
    if (!canAccessRoute(to.path, userRoles, userPrivs)) {
      return next('/no-access')
    }
  }

  next()
})


export default router
