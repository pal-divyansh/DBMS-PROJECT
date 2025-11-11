import { getRole } from '../services/auth'
import StudentTransport from './transport/StudentTransport'
import AdminTransport from './transport/AdminTransport'

export default function Transport() {
  const role = (getRole() || '').toLowerCase()
  if (role === 'admin' || role === 'staff') return <AdminTransport />
  return <StudentTransport />
}
