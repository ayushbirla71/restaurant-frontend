"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Phone, User, Clock } from "lucide-react"
import { useBookings } from "@/hooks/use-bookings"
import { cancelBooking as cancelBookingAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface BookingsListProps {
  searchQuery?: string
  statusFilter?: string
  bookingTypeFilter?: string
  dateFilter?: string
}

export function BookingsList({
  searchQuery = "",
  statusFilter = "ALL",
  bookingTypeFilter = "ALL",
  dateFilter = ""
}: BookingsListProps) {
  const { bookings, loading, error } = useBookings()
  const { toast } = useToast()

  // Filter bookings based on search and filters
  const filteredBookings = useMemo(() => {
    if (!bookings) return []

    return bookings.filter((booking) => {
      // Hide pre-bookings when client has arrived and table is OCCUPIED
      // This means the client is already seated, so no need to show in pre-booking list
      if (booking.bookingType === "PRE_BOOKING" && booking.Table?.status === "OCCUPIED") {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          booking.customerName.toLowerCase().includes(query) ||
          booking.mobile.includes(query) ||
          booking.Table?.tableNumber.toLowerCase().includes(query)

        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== "ALL" && booking.status !== statusFilter) {
        return false
      }

      // Booking type filter
      if (bookingTypeFilter !== "ALL" && booking.bookingType !== bookingTypeFilter) {
        return false
      }

      // Date filter
      if (dateFilter) {
        const bookingDate = new Date(booking.bookingTime).toISOString().split('T')[0]
        if (bookingDate !== dateFilter) {
          return false
        }
      }

      return true
    })
  }, [bookings, searchQuery, statusFilter, bookingTypeFilter, dateFilter])

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBookingAPI(bookingId)
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-sm text-destructive">Failed to load bookings</p>
        </CardContent>
      </Card>
    )
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No bookings yet</p>
        </CardContent>
      </Card>
    )
  }

  if (filteredBookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No bookings match your filters</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredBookings.length} of {bookings.length} booking(s)
      </div>

      {/* Bookings grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredBookings.map((booking) => (
        <Card key={booking.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">Table {booking.Table?.tableNumber || "N/A"}</CardTitle>
                <p className="text-sm text-muted-foreground">ID: {booking.id.slice(0, 8)}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Badge variant={booking.status === "CANCELLED" ? "destructive" : "default"}>
                  {booking.status}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {booking.bookingType === "WALK_IN" ? "Walk-in" : "Pre-booking"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{booking.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{booking.mobile}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{booking.peopleCount} guests</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm">{new Date(booking.bookingTime).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{booking.durationMinutes || 60} minutes</span>
            </div>
            {booking.status === "BOOKED" && (
              <Button variant="destructive" size="sm" className="w-full mt-2" onClick={() => handleCancel(booking.id)}>
                Cancel Booking
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  )
}
