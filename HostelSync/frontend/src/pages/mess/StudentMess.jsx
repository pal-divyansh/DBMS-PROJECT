import { useEffect, useMemo, useState } from 'react'
import MessService from '../../services/messService'
import styles from './mess.module.css'
import Toast from '../../components/UI/Toast'

export default function StudentMess() {
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  const [feedback, setFeedback] = useState({ menuId: '', rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await MessService.getWeeklyMenu()
        setMenu(data)
      } catch (e) {
        setError(e?.response?.data?.message || e?.response?.data?.error || 'Failed to load menu')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const todayMenus = useMemo(() => {
    const today = new Date().toDateString()
    return (menu || []).filter(m => new Date(m.date).toDateString() === today)
  }, [menu])

  const onSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!feedback.menuId) return
    setSubmitting(true)
    try {
      await MessService.submitFeedback({
        menuId: Number(feedback.menuId),
        rating: Number(feedback.rating),
        comment: feedback.comment,
      })
      setFeedback({ menuId: '', rating: 5, comment: '' })
      setToast({ open: true, message: 'Feedback submitted', type: 'success' })
    } catch (e) {
      setToast({ open: true, message: e?.response?.data?.message || e?.response?.data?.error || 'Failed to submit feedback', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.title}>Today’s Mess Menu</div>
      </div>

      {loading && <div>Loading menu…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.striped}`}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Meal</th>
                <th className={styles.th}>Serving Time</th>
                <th className={styles.th}>Items</th>
              </tr>
            </thead>
            <tbody>
              {(todayMenus.length ? todayMenus : menu).map((m) => (
                <tr key={`${m.id}-${m.mealType}`}>
                  <td className={styles.td}>{new Date(m.date).toLocaleDateString()}</td>
                  <td className={styles.td}><span className={styles.badge}>{m.mealType}</span></td>
                  <td className={styles.td}>{m.servingTime || '-'}</td>
                  <td className={styles.td}>{Array.isArray(m.items) ? m.items.join(', ') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h3>Feedback</h3>
        <form onSubmit={onSubmitFeedback} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label>Menu</label>
              <select className={styles.select} value={feedback.menuId} onChange={(e) => setFeedback(s => ({ ...s, menuId: e.target.value }))}>
                <option value="">Select menu</option>
                {(todayMenus.length ? todayMenus : menu).map(m => (
                  <option key={m.id} value={m.id}>{new Date(m.date).toLocaleDateString()} - {m.mealType}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Rating</label>
              <select className={styles.select} value={feedback.rating} onChange={(e) => setFeedback(s => ({ ...s, rating: e.target.value }))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label>Comment</label>
            <textarea className={styles.textarea} value={feedback.comment} onChange={(e) => setFeedback(s => ({ ...s, comment: e.target.value }))} />
          </div>
          <div>
            <button className={styles.btn} disabled={submitting || !feedback.menuId}>
              {submitting ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast(s => ({ ...s, open: false }))} />
    </div>
  )
}
