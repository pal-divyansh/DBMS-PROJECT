import { useEffect, useState } from 'react'
import useApi from './useApi'

export default function useFetch(url, { params, immediate = true } = {}) {
  const { get, loading, error, setError } = useApi()
  const [data, setData] = useState(null)

  useEffect(() => {
    let mounted = true
    async function run() {
      try {
        const res = await get(url, { params })
        if (mounted) setData(res)
      } catch (e) {
        // handled by interceptor
      }
    }
    if (immediate) run()
    return () => { mounted = false }
  }, [url])

  const refetch = async (p = params) => {
    const res = await get(url, { params: p })
    setData(res)
  }

  return { data, loading, error, setError, refetch }
}
