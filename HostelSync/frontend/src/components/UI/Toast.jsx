import { useEffect } from 'react'
import styles from './Toast.module.css'

export default function Toast({ message, type = 'success', open, onClose, duration = 2500 }) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [open, duration, onClose])

  if (!open) return null
  return (
    <div className={styles.wrap}>
      <div className={`${styles.toast} ${styles[type]}`}>{message}</div>
    </div>
  )
}
