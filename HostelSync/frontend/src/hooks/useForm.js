import { useCallback, useMemo, useState } from 'react'

// useForm with Joi schema validation and inline error messages
// Usage:
// const { values, errors, handleChange, handleSubmit, submitting } = useForm({
//   initial: { title: '' },
//   schema: joi.object({ title: joi.string().required() }),
//   onSubmit: async (vals) => { ... }
// })
export default function useForm({ initial = {}, schema, onSubmit }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const validate = useCallback((vals) => {
    if (!schema) return {}
    const { error } = schema.validate(vals, { abortEarly: false })
    if (!error) return {}
    const map = {}
    for (const d of error.details) {
      const key = d.path?.[0]
      if (!map[key]) map[key] = d.message
    }
    return map
  }, [schema])

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    setValues((s) => ({ ...s, [name]: val }))
    setTouched((s) => ({ ...s, [name]: true }))
    if (schema) {
      const next = { ...values, [name]: val }
      setErrors(validate(next))
    }
  }, [schema, validate, values])

  const handleSubmit = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    setTouched(Object.keys(values).reduce((a, k) => (a[k] = true, a), {}))
    if (Object.keys(errs).length) return
    setSubmitting(true)
    try {
      await onSubmit?.(values)
    } finally {
      setSubmitting(false)
    }
  }, [onSubmit, validate, values])

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors])

  return {
    values,
    setValues,
    errors,
    setErrors,
    touched,
    setTouched,
    isValid,
    submitting,
    handleChange,
    handleSubmit,
    setField: (name, val) => {
      setValues((s) => ({ ...s, [name]: val }))
      if (schema) setErrors(validate({ ...values, [name]: val }))
    }
  }
}
