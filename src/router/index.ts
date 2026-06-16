import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { canEditTemplates } from '../utils/permissions'

const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('../views/DashboardView.vue') },
  { path: '/factories', component: () => import('../views/FactoryListView.vue') },
  { path: '/factories/new', component: () => import('../views/FactoryDetailView.vue') },
  { path: '/factories/dept/:craft', component: () => import('../views/DeptFactoriesView.vue') },
  { path: '/factories/:id', component: () => import('../views/FactoryDetailView.vue') },
  { path: '/factories/:id/score/:month', component: () => import('../views/ScoreSheetView.vue') },
  { path: '/orders', component: () => import('../views/OrdersView.vue') },
  { path: '/orders/dept/:craft', component: () => import('../views/DeptOrdersView.vue') },
  { path: '/orders/dept/:craft/new', component: () => import('../views/OrderFormView.vue') },
  { path: '/order-tracking', component: () => import('../views/OrderTrackingView.vue') },
  { path: '/monthly-output', component: () => import('../views/MonthlyOutputView.vue') },
  { path: '/review/:month', component: () => import('../views/ReviewBoardView.vue') },
  { path: '/review/:month/meeting', component: () => import('../views/ReviewMeetingView.vue') },
  { path: '/kpi', component: () => import('../views/KpiBoardView.vue') },
  { path: '/scoring', component: () => import('../views/MonthlyScoringView.vue') },
  { path: '/admin/score-templates', component: () => import('../views/admin/ScoreTemplateAdminView.vue'), meta: { adminOnly: true } },
  { path: '/admin/users', component: () => import('../views/admin/UserAdminView.vue'), meta: { adminOnly: true } },
]

export const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) return '/login'
  if (to.meta.adminOnly && !(auth.role && canEditTemplates(auth.role))) return '/dashboard'
  return true
})
