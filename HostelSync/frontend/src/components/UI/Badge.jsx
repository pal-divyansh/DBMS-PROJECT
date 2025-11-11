import styles from '../../styles/theme.module.css'

const map = {
  open: styles['badge-open'],
  progress: styles['badge-progress'],
  success: styles['badge-success'],
  danger: styles['badge-danger'],
}

export default function Badge({ children, tone = 'open', className = '' }) {
  const cls = [styles.badge, map[tone] || '']
  return <span className={[...cls, className].join(' ')}>{children}</span>
}
