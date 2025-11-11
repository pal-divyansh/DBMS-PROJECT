import { Link } from 'react-router-dom'
import styles from './dashboard.module.css'

export default function StaffDashboard() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>Staff Dashboard</div>
        <div className={styles.subtitle}>Today’s operational overview</div>
      </div>
      <div className={styles.grid}>
        <Link to="/mess" className={styles.card}>
          <div className={styles.cardTitle}>Today’s Mess Menu</div>
          <div className={styles.cardMeta}>Review and update menu</div>
        </Link>
        <Link to="/transport" className={styles.card}>
          <div className={styles.cardTitle}>My Transport Bookings</div>
          <div className={styles.cardMeta}>Manage bookings and requests</div>
        </Link>
        <Link to="/water" className={styles.card}>
          <div className={styles.cardTitle}>Pending Water Issues</div>
          <div className={styles.cardMeta}>Resolve active reports</div>
        </Link>
      </div>
    </div>
  )
}
