import api from './api'
import { setToken, clearToken, setUser as setUserStorage, clearUser as clearUserStorage } from './auth'

const AuthService = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials)
    const token = data?.token
    if (token) setToken(token)
    const me = await this.me()
    return me
  },

  async register(payload) {
    // payload may optionally include role (e.g., PLUMBER, IT_STAFF) in dev/testing
    const { data } = await api.post('/auth/register', payload)
    const token = data?.token
    if (token) setToken(token)
    const me = await this.me()
    return me
  },

  async me() {
    const { data } = await api.get('/auth/me')
    if (data) setUserStorage(data)
    return data
  },

  async logout() {
    try { await api.post('/auth/logout') } catch {}
    clearToken()
    clearUserStorage()
  }
}

export default AuthService
