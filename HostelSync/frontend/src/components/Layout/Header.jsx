import styles from './Header.module.css'
import { getUser } from '../../services/auth'
import AuthService from '../../services/authService'
import { useNavigate } from 'react-router-dom'

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate()
  const user = getUser()

  const onLogout = async () => {
    await AuthService.logout()
    navigate('/login')
  }

  return (
    <header className={styles.header}>
      <button className={styles.toggle} onClick={onToggleSidebar} aria-label="Toggle menu">☰</button>
      <div className={styles.brand}>HostelSync</div>
      <div className={styles.right}>
        <span className={styles.user}>{user?.name || 'User'}</span>
        <button className={styles.logout} onClick={onLogout}>Logout</button>
      </div>
    </header>
  )
}
