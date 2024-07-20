import axios from 'axios';
import router from './router'; // 确保导入路由

const instance = axios.create({
  baseURL: 'http://10.192.34.220:8000',
  timeout: 500000,
  headers: { 'Content-Type': 'application/json' }
});

// Add a request interceptor to attach the access token 请求拦截器
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  const tokenExpiry = localStorage.getItem('token_expiry'); // 存储在 localStorage 中的 token 过期时间

  if (token && tokenExpiry) {
    const now = new Date().getTime();
    if (now >= tokenExpiry) {
      // token 过期，跳转到登录页面
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('is_guest');
      localStorage.removeItem('productionTrend');
      router.push('/login');
      return Promise.reject(new Error('Token expired'));
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
}, error => {
  return Promise.reject(error);
});

// // Add a response interceptor to handle token expiration 响应拦截器
// instance.interceptors.response.use(
//   response => response,
//   async error => {
//     const originalRequest = error.config;
//     console.log('Error response interceptor:', error.response.status);
//     if (error.response && error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       localStorage.removeItem('access_token');
//       localStorage.removeItem('is_guest');
//       localStorage.removeItem('productionTrend');
//       // Redirect to login page or show login modal
//       // router.push('/login');
//       this.$router.push('/login');
      
//       return Promise.reject(error);
//     }
//     return Promise.reject(error);
//   }
// );

export default instance;
