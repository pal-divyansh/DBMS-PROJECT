import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import Joi from 'joi'
import AuthService from '../services/authService'
import styles from './auth.module.css'

const schema = Joi.object({
  email: Joi.string().email({ tlds: false }).required().messages({
    'string.email': 'Enter a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
})

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = (payload) => {
    const { error } = schema.validate(payload, { abortEarly: false })
    if (!error) return {}
    const map = {}
    for (const d of error.details) map[d.path[0]] = d.message
    return map
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    const v = validate(form)
    setErrors(v)
    if (Object.keys(v).length) return
    setLoading(true)
    try {
      const me = await AuthService.login(form)
      // Role-based landing pages
      const role = (me?.role || '').toLowerCase()
      const from = location.state?.from?.pathname
      let to = from || '/dashboard'
      if (!from) {
        if (role === 'plumber') to = '/water'
        else if (role === 'it_staff') to = '/network'
        else if (role === 'cleaner') to = '/cleaning'
        else to = '/dashboard'
      }
      navigate(to)
    } catch (err) {
      const data = err?.response?.data
      const msg = data?.message || data?.error || 'Login failed'
      setApiError(msg)
      // Optional debug
      console.error('Login error:', err?.response || err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.centerWrap}>
      <div className={styles.card}>
        <div className={styles.brand}>HostelSync</div>
        <h2 className={styles.title}>Sign in</h2>
        {apiError && <div className={styles.error}>{apiError}</div>}
        <form onSubmit={onSubmit} className={styles.form}>
          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
            />
            {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
          </label>
          <label className={styles.label}>
            Password
            <input
              className={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              autoComplete="current-password"
            />
            {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
          </label>
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className={styles.alt}>No account? <Link to="/register">Register</Link></div>
      </div>
    </div>
  )
}
