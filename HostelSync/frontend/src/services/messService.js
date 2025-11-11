import api from './api'

const MessService = {
  async getWeeklyMenu() {
    const { data } = await api.get('/mess/menu')
    return data
  },
  async submitFeedback({ menuId, rating, comment }) {
    const { data } = await api.post('/mess/feedback', { menuId, rating, comment })
    return data
  },
  async createMenu(payload) {
    const { data } = await api.post('/mess/menu', payload)
    return data
  },
  async updateMenu(id, payload) {
    const { data } = await api.put(`/mess/menu/${id}`, payload)
    return data
  },
  async deleteMenu(id) {
    const { data } = await api.delete(`/mess/menu/${id}`)
    return data
  },
  async getFeedback(params = {}) {
    const { data } = await api.get('/mess/feedback', { params })
    return data
  },
  async getAdminFeedback(params = {}) {
    const { data } = await api.get('/mess/admin/feedback', { params })
    return data
  },
  exportMenus(params = {}) {
    const query = new URLSearchParams(params).toString()
    const url = `${api.defaults.baseURL}/mess/menus/export${query ? `?${query}` : ''}`
    window.open(url, '_blank')
  },
  async importMenus(file) {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/mess/menus/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}

export default MessService
