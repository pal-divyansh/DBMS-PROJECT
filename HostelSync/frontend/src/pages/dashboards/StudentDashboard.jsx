import { Link } from 'react-router-dom'
import styles from './dashboard.module.css'

export default function StudentDashboard() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>Student Dashboard</div>
        <div className={styles.subtitle}>Quick overview for today</div>
      </div>
      <div className={styles.grid}>
        <Link to="/mess" className={styles.card}>
          <div className={styles.cardTitle}>Today’s Mess Menu</div>
          <div className={styles.cardMeta}>See breakfast, lunch, and dinner</div>
        </Link>
        <Link to="/transport" className={styles.card}>
          <div className={styles.cardTitle}>My Transport Bookings</div>
          <div className={styles.cardMeta}>Upcoming and past rides</div>
        </Link>
        <Link to="/water" className={styles.card}>
          <div className={styles.cardTitle}>Pending Water Issues</div>
          <div className={styles.cardMeta}>Track reported issues</div>
        </Link>
      </div>
    </div>
  )
}
