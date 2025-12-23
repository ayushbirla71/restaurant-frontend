"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { addToWaitingList, createBooking } from "@/lib/api"
import { useFloors } from "@/contexts/floors-context"
import { Users, Phone, Mail, Clock, Search, CheckCircle2, AlertCircle } from "lucide-react"
import { TableOccupancyTimer } from "@/components/table-occupancy-timer"
import { TableItem } from "@/components/table-item"
import { cn } from "@/lib/utils"
import type { Table } from "@/types"

interface WalkInBookingProps {
  onBookingActive?: (isActive: boolean) => void
}

export function WalkInBooking({ onBookingActive }: WalkInBookingProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { floors, loading: floorsLoading } = useFloors()

  // Customer details
  const [customerName, setCustomerName] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")
  const [peopleCount, setPeopleCount] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [preferredTableSize, setPreferredTableSize] = useState<"SMALL" | "MEDIUM" | "LARGE">("MEDIUM")

  // Table selection
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "BOOKED">("ALL")
  const [sizeFilter, setSizeFilter] = useState<"ALL" | "SMALL" | "MEDIUM" | "LARGE">("ALL")

  // Conflict dialog state
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictInfo, setConflictInfo] = useState<any>(null)

  // Notify parent when booking is active
  const isFormValid = customerName && mobile && peopleCount

  useEffect(() => {
    if (onBookingActive) {
      onBookingActive(isFormValid)
    }
  }, [isFormValid, onBookingActive])

  // Filter tables
  const filteredFloors = useMemo(() => {
    if (!floors) return []

    return floors
      .map((floor) => ({
        ...floor,
        Tables: floor.Tables.filter((table: Table) => {
          // Search filter
          if (searchQuery && !table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false
          }

          // Status filter
          if (statusFilter !== "ALL" && table.status !== statusFilter) {
            return false
          }

          // Size filter
          if (sizeFilter !== "ALL" && table.size !== sizeFilter) {
            return false
          }

          return true
        }),
      }))
      .filter((floor) => floor.Tables.length > 0)
  }, [floors, searchQuery, statusFilter, sizeFilter])

  // Calculate total seats selected
  const totalSeatsSelected = useMemo(() => {
    if (!floors) return 0
    const allTables = floors.flatMap((f) => f.Tables)
    return selectedTableIds.reduce((total, tableId) => {
      const table = allTables.find((t: Table) => t.id === tableId)
      return total + (table?.seats || 0)
    }, 0)
  }, [selectedTableIds, floors])

  const toggleTableSelection = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    )
  }

  const handleAssignTables = async () => {
    if (!isFormValid || selectedTableIds.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select at least one table",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Create booking for each selected table
      let autoScheduledCount = 0
      for (const tableId of selectedTableIds) {
        const result = await createBooking({
          tableId,
          customerName,
          mobile,
          email: email || undefined,
          peopleCount: Number.parseInt(peopleCount),
          bookingTime: new Date().toISOString(),
          bookingType: "WALK_IN",
          durationMinutes: Number.parseInt(durationMinutes),
        })

        if (result.autoScheduled) {
          autoScheduledCount++
        }
      }

      const autoScheduledMsg = autoScheduledCount > 0
        ? ` (${autoScheduledCount} table(s) scheduled after current booking ends)`
        : ""

      toast({
        title: "Tables Assigned",
        description: `${selectedTableIds.length} table(s) assigned to ${customerName}${autoScheduledMsg}`,
      })

      // Reset form
      setCustomerName("")
      setMobile("")
      setEmail("")
      setPeopleCount("")
      setPreferredTableSize("MEDIUM")
      setDurationMinutes("60")
      setSelectedTableIds([])
    } catch (error: any) {
      // Handle booking conflict (409 status)
      if (error.status === 409 && error.estimatedWaitTime) {
        setConflictInfo({
          conflict: error.conflict,
          estimatedWaitTime: error.estimatedWaitTime,
          suggestedTime: error.suggestedTime, // Add suggested time for auto-schedule
          customerData: {
            customerName,
            mobile,
            email,
            peopleCount,
            preferredTableSize,
            durationMinutes
          }
        })
        setShowConflictDialog(true)
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to assign tables",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAutoSchedule = async () => {
    if (!conflictInfo) return

    setLoading(true)
    setShowConflictDialog(false)

    try {
      // Get the first selected table (the one with conflict)
      const tableId = selectedTableIds[0]

      // Create booking with confirmAutoSchedule flag
      await createBooking({
        tableId,
        customerName,
        mobile,
        email: email || undefined,
        peopleCount: Number.parseInt(peopleCount),
        bookingTime: new Date().toISOString(),
        bookingType: "WALK_IN",
        durationMinutes: Number.parseInt(durationMinutes),
        confirmAutoSchedule: true, // This tells server to auto-schedule
      })

      const suggestedTime = conflictInfo.suggestedTime
        ? new Date(conflictInfo.suggestedTime).toLocaleTimeString()
        : "after current booking"

      toast({
        title: "Booking Auto-Scheduled",
        description: `Table will be assigned to ${customerName} at ${suggestedTime}`,
      })

      // Reset form
      setCustomerName("")
      setMobile("")
      setEmail("")
      setPeopleCount("")
      setPreferredTableSize("MEDIUM")
      setDurationMinutes("60")
      setSelectedTableIds([])
      setConflictInfo(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to auto-schedule booking",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToWaitingList = async () => {
    if (!isFormValid) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Get estimated wait time from conflict info if available
      const estimatedWaitMinutes = conflictInfo?.estimatedWaitTime?.estimatedMinutes || undefined

      await addToWaitingList({
        customerName,
        mobile,
        email: email || undefined,
        peopleCount: Number.parseInt(peopleCount),
        preferredTableSize,
        bookingType: "WALK_IN",
        estimatedWaitMinutes,
      })

      const waitTimeMsg = estimatedWaitMinutes
        ? ` (Est. wait: ~${estimatedWaitMinutes} minutes)`
        : ""

      toast({
        title: "Added to Waiting List",
        description: `${customerName} has been added to the waiting list${waitTimeMsg}`,
      })

      // Reset form
      setCustomerName("")
      setMobile("")
      setEmail("")
      setPeopleCount("")
      setPreferredTableSize("MEDIUM")
      setDurationMinutes("60")
      setConflictInfo(null)
      setShowConflictDialog(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add to waiting list",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Customer Details Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Walk-In Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+1-555-0123"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="peopleCount">Number of People *</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="peopleCount"
                  type="number"
                  min="1"
                  max="20"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                  placeholder="2"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes (1 hour)</SelectItem>
                  <SelectItem value="90">90 minutes (1.5 hours)</SelectItem>
                  <SelectItem value="120">120 minutes (2 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tableSize">Preferred Table Size *</Label>
            <Select value={preferredTableSize} onValueChange={(value: any) => setPreferredTableSize(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select table size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SMALL">Small (2 seats)</SelectItem>
                <SelectItem value="MEDIUM">Medium (4 seats)</SelectItem>
                <SelectItem value="LARGE">Large (6+ seats)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selection Summary */}
          {isFormValid && selectedTableIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="font-medium">{customerName}</span> • {peopleCount} people • {durationMinutes} min
              </div>
              <Badge variant="secondary">
                {selectedTableIds.length} table(s) selected ({totalSeatsSelected} seats)
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleAssignTables}
              disabled={!isFormValid || selectedTableIds.length === 0 || loading}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {selectedTableIds.length > 0 ? `Assign ${selectedTableIds.length} Table(s)` : "Assign Tables"}
            </Button>
            <Button variant="outline" onClick={handleAddToWaitingList} disabled={!isFormValid || loading}>
              <Users className="h-4 w-4 mr-2" />
              Waiting List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Selection UI - Only show when form is valid */}
      {isFormValid && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Select Tables</CardTitle>
              <div className="text-sm text-muted-foreground">Need: {peopleCount} seats</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search table number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("ALL")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "AVAILABLE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("AVAILABLE")}
                >
                  Available
                </Button>
                <Button
                  variant={statusFilter === "BOOKED" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("BOOKED")}
                >
                  Booked
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={sizeFilter === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSizeFilter("ALL")}
                >
                  All Sizes
                </Button>
                <Button
                  variant={sizeFilter === "SMALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSizeFilter("SMALL")}
                >
                  Small
                </Button>
                <Button
                  variant={sizeFilter === "MEDIUM" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSizeFilter("MEDIUM")}
                >
                  Medium
                </Button>
                <Button
                  variant={sizeFilter === "LARGE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSizeFilter("LARGE")}
                >
                  Large
                </Button>
              </div>
            </div>

            {/* Tables by Floor - Same UI as default tables */}
            {floorsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading tables...</div>
            ) : filteredFloors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No tables found</div>
            ) : (
              <div className="space-y-4">
                {filteredFloors.map((floor) => (
                  <Card key={floor.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{floor.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {floor.Tables.length} {floor.Tables.length === 1 ? "table" : "tables"}
                        </Badge>
                      </div>
                      <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                        {floor.Tables.sort((a, b) =>
                          a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true })
                        ).map((table: Table) => {
                          const isSelected = selectedTableIds.includes(table.id)
                          return (
                            <div
                              key={table.id}
                              className={cn(
                                "relative",
                                isSelected && "ring-2 ring-primary rounded-lg"
                              )}
                            >
                              <TableItem
                                table={table}
                                isStaffView={false}
                                isSelectionMode={true}
                                onTableClick={() => toggleTableSelection(table.id)}
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conflict Dialog with Auto-Schedule Option */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Table Already Booked
            </DialogTitle>
            <DialogDescription>
              The selected table is currently occupied. Choose an option below:
            </DialogDescription>
          </DialogHeader>

          {conflictInfo && (
            <div className="space-y-4">
              {/* Current Booking Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-amber-900">Current Booking:</p>
                <div className="text-sm text-amber-800 space-y-1">
                  <p>• Customer: {conflictInfo.conflict?.customerName}</p>
                  <p>• Time: {conflictInfo.conflict?.bookingTimeSlot || new Date(conflictInfo.conflict?.bookingTime).toLocaleTimeString()}</p>
                  <p>• Duration: {conflictInfo.conflict?.durationMinutes || 60} minutes</p>
                  <p>• Ends at: {new Date(conflictInfo.conflict?.endTime).toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Auto-Schedule Option */}
              {conflictInfo.suggestedTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-blue-900">Option 1: Auto-Schedule</p>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>Table will be automatically assigned after current booking ends.</p>
                    <p className="font-semibold">New booking time: {new Date(conflictInfo.suggestedTime).toLocaleTimeString()}</p>
                    <p className="text-xs text-blue-600 mt-2">
                      (Includes 5-minute buffer for table cleanup)
                    </p>
                  </div>
                </div>
              )}

              {/* Waiting List Option */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-900">Option 2: Add to Waiting List</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Customer will be added to waiting list.</p>
                  {conflictInfo.estimatedWaitTime && (
                    <p>Estimated wait: <strong>~{conflictInfo.estimatedWaitTime.estimatedMinutes} minutes</strong></p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConflictDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToWaitingList}
              variant="secondary"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Add to Waiting List
            </Button>
            <Button
              onClick={handleConfirmAutoSchedule}
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Scheduling..." : "Confirm Auto-Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
