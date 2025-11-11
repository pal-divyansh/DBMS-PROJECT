import axios from 'axios'
import { getToken, clearToken } from './auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const data = error?.response?.data
    if (status === 401) {
      clearToken()
      try { window.dispatchEvent(new CustomEvent('api:error', { detail: { message: 'Session expired. Please log in again.' } })) } catch {}
    } else if (status >= 400) {
      const msg = Array.isArray(data?.error)
        ? data.error.map(x => x.message).join(', ')
        : (data?.message || data?.error || 'Request failed')
      try { window.dispatchEvent(new CustomEvent('api:error', { detail: { message: msg } })) } catch {}
    }
    return Promise.reject(error)
  }
)

export default api
