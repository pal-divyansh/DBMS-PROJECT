import styles from '../../styles/theme.module.css'
import Spinner from './Spinner'

export default function Button({ children, variant = 'primary', ghost = false, className = '', loading = false, disabled = false, ...props }) {
  const cls = [styles.btn]
  if (ghost) cls.push(styles['btn-ghost'])
  if (variant === 'danger') cls.push(styles['btn-danger'])
  if (variant === 'success') cls.push(styles['btn-success'])

  const isDisabled = disabled || loading
  const style = isDisabled ? { opacity: 0.75, cursor: 'not-allowed' } : undefined

  return (
    <button className={[...cls, className].join(' ')} disabled={isDisabled} style={style} {...props}>
      {loading && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Spinner size={16} /><span>{children}</span></span>}
      {!loading && children}
    </button>
  )
}
