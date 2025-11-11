import { useEffect, useMemo, useState } from 'react'
import TransportService from '../../services/transportService'
import styles from './transport.module.css'
import Toast from '../../components/UI/Toast'

export default function StudentTransport() {
  const [routes, setRoutes] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  const [form, setForm] = useState({ scheduleId: '', bookingDate: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [r, v, b] = await Promise.all([
        TransportService.getRoutes(),
        TransportService.getVehicles(),
        TransportService.getMyBookings(),
      ])
      setRoutes(r)
      setVehicles(v)
      setBookings(b)
    } catch (e) {
      const data = e?.response?.data
      const joiMsg = Array.isArray(data?.errors) && data.errors[0]?.message
      setError(joiMsg || data?.message || data?.error || 'Failed to load transport data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const scheduleOptions = useMemo(() => {
    const opts = []
    for (const r of routes || []) {
      for (const s of r.schedules || []) {
        opts.push({
          id: s.id,
          label: `${r.name} • ${s.day} ${s.startTime}-${s.endTime} • seats: ${(s.maxCapacity ?? '-')}`,
        })
      }
    }
    return opts
  }, [routes])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.scheduleId || !form.bookingDate) return
    setSubmitting(true)
    try {
      await TransportService.createBooking({ scheduleId: Number(form.scheduleId), bookingDate: form.bookingDate })
      setToast({ open: true, message: 'Booking created', type: 'success' })
      setForm({ scheduleId: '', bookingDate: '' })
      const b = await TransportService.getMyBookings()
      setBookings(b)
    } catch (e) {
      const data = e?.response?.data
      const joiMsg = Array.isArray(data?.errors) && data.errors[0]?.msg
      setToast({ open: true, message: joiMsg || data?.message || data?.error || 'Failed to create booking', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const onCancel = async (id) => {
    try {
      await TransportService.cancelBooking(id)
      setToast({ open: true, message: 'Booking cancelled', type: 'success' })
      setBookings(b => b.filter(x => x.id !== id))
    } catch (e) {
      const data = e?.response?.data
      const joiMsg = Array.isArray(data?.errors) && data.errors[0]?.msg
      setToast({ open: true, message: joiMsg || data?.message || data?.error || 'Failed to cancel booking', type: 'error' })
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.title}>Transport</div>
        <div className={styles.subtitle}>Routes, vehicles and your bookings</div>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Create Booking</div>
            <form onSubmit={onSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>Schedule</label>
                  <select className={styles.select} value={form.scheduleId} onChange={(e) => setForm(s => ({ ...s, scheduleId: e.target.value }))}>
                    <option value="">Select schedule</option>
                    {scheduleOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Date</label>
                  <input className={styles.input} type="date" value={form.bookingDate} onChange={(e) => setForm(s => ({ ...s, bookingDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <button className={styles.btn} disabled={submitting || !form.scheduleId || !form.bookingDate}>
                  {submitting ? 'Booking…' : 'Book'}
                </button>
              </div>
            </form>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Available Routes</div>
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.striped}`}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>Route</th>
                    <th className={styles.th}>Start - End</th>
                    <th className={styles.th}>Schedules</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map(r => (
                    <tr key={r.id}>
                      <td className={styles.td}>{r.name}</td>
                      <td className={styles.td}>{r.startPoint} → {r.endPoint}</td>
                      <td className={styles.td}>{(r.schedules||[]).map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Available Vehicles</div>
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.striped}`}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>Type</th>
                    <th className={styles.th}>Number</th>
                    <th className={styles.th}>Capacity</th>
                    <th className={styles.th}>Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id}>
                      <td className={styles.td}>{v.type}</td>
                      <td className={styles.td}>{v.number}</td>
                      <td className={styles.td}>{v.capacity}</td>
                      <td className={styles.td}>{v.driver ? `${v.driver.name} (${v.driver.email})` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>My Bookings</div>
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.striped}`}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th}>Route</th>
                    <th className={styles.th}>Vehicle</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td className={styles.td}>{new Date(b.bookingDate).toLocaleDateString()}</td>
                      <td className={styles.td}>{b.schedule?.route?.name}</td>
                      <td className={styles.td}>{b.schedule?.vehicle?.number || b.schedule?.vehicle?.type}</td>
                      <td className={styles.td}><span className={styles.badge}>{b.status}</span></td>
                      <td className={styles.td}>
                        <button className={styles.btnGhost} onClick={() => onCancel(b.id)}>Cancel</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast(s => ({ ...s, open: false }))} />
    </div>
  )
}
