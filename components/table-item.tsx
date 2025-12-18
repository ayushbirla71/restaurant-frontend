"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Users, Clock } from "lucide-react"
import { TableDetailsDialog } from "@/components/table-details-dialog"
import { getTableBooking } from "@/lib/api"
import type { Table, Booking } from "@/types"

interface TableItemProps {
  table: Table
  isStaffView?: boolean
}

export function TableItem({ table, isStaffView = false }: TableItemProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Fetch booking if table is occupied
  useEffect(() => {
    const fetchBooking = async () => {
      if (table.status === "OCCUPIED" || table.status === "BOOKED") {
        try {
          const data = await getTableBooking(table.id)
          setBooking(data)
        } catch (error) {
          console.error("Failed to fetch booking:", error)
        }
      } else {
        setBooking(null)
        setTimeRemaining(null)
      }
    }
    fetchBooking()
  }, [table.id, table.status])

  // Calculate time remaining
  useEffect(() => {
    if (!booking || table.status !== "OCCUPIED") {
      setTimeRemaining(null)
      return
    }

    const calculateTime = () => {
      const bookingStart = new Date(booking.bookingTime)
      const bookingEnd = new Date(bookingStart.getTime() + (booking.durationMinutes || 60) * 60000)
      const now = new Date()
      const remainingMs = bookingEnd.getTime() - now.getTime()
      const remainingMinutes = Math.ceil(remainingMs / 60000)

      if (remainingMinutes > 0 && remainingMinutes <= 10) {
        setTimeRemaining(remainingMinutes)
      } else {
        setTimeRemaining(null)
      }
    }

    calculateTime()
    const interval = setInterval(calculateTime, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [booking, table.status])

  const statusColors = {
    AVAILABLE: "bg-emerald-600 hover:bg-emerald-700 border-emerald-700 shadow-emerald-500/20",
    BOOKED: "bg-amber-500 hover:bg-amber-600 border-amber-600 shadow-amber-500/20",
    OCCUPIED: "bg-rose-600 hover:bg-rose-700 border-rose-700 shadow-rose-500/20",
  }

  const sizeIcons = {
    SMALL: 2,
    MEDIUM: 4,
    LARGE: 6,
  }

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "h-20 w-full flex-col gap-1 border-2 text-white shadow-md transition-all hover:shadow-lg active:scale-95 p-2",
          statusColors[table.status as keyof typeof statusColors],
        )}
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span className="text-sm font-bold tracking-tight">{table.tableNumber}</span>
        </div>
        <div className="text-[10px] font-semibold opacity-90 leading-tight">
          {table.size === "SMALL" ? "S" : table.size === "MEDIUM" ? "M" : "L"}
        </div>
        {timeRemaining !== null && (
          <div className="flex items-center gap-0.5 text-[9px] font-bold bg-white/20 px-1 py-0.5 rounded">
            <Clock className="h-2.5 w-2.5" />
            <span>{timeRemaining}m</span>
          </div>
        )}
        <div className="flex gap-1">
          {Array.from({ length: sizeIcons[table.size as keyof typeof sizeIcons] }).map((_, i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-white/70" />
          ))}
        </div>
      </Button>

      <TableDetailsDialog table={table} open={showDetails} onOpenChange={setShowDetails} isStaffView={isStaffView} />
    </>
  )
}
