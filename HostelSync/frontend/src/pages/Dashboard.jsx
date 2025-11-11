import { getRole } from '../services/auth'
import StudentDashboard from './dashboards/StudentDashboard'
import StaffDashboard from './dashboards/StaffDashboard'
import AdminDashboard from './dashboards/AdminDashboard'

export default function Dashboard() {
  const role = getRole() || 'student'
  if (role === 'admin') return <AdminDashboard />
  if (role === 'staff') return <StaffDashboard />
  return <StudentDashboard />
}
