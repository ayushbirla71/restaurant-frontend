"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Users, Clock, Calendar, Info, Eye, Edit, Timer } from "lucide-react"
import { TableDetailsDialog } from "@/components/table-details-dialog"
import { TableStatusDialog } from "@/components/table-status-dialog"
import { getTableBooking, getUpcomingBookingsForTable } from "@/lib/api"
import type { Table, Booking } from "@/types"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface TableItemProps {
  table: Table
  isStaffView?: boolean
  isSelectionMode?: boolean
  onTableClick?: () => void
  bookingDate?: string
  isPreeBooking?: boolean
  isWalkInBooking?: boolean
  isWaitingList?: boolean
  isTodaysBooking?: boolean
  isFutureBooking?: boolean
  bookingTimeSlot?: string
}

export function TableItem({ table, isStaffView = false, isSelectionMode = false, onTableClick, bookingDate, isPreeBooking = false, isWalkInBooking = false, isWaitingList = false, isTodaysBooking = false, isFutureBooking = false, bookingTimeSlot}: TableItemProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [futureBookingInfo, setFutureBookingInfo] = useState<string | null>(null)
  const [todaysBookings, setTodaysBookings] = useState<Booking[]>([])
  const [showTodaysBookings, setShowTodaysBookings] = useState(false)

  // Fetch booking if table is occupied or booked
  // useEffect(() => {
  //   const fetchBooking = async () => {
  //     if (table.status === "OCCUPIED" || table.status === "BOOKED") {
  //       try {
  //         const data = await getTableBooking(table.id)
  //         setBooking(data)

  //         // Check if this is a future booking
  //         if (data && data.bookingDate && data.bookingTimeSlot) {
  //           const bookingDateTime = new Date(`${data.bookingDate}T${data.bookingTimeSlot}`)
  //           const now = new Date()

  //           if (bookingDateTime > now) {
  //             // Format the future booking time
  //             const timeStr = data.bookingTimeSlot
  //             const dateStr = new Date(data.bookingDate).toLocaleDateString('en-US', {
  //               month: 'short',
  //               day: 'numeric'
  //             })
  //             setFutureBookingInfo(`${timeStr} ${dateStr}`)
  //           } else {
  //             setFutureBookingInfo(null)
  //           }
  //         } else {
  //           setFutureBookingInfo(null)
  //         }
  //       } catch (error) {
  //         console.error("Failed to fetch booking:", error)
  //       }
  //     } else {
  //       setBooking(null)
  //       setTimeRemaining(null)
  //       setFutureBookingInfo(null)
  //     }
  //   }
  //   fetchBooking()
  // }, [table.id, table.status])

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

  // Fetch today's upcoming bookings for this table
  useEffect(() => {
    const fetchTodaysBookings = async () => {
      try {
        const bookings = await getUpcomingBookingsForTable(table.id, isTodaysBooking, bookingDate)
        setTodaysBookings(bookings)
      } catch (error) {
        console.error("Failed to fetch today's bookings:", error)
      }
    }
    fetchTodaysBookings()
  }, [table.id, bookingDate, bookingTimeSlot])

  // const statusColors = {
  //   AVAILABLE: "bg-emerald-600 hover:bg-emerald-700 border-emerald-700 shadow-emerald-500/20",
  //   BOOKED: "bg-amber-500 hover:bg-amber-600 border-amber-600 shadow-amber-500/20",
  //   OCCUPIED: "bg-rose-600 hover:bg-rose-700 border-rose-700 shadow-rose-500/20",
  // }

const statusColors = {
  AVAILABLE:
    "bg-emerald-100 text-emerald-900 border border-emerald-400 hover:bg-emerald-200 shadow-emerald-400/30",

  BOOKED:
    "bg-amber-100 text-amber-900 border border-amber-400 hover:bg-amber-200 shadow-amber-400/30",

  OCCUPIED:
    "bg-rose-100 text-rose-900 border border-rose-400 hover:bg-rose-200 shadow-rose-400/30",
};


  const sizeIcons = {
    SMALL: 2,
    MEDIUM: 4,
    LARGE: 6,
  }

  const handleClick = () => {
    if (isSelectionMode && onTableClick) {
      onTableClick()
    }
    // In selection mode, don't open details dialog
  }

  return (
    <>
      <div className="relative w-full">
        <Button
          variant="outline"
          className={cn(
            "h-20 w-full flex-col gap-1 border-2 text-white shadow-md transition-all hover:shadow-lg active:scale-95 p-2",
            statusColors[table.status as keyof typeof statusColors],
            isSelectionMode && "cursor-pointer"
          )}
          onClick={handleClick}
        >
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span className="text-sm font-bold tracking-tight">{table.tableNumber}</span>
          </div>
          <div className="text-[10px] font-semibold opacity-90 leading-tight">
            {table.size === "SMALL" ? "S" : table.size === "MEDIUM" ? "M" : "L"}
          </div>

          {/* Show elapsed time ONLY for OCCUPIED tables (customer seated) */}
          {table.status === "OCCUPIED" && table.occupiedSince && (() => {
            const now = new Date()
            const occupiedSince = new Date(table.occupiedSince)
            const elapsedMinutes = Math.floor((now.getTime() - occupiedSince.getTime()) / 60000)
            return elapsedMinutes >= 0 ? (
              <div className="flex items-center gap-0.5 text-[9px] font-bold bg-white/30 px-1 py-0.5 rounded">
                <Timer className="h-2.5 w-2.5" />
                <span>{elapsedMinutes}m</span>
              </div>
            ) : null
          })()}

        {/* Show calculated time remaining OR staff-set available time (not both) */}
        {/* {timeRemaining !== null ? (
          <div className="flex items-center gap-0.5 text-[9px] font-bold bg-white/20 px-1 py-0.5 rounded">
            <Clock className="h-2.5 w-2.5" />
            <span>{timeRemaining}m</span>
          </div>
        ) : table.availableInMinutes && table.status !== "AVAILABLE" ? (
          <div className="flex items-center gap-0.5 text-[9px] font-bold bg-blue-500/30 px-1 py-0.5 rounded">
            <Clock className="h-2.5 w-2.5" />
            <span>~{table.availableInMinutes}m</span>
          </div>
        ) : null} */}
        {/* {futureBookingInfo && table.status === "BOOKED" && (
          <div className="flex items-center gap-0.5 text-[9px] font-bold bg-purple-500/30 px-1 py-0.5 rounded">
            <Calendar className="h-2.5 w-2.5" />
            <span>{futureBookingInfo}</span>
          </div>
        )} */}
        <div className="flex gap-1">
          {Array.from({ length: sizeIcons[table.size as keyof typeof sizeIcons] }).map((_, i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-white/70" />
          ))}
        </div>
      </Button>

      {/* Action Buttons - Only show when NOT in selection mode */}
      {!isSelectionMode && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 p-0 rounded-full shadow-md bg-white hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation()
              setShowDetails(true)
            }}
          >
            <Eye className="h-3 w-3 text-gray-700" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 p-0 rounded-full shadow-md bg-white hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation()
              setShowStatusDialog(true)
            }}
          >
            <Edit className="h-3 w-3 text-gray-700" />
          </Button>
        </div>
      )}

      {/* Info icon for today's upcoming bookings */}
      {todaysBookings.length > 0 && (
        <Popover open={showTodaysBookings} onOpenChange={setShowTodaysBookings}>
          <PopoverTrigger asChild>
            <button
              className="absolute -top-1 -right-1 z-10 bg-blue-600 text-white rounded-full p-1 shadow-md hover:bg-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setShowTodaysBookings(!showTodaysBookings)
              }}
            >
              <Info className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="end">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">{ isTodaysBooking ? "Today's" : bookingDate  } Bookings</h4>
              <p className="text-xs text-muted-foreground">Bookings scheduled for today only</p>
              {todaysBookings.map((todaysBooking) => {
                const bookingDateTime = todaysBooking.bookingDate && todaysBooking.bookingTimeSlot
                  ? new Date(`${todaysBooking.bookingDate}T${todaysBooking.bookingTimeSlot}`)
                  : new Date(todaysBooking.bookingTime)

                const timeStr = bookingDateTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })

                return (
                  <div key={todaysBooking.id} className="border-l-2 border-blue-500 pl-2 py-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{todaysBooking.customerName}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {todaysBooking.peopleCount} guests
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3 inline mr-1" />
                      { isTodaysBooking ? "Today at" : bookingDate + " at"} {timeStr}
                    </div>
                    {todaysBooking.mobile && (
                      <div className="text-muted-foreground mt-0.5">
                        📞 {todaysBooking.mobile}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>

      <TableDetailsDialog table={table} open={showDetails} onOpenChange={setShowDetails} isStaffView={isStaffView} />
      <TableStatusDialog
        table={table}
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        onStatusUpdated={() => {
          // Refresh will happen via socket event
        }}
      />
    </>
  )
}
