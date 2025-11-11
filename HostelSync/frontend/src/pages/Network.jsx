import { getRole } from '../services/auth'
import StudentNetwork from './network/StudentNetwork'
import AdminNetwork from './network/AdminNetwork'

export default function Network() {
  const role = (getRole() || '').toLowerCase()
  if (role === 'admin' || role === 'it_staff' || role === 'staff') return <AdminNetwork />
  return <StudentNetwork />
}
