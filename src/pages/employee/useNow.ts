import { useEffect, useState } from 'react'

/** Re-renders every 30 s so the live duration stays fresh. */
export function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  return now
}
