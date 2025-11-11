import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../services/api'

export default function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef()

  useEffect(() => {
    const onErr = (e) => {
      const msg = e?.detail?.message || 'Request failed'
      setError(msg)
    }
    window.addEventListener('api:error', onErr)
    return () => window.removeEventListener('api:error', onErr)
  }, [])

  const request = useCallback(async (method, url, { params, data, config } = {}) => {
    setLoading(true)
    setError('')
    try {
      const source = new AbortController()
      abortRef.current = source
      const cfg = { signal: source.signal, ...(config || {}) }
      let res
      if (method === 'get' || method === 'delete') {
        res = await api[method](url, { ...(cfg || {}), params })
      } else {
        res = await api[method](url, data, cfg)
      }
      return res.data
    } catch (e) {
      // error already dispatched by interceptor; also set local message
      const data = e?.response?.data
      const msg = Array.isArray(data?.error)
        ? data.error.map(x => x.message).join(', ')
        : (data?.message || data?.error || e?.message || 'Request failed')
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const get = useCallback((url, options) => request('get', url, options), [request])
  const post = useCallback((url, data, options) => request('post', url, { ...(options || {}), data }), [request])
  const del = useCallback((url, options) => request('delete', url, options), [request])
  const put = useCallback((url, data, options) => request('put', url, { ...(options || {}), data }), [request])
  const patch = useCallback((url, data, options) => request('patch', url, { ...(options || {}), data }), [request])

  const cancel = useCallback(() => {
    try { abortRef.current?.abort() } catch {}
  }, [])

  return { loading, error, setError, request, get, post, del, put, patch, cancel }
}
