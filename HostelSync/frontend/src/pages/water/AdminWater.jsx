import { useEffect, useMemo, useState } from 'react'
import WaterService from '../../services/waterService'
import Toast from '../../components/UI/Toast'
import { getRole } from '../../services/auth'

const badgeStyle = (status) => {
  const base = { padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }
  switch (status) {
    case 'PENDING': return { ...base, background: '#fff4e5', color: '#b26a00' }
    case 'IN_PROGRESS': return { ...base, background: '#e6f4ff', color: '#074799' }
    case 'RESOLVED': return { ...base, background: '#e8f5e9', color: '#1b5e20' }
    case 'CANCELLED': return { ...base, background: '#ffebee', color: '#b71c1c' }
    default: return base
  }
}

const Modal = ({ open, onClose, children, title }) => {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', minWidth: 360, maxWidth: 520, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 600 }}>{title}</div>
        <div style={{ padding: 12 }}>{children}</div>
        <div style={{ padding: 12, borderTop: '1px solid #eee', textAlign: 'right' }}>
          <button onClick={onClose} style={{ padding: '6px 10px' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminWater() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [updateForm, setUpdateForm] = useState({ status: 'IN_PROGRESS', plumberId: '' })
  const [updating, setUpdating] = useState(false)
  const [plumbers, setPlumbers] = useState([])
  const role = (getRole() || '').toLowerCase()

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const data = await WaterService.getIssues(params)
      setIssues(data)
    } catch (e) {
      const data = e?.response?.data
      setError(data?.message || data?.error || 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  useEffect(() => {
    // Admin only: load plumbers list for assignment
    if (role === 'admin') {
      (async () => {
        try {
          const list = await WaterService.getPlumbers()
          setPlumbers(list)
        } catch {}
      })()
    }
  }, [role])

  const openUpdate = (issue) => {
    setSelected(issue)
    setUpdateForm({ status: issue.status || 'IN_PROGRESS', plumberId: issue.plumberId || '' })
    setModalOpen(true)
  }

  const onUpdate = async (e) => {
    e.preventDefault()
    if (!selected) return
    setUpdating(true)
    try {
      const payload = { status: updateForm.status }
      if (updateForm.plumberId) payload.plumberId = Number(updateForm.plumberId)
      await WaterService.updateIssueStatus(selected.id, payload)
      setToast({ open: true, message: 'Issue updated', type: 'success' })
      setModalOpen(false)
      setSelected(null)
      load()
    } catch (e) {
      const data = e?.response?.data
      const msgArr = Array.isArray(data?.error) ? data.error.map(x => x.message) : null
      setToast({ open: true, message: (msgArr && msgArr.join(', ')) || data?.message || data?.error || 'Failed to update issue', type: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  const list = useMemo(() => issues, [issues])

  return (
    <div style={{ padding: 16 }}>
      <h2>Water Issues Management</h2>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: 8 }}>
          <option value="">All statuses</option>
          {['PENDING','IN_PROGRESS','RESOLVED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={load} style={{ padding: '8px 12px' }}>Refresh</button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {list.map(issue => (
            <div key={issue.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{issue.title}</div>
                <span style={badgeStyle(issue.status)}>{issue.status}</span>
              </div>
              <div style={{ color: '#555', marginTop: 6 }}>{issue.description}</div>
              <div style={{ color: '#666', fontSize: 13, marginTop: 6 }}>Location: {issue.location}</div>
              <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>Reported by: {issue.reportedBy?.name || '—'}</div>
              <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>Assigned to: {issue.assignedTo?.name || (issue.plumberId ? `#${issue.plumberId}` : 'Not assigned')}</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button onClick={() => openUpdate(issue)} style={{ padding: '6px 10px' }}>Update</button>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div style={{ color: '#666' }}>No issues found.</div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Update Issue">
        <form onSubmit={onUpdate}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 200, flex: 1 }}>
              <label>Status</label>
              <select value={updateForm.status} onChange={(e) => setUpdateForm(s => ({ ...s, status: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                {['PENDING','IN_PROGRESS','RESOLVED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {role === 'admin' && (
              <div style={{ minWidth: 200, flex: 1 }}>
                <label>Assign plumber</label>
                <select value={updateForm.plumberId} onChange={(e) => setUpdateForm(s => ({ ...s, plumberId: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                  <option value="">Not assigned</option>
                  {plumbers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <button disabled={updating} style={{ padding: '8px 12px' }}>{updating ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast(s => ({ ...s, open: false }))} />
    </div>
  )
}
