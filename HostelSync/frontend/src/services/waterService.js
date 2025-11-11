import api from './api'

const WaterService = {
  async reportIssue(payload) {
    const { data } = await api.post('/water/water/issues', payload)
    return data
  },
  async getIssues(params = {}) {
    const { data } = await api.get('/water/water/issues', { params })
    return data
  },
  async updateIssueStatus(id, payload) {
    const { data } = await api.patch(`/water/water/issues/${id}`, payload)
    return data
  },
  async getPlumbers() {
    const { data } = await api.get('/water/water/plumbers')
    return data
  }
}

export default WaterService
