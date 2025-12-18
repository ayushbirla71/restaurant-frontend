"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Phone, Mail, User, Clock, ArrowRightLeft } from "lucide-react"
import { useTableDetails } from "@/hooks/use-table-details"
import { useTables } from "@/hooks/use-tables"
import { createBooking, cancelBooking, completeBooking, reassignTable, updateTableStatus, createQuickOccupancy } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Table } from "@/types"
import { cn } from "@/lib/utils"

interface TableDetailsDialogProps {
  table: Table
  open: boolean
  onOpenChange: (open: boolean) => void
  isStaffView?: boolean
}

export function TableDetailsDialog({ table, open, onOpenChange, isStaffView = false }: TableDetailsDialogProps) {
  const { booking, loading: bookingLoading } = useTableDetails(table.id, open)
  const { tables: allTables } = useTables(table.floorId)
  const { toast } = useToast()
  const [updating, setUpdating] = useState(false)
  const [showReassign, setShowReassign] = useState(false)
  const [selectedNewTable, setSelectedNewTable] = useState<string>("")

  // Form state for new booking
  const [customerName, setCustomerName] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")
  const [peopleCount, setPeopleCount] = useState("")
  const [bookingTime, setBookingTime] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("60")

  // Calculate time remaining for booking
  const getTimeRemaining = () => {
    if (!booking) return null

    const bookingStart = new Date(booking.bookingTime)
    const bookingEnd = new Date(bookingStart.getTime() + (booking.durationMinutes || 60) * 60000)
    const now = new Date()
    const remainingMs = bookingEnd.getTime() - now.getTime()

    if (remainingMs <= 0) {
      return { text: "Booking time expired", minutes: 0, isExpired: true }
    }

    const remainingMinutes = Math.ceil(remainingMs / 60000)

    if (remainingMinutes < 60) {
      return { text: `Available in ${remainingMinutes} min`, minutes: remainingMinutes, isExpired: false }
    } else {
      const hours = Math.floor(remainingMinutes / 60)
      const mins = remainingMinutes % 60
      return {
        text: `Available in ${hours}h ${mins}m`,
        minutes: remainingMinutes,
        isExpired: false
      }
    }
  }

  const timeRemaining = getTimeRemaining()

  useEffect(() => {
    if (open) {
      // Reset form
      setCustomerName("")
      setMobile("")
      setEmail("")
      setPeopleCount("")
      setBookingTime("")
      setDurationMinutes("60")
    }
  }, [open])

  const handleStatusChange = async (status: string) => {
    setUpdating(true)
    try {
      await updateTableStatus(table.id, status)
      toast({
        title: "Status Updated",
        description: `Table ${table.tableNumber} is now ${status.toLowerCase()}`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update table status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleQuickOccupy = async () => {
    setUpdating(true)
    try {
      await createQuickOccupancy(table.id)
      toast({
        title: "Table Occupied",
        description: `Table ${table.tableNumber} marked as occupied`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark table as occupied",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !mobile || !peopleCount ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)
    try {
      await createBooking({
        tableId: table.id,
        customerName,
        mobile,
        email: email || undefined,
        peopleCount: Number.parseInt(peopleCount),
        bookingTime: new Date().toISOString(),
        durationMinutes: Number.parseInt(durationMinutes),
      })
      toast({
        title: "Booking Created",
        description: `Table ${table.tableNumber} booked for ${customerName} (${durationMinutes} min)`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelBooking = async () => {
    if (booking) {
      setUpdating(true)
      try {
        await cancelBooking(booking.id)
        toast({
          title: "Booking Cancelled",
          description: `Booking for ${booking.customerName} has been cancelled`,
        })
        onOpenChange(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to cancel booking",
          variant: "destructive",
        })
      } finally {
        setUpdating(false)
      }
    }
  }

  const handleCompleteBooking = async () => {
    if (booking) {
      setUpdating(true)
      try {
        await completeBooking(booking.id)
        toast({
          title: "Booking Completed",
          description: `Booking for ${booking.customerName} has been completed`,
        })
        onOpenChange(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to complete booking",
          variant: "destructive",
        })
      } finally {
        setUpdating(false)
      }
    }
  }

  const handleReassignTable = async () => {
    if (!booking || !selectedNewTable) {
      toast({
        title: "Validation Error",
        description: "Please select a table to reassign",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)
    try {
      await reassignTable(booking.id, selectedNewTable)
      toast({
        title: "Table Reassigned",
        description: `Booking moved to new table successfully`,
      })
      setShowReassign(false)
      setSelectedNewTable("")
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reassign table",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const statusBadgeColor = {
    AVAILABLE: "bg-emerald-600 text-white border-emerald-600",
    BOOKED: "bg-amber-500 text-white border-amber-500",
    OCCUPIED: "bg-rose-600 text-white border-rose-600",
  }

  const tableCapacity = table.size === "SMALL" ? 2 : table.size === "MEDIUM" ? 4 : 6

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl">Table {table.tableNumber}</DialogTitle>
              <DialogDescription className="text-sm mt-2">
                {table.size} table · Capacity: {tableCapacity} guests
              </DialogDescription>
            </div>
            <Badge
              className={cn(
                "text-xs sm:text-sm font-semibold shrink-0",
                statusBadgeColor[table.status as keyof typeof statusBadgeColor],
              )}
            >
              {table.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 overflow-x-hidden">
          {/* Staff View - Quick Actions */}
          {isStaffView && (
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Quick Actions</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-medium"
                      onClick={handleQuickOccupy}
                      disabled={updating || table.status === "OCCUPIED"}
                    >
                      Mark as Occupied
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      onClick={() => handleStatusChange("AVAILABLE")}
                      disabled={updating || table.status === "AVAILABLE"}
                    >
                      Mark as Available
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking Details */}
          {booking && (
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm sm:text-base font-semibold">Booking Information</Label>
                    <Badge variant="outline" className="text-xs shrink-0">
                      ID: {booking.id.slice(0, 8)}
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Customer Name</p>
                        <p className="font-medium truncate">{booking.customerName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Mobile</p>
                        <p className="font-medium truncate">{booking.mobile}</p>
                      </div>
                    </div>

                    {booking.email && (
                      <div className="flex items-center gap-3 min-w-0">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                          <p className="font-medium text-sm truncate">{booking.email}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Guests</p>
                        <p className="font-medium">{booking.peopleCount} people</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:col-span-2 min-w-0">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Booking Time</p>
                        <p className="font-medium text-sm sm:text-base break-words">
                          {new Date(booking.bookingTime).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:col-span-2">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{booking.durationMinutes || 60} minutes</p>
                      </div>
                    </div>

                    {timeRemaining && table.status === "OCCUPIED" && (
                      <div className="sm:col-span-2">
                        <div className={cn(
                          "rounded-lg p-3 text-center font-semibold",
                          timeRemaining.isExpired
                            ? "bg-rose-100 text-rose-700"
                            : timeRemaining.minutes <= 15
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        )}>
                          {timeRemaining.text}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Staff Actions for Booking */}
                  {isStaffView && (
                    <div className="space-y-2 pt-2">
                      {!showReassign ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          {table.status === "OCCUPIED" ? (
                            <Button
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                              onClick={handleCompleteBooking}
                              disabled={updating}
                            >
                              Complete Booking
                            </Button>
                          ) : (
                            <Button
                              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-medium"
                              onClick={() => handleStatusChange("OCCUPIED")}
                              disabled={updating}
                            >
                              Mark as Occupied
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="flex-1 font-medium"
                            onClick={() => setShowReassign(true)}
                            disabled={updating}
                          >
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Change Table
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Reassign to Table</Label>
                          <Select value={selectedNewTable} onValueChange={setSelectedNewTable}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select available table" />
                            </SelectTrigger>
                            <SelectContent>
                              {allTables
                                ?.filter((t) => t.status === "AVAILABLE" && t.id !== table.id)
                                .map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    Table {t.tableNumber} ({t.size})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={handleReassignTable}
                              disabled={updating || !selectedNewTable}
                            >
                              Confirm Reassign
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setShowReassign(false)
                                setSelectedNewTable("")
                              }}
                              disabled={updating}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Actions for Booking */}
                  {!isStaffView && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      {table.status === "OCCUPIED" ? (
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          onClick={handleCompleteBooking}
                          disabled={updating}
                        >
                          Complete Booking
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-medium"
                          onClick={() => handleStatusChange("OCCUPIED")}
                          disabled={updating}
                        >
                          Mark as Occupied
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        className="flex-1 font-medium"
                        onClick={handleCancelBooking}
                        disabled={updating}
                      >
                        Cancel Booking
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create Booking Form - Only for admin on available tables */}
          {!isStaffView && !booking && table.status === "AVAILABLE" && (
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <form onSubmit={handleCreateBooking} className="space-y-4">
                  <Label className="text-sm sm:text-base font-semibold">Create New Booking</Label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="text-sm">
                        Customer Name *
                      </Label>
                      <Input
                        id="customerName"
                        placeholder="Enter customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-sm">
                        Mobile Number *
                      </Label>
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="+1-555-0000"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="customer@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="peopleCount" className="text-sm">
                        Number of Guests *
                      </Label>
                      <Input
                        id="peopleCount"
                        type="number"
                        min="1"
                        max={tableCapacity}
                        placeholder={`Max ${tableCapacity} guests`}
                        value={peopleCount}
                        onChange={(e) => setPeopleCount(e.target.value)}
                        required
                        className="text-base"
                      />
                    </div>

                    {/* <div className="space-y-2">
                      <Label htmlFor="bookingTime" className="text-sm">
                        Booking Date & Time *
                      </Label>
                      <Input
                        id="bookingTime"
                        type="datetime-local"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        required
                        className="text-base w-full"
                      />
                    </div> */}

                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-sm">
                        Duration (minutes) *
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        min="15"
                        step="15"
                        placeholder="60"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        required
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">Default: 60 minutes (1 hour)</p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-medium" disabled={updating}>
                    Create Booking
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Admin Status Controls - Only when no booking */}
          {!isStaffView && !booking && table.status !== "AVAILABLE" && (
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Update Table Status</Label>
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                    <Button
                      variant="outline"
                      className="border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 bg-transparent font-medium"
                      onClick={() => handleStatusChange("AVAILABLE")}
                      disabled={updating}
                    >
                      Available
                    </Button>
                    <Button
                      variant="outline"
                      className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50 bg-transparent font-medium"
                      onClick={() => handleStatusChange("BOOKED")}
                      disabled={updating}
                    >
                      Booked
                    </Button>
                    <Button
                      variant="outline"
                      className="border-2 border-rose-600 text-rose-700 hover:bg-rose-50 bg-transparent font-medium"
                      onClick={() => handleStatusChange("OCCUPIED")}
                      disabled={updating}
                    >
                      Occupied
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!booking && table.status === "OCCUPIED" && (
            <div className="text-center text-sm text-muted-foreground py-2">Walk-in customer currently seated</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
