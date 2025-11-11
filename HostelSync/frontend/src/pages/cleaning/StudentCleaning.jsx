import { useEffect, useState } from 'react'
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

export default function StudentCleaning() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  const [form, setForm] = useState({
    room: '',
    building: '',
    cleaningType: 'REGULAR',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    specialInstructions: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await CleaningService.getMyRequests()
      setRequests(data)
    } catch (e) {
      const data = e?.response?.data
      setError(data?.message || data?.error || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const isoDateRe = /^\d{4}-\d{2}-\d{2}$/
      if (!isoDateRe.test(form.scheduledDate)) {
        throw { response: { data: { message: 'Date must be YYYY-MM-DD' } } }
      }
      const timeRe = /^\d{2}:\d{2}$/
      if (!timeRe.test(form.startTime) || !timeRe.test(form.endTime)) {
        throw { response: { data: { message: 'Please select valid start and end times (HH:MM)' } } }
      }
      if (form.endTime <= form.startTime) {
        throw { response: { data: { message: 'End time must be after start time' } } }
      }
      const timeSlot = `${form.startTime}-${form.endTime}`
      const payload = {
        room: form.room,
        building: form.building,
        cleaningType: form.cleaningType,
        scheduledDate: `${form.scheduledDate}T00:00:00.000Z`,
        timeSlot,
        specialInstructions: form.specialInstructions || undefined,
      }
      await CleaningService.createRequest(payload)
      setToast({ open: true, message: 'Cleaning request submitted', type: 'success' })
      setForm({ room: '', building: '', cleaningType: 'REGULAR', scheduledDate: '', startTime: '', endTime: '', specialInstructions: '' })
      load()
    } catch (e) {
      const data = e?.response?.data
      const msgs = Array.isArray(data?.error) ? data.error.map(x => x.message).join(', ') : (data?.message || data?.error || 'Failed to submit request')
      setToast({ open: true, message: msgs, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Cleaning Requests</h2>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Request Cleaning</h3>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label>Room</label>
              <input value={form.room} onChange={(e) => setForm(s => ({ ...s, room: e.target.value }))} style={{ width: '100%', padding: 8 }} required />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label>Building</label>
              <input value={form.building} onChange={(e) => setForm(s => ({ ...s, building: e.target.value }))} style={{ width: '100%', padding: 8 }} required />
            </div>
            <div style={{ width: 200 }}>
              <label>Type</label>
              <select value={form.cleaningType} onChange={(e) => setForm(s => ({ ...s, cleaningType: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                {['REGULAR','DEEP','SPECIAL'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            <div style={{ width: 200 }}>
              <label>Date</label>
              <input type="date" value={form.scheduledDate} onChange={(e) => setForm(s => ({ ...s, scheduledDate: e.target.value }))} style={{ width: '100%', padding: 8 }} required />
            </div>
            <div style={{ width: 160 }}>
              <label>Start Time</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm(s => ({ ...s, startTime: e.target.value }))} style={{ width: '100%', padding: 8 }} required />
            </div>
            <div style={{ width: 160 }}>
              <label>End Time</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm(s => ({ ...s, endTime: e.target.value }))} style={{ width: '100%', padding: 8 }} required />
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <label>Special Instructions</label>
              <input value={form.specialInstructions} onChange={(e) => setForm(s => ({ ...s, specialInstructions: e.target.value }))} style={{ width: '100%', padding: 8 }} placeholder="Optional" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button disabled={submitting} style={{ padding: '8px 12px' }}>{submitting ? 'Submitting…' : 'Submit Request'}</button>
          </div>
        </form>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {requests.map(req => (
            <div key={req.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{req.cleaningType} Cleaning</div>
                <span style={badgeStyle(req.status)}>{req.status}</span>
              </div>
              <div style={{ color: '#555', marginTop: 6 }}>{req.building}, Room {req.room}</div>
              <div style={{ color: '#666', fontSize: 13, marginTop: 6 }}>Scheduled: {new Date(req.scheduledDate).toLocaleString()}</div>
              {req.timeSlot && (
                <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>Time: {req.timeSlot}</div>
              )}
              {req.cleaner && (
                <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>Cleaner: {req.cleaner?.name}</div>
              )}
            </div>
          ))}
          {requests.length === 0 && (
            <div style={{ color: '#666' }}>No requests yet.</div>
          )}
        </div>
      )}

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast(s => ({ ...s, open: false }))} />
    </div>
  )
}
