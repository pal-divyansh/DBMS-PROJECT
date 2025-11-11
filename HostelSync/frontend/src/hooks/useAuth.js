import { useMemo } from 'react'
import { getRole, isAuthenticated, getUser } from '../services/auth'

export default function useAuth() {
  const authed = isAuthenticated()
  const role = (getRole() || '').toLowerCase()
  const user = getUser()
  return useMemo(() => ({ authed, role, user }), [authed, role, user])
}
