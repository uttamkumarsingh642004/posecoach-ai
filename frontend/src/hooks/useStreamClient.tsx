import { useEffect, useState } from 'react'
import { StreamVideoClient } from '@stream-io/video-react-sdk'
import { useStore } from '../store'

export function useStreamClient(userId: string, userName: string) {
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const setMetrics = useStore((s) => s.setMetrics)
  const setConnected = useStore((s) => s.setConnected)

  useEffect(() => {
    if (!userId) return

    const init = async () => {
      try {
        setIsLoading(true)
        const start = Date.now()

        const res = await fetch(`${import.meta.env.VITE_API_URL}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userName }),
        })

        if (!res.ok) throw new Error('Failed to get token')
        const { token, apiKey } = await res.json()

        const streamClient = new StreamVideoClient({
          apiKey,
          user: { id: userId, name: userName },
          token,
        })

        const joinTime = Date.now() - start
        setMetrics(joinTime, null)
        setConnected(true)
        setClient(streamClient)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection failed')
      } finally {
        setIsLoading(false)
      }
    }

    init()

    return () => {
      setConnected(false)
    }
  }, [userId])

  return { client, isLoading, error }
}