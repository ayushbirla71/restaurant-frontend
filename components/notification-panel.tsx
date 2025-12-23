"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, Clock, X, Calendar, Users, Phone } from "lucide-react"
import { getPendingNotifications, confirmBooking, markClientDelayed } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { connectSocket } from "@/lib/socket"
import type { Booking } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Notification {
  id: string
  type?: "UPCOMING_BOOKING" | "LONG_WAITING"
  bookingId?: string
  tableId?: string
  tableNumber?: string
  waitingListId?: string
  customerName: string
  mobile: string
  peopleCount: number
  preferredTableSize?: string
  bookingTime?: string
  minutesBefore?: number
  waitingMinutes?: number
  confirmationStatus?: string
  message: string
  timestamp?: string
  createdAt?: string
}

interface NotificationPanelProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NotificationPanel({ open = true, onOpenChange }: NotificationPanelProps = {}) {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  const [showDelayDialog, setShowDelayDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [delayMinutes, setDelayMinutes] = useState("")

  // Fetch pending bookings
  const fetchPending = async () => {
    try {
      const bookings = await getPendingNotifications()
      setPendingBookings(bookings)
    } catch (error) {
      console.error("Failed to fetch pending notifications:", error)
    }
  }

  useEffect(() => {
    fetchPending()

    const socketInstance = connectSocket()

    // Listen for real-time notifications
    socketInstance.on("upcomingBookingNotification", (notification: Notification) => {
      setNotifications((prev) => {
        // Check if notification already exists (prevent duplicates)
        const exists = prev.some((n) => n.id === notification.id)
        if (exists) {
          return prev
        }
        return [notification, ...prev]
      })

      // Show toast notification
      toast({
        title: "Upcoming Booking",
        description: notification.message,
        duration: 10000,
      })

      // Play notification sound (optional)
      if (typeof Audio !== "undefined") {
        const audio = new Audio("/notification.mp3")
        audio.play().catch(() => {}) // Ignore errors if sound file doesn't exist
      }
    })

    // Listen for long waiting customer notifications
    socketInstance.on("longWaitingCustomer", (notification: Notification) => {
      setNotifications((prev) => {
        // Check if notification already exists (prevent duplicates)
        const exists = prev.some((n) => n.id === notification.id)
        if (exists) {
          return prev
        }
        return [notification, ...prev]
      })

      // Show toast notification
      toast({
        title: "⏰ Long Waiting Customer",
        description: notification.message,
        duration: 10000,
      })

      // Play notification sound
      if (typeof Audio !== "undefined") {
        const audio = new Audio("/notification.mp3")
        audio.play().catch(() => {})
      }
    })

    socketInstance.on("bookingConfirmed", () => {
      fetchPending()
    })

    socketInstance.on("bookingDelayed", () => {
      fetchPending()
    })

    return () => {
      socketInstance.off("upcomingBookingNotification")
      socketInstance.off("longWaitingCustomer")
      socketInstance.off("bookingConfirmed")
      socketInstance.off("bookingDelayed")
    }
  }, [toast])

  const handleConfirm = async (bookingId: string) => {
    try {
      await confirmBooking(bookingId)
      toast({
        title: "Booking Confirmed",
        description: "Client confirmed as arriving on time",
      })
      fetchPending()
      // Remove notification
      setNotifications((prev) => prev.filter((n) => n.bookingId !== bookingId))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm booking",
        variant: "destructive",
      })
    }
  }

  const handleDelay = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowDelayDialog(true)
  }

  const submitDelay = async () => {
    if (!selectedBooking || !delayMinutes) return

    try {
      await markClientDelayed(selectedBooking.id, Number.parseInt(delayMinutes))
      toast({
        title: "Delay Recorded",
        description: `Client will arrive ${delayMinutes} minutes late`,
      })
      setShowDelayDialog(false)
      setDelayMinutes("")
      fetchPending()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record delay",
        variant: "destructive",
      })
    }
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Notifications</h3>
        </div>
        {(notifications.length > 0 || pendingBookings.length > 0) && (
          <Badge variant="destructive" className="text-xs">
            {notifications.length + pendingBookings.length}
          </Badge>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 && pendingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending notifications</p>
          ) : (
            <div className="space-y-2">
              {/* Real-time notifications */}
              {notifications.map((notif) => {
                const isLongWaiting = notif.type === "LONG_WAITING"

                return (
                  <div
                    key={notif.id}
                    className={`border rounded-lg p-3 ${
                      isLongWaiting
                        ? "bg-rose-50 border-rose-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className={`h-4 w-4 shrink-0 ${
                            isLongWaiting ? "text-rose-600" : "text-amber-600"
                          }`} />
                          <span className="font-semibold text-sm">
                            {isLongWaiting
                              ? `⏰ Waiting ${notif.waitingMinutes}m`
                              : `${notif.minutesBefore} min warning`
                            }
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{notif.message}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {notif.peopleCount} guests
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {notif.mobile}
                          </span>
                          {isLongWaiting && notif.preferredTableSize && (
                            <span className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {notif.preferredTableSize}
                              </Badge>
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => dismissNotification(notif.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}

              {/* Pending bookings needing confirmation */}
              {pendingBookings.map((booking) => {
                const bookingDateTime = booking.bookingDate && booking.bookingTimeSlot
                  ? new Date(`${booking.bookingDate}T${booking.bookingTimeSlot}`)
                  : new Date(booking.bookingTime)

                const timeStr = bookingDateTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })

                return (
                  <div key={booking.id} className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                            <span className="font-semibold text-sm">Table {booking.Table?.tableNumber}</span>
                            <Badge variant="outline" className="text-xs">
                              {timeStr}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{booking.customerName}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {booking.peopleCount} guests
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {booking.mobile}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleConfirm(booking.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleDelay(booking)}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Delayed
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>
    </div>
  )

  // If used as modal
  if (onOpenChange) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Notifications</DialogTitle>
              <DialogDescription>
                Upcoming bookings and pending confirmations
              </DialogDescription>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>

        {/* Delay Dialog */}
      <Dialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Client Delayed</DialogTitle>
            <DialogDescription>How many minutes will the client be late?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="delayMinutes">Delay (minutes)</Label>
              <Input
                id="delayMinutes"
                type="number"
                min="1"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e.target.value)}
                placeholder="Enter minutes"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={submitDelay} disabled={!delayMinutes} className="flex-1">
                Confirm Delay
              </Button>
              <Button variant="outline" onClick={() => setShowDelayDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
    )
  }

  // If used as panel (legacy)
  return (
    <>
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {content}
        </CardContent>
      </Card>

      {/* Delay Dialog */}
      <Dialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Client Delayed</DialogTitle>
            <DialogDescription>How many minutes will the client be late?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="delayMinutes">Delay (minutes)</Label>
              <Input
                id="delayMinutes"
                type="number"
                min="1"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e.target.value)}
                placeholder="Enter minutes"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={submitDelay} disabled={!delayMinutes} className="flex-1">
                Confirm Delay
              </Button>
              <Button variant="outline" onClick={() => setShowDelayDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}