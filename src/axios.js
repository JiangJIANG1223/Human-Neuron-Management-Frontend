import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://10.192.58.140:8000',
  timeout: 1000,
  headers: { 'Content-Type': 'application/json' }
});

// Add a request interceptor to attach the access token
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Add a response interceptor to handle token refresh
instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/refresh/', {}, {
          headers: { 'Authorization': `Bearer ${refreshToken}` }
        });
        const newToken = response.data.access_token;
        localStorage.setItem('access_token', newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (err) {
        console.error('Refresh token expired or invalid');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Redirect to login page or show login modal
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


export default instance;
