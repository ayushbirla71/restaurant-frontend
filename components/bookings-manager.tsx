"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateBookingDialog } from "@/components/create-booking-dialog"
import { BookingsList } from "@/components/bookings-list"

export function BookingsManager() {
  const [showCreateBooking, setShowCreateBooking] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateBooking(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </div>

      <BookingsList />

      <CreateBookingDialog open={showCreateBooking} onOpenChange={setShowCreateBooking} />
    </div>
  )
}
