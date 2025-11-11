import { getRole } from '../services/auth'
import StudentWater from './water/StudentWater'
import AdminWater from './water/AdminWater'

export default function Water() {
  const role = (getRole() || '').toLowerCase()
  if (role === 'admin' || role === 'staff' || role === 'plumber') return <AdminWater />
  return <StudentWater />
}
