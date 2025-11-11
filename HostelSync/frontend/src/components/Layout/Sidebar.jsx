import { NavLink } from 'react-router-dom'
import classNames from 'classnames'
import styles from './Sidebar.module.css'
import { getRole } from '../../services/auth'

const ALL_LINKS = [
  { to: '/dashboard', label: 'Dashboard', key: 'dashboard' },
  { to: '/mess', label: 'Mess', key: 'mess' },
  { to: '/transport', label: 'Transport', key: 'transport' },
  { to: '/water', label: 'Water', key: 'water' },
  { to: '/cleaning', label: 'Cleaning', key: 'cleaning' },
  { to: '/network', label: 'Network', key: 'network' },
  { to: '/profile', label: 'Profile', key: 'profile' },
]

function getLinksForRole(role) {
  const r = (role || '').toLowerCase()
  // Default: students see all modules
  if (!r || r === 'student') return ALL_LINKS
  if (r === 'admin' || r === 'staff' || r === 'warden') return ALL_LINKS
  // Workers: restrict to their module + profile
  if (r === 'plumber') return ALL_LINKS.filter(l => ['water','profile'].includes(l.key))
  if (r === 'it_staff') return ALL_LINKS.filter(l => ['network','profile'].includes(l.key))
  if (r === 'cleaner') return ALL_LINKS.filter(l => ['cleaning','profile'].includes(l.key))
  return ALL_LINKS
}

export default function Sidebar({ collapsed }) {
  const links = getLinksForRole(getRole())
  return (
    <aside className={classNames(styles.sidebar, collapsed && styles.collapsed)}>
      <nav className={styles.nav}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => classNames(styles.link, isActive && styles.active)}
          >
            <span className={styles.icon}>•</span>
            <span className={styles.label}>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
