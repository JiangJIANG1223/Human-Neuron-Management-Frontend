import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import axios from 'axios';
import router from './router'; // 导入路由配置

const app = createApp(App);
app.use(router); // 使用路由
app.use(ElementPlus);
app.config.globalProperties.$axios = axios;

// router.beforeEach((to, from, next) => {
//     const token = localStorage.getItem('access_token');
//     const isGuest = localStorage.getItem('is_guest') === 'true';
//     if (to.matched.length === 0) {
//       next('/');
//     } else if (to.matched.some(record => record.meta.requiresAuth) && !token && !isGuest) {
//       next({ name: 'Login' });
//     } else {
//       next();
//     }
//   });

// router.beforeEach((to, from, next) => {
//     // 清除本地存储中的令牌
//     localStorage.removeItem('access_token');
//     next();
//   });

// const eventBus = mitt();
// app.config.globalProperties.$eventBus = eventBus;

app.mount('#app');

// // 监听登录事件
// app.config.globalProperties.$on('loggedIn', () => {
//     app.config.globalProperties.$root.isLoggedIn = true;
//   });
// 监听登录事件
// app.config.globalProperties.$on('loggedIn', () => {
//     app.config.globalProperties.$root.isLoggedIn = true;
//     app.config.globalProperties.$root.userRole = localStorage.getItem('user_role');
//   });
