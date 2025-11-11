import { useEffect, useMemo, useState } from 'react'
import CleaningService from '../../services/cleaningService'
import Toast from '../../components/UI/Toast'

const badgeStyle = (status) => {
  const base = { padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }
  switch (status) {
    case 'PENDING': return { ...base, background: '#fff4e5', color: '#b26a00' }
    case 'ASSIGNED': return { ...base, background: '#ede7f6', color: '#4527a0' }
    case 'IN_PROGRESS': return { ...base, background: '#e6f4ff', color: '#074799' }
    case 'COMPLETED': return { ...base, background: '#e8f5e9', color: '#1b5e20' }
    case 'CANCELLED': return { ...base, background: '#ffebee', color: '#b71c1c' }
    default: return base
  }
}

const Modal = ({ open, onClose, children, title }) => {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', minWidth: 380, maxWidth: 640, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 600 }}>{title}</div>
        <div style={{ padding: 12 }}>{children}</div>
        <div style={{ padding: 12, borderTop: '1px solid #eee', textAlign: 'right' }}>
          <button onClick={onClose} style={{ padding: '6px 10px' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCleaning() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  const [status, setStatus] = useState('')
  const [building, setBuilding] = useState('')
  const [cleanerId, setCleanerId] = useState('')
  const [cleaners, setCleaners] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [updateForm, setUpdateForm] = useState({ status: 'ASSIGNED', cleanerId: '' })
  const [updating, setUpdating] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (status) params.status = status
      if (building) params.building = building
      if (cleanerId) params.cleanerId = cleanerId
      const data = await CleaningService.getRequests(params)
      setRequests(data)
    } catch (e) {
      const data = e?.response?.data
      setError(data?.message || data?.error || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const loadCleaners = async () => {
    try {
      const res = await CleaningService.getCleaners()
      const arr = res?.data || []
      setCleaners(arr)
    } catch (e) {
      // non-blocking
    }
  }

  useEffect(() => { load(); loadCleaners() }, [])
  useEffect(() => { load() }, [status, building, cleanerId])

  const openUpdate = (req) => {
    setSelected(req)
    setUpdateForm({ status: req.status || 'ASSIGNED', cleanerId: req.cleaner?.id || '' })
    setModalOpen(true)
  }

  const onUpdate = async (e) => {
    e.preventDefault()
    if (!selected) return
    setUpdating(true)
    try {
      const payload = {}
      if (updateForm.status) payload.status = updateForm.status
      if (updateForm.cleanerId) payload.cleanerId = Number(updateForm.cleanerId)
      await CleaningService.updateRequestStatus(selected.id, payload)
      setToast({ open: true, message: 'Request updated', type: 'success' })
      setModalOpen(false)
      setSelected(null)
      load()
    } catch (e) {
      const data = e?.response?.data
      const msgArr = Array.isArray(data?.error) ? data.error.map(x => x.message) : null
      setToast({ open: true, message: (msgArr && msgArr.join(', ')) || data?.message || data?.error || 'Failed to update', type: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  const list = useMemo(() => requests, [requests])

  return (
    <div style={{ padding: 16 }}>
      <h2>Cleaning Management</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 8 }}>
          <option value="">All statuses</option>
          {['PENDING','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="Filter building" style={{ padding: 8 }} />
        <select value={cleanerId} onChange={(e) => setCleanerId(e.target.value)} style={{ padding: 8 }}>
          <option value="">Any cleaner</option>
          {cleaners.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={load} style={{ padding: '8px 12px' }}>Refresh</button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <div className="table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>When</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Student</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Location</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Type</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Cleaner</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(req => (
                <tr key={req.id}>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f3f3' }}>{new Date(req.scheduledDate).toLocaleString()}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f3f3' }}>{req.student?.name}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f3f3' }}>{req.building}, Room {req.room}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f3f3' }}>{req.cleaningType}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f3f3' }}>{req.cleaner?.name || '—'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f3f3' }}><span style={badgeStyle(req.status)}>{req.status}</span></td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f3f3' }}>
                    <button onClick={() => openUpdate(req)} style={{ padding: '6px 10px' }}>Details</button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 12, textAlign: 'center', color: '#666' }}>No requests</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request Details">
        {selected && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{selected.cleaningType} Cleaning</div>
              <div style={{ color: '#666' }}>{selected.building}, Room {selected.room}</div>
              <div style={{ color: '#888', fontSize: 13 }}>Scheduled: {new Date(selected.scheduledDate).toLocaleString()}</div>
              <div style={{ color: '#888', fontSize: 13 }}>Student: {selected.student?.name} ({selected.student?.roomNo})</div>
            </div>
            <form onSubmit={onUpdate}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 200, flex: 1 }}>
                  <label>Status</label>
                  <select value={updateForm.status} onChange={(e) => setUpdateForm(s => ({ ...s, status: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                    {['PENDING','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ minWidth: 200, flex: 1 }}>
                  <label>Assign Cleaner</label>
                  <select value={updateForm.cleanerId} onChange={(e) => setUpdateForm(s => ({ ...s, cleanerId: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                    <option value="">Unassigned</option>
                    {cleaners.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 12, textAlign: 'right' }}>
                <button disabled={updating} style={{ padding: '8px 12px' }}>{updating ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast(s => ({ ...s, open: false }))} />
    </div>
  )
}
