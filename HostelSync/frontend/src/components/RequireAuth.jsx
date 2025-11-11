import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated, getRole } from '../services/auth'

export default function RequireAuth({ children, allowedRoles }) {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = getRole()
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}
