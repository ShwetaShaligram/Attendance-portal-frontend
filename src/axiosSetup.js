// src/axiosSetup.js
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:8000/api/';

axios.interceptors.request.use((config) => {
  const publicRoutes = ['register', 'login', 'managers'];
  const isPublic = publicRoutes.some(route => config.url?.includes(route));

  if (!isPublic) {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    delete config.headers.Authorization;
  }

  return config;
});
