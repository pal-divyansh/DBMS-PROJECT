import api from './api'

const TransportService = {
  async getRoutes() {
    const { data } = await api.get('/transport/routes')
    return data
  },
  async getVehicles() {
    const { data } = await api.get('/transport/vehicles')
    return data
  },
  async createBooking({ scheduleId, bookingDate }) {
    const { data } = await api.post('/transport/bookings', { scheduleId, bookingDate })
    return data
  },
  async getMyBookings() {
    const { data } = await api.get('/transport/bookings/me')
    return data
  },
  async cancelBooking(id) {
    const { data } = await api.delete(`/transport/bookings/${id}`)
    return data
  },
  // Admin
  async addRoute(payload) {
    const { data } = await api.post('/transport/admin/routes', payload)
    return data
  },
  async addVehicle(payload) {
    const { data } = await api.post('/transport/admin/vehicles', payload)
    return data
  },
  async deleteVehicle(id) {
    const { data } = await api.delete(`/transport/admin/vehicles/${id}`)
    return data
  },
  async addSchedule(payload) {
    const { data } = await api.post('/transport/admin/schedules', payload)
    return data
  },
}

export default TransportService
