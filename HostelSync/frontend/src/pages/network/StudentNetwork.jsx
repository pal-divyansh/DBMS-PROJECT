import { useEffect, useState } from 'react'
import NetworkService from '../../services/networkService'
import Toast from '../../components/UI/Toast'

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

export default function StudentNetwork() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  const [form, setForm] = useState({
    title: '',
    description: '',
    issueType: 'CONNECTIVITY',
    priority: 'MEDIUM',
    ipAddress: '',
    macAddress: '',
    location: '', // UI only, appended into description
    device: '',   // UI only
  })
  const [submitting, setSubmitting] = useState(false)

  const [comments, setComments] = useState({}) // id -> array
  const [newComment, setNewComment] = useState({}) // id -> text
  const [loadingComments, setLoadingComments] = useState({}) // id -> boolean
  const [addingComment, setAddingComment] = useState({}) // id -> boolean

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await NetworkService.getIssues()
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
      let desc = form.description
      const extras = []
      if (form.location) extras.push(`Location: ${form.location}`)
      if (form.device) extras.push(`Device: ${form.device}`)
      if (extras.length) desc = `${desc}\n\n${extras.join(' | ')}`
      const payload = {
        title: form.title,
        description: desc,
        issueType: form.issueType,
        priority: form.priority,
        ipAddress: form.ipAddress || undefined,
        macAddress: form.macAddress || undefined,
      }
      await NetworkService.reportIssue(payload)
      setToast({ open: true, message: 'Issue reported', type: 'success' })
      setForm({ title: '', description: '', issueType: 'CONNECTIVITY', priority: 'MEDIUM', ipAddress: '', macAddress: '', location: '', device: '' })
      load()
    } catch (e) {
      const data = e?.response?.data
      const msgArr = Array.isArray(data?.error) ? data.error.map(x => x.message) : null
      setToast({ open: true, message: (msgArr && msgArr.join(', ')) || data?.message || data?.error || 'Failed to report issue', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const fetchComments = async (id) => {
    setLoadingComments(s => ({ ...s, [id]: true }))
    try {
      const data = await NetworkService.getComments(id)
      setComments(s => ({ ...s, [id]: data }))
    } catch (e) {
      // ignore per-card error, can toast if desired
    } finally {
      setLoadingComments(s => ({ ...s, [id]: false }))
    }
  }

  const addComment = async (id) => {
    const content = (newComment[id] || '').trim()
    if (!content) return
    setAddingComment(s => ({ ...s, [id]: true }))
    try {
      await NetworkService.addComment(id, { content })
      setNewComment(s => ({ ...s, [id]: '' }))
      fetchComments(id)
    } catch (e) {
      const data = e?.response?.data
      setToast({ open: true, message: data?.message || data?.error || 'Failed to add comment', type: 'error' })
    } finally {
      setAddingComment(s => ({ ...s, [id]: false }))
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Network Issues</h2>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Report an Issue</h3>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 240, flex: 1 }}>
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))} style={{ width: '100%', padding: 8 }} required />
            </div>
            <div style={{ width: 220 }}>
              <label>Type</label>
              <select value={form.issueType} onChange={(e) => setForm(s => ({ ...s, issueType: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                {['CONNECTIVITY','SPEED','AUTHENTICATION','OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ width: 180 }}>
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm(s => ({ ...s, priority: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                {['LOW','MEDIUM','HIGH','CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} rows={3} style={{ width: '100%', padding: 8 }} required />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            <div style={{ width: 200 }}>
              <label>Location (optional)</label>
              <input value={form.location} onChange={(e) => setForm(s => ({ ...s, location: e.target.value }))} style={{ width: '100%', padding: 8 }} />
            </div>
            <div style={{ width: 200 }}>
              <label>Device (optional)</label>
              <input value={form.device} onChange={(e) => setForm(s => ({ ...s, device: e.target.value }))} style={{ width: '100%', padding: 8 }} />
            </div>
            <div style={{ width: 180 }}>
              <label>IP (optional)</label>
              <input value={form.ipAddress} onChange={(e) => setForm(s => ({ ...s, ipAddress: e.target.value }))} style={{ width: '100%', padding: 8 }} placeholder="192.168.0.10" />
            </div>
            <div style={{ width: 220 }}>
              <label>MAC (optional)</label>
              <input value={form.macAddress} onChange={(e) => setForm(s => ({ ...s, macAddress: e.target.value }))} style={{ width: '100%', padding: 8 }} placeholder="AA:BB:CC:DD:EE:FF" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button disabled={submitting} style={{ padding: '8px 12px' }}>{submitting ? 'Submitting…' : 'Report Issue'}</button>
          </div>
        </form>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {issues.map(issue => (
            <div key={issue.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{issue.title}</div>
                <span style={badgeStyle(issue.status)}>{issue.status}</span>
              </div>
              <div style={{ color: '#555' }}>{issue.description}</div>
              <div style={{ color: '#666', fontSize: 12 }}>Reported: {new Date(issue.createdAt).toLocaleString()}</div>

              <div style={{ marginTop: 6 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Comments</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(comments[issue.id] || []).map(c => (
                    <CommentCard key={c.id} c={c} />
                  ))}
                  {!comments[issue.id] && (
                    <button onClick={() => fetchComments(issue.id)} style={{ padding: '6px 10px', alignSelf: 'start' }}>
                      {loadingComments[issue.id] ? 'Loading…' : 'Load comments'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input
                  value={newComment[issue.id] || ''}
                  onChange={(e) => setNewComment(s => ({ ...s, [issue.id]: e.target.value }))}
                  placeholder="Add a comment"
                  style={{ flex: 1, padding: 8 }}
                />
                <button onClick={() => addComment(issue.id)} disabled={addingComment[issue.id]} style={{ padding: '8px 12px' }}>
                  {addingComment[issue.id] ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>
          ))}
          {issues.length === 0 && (
            <div style={{ color: '#666' }}>No issues yet.</div>
          )}
        </div>
      )}

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast(s => ({ ...s, open: false }))} />
    </div>
  )
}
