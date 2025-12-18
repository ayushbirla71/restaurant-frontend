"use client"

import { useState, useEffect } from "react"
import { demoFloors, demoTables, demoBookings } from "@/lib/demo-data"
import type { Floor, Table, Booking } from "@/types"

// Global state for demo mode
const useDemoMode = true
const globalTables = [...demoTables]
const globalBookings = [...demoBookings]

export function useDemoFloors() {
  const [floors] = useState<Floor[]>(demoFloors)
  return { floors }
}

export function useDemoTables(floorId?: string) {
  const [tables, setTables] = useState<Table[]>(globalTables)
  const [loading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setTables([...globalTables])
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const filteredTables = floorId ? tables.filter((t) => t.floorId === floorId) : tables

  const updateTable = (tableId: string, updates: Partial<Table>) => {
    const index = globalTables.findIndex((t) => t.id === tableId)
    if (index !== -1) {
      globalTables[index] = { ...globalTables[index], ...updates, updatedAt: new Date().toISOString() }
      setTables([...globalTables])
    }
  }

  return { tables: filteredTables, loading, updateTable, allTables: globalTables }
}

export function useDemoBookings() {
  const [bookings, setBookings] = useState<Booking[]>(globalBookings)
  const [loading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setBookings([...globalBookings])
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const getBookingByTableId = (tableId: string) => {
    return globalBookings.find((b) => b.tableId === tableId && b.status === "BOOKED")
  }

  const createBooking = (booking: Omit<Booking, "id" | "createdAt" | "updatedAt">) => {
    const newBooking: Booking = {
      ...booking,
      id: `b${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    globalBookings.push(newBooking)
    setBookings([...globalBookings])

    // Update table status
    const tableIndex = globalTables.findIndex((t) => t.id === booking.tableId)
    if (tableIndex !== -1) {
      globalTables[tableIndex].status = "BOOKED"
    }

    return newBooking
  }

  const updateBooking = (bookingId: string, updates: Partial<Booking>) => {
    const index = globalBookings.findIndex((b) => b.id === bookingId)
    if (index !== -1) {
      globalBookings[index] = { ...globalBookings[index], ...updates, updatedAt: new Date().toISOString() }
      setBookings([...globalBookings])
    }
  }

  const cancelBooking = (bookingId: string) => {
    const booking = globalBookings.find((b) => b.id === bookingId)
    if (booking) {
      updateBooking(bookingId, { status: "CANCELLED" })

      // Update table status to available
      const tableIndex = globalTables.findIndex((t) => t.id === booking.tableId)
      if (tableIndex !== -1) {
        globalTables[tableIndex].status = "AVAILABLE"
      }
    }
  }

  return { bookings, loading, getBookingByTableId, createBooking, updateBooking, cancelBooking }
}

export function useDemoStats() {
  const { allTables } = useDemoTables()
  const { floors } = useDemoFloors()
  const { bookings } = useDemoBookings()

  const stats = {
    summary: {
      totalFloors: floors.length,
      totalTables: allTables.length,
      availableTables: allTables.filter((t) => t.status === "AVAILABLE").length,
      bookedTables: allTables.filter((t) => t.status === "BOOKED").length,
      occupiedTables: allTables.filter((t) => t.status === "OCCUPIED").length,
      todayBookingCount: bookings.filter((b) => b.status === "BOOKED").length,
      totalGuestsToday: bookings.filter((b) => b.status === "BOOKED").reduce((sum, b) => sum + b.peopleCount, 0),
    },
    floorStats: floors.map((floor) => ({
      floorId: floor.id,
      floorName: floor.name,
      totalTables: allTables.filter((t) => t.floorId === floor.id).length,
    })),
    sizeStats: {
      SMALL: allTables.filter((t) => t.size === "SMALL").length,
      MEDIUM: allTables.filter((t) => t.size === "MEDIUM").length,
      LARGE: allTables.filter((t) => t.size === "LARGE").length,
    },
  }

  return { stats, loading: false }
}
