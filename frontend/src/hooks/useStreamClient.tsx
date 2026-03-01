import { useEffect, useState } from 'react'
import { StreamVideoClient } from '@stream-io/video-react-sdk'
import { useStore } from '../store'

export function useStreamClient(userId: string, userName: string) {
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [callId, setCallId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setConnected, setMetrics } = useStore()

  const connect = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const start = Date.now()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName }),
      })
      if (!res.ok) throw new Error('Failed to get token')
      const { token, apiKey, callId } = await res.json()

      const streamClient = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: { id: userId, name: userName },
        token,
      })

      setMetrics(Date.now() - start, null)
      setClient(streamClient)
      setCallId(callId)
      setConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    connect()
    return () => {
      setConnected(false)
    }
  }, [userId])

  return { client, callId, isLoading, error }
}