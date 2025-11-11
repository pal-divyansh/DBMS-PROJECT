import api from './api'

const CleaningService = {
  // Student
  async createRequest(payload) {
    const { data } = await api.post('/cleaning/requests', payload)
    return data
  },
  async getMyRequests(params = {}) {
    const { data } = await api.get('/cleaning/my-requests', { params })
    return data
  },
  async submitFeedback(id, payload) {
    const { data } = await api.post(`/cleaning/requests/${id}/feedback`, payload)
    return data
  },
  
  // Admin/Cleaner
  async getRequests(params = {}) {
    const { data } = await api.get('/cleaning/requests', { params })
    return data
  },
  async updateRequestStatus(id, payload) {
    const { data } = await api.patch(`/cleaning/requests/${id}/status`, payload)
    return data
  },
  async getCleaners() {
    const { data } = await api.get('/cleaning/cleaners')
    return data
  },
}

export default CleaningService
