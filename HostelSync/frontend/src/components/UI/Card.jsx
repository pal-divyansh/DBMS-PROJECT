import styles from '../../styles/theme.module.css'
export default function Card({ children, className = '', ...props }) {
  return <div className={[styles.card, styles.p-4, className].join(' ')} {...props}>{children}</div>
}
