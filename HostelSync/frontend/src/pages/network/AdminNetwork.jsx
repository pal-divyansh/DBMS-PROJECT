import { useEffect, useMemo, useState } from 'react'
import NetworkService from '../../services/networkService'
import Toast from '../../components/UI/Toast'
import { getRole } from '../../services/auth'

const badgeStyle = (status) => {
  const base = { padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }
  switch (status) {
    case 'OPEN': return { ...base, background: '#fff4e5', color: '#b26a00' }
    case 'IN_PROGRESS': return { ...base, background: '#e6f4ff', color: '#074799' }
    case 'RESOLVED': return { ...base, background: '#e8f5e9', color: '#1b5e20' }
    case 'CANCELLED': return { ...base, background: '#ffebee', color: '#b71c1c' }
    default: return base
  }
}

const CommentCard = ({ c }) => (
  <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
    <div style={{ fontSize: 13, color: '#333' }}>{c.content}</div>
    <div style={{ fontSize: 11, color: '#777', marginTop: 4 }}>{new Date(c.createdAt).toLocaleString()} • {c.author?.name || ''}</div>
  </div>
)

const Modal = ({ open, onClose, children, title }) => {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', minWidth: 380, maxWidth: 700, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 600 }}>{title}</div>
        <div style={{ padding: 12 }}>{children}</div>
        <div style={{ padding: 12, borderTop: '1px solid #eee', textAlign: 'right' }}>
          <button onClick={onClose} style={{ padding: '6px 10px' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminNetwork() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [updateForm, setUpdateForm] = useState({ status: 'IN_PROGRESS', assignedToId: '' })
  const [maintenanceNote, setMaintenanceNote] = useState('')
  const [pending, setPending] = useState(false)
  const [itStaff, setItStaff] = useState([])
  const role = (getRole() || '').toLowerCase()

  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter
      const data = await NetworkService.getIssues(params)
      setIssues(data)
    } catch (e) {
      const data = e?.response?.data
      setError(data?.message || data?.error || 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter, typeFilter])

  const openUpdate = async (issue) => {
    setSelected(issue)
    setUpdateForm({ status: issue.status || 'IN_PROGRESS', assignedToId: issue.assignedToId || '' })
    setMaintenanceNote('')
    setModalOpen(true)
    setLoadingComments(true)
    try {
      const cs = await NetworkService.getComments(issue.id)
      setComments(cs)
      // Load IT staff for admin to assign
      if (role === 'admin') {
        try {
          const staff = await NetworkService.getItStaff()
          setItStaff(staff)
        } catch {}
      }
    } catch (e) { /* ignore */ } finally { setLoadingComments(false) }
  }

  const onUpdate = async (e) => {
    e.preventDefault()
    if (!selected) return
    setPending(true)
    try {
      const payload = {}
      if (updateForm.status) payload.status = updateForm.status
      if (updateForm.assignedToId) payload.assignedToId = Number(updateForm.assignedToId)
      if (Object.keys(payload).length) {
        await NetworkService.updateIssue(selected.id, payload)
      }
      if (maintenanceNote.trim()) {
        await NetworkService.addComment(selected.id, { content: maintenanceNote.trim() })
      }
      setToast({ open: true, message: 'Issue updated', type: 'success' })
      setModalOpen(false)
      setSelected(null)
      load()
    } catch (e) {
      const data = e?.response?.data
      const msgArr = Array.isArray(data?.error) ? data.error.map(x => x.message) : null
      setToast({ open: true, message: (msgArr && msgArr.join(', ')) || data?.message || data?.error || 'Failed to update', type: 'error' })
    } finally {
      setPending(false)
    }
  }

  const list = useMemo(() => issues, [issues])

  return (
    <div style={{ padding: 16 }}>
      <h2>Network Issues Management</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: 8 }}>
          <option value="">All statuses</option>
          {['OPEN','IN_PROGRESS','RESOLVED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: 8 }}>
          <option value="">All types</option>
          {['CONNECTIVITY','SPEED','AUTHENTICATION','OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={load} style={{ padding: '8px 12px' }}>Refresh</button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
          {list.map(issue => (
            <div key={issue.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{issue.title}</div>
                <span style={badgeStyle(issue.status)}>{issue.status}</span>
              </div>
              <div style={{ color: '#555' }}>{issue.description}</div>
              <div style={{ color: '#666', fontSize: 12 }}>Reported: {new Date(issue.createdAt).toLocaleString()}</div>
              <div style={{ marginTop: 6 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Comments</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Comments will be shown in modal for full view */}
                  <button onClick={() => openUpdate(issue)} style={{ padding: '6px 10px', alignSelf: 'start' }}>Open</button>
                </div>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div style={{ color: '#666' }}>No issues found.</div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? `Update: ${selected.title}` : 'Update Issue'}>
        {selected && (
          <form onSubmit={onUpdate}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 200, flex: 1 }}>
                <label>Status</label>
                <select value={updateForm.status} onChange={(e) => setUpdateForm(s => ({ ...s, status: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                  {['OPEN','IN_PROGRESS','RESOLVED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {role === 'admin' && (
                <div style={{ minWidth: 200, flex: 1 }}>
                  <label>Assign to IT staff</label>
                  <select value={updateForm.assignedToId} onChange={(e) => setUpdateForm(s => ({ ...s, assignedToId: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                    <option value="">Not assigned</option>
                    {itStaff.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <label>Maintenance Note (adds comment)</label>
              <textarea value={maintenanceNote} onChange={(e) => setMaintenanceNote(e.target.value)} rows={3} style={{ width: '100%', padding: 8 }} placeholder="What did you check/fix?" />
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Comments</div>
              {loadingComments ? (
                <div>Loading…</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflow: 'auto' }}>
                  {comments.map(c => <CommentCard key={c.id} c={c} />)}
                  {comments.length === 0 && <div style={{ color: '#777' }}>No comments yet.</div>}
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button disabled={pending} style={{ padding: '8px 12px' }}>{pending ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast(s => ({ ...s, open: false }))} />
    </div>
  )
}
