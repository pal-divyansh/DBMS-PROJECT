import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Joi from 'joi'
import AuthService from '../services/authService'
import styles from './auth.module.css'

const schema = Joi.object({
  name: Joi.string().min(2).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email({ tlds: false }).required().messages({
    'string.email': 'Enter a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Confirm your password',
  }),
  role: Joi.string().valid('STUDENT','STAFF','ADMIN','PLUMBER','IT_STAFF','CLEANER').optional(),
})

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'STUDENT' })
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
      await AuthService.register({ name: form.name, email: form.email, password: form.password, role: form.role })
      navigate('/dashboard')
    } catch (err) {
      const data = err?.response?.data
      const msg = data?.message || data?.error || 'Registration failed'
      setApiError(msg)
      console.error('Register error:', err?.response || err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.centerWrap}>
      <div className={styles.card}>
        <div className={styles.brand}>HostelSync</div>
        <h2 className={styles.title}>Create your account</h2>
        {apiError && <div className={styles.error}>{apiError}</div>}
        <form onSubmit={onSubmit} className={styles.form}>
          <label className={styles.label}>
            Name
            <input
              className={styles.input}
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              autoComplete="name"
            />
            {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          </label>
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
              autoComplete="new-password"
            />
            {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
          </label>
          <label className={styles.label}>
            Confirm Password
            <input
              className={styles.input}
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword}</span>}
          </label>
          <label className={styles.label}>
            Role (for demo/testing)
            <select
              className={styles.input}
              name="role"
              value={form.role}
              onChange={onChange}
            >
              {['STUDENT','STAFF','ADMIN','PLUMBER','IT_STAFF','CLEANER'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.role && <span className={styles.fieldError}>{errors.role}</span>}
          </label>
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <div className={styles.alt}>Already have an account? <Link to="/login">Sign in</Link></div>
      </div>
    </div>
  )
}
