"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Phone, User, Clock, ArrowRightLeft, X, Calendar } from "lucide-react"
import { useTableDetails } from "@/hooks/use-table-details"
import { useTables } from "@/hooks/use-tables"
import { cancelBooking, completeBooking, reassignTable, updateTableStatus, createQuickOccupancy, getAllTableBookings } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Table, Booking } from "@/types"
import { cn } from "@/lib/utils"
import { TableAvailabilityUpdate } from "@/components/table-availability-update"

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
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loadingAllBookings, setLoadingAllBookings] = useState(false)
  const [showReassignDialog, setShowReassignDialog] = useState(false)
  const [bookingToReassign, setBookingToReassign] = useState<Booking | null>(null)
  const [newTableForReassign, setNewTableForReassign] = useState<string>("")

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

  // Fetch all bookings for this table
  const fetchAllBookings = async () => {
    if (!open) return

    try {
      setLoadingAllBookings(true)
      const bookings = await getAllTableBookings(table.id)
      setAllBookings(bookings)
    } catch (error) {
      console.error("Failed to fetch all bookings:", error)
      setAllBookings([])
    } finally {
      setLoadingAllBookings(false)
    }
  }

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setShowReassign(false)
      setSelectedNewTable("")
      setShowReassignDialog(false)
      setBookingToReassign(null)
      setNewTableForReassign("")

      // Fetch all bookings
      fetchAllBookings()
    }
  }, [open, table.id])

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
                  {table.status !== "AVAILABLE" && (
                    <div className="pt-2">
                      <Label className="text-sm font-semibold mb-2 block">Table Availability Time</Label>
                      <TableAvailabilityUpdate
                        tableId={table.id}
                        tableNumber={table.tableNumber}
                        currentAvailability={table.availableInMinutes}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Active Booking Details */}
          {booking && (
            <Card className="border-2 border-green-200 bg-green-50/30">
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm sm:text-base font-semibold text-green-900 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Current Active Booking
                    </Label>
                    <Badge className="bg-green-600 text-white text-xs shrink-0">
                      ACTIVE
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="font-semibold truncate">{booking.customerName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Mobile</p>
                        <p className="font-semibold truncate">{booking.mobile}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Guests</p>
                        <p className="font-semibold">{booking.peopleCount} people</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Time</p>
                        <p className="font-semibold text-sm break-words">
                          {new Date(booking.bookingTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Staff Actions for Booking */}
                  {isStaffView && (
                    <div className="space-y-2 pt-2">
                      {!showReassign ? (
                        <>
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
                          {table.status === "BOOKED" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs text-blue-800">
                              💡 <strong>Early Arrival?</strong> Click "Mark as Occupied" to seat the customer now, even if they arrived before their booking time.
                            </div>
                          )}
                        </>
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
                    <div className="space-y-2 pt-2">
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
                          variant="destructive"
                          className="flex-1 font-medium"
                          onClick={handleCancelBooking}
                          disabled={updating}
                        >
                          Cancel Booking
                        </Button>
                      </div>
                      {table.status === "BOOKED" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs text-blue-800">
                          💡 <strong>Early Arrival?</strong> Click "Mark as Occupied" to seat the customer now, even if they arrived before their booking time.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Upcoming Bookings - Show only TODAY'S FUTURE bookings (not the current active one) */}
          {!isStaffView && (() => {
            // Filter out the current active booking and show only today's upcoming bookings
            const todaysNextBookings = allBookings.filter(bkg =>
              bkg.status !== "CANCELLED" &&
              bkg.status !== "COMPLETED" &&
              (!booking || bkg.id !== booking.id) // Exclude current active booking
            )

            return todaysNextBookings.length > 0 ? (
              <Card className="border-2 border-blue-200 bg-blue-50/30">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-sm sm:text-base font-semibold flex items-center gap-2 text-blue-900">
                        <Calendar className="h-4 w-4" />
                        Today's Next Bookings
                      </Label>
                      <Badge className="bg-blue-600 text-white text-xs">
                        {todaysNextBookings.length} today
                      </Badge>
                    </div>

                    {loadingAllBookings ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading bookings...
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {todaysNextBookings.map((bkg, index) => {
                          const bookingDateTime = bkg.bookingDate && bkg.bookingTimeSlot
                            ? new Date(`${bkg.bookingDate}T${bkg.bookingTimeSlot}`)
                            : new Date(bkg.bookingTime)

                          return (
                            <div
                              key={bkg.id}
                              className="border border-gray-300 rounded-lg p-3 space-y-2 bg-white hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs font-mono">
                                      #{index + 1}
                                    </Badge>
                                    <p className="font-semibold text-sm truncate">{bkg.customerName}</p>
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {bkg.mobile}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {bkg.peopleCount} guests
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {bookingDateTime.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {bkg.status}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {bkg.bookingType === "WALK_IN" ? "Walk-in" : "Pre-booking"}
                                  </Badge>
                                </div>
                              </div>

                              {/* Booking Actions */}
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-xs"
                                  onClick={() => {
                                    setBookingToReassign(bkg)
                                    setNewTableForReassign("")
                                    setShowReassignDialog(true)
                                  }}
                                  disabled={updating}
                                >
                                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                                  Change Table
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="text-xs"
                                  onClick={async () => {
                                    if (confirm(`Cancel booking for ${bkg.customerName}?`)) {
                                      try {
                                        setUpdating(true)
                                        await cancelBooking(bkg.id)
                                        toast({
                                          title: "Booking Cancelled",
                                          description: `Booking for ${bkg.customerName} cancelled`,
                                        })
                                        fetchAllBookings()
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
                                  }}
                                  disabled={updating}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null
          })()}

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

      {/* Reassign Table Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Table</DialogTitle>
            <DialogDescription>
              Select a new table for {bookingToReassign?.customerName}'s booking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select New Table</Label>
              <Select value={newTableForReassign} onValueChange={setNewTableForReassign}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a table" />
                </SelectTrigger>
                <SelectContent>
                  {allTables
                    ?.filter(t => t.id !== table.id && t.status === "AVAILABLE")
                    .map((t) => {
                      const capacity = t.size === "SMALL" ? 2 : t.size === "MEDIUM" ? 4 : 6
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          Table {t.tableNumber} - {t.size} ({capacity} seats)
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowReassignDialog(false)
                  setBookingToReassign(null)
                  setNewTableForReassign("")
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!bookingToReassign || !newTableForReassign) {
                    toast({
                      title: "Error",
                      description: "Please select a table",
                      variant: "destructive",
                    })
                    return
                  }

                  try {
                    setUpdating(true)
                    await reassignTable(bookingToReassign.id, newTableForReassign)
                    toast({
                      title: "Table Changed",
                      description: `Booking moved to new table`,
                    })
                    setShowReassignDialog(false)
                    setBookingToReassign(null)
                    setNewTableForReassign("")
                    fetchAllBookings()
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to change table",
                      variant: "destructive",
                    })
                  } finally {
                    setUpdating(false)
                  }
                }}
                disabled={!newTableForReassign || updating}
              >
                Change Table
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
