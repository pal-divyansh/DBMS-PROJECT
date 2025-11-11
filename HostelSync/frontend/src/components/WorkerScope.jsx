import { Navigate, useLocation } from 'react-router-dom'
import { getRole } from '../services/auth'

const allowedByRole = {
  plumber: ['/water', '/profile'],
  it_staff: ['/network', '/profile'],
  cleaner: ['/cleaning', '/profile'],
}

export default function WorkerScope({ children }) {
  const role = (getRole() || '').toLowerCase()
  const location = useLocation()

  if (role === 'plumber' || role === 'it_staff' || role === 'cleaner') {
    const allowed = allowedByRole[role] || []
    const path = location.pathname.toLowerCase()
    const isAllowed = allowed.some(p => path === p || path.startsWith(p + '/'))
    if (!isAllowed) {
      const fallback = role === 'plumber' ? '/water' : role === 'it_staff' ? '/network' : '/cleaning'
      return <Navigate to={fallback} replace />
    }
  }

  return children
}
