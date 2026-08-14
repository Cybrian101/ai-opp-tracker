import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - inject user ID
api.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem('oia_user_id')
    if (userId) {
      config.headers['x-user-id'] = userId
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('oia_user_id')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default api
