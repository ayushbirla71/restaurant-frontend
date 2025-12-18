"use client"

import { useEffect, useState } from "react"
import { getTableBooking } from "@/lib/api"
import type { Booking } from "@/types"
import { useSocketEvents } from "./use-socket-events"

export function useTableDetails(tableId: string, isOpen: boolean) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchBooking = async () => {
    if (!isOpen || !tableId) return

    try {
      setLoading(true)
      const data = await getTableBooking(tableId)
      setBooking(data)
    } catch (err) {
      console.error("[v0] Failed to fetch table booking:", err)
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [tableId, isOpen])

  useSocketEvents(["tableStatusUpdated", "bookingUpdated"], () => {
    if (isOpen) {
      fetchBooking()
    }
  })

  return { booking, loading, refetch: fetchBooking }
}
