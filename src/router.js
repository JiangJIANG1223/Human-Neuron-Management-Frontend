import { createRouter, createWebHashHistory } from 'vue-router';
import Login from '@/components/Login.vue';
import Register from '@/components/Register.vue';
import Main from '@/components/Main.vue'; // Import Main.vue as the main component
import DataTable from '@/components/DataTable.vue';
import DataExplorer from '@/components/DataExplorer.vue';
import DataStatus from '@/components/DataStatus.vue';
import SampleInfo from '@/components/SampleInfo.vue';

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  {
    path: '/',
    name: 'Home',
    redirect: '/main'
  },
  {
    path: '/main',
    component: Main,  // Use Main as the main component
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'DataTable',
        component: DataTable
      },
      {
        path: 'explore',
        name: 'DataExplorer',
        component: DataExplorer
      },
      {
        path: 'status',
        name: 'DataStatus',
        component: DataStatus
      },
      {
        path: 'sample',
        name: 'SampleInfo',
        component: SampleInfo
      }
    ]
  },
  { path: '/:catchAll(.*)', redirect: '/login' }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('access_token');
  const isGuest = localStorage.getItem('is_guest') === 'true';

  if (to.matched.length === 0) {
    next('/login');
  } else if (to.matched.some(record => record.meta.requiresAuth) && !token && !isGuest) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router;
