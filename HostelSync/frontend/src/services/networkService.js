import api from './api'

const NetworkService = {
  async reportIssue(payload) {
    const { data } = await api.post('/network/issues', payload)
    return data
  },
  async getIssues(params = {}) {
    const { data } = await api.get('/network/issues', { params })
    return data
  },
  async updateIssue(id, payload) {
    const { data } = await api.patch(`/network/issues/${id}`, payload)
    return data
  },
  async getComments(id) {
    const { data } = await api.get(`/network/issues/${id}/comments`)
    return data
  },
  async addComment(id, payload) {
    const { data } = await api.post(`/network/issues/${id}/comments`, payload)
    return data
  },
  async getItStaff() {
    const { data } = await api.get('/network/it-staff')
    return data
  },
}

export default NetworkService
