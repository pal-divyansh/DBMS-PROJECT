import api from './api'

const AccountService = {
  async getMe() {
    const { data } = await api.get('/auth/me')
    return data
  },
  async updateMe(payload) {
    // Attempt a conventional endpoint; handle 404 gracefully in the caller
    const { data } = await api.put('/auth/me', payload)
    return data
  },
  async changePassword(payload) {
    const { data } = await api.post('/auth/change-password', payload)
    return data
  }
}

export default AccountService
