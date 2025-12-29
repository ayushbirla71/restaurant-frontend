"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { useToast } from "@/hooks/use-toast"
import { updateBookingAPI, getBookingAPI } from "@/lib/api"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

/* ============================
   Types
============================ */

interface Booking {
  customerName: string
  mobile: string
  email: string
  peopleCount: number
  bookingTime: string
  durationMinutes: number
}

interface UpdateBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
}

/* ============================
   Component
============================ */

export function UpdateBookingDialog({
  open,
  onOpenChange,
  bookingId,
}: UpdateBookingDialogProps) {
  const { toast } = useToast()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  /* ============================
     Fetch booking
  ============================ */

  const getBooking = async () => {
    if (!bookingId) return

    setLoading(true)
    try {
      const data = await getBookingAPI(bookingId)

      setBooking({
        customerName: data.customerName ?? "",
        mobile: data.mobile ?? "",
        email: data.email ?? "",
        peopleCount: data.peopleCount ?? 1,
        bookingTime: data.bookingTime ?? "",
        durationMinutes: data.durationMinutes ?? 60,
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch booking",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) getBooking()
  }, [bookingId, open])

  /* ============================
     Update booking
  ============================ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking) return

    setUpdating(true)
    try {
      await updateBookingAPI(bookingId, booking)
      toast({
        title: "Booking Updated",
        description: "The booking has been updated successfully",
      })
      onOpenChange(false)
    } catch {
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  /* ============================
     UI
  ============================ */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ALWAYS PRESENT FOR ACCESSIBILITY */}
        <DialogHeader>
          {/* Visible title */}
          <DialogTitle className="text-xl sm:text-2xl">
            Update Booking
          </DialogTitle>

          {/* If you want this hidden, wrap with VisuallyHidden */}
          <DialogDescription>
            Modify booking details
          </DialogDescription>
        </DialogHeader>

        {loading || !booking ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            Loading booking...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={booking.customerName}
                  onChange={(e) =>
                    setBooking({ ...booking, customerName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input
                  type="tel"
                  value={booking.mobile}
                  onChange={(e) =>
                    setBooking({ ...booking, mobile: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={booking.email}
                  onChange={(e) =>
                    setBooking({ ...booking, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>People Count</Label>
                <Input
                  type="number"
                  min={1}
                  value={booking.peopleCount}
                  onChange={(e) =>
                    setBooking({
                      ...booking,
                      peopleCount: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              {/* <div className="space-y-2">
                <Label>Booking Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={booking.bookingTime}
                  onChange={(e) =>
                    setBooking({
                      ...booking,
                      bookingTime: e.target.value,
                    })
                  }
                  required
                />
              </div> */}

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={booking.durationMinutes}
                  onChange={(e) =>
                    setBooking({
                      ...booking,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Updating..." : "Update Booking"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
