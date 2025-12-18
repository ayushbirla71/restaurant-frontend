"use client"

import { useState, useEffect } from "react"
import { getBookings } from "@/lib/api"
import type { Booking } from "@/types"
import { useSocketEvents } from "./use-socket-events"

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const data = await getBookings()
      setBookings(data)
      setError(false)
    } catch (err) {
      console.error("[v0] Failed to fetch bookings:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  useSocketEvents(["bookingCreated", "bookingUpdated", "bookingCancelled"], () => {
    fetchBookings()
  })

  return { bookings, loading, error, refetch: fetchBookings }
}
