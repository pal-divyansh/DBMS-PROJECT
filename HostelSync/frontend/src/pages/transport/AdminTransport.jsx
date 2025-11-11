import { useEffect, useState } from 'react'
import TransportService from '../../services/transportService'
import styles from './transport.module.css'
import Toast from '../../components/UI/Toast'

export default function AdminTransport() {
  const [vehicles, setVehicles] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  // Forms
  const [routeForm, setRouteForm] = useState({ 
    name: '', 
    startPoint: '', 
    endPoint: '',
    stops: '',
    description: ''
  })
  const [routeSaving, setRouteSaving] = useState(false)
  
  const [vehicleForm, setVehicleForm] = useState({ type: 'Bus', number: '', capacity: '', driverId: '' })
  const [vehicleSaving, setVehicleSaving] = useState(false)

  const [scheduleForm, setScheduleForm] = useState({
    routeId: '',
    vehicleId: '',
    day: 'MONDAY',
    startTime: '',
    endTime: '',
    startDate: '',
    endDate: '',
    maxCapacity: "",
    price: 0,
  })
  const [scheduleSaving, setScheduleSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [v, r] = await Promise.all([
        TransportService.getVehicles(),
        TransportService.getRoutes(),
      ])
      setVehicles(v)
      setRoutes(r)
    } catch (e) {
      const data = e?.response?.data
      const msg = data?.message || data?.error || 'Failed to load transport data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onAddVehicle = async (e) => {
    e.preventDefault()
    setVehicleSaving(true)
    try {
      await TransportService.addVehicle({
        type: vehicleForm.type,
        number: vehicleForm.number,
        capacity: Number(vehicleForm.capacity),
        driverId: vehicleForm.driverId ? Number(vehicleForm.driverId) : undefined,
      })
      setToast({ open: true, message: 'Vehicle created', type: 'success' })
      setVehicleForm({ type: 'Bus', number: '', capacity: '', driverId: '' })
      load()
    } catch (e) {
      const data = e?.response?.data
      const msg = data?.message || data?.error || 'Failed to add vehicle (endpoint may be not implemented)'
      setToast({ open: true, message: msg, type: 'error' })
    } finally {
      setVehicleSaving(false)
    }
  }

  const onDeleteVehicle = async (id) => {
    try {
      await TransportService.deleteVehicle(id)
      setVehicles(v => v.filter(x => x.id !== id))
      setToast({ open: true, message: 'Vehicle deleted', type: 'success' })
    } catch (e) {
      const data = e?.response?.data
      const msg = data?.message || data?.error || 'Failed to delete vehicle'
      setToast({ open: true, message: msg, type: 'error' })
    }
  }

  const onAddRoute = async (e) => {
    e.preventDefault()
    setRouteSaving(true)
    try {
      await TransportService.addRoute({
        name: routeForm.name,
        startPoint: routeForm.startPoint,
        endPoint: routeForm.endPoint,
        stops: routeForm.stops.split(',').map(s => s.trim()).filter(Boolean),
        description: routeForm.description || undefined,
      })
      setToast({ open: true, message: 'Route created', type: 'success' })
      setRouteForm({ name: '', startPoint: '', endPoint: '', stops: '', description: '' })
      load()
    } catch (e) {
      const data = e?.response?.data
      const msg = data?.message || data?.error || 'Failed to add route'
      setToast({ open: true, message: msg, type: 'error' })
    } finally {
      setRouteSaving(false)
    }
  }

  const onDeleteRoute = async (id) => {
    try {
      await TransportService.deleteRoute(id)
      setRoutes(r => r.filter(x => x.id !== id))
      setToast({ open: true, message: 'Route deleted', type: 'success' })
    } catch (e) {
      const data = e?.response?.data
      const msg = data?.message || data?.error || 'Failed to delete route'
      setToast({ open: true, message: msg, type: 'error' })
    }
  }

  const onAddSchedule = async (e) => {
    e.preventDefault()
    setScheduleSaving(true)
    try {
      // Basic client-side validation to match backend Joi.date().iso()
      const isoDateRe = /^\d{4}-\d{2}-\d{2}$/
      if (!scheduleForm.startDate || !scheduleForm.endDate) {
        throw { response: { data: { message: 'Start date and End date are required' } } }
      }
      if (!isoDateRe.test(scheduleForm.startDate)) {
        throw { response: { data: { message: 'Start date must be in ISO format (YYYY-MM-DD)' } } }
      }
      if (!isoDateRe.test(scheduleForm.endDate)) {
        throw { response: { data: { message: 'End date must be in ISO format (YYYY-MM-DD)' } } }
      }

      const startIso = `${scheduleForm.startDate}T00:00:00.000Z`
      const endIso = `${scheduleForm.endDate}T00:00:00.000Z`
      await TransportService.addSchedule({
        routeId: Number(scheduleForm.routeId),
        vehicleId: Number(scheduleForm.vehicleId),
        day: scheduleForm.day,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        startDate: startIso,
        endDate: endIso,
        maxCapacity: Number(scheduleForm.maxCapacity),
        price: Number(scheduleForm.price),
      })
      setToast({ open: true, message: 'Schedule created', type: 'success' })
      setScheduleForm({ routeId: '', vehicleId: '', day: 'MONDAY', startTime: '', endTime: '', startDate: '', endDate: '', maxCapacity: '', price: 0 })
      load()
    } catch (e) {
      const data = e?.response?.data
      const msg = Array.isArray(data?.details) ? data.details.join(', ') : (data?.message || data?.error || 'Failed to add schedule')
      setToast({ open: true, message: msg, type: 'error' })
    } finally {
      setScheduleSaving(false)
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.title}>Transport Management</div>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <>
          {/* Routes section */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Routes</div>
            <form onSubmit={onAddRoute} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>Route Name*</label>
                  <input 
                    className={styles.input} 
                    value={routeForm.name} 
                    onChange={(e) => setRouteForm(s => ({ ...s, name: e.target.value }))} 
                    required 
                  />
                </div>
                <div className={styles.field}>
                  <label>Start Point*</label>
                  <input 
                    className={styles.input} 
                    value={routeForm.startPoint} 
                    onChange={(e) => setRouteForm(s => ({ ...s, startPoint: e.target.value }))} 
                    required 
                  />
                </div>
                <div className={styles.field}>
                  <label>End Point*</label>
                  <input 
                    className={styles.input} 
                    value={routeForm.endPoint} 
                    onChange={(e) => setRouteForm(s => ({ ...s, endPoint: e.target.value }))} 
                    required 
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.field} style={{ flex: 2 }}>
                  <label>Stops (comma separated)</label>
                  <input 
                    className={styles.input} 
                    value={routeForm.stops} 
                    onChange={(e) => setRouteForm(s => ({ ...s, stops: e.target.value }))} 
                    placeholder="Stop 1, Stop 2, Stop 3"
                  />
                </div>
                <div className={styles.field} style={{ flex: 2 }}>
                  <label>Description</label>
                  <input 
                    className={styles.input} 
                    value={routeForm.description} 
                    onChange={(e) => setRouteForm(s => ({ ...s, description: e.target.value }))} 
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div>
                <button className={styles.btn} disabled={routeSaving}>
                  {routeSaving ? 'Saving…' : 'Add Route'}
                </button>
              </div>
            </form>

            <div className={styles.tableWrap} style={{ marginTop: 12 }}>
              <table className={`${styles.table} ${styles.striped}`}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>Name</th>
                    <th className={styles.th}>Route</th>
                    <th className={styles.th}>Stops</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map(r => (
                    <tr key={r.id}>
                      <td className={styles.td}><strong>{r.name}</strong></td>
                      <td className={styles.td}>{r.startPoint} → {r.endPoint}</td>
                      <td className={styles.td}>
                        {r.stops?.join(', ') || 'No stops'}
                        {r.description && <div className={styles.textMuted}>{r.description}</div>}
                      </td>
                      <td className={styles.td}>
                        <button 
                          className={styles.btnGhost} 
                          onClick={() => onDeleteRoute(r.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {routes.length === 0 && (
                    <tr>
                      <td className={styles.td} colSpan="4" style={{ textAlign: 'center' }}>
                        No routes found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehicles section */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Vehicles</div>
            <form onSubmit={onAddVehicle} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>Type</label>
                  <select className={styles.select} value={vehicleForm.type} onChange={(e) => setVehicleForm(s => ({ ...s, type: e.target.value }))}>
                    {['Bus','Van','Car','Minibus'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Number</label>
                  <input className={styles.input} value={vehicleForm.number} onChange={(e) => setVehicleForm(s => ({ ...s, number: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Capacity</label>
                  <input className={styles.input} type="number" min={1} value={vehicleForm.capacity} onChange={(e) => setVehicleForm(s => ({ ...s, capacity: e.target.value }))} />
                </div>
                
              </div>
              <div>
                <button className={styles.btn} disabled={vehicleSaving}>{vehicleSaving ? 'Saving…' : 'Add Vehicle'}</button>
              </div>
            </form>

            <div className={styles.tableWrap} style={{ marginTop: 12 }}>
              <table className={`${styles.table} ${styles.striped}`}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>Type</th>
                    <th className={styles.th}>Number</th>
                    <th className={styles.th}>Capacity</th>
                    
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id}>
                      <td className={styles.td}>{v.type}</td>
                      <td className={styles.td}>{v.number}</td>
                      <td className={styles.td}>{v.capacity}</td>
                      
                      <td className={styles.td}>
                        <button className={styles.btnGhost} onClick={() => onDeleteVehicle(v.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Schedules section */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Schedules</div>
            <form onSubmit={onAddSchedule} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>Route</label>
                  <select className={styles.select} value={scheduleForm.routeId} onChange={(e) => setScheduleForm(s => ({ ...s, routeId: e.target.value }))}>
                    <option value="">Select route</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Vehicle</label>
                  <select className={styles.select} value={scheduleForm.vehicleId} onChange={(e) => setScheduleForm(s => ({ ...s, vehicleId: e.target.value }))}>
                    <option value="">Select vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.number} ({v.type})</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Day</label>
                  <select className={styles.select} value={scheduleForm.day} onChange={(e) => setScheduleForm(s => ({ ...s, day: e.target.value }))}>
                    {['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>Start Time</label>
                  <input className={styles.input} type="time" value={scheduleForm.startTime} onChange={(e) => setScheduleForm(s => ({ ...s, startTime: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>End Time</label>
                  <input className={styles.input} type="time" value={scheduleForm.endTime} onChange={(e) => setScheduleForm(s => ({ ...s, endTime: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Max Capacity</label>
                  <input className={styles.input} type="number" min={1} value={scheduleForm.maxCapacity} onChange={(e) => setScheduleForm(s => ({ ...s, maxCapacity: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Price</label>
                  <input className={styles.input} type="number" min={0} step={0.01} value={scheduleForm.price} onChange={(e) => setScheduleForm(s => ({ ...s, price: e.target.value }))} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>Start Date</label>
                  <input className={styles.input} type="date" required value={scheduleForm.startDate} onChange={(e) => setScheduleForm(s => ({ ...s, startDate: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>End Date</label>
                  <input className={styles.input} type="date" required min={scheduleForm.startDate || undefined} value={scheduleForm.endDate} onChange={(e) => setScheduleForm(s => ({ ...s, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <button className={styles.btn} disabled={scheduleSaving}>
                  {scheduleSaving ? 'Saving…' : 'Add Schedule'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast(s => ({ ...s, open: false }))} />
    </div>
  )
}
