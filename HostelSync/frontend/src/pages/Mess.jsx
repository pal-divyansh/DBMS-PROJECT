import { getRole } from '../services/auth'
import StudentMess from './mess/StudentMess'
import AdminMess from './mess/AdminMess'

export default function Mess() {
  const role = (getRole() || '').toLowerCase()
  if (role === 'admin' || role === 'staff') return <AdminMess />
  return <StudentMess />
}
