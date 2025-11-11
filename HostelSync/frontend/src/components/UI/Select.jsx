import styles from '../../styles/theme.module.css'
export default function Select({ children, ...props }) { return <select className={styles.select} {...props}>{children}</select> }
