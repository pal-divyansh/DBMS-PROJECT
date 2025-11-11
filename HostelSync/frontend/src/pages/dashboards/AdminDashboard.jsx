import { Link } from 'react-router-dom'
import styles from './dashboard.module.css'

export default function AdminDashboard() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>Admin Dashboard</div>
        <div className={styles.subtitle}>System overview and quick actions</div>
      </div>
      <div className={styles.grid}>
        <Link to="/mess" className={styles.card}>
          <div className={styles.cardTitle}>Today’s Mess Menu</div>
          <div className={styles.cardMeta}>Oversee menu across hostels</div>
        </Link>
        <Link to="/transport" className={styles.card}>
          <div className={styles.cardTitle}>My Transport Bookings</div>
          <div className={styles.cardMeta}>Monitor capacity and usage</div>
        </Link>
        <Link to="/water" className={styles.card}>
          <div className={styles.cardTitle}>Pending Water Issues</div>
          <div className={styles.cardMeta}>Review outstanding issues</div>
        </Link>
      </div>
    </div>
  )
}
