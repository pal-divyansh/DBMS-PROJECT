import { useEffect, useMemo, useState } from 'react'
import AccountService from '../services/accountService'
import { clearToken } from '../services/auth'
import Toast from '../components/UI/Toast'

export default function Profile() {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  const [form, setForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [changing, setChanging] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await AccountService.getMe()
      setMe(data)
      setForm({ name: data?.name || '', phone: data?.phone || '' })
    } catch (e) {
      const data = e?.response?.data
      setError(data?.message || data?.error || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const initials = useMemo(() => {
    const src = me?.name || me?.email || ''
    const parts = src.trim().split(/\s+/)
    const letters = parts.length >= 2 ? (parts[0][0] + parts[1][0]) : (src[0] || '?')
    return letters.toUpperCase()
  }, [me])

  const onSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { name: form.name }
      if (form.phone) payload.phone = form.phone
      const res = await AccountService.updateMe(payload)
      const updated = res?.data || res
      setToast({ open: true, message: 'Profile updated', type: 'success' })
      if (updated) setMe(updated)
    } catch (e) {
      const status = e?.response?.status
      const data = e?.response?.data
      const notSupported = status === 404 || status === 405
      const msg = notSupported ? 'Profile update is not enabled on the server' : (data?.message || data?.error || 'Failed to update profile')
      setToast({ open: true, message: msg, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const onChangePassword = async (e) => {
    e.preventDefault()
    if (!pwd.newPassword || pwd.newPassword !== pwd.confirm) {
      setToast({ open: true, message: 'Passwords do not match', type: 'error' })
      return
    }
    setChanging(true)
    try {
      await AccountService.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
      setToast({ open: true, message: 'Password changed', type: 'success' })
      setPwd({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (e) {
      const status = e?.response?.status
      const data = e?.response?.data
      const notSupported = status === 404 || status === 405
      const msg = notSupported ? 'Change password is not enabled on the server' : (data?.message || data?.error || 'Failed to change password')
      setToast({ open: true, message: msg, type: 'error' })
    } finally {
      setChanging(false)
    }
  }

  const logout = () => {
    clearToken()
    window.location.href = '/login'
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eceff1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#455a64' }}>{initials}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{me?.name || '—'}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{me?.email}</div>
          </div>
        </div>
        <button onClick={logout} style={{ padding: '8px 12px' }}>Logout</button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', maxWidth: 720 }}>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Profile</div>
            <form onSubmit={onSave}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 260, flex: 1 }}>
                  <label>Name</label>
                  <input value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} style={{ width: '100%', padding: 8 }} required />
                </div>
                <div style={{ minWidth: 260, flex: 1 }}>
                  <label>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm(s => ({ ...s, phone: e.target.value }))} style={{ width: '100%', padding: 8 }} placeholder="Optional" />
                </div>
                <div style={{ minWidth: 260, flex: 1 }}>
                  <label>Role</label>
                  <input value={me?.role || ''} readOnly style={{ width: '100%', padding: 8, background: '#fafafa' }} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button disabled={saving} style={{ padding: '8px 12px' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>

          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Change Password</div>
            <form onSubmit={onChangePassword}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 240, flex: 1 }}>
                  <label>Current Password</label>
                  <input type="password" value={pwd.currentPassword} onChange={(e) => setPwd(s => ({ ...s, currentPassword: e.target.value }))} style={{ width: '100%', padding: 8 }} />
                </div>
                <div style={{ minWidth: 240, flex: 1 }}>
                  <label>New Password</label>
                  <input type="password" value={pwd.newPassword} onChange={(e) => setPwd(s => ({ ...s, newPassword: e.target.value }))} style={{ width: '100%', padding: 8 }} />
                </div>
                <div style={{ minWidth: 240, flex: 1 }}>
                  <label>Confirm Password</label>
                  <input type="password" value={pwd.confirm} onChange={(e) => setPwd(s => ({ ...s, confirm: e.target.value }))} style={{ width: '100%', padding: 8 }} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button disabled={changing} style={{ padding: '8px 12px' }}>{changing ? 'Saving…' : 'Change Password'}</button>
              </div>
            </form>
            <div style={{ marginTop: 8, color: '#777', fontSize: 12 }}>If your server does not support password changes, a helpful message will be shown.</div>
          </div>
        </div>
      )}

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast(s => ({ ...s, open: false }))} />
    </div>
  )
}
