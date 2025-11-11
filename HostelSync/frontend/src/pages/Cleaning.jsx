import { getRole } from '../services/auth'
import StudentCleaning from './cleaning/StudentCleaning'
import AdminCleaning from './cleaning/AdminCleaning'

export default function Cleaning() {
  const role = (getRole() || '').toLowerCase()
  if (role === 'admin' || role === 'cleaner' || role === 'staff') return <AdminCleaning />
  return <StudentCleaning />
}
