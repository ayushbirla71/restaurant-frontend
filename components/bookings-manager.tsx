"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter } from "lucide-react"
import { CreateBookingDialog } from "@/components/create-booking-dialog"
import { BookingsList } from "@/components/bookings-list"
import { UpdateBookingDialog } from "./update-booking-dialog"
import { DeleteBookingDialog } from "./delete-booking-dialog"

export function BookingsManager() {
  const [showCreateBooking, setShowCreateBooking] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [bookingTypeFilter, setBookingTypeFilter] = useState<string>("ALL")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [showUpdateBooking, setShowUpdateBooking] = useState(false)
  const [bookingId, setBookingId] = useState<string>("")
  const [booking, setBooking] = useState<object>({})
  const [showDeleteBooking, setShowDeleteBooking] = useState(false)
  const [deleteBookingId, setDeleteBookingId] = useState<string>("")

  return (
    <div className="space-y-6">
      {/* Header with New Booking button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateBooking(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="BOOKED">Booked</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Booking Type Filter */}
            <Select value={bookingTypeFilter} onValueChange={setBookingTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="WALK_IN">Walk-in</SelectItem>
                <SelectItem value="PRE_BOOKING">Pre-booking</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <BookingsList
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        bookingTypeFilter={bookingTypeFilter}
        dateFilter={dateFilter}
        onUpdateBooking={setShowUpdateBooking}
        onBookingIdChange={setBookingId}
        onDeleteBooking={setShowDeleteBooking}
        
      />

      <CreateBookingDialog open={showCreateBooking} onOpenChange={setShowCreateBooking} />
      <UpdateBookingDialog open={showUpdateBooking} onOpenChange={setShowUpdateBooking} bookingId={bookingId}  />
      <DeleteBookingDialog open={showDeleteBooking} onOpenChange={setShowDeleteBooking} bookingId={bookingId} />
    </div>
  )
}
