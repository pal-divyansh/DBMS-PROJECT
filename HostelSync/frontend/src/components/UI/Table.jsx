import styles from '../../styles/theme.module.css'

export default function Table({ columns = [], data = [], empty = 'No data', className = '' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className={[styles.table, styles.striped, className].join(' ')}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key || col.header} className={styles.th}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map(col => (
                <td key={col.key || col.header} className={styles.td}>
                  {typeof col.render === 'function' ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td className={styles.td} colSpan={columns.length} style={{ textAlign: 'center', color: '#666' }}>{empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
