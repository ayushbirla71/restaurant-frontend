"use client"

import { useState, useEffect } from "react"
import { getWaitingList } from "@/lib/api"
import type { WaitingList } from "@/types"
import { useSocketEvents } from "./use-socket-events"

export function useWaitingList(date?: string) {
  const [waitingList, setWaitingList] = useState<WaitingList[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchWaitingList = async () => {
    try {
      setLoading(true)
      const data = await getWaitingList(date)
      setWaitingList(data)
      setError(false)
    } catch (err) {
      console.error("Failed to fetch waiting list:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWaitingList()
  }, [date])

  useSocketEvents(["waitingListUpdated"], () => {
    fetchWaitingList()
  })

  return { waitingList, loading, error, refetch: fetchWaitingList }
}

