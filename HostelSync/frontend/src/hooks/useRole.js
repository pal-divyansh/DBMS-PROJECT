import useAuth from './useAuth'

export default function useRole(target) {
  const { role } = useAuth()
  const norm = (target || '').toLowerCase()
  return role === norm
}
