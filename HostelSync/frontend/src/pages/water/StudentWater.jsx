import { useEffect, useState } from 'react'
import WaterService from '../../services/waterService'
import Toast from '../../components/UI/Toast'

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

export default function StudentWater() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'MEDIUM',
    images: '', // comma separated URLs
  })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await WaterService.getIssues()
      setIssues(data)
    } catch (e) {
      const data = e?.response?.data
      setError(data?.message || data?.error || 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        priority: form.priority,
      }
      const imgs = form.images.split(',').map(s => s.trim()).filter(Boolean)
      if (imgs.length) payload.images = imgs
      await WaterService.reportIssue(payload)
      setToast({ open: true, message: 'Issue reported', type: 'success' })
      setForm({ title: '', description: '', location: '', priority: 'MEDIUM', images: '' })
      load()
    } catch (e) {
      const data = e?.response?.data
      const msgArr = Array.isArray(data?.error) ? data.error.map(x => x.message) : null
      setToast({ open: true, message: (msgArr && msgArr.join(', ')) || data?.message || data?.error || 'Failed to report issue', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Water Issues</h2>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Report an Issue</h3>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))} style={{ width: '100%', padding: 8 }} required />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label>Location</label>
              <input value={form.location} onChange={(e) => setForm(s => ({ ...s, location: e.target.value }))} style={{ width: '100%', padding: 8 }} required />
            </div>
            <div style={{ width: 180 }}>
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm(s => ({ ...s, priority: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} rows={3} style={{ width: '100%', padding: 8 }} required />
          </div>
          <div style={{ marginTop: 12 }}>
            <button disabled={submitting} style={{ padding: '8px 12px' }}>{submitting ? 'Submitting…' : 'Report Issue'}</button>
          </div>
        </form>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {issues.map(issue => (
            <div key={issue.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{issue.title}</div>
                <span style={badgeStyle(issue.status)}>{issue.status}</span>
              </div>
              <div style={{ color: '#555', marginTop: 6 }}>{issue.description}</div>
              <div style={{ color: '#666', fontSize: 13, marginTop: 6 }}>Location: {issue.location}</div>
              {Array.isArray(issue.images) && issue.images.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>Images: {issue.images.length}</div>
              )}
              <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>Reported: {new Date(issue.createdAt).toLocaleString()}</div>
            </div>
          ))}
          {issues.length === 0 && (
            <div style={{ color: '#666' }}>No issues reported yet.</div>
          )}
        </div>
      )}

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast(s => ({ ...s, open: false }))} />
    </div>
  )
}
