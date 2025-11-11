import { useEffect, useState } from 'react'
import MessService from '../../services/messService'
import styles from './mess.module.css'
import Modal from '../../components/UI/Modal'
import Toast from '../../components/UI/Toast'

const initialForm = { id: null, date: '', mealType: 'BREAKFAST', servingTime: '', items: '' }

export default function AdminMess() {
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  const [openModal, setOpenModal] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const [importing, setImporting] = useState(false)

  // Feedback state
  const [feedback, setFeedback] = useState([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await MessService.getWeeklyMenu()
      setMenu(data)
    } catch (e) {
      const data = e?.response?.data
      const joiMsg = Array.isArray(data?.errors) && data.errors[0]?.message
      setError(joiMsg || data?.message || data?.error || 'Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const loadFeedback = async () => {
    setFeedbackLoading(true)
    setFeedbackError('')
    try {
      const data = await MessService.getAdminFeedback()
      setFeedback(data)
    } catch (e) {
      const data = e?.response?.data
      const joiMsg = Array.isArray(data?.errors) && data.errors[0]?.message
      setFeedbackError(joiMsg || data?.message || data?.error || 'Failed to load feedback')
    } finally {
      setFeedbackLoading(false)
    }
  }
  useEffect(() => { loadFeedback() }, [])

  const onAdd = () => {
    setForm(initialForm)
    setOpenModal(true)
  }

  const onEdit = (m) => {
    setForm({
      id: m.id,
      date: m.date?.slice(0, 10),
      mealType: m.mealType,
      servingTime: m.servingTime || '',
      items: Array.isArray(m.items)
        ? m.items.map(it => (typeof it === 'string' ? it : it?.name)).filter(Boolean).join(', ')
        : ''
    })
    setOpenModal(true)
  }

  const onDelete = async (id) => {
    if (!confirm('Delete this menu item?')) return
    try {
      await MessService.deleteMenu(id)
      setToast({ open: true, message: 'Deleted successfully', type: 'success' })
      load()
    } catch (e) {
      const data = e?.response?.data
      const joiMsg = Array.isArray(data?.errors) && data.errors[0]?.message
      setToast({ open: true, message: joiMsg || data?.message || data?.error || 'Delete failed', type: 'error' })
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Backend validator expects items: [{name, type}], and servingTime required for create
      const itemsArray = form.items
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(name => ({ name, type: 'VEG' }))

      const payload = {
        date: form.date,
        mealType: form.mealType,
        // servingTime required on create; keep on update if provided
        ...(form.id ? (form.servingTime ? { servingTime: form.servingTime } : {}) : { servingTime: form.servingTime }),
        items: itemsArray,
      }
      if (form.id) {
        await MessService.updateMenu(form.id, payload)
        setToast({ open: true, message: 'Updated successfully', type: 'success' })
      } else {
        await MessService.createMenu(payload)
        setToast({ open: true, message: 'Created successfully', type: 'success' })
      }
      setOpenModal(false)
      setForm(initialForm)
      load()
    } catch (e) {
      const data = e?.response?.data
      const joiMsg = Array.isArray(data?.errors) && data.errors[0]?.message
      setToast({ open: true, message: joiMsg || data?.message || data?.error || 'Save failed', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const res = await MessService.importMenus(file)
      setToast({ open: true, message: res?.message || 'Import completed', type: 'success' })
      load()
    } catch (e) {
      setToast({ open: true, message: e?.response?.data?.message || e?.response?.data?.error || 'Import failed', type: 'error' })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const onExport = () => {
    MessService.exportMenus()
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.title}>Menu Management</div>
        <div className={styles.actions}>
          <button className={styles.btnGhost} onClick={onExport}>Export CSV</button>
          <label className={styles.btnGhost}>
            {importing ? 'Importing…' : 'Import CSV'}
            <input className={styles.file} type="file" accept=".csv" onChange={onImport} style={{ display: 'none' }} />
          </label>
          <button className={styles.btn} onClick={onAdd}>Add Menu</button>
        </div>
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
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menu.map((m) => (
                <tr key={`${m.id}-${m.mealType}`}>
                  <td className={styles.td}>{new Date(m.date).toLocaleDateString()}</td>
                  <td className={styles.td}><span className={styles.badge}>{m.mealType}</span></td>
                  <td className={styles.td}>{m.servingTime || '-'}</td>
                  <td className={styles.td}>{Array.isArray(m.items) ? m.items.map(it => (typeof it === 'string' ? it : it?.name)).filter(Boolean).join(', ') : ''}</td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button className={styles.btnGhost} onClick={() => onEdit(m)}>Edit</button>
                      <button className={styles.btnGhost} onClick={() => onDelete(m.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Feedback section */}
      <div className={styles.header} style={{ marginTop: 24 }}>
        <div className={styles.title}>Meal Feedback</div>
        <div className={styles.actions}>
          <button className={styles.btnGhost} onClick={loadFeedback}>Refresh</button>
        </div>
      </div>

      {feedbackLoading && <div>Loading feedback…</div>}
      {feedbackError && <div className={styles.error}>{feedbackError}</div>}

      {!feedbackLoading && !feedbackError && (
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.striped}`}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>User</th>
                <th className={styles.th}>Menu</th>
                <th className={styles.th}>Rating</th>
                <th className={styles.th}>Comment</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map(f => (
                <tr key={f.id}>
                  <td className={styles.td}>{new Date(f.createdAt).toLocaleString()}</td>
                  <td className={styles.td}>{f.user?.name} <span style={{ color:'#6b7280' }}>({f.user?.email})</span></td>
                  <td className={styles.td}>{new Date(f.menu?.date).toLocaleDateString()} - <span className={styles.badge}>{f.menu?.mealType}</span></td>
                  <td className={styles.td}>{f.rating}</td>
                  <td className={styles.td}>{f.comment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={form.id ? 'Edit Menu' : 'Add Menu'}
        actions={
          <>
            <button className={styles.btnGhost} onClick={() => setOpenModal(false)}>Cancel</button>
            <button className={styles.btn} onClick={onSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label>Date</label>
              <input className={styles.input} type="date" value={form.date} onChange={(e) => setForm(s => ({ ...s, date: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label>Meal</label>
              <select className={styles.select} value={form.mealType} onChange={(e) => setForm(s => ({ ...s, mealType: e.target.value }))}>
                {['BREAKFAST','LUNCH','DINNER','SPECIAL'].map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label>Serving Time</label>
              <input className={styles.input} type="time" value={form.servingTime} onChange={(e) => setForm(s => ({ ...s, servingTime: e.target.value }))} placeholder="HH:MM" required={!form.id} />
            </div>
            <div className={styles.field}>
              <label>Items (comma-separated)</label>
              <input className={styles.input} type="text" value={form.items} onChange={(e) => setForm(s => ({ ...s, items: e.target.value }))} placeholder="e.g. Poha, Tea, Apple" />
            </div>
          </div>
        </form>
      </Modal>

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast(s => ({ ...s, open: false }))} />
    </div>
  )
}
