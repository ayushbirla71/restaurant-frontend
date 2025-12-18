"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Phone, User, Clock } from "lucide-react"
import { useBookings } from "@/hooks/use-bookings"
import { cancelBooking as cancelBookingAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function BookingsList() {
  const { bookings, loading, error } = useBookings()
  const { toast } = useToast()

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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Table {booking.Table?.tableNumber || "N/A"}</CardTitle>
                <p className="text-sm text-muted-foreground">ID: {booking.id.slice(0, 8)}</p>
              </div>
              <Badge variant={booking.status === "CANCELLED" ? "destructive" : "default"}>{booking.status}</Badge>
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
  )
}
