"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createBooking, addToWaitingList, getTableStatusesForDateTime } from "@/lib/api"
import { useFloors } from "@/contexts/floors-context"
import { Users, Phone, Mail, Calendar, Clock, X, Search, CheckCircle2 } from "lucide-react"
import { TableItem } from "@/components/table-item"
import { cn } from "@/lib/utils"
import type { Table } from "@/types"

interface PreBookingFormProps {
  onClose: () => void
}

interface TableWithStatus extends Table {
  statusForDateTime?: "AVAILABLE" | "BOOKED"
  bookingForDateTime?: {
    id: string
    customerName: string
    peopleCount: number
    durationMinutes: number
  } | null
}

interface FloorWithStatus {
  id: string
  floorNumber: number
  name: string
  Tables: TableWithStatus[]
}

export function PreBookingForm({ onClose }: PreBookingFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { floors, loading: floorsLoading } = useFloors()
  const [floorsForDateTime, setFloorsForDateTime] = useState<FloorWithStatus[] | null>(null)
  const [loadingDateTime, setLoadingDateTime] = useState(false)

  // Form fields
  const [customerName, setCustomerName] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")
  const [peopleCount, setPeopleCount] = useState("")
  const [bookingDate, setBookingDate] = useState("")
  const [bookingTimeSlot, setBookingTimeSlot] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [preferredTableSize, setPreferredTableSize] = useState<"SMALL" | "MEDIUM" | "LARGE">("MEDIUM")

  // Table selection
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "BOOKED">("ALL")
  const [sizeFilter, setSizeFilter] = useState<"ALL" | "SMALL" | "MEDIUM" | "LARGE">("ALL")

  const isFormValid = customerName && mobile && peopleCount && bookingDate && bookingTimeSlot

  // Fetch table statuses for the selected date/time
  const fetchTableStatusesForDateTime = async () => {
    if (!bookingDate || !bookingTimeSlot) {
      setFloorsForDateTime(null)
      return
    }

    setLoadingDateTime(true)
    try {
      const data = await getTableStatusesForDateTime(bookingDate, bookingTimeSlot)
      setFloorsForDateTime(data)
    } catch (error) {
      console.error("Failed to fetch table statuses:", error)
      toast({
        title: "Error",
        description: "Failed to load table availability for selected date/time",
        variant: "destructive",
      })
    } finally {
      setLoadingDateTime(false)
    }
  }

  // Fetch table statuses when date/time changes
  useEffect(() => {
    fetchTableStatusesForDateTime()
  }, [bookingDate, bookingTimeSlot])

  // Use floorsForDateTime if available, otherwise use regular floors
  const displayFloors = floorsForDateTime || floors

  // Filter tables
  const filteredFloors = useMemo(() => {
    if (!displayFloors) return []

    return displayFloors
      .map((floor) => ({
        ...floor,
        Tables: floor.Tables.filter((table: TableWithStatus) => {
          // Search filter
          if (searchQuery && !table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false
          }

          // Status filter - Use statusForDateTime if available (for pre-bookings)
          // This shows the status for the selected date/time, not current status
          if (statusFilter !== "ALL") {
            const tableStatus = table.statusForDateTime || table.status
            if (tableStatus !== statusFilter) {
              return false
            }
          }

          // Size filter
          if (sizeFilter !== "ALL" && table.size !== sizeFilter) {
            return false
          }

          return true
        }),
      }))
      .filter((floor) => floor.Tables.length > 0)
  }, [displayFloors, searchQuery, statusFilter, sizeFilter])

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
      const bookingTime = new Date(`${bookingDate}T${bookingTimeSlot}`).toISOString()

      for (const tableId of selectedTableIds) {
        await createBooking({
          tableId,
          customerName,
          mobile,
          email: email || undefined,
          peopleCount: Number.parseInt(peopleCount),
          bookingTime,
          bookingDate,
          bookingTimeSlot,
          bookingType: "PRE_BOOKING",
          durationMinutes: Number.parseInt(durationMinutes),
        })
      }

      toast({
        title: "Pre-Booking Confirmed",
        description: `${selectedTableIds.length} table(s) pre-booked for ${customerName} on ${bookingDate} at ${bookingTimeSlot}`,
      })

      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create pre-booking",
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
      await addToWaitingList({
        customerName,
        mobile,
        email: email || undefined,
        peopleCount: Number.parseInt(peopleCount),
        preferredTableSize,
        bookingType: "PRE_BOOKING",
        bookingDate,
        bookingTimeSlot,
      })

      toast({
        title: "Added to Waiting List",
        description: `${customerName} has been added to the waiting list with priority`,
      })

      onClose()
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

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg">New Pre-Booking</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Reserve a table in advance</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="customerName" className="text-sm">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  className="text-sm sm:text-base h-10 sm:h-11"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="mobile" className="text-sm">Mobile Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+1-555-0123"
                    className="pl-10 text-sm sm:text-base h-10 sm:h-11"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-sm">Email (Optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="pl-10 text-sm sm:text-base h-10 sm:h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="peopleCount" className="text-sm">Number of People *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="peopleCount"
                    type="number"
                    min="1"
                    max="12"
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    placeholder="2"
                    className="pl-10 text-sm sm:text-base h-10 sm:h-11"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="bookingDate" className="text-sm">Booking Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bookingDate"
                    type="date"
                    min={getMinDate()}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="pl-10 text-sm sm:text-base h-10 sm:h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="bookingTimeSlot" className="text-sm">Time Slot *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bookingTimeSlot"
                    type="time"
                    value={bookingTimeSlot}
                    onChange={(e) => setBookingTimeSlot(e.target.value)}
                    className="pl-10 text-sm sm:text-base h-10 sm:h-11"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="duration" className="text-sm">Duration *</Label>
                <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
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

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="tableSize" className="text-sm">Preferred Table Size *</Label>
                <Select value={preferredTableSize} onValueChange={(value: any) => setPreferredTableSize(value)}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                    <SelectValue placeholder="Select table size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMALL">Small (2 seats)</SelectItem>
                    <SelectItem value="MEDIUM">Medium (4 seats)</SelectItem>
                    <SelectItem value="LARGE">Large (6+ seats)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selection Summary */}
            {isFormValid && selectedTableIds.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">{customerName}</span> • {peopleCount} people • {bookingDate} at {bookingTimeSlot}
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
                className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {selectedTableIds.length > 0 ? `Assign ${selectedTableIds.length} Table(s)` : "Assign Tables"}
              </Button>
              <Button
                variant="outline"
                onClick={handleAddToWaitingList}
                disabled={!isFormValid || loading}
                className="h-10 sm:h-11 text-sm sm:text-base"
              >
                <Users className="h-4 w-4 mr-2" />
                Waiting List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Selection UI - Only show when form is valid */}
      {isFormValid && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Select Tables</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Need: {peopleCount} seats • {bookingDate} at {bookingTimeSlot}
                </div>
              </div>
              {floorsForDateTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="text-xs">
                    Showing availability for {bookingDate} at {bookingTimeSlot}
                  </Badge>
                  {loadingDateTime && (
                    <span className="text-xs text-muted-foreground">Updating...</span>
                  )}
                </div>
              )}
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
                        ).map((table: TableWithStatus) => {
                          const isSelected = selectedTableIds.includes(table.id)
                          // Use statusForDateTime if available (shows status for selected date/time)
                          const displayTable = table.statusForDateTime
                            ? { ...table, status: table.statusForDateTime }
                            : table
                          const isBookedForDateTime = table.statusForDateTime === "BOOKED"

                          return (
                            <div
                              key={table.id}
                              className={cn(
                                "relative",
                                isSelected && "ring-2 ring-primary rounded-lg"
                              )}
                              title={isBookedForDateTime && table.bookingForDateTime
                                ? `Booked by ${table.bookingForDateTime.customerName} (${table.bookingForDateTime.peopleCount} people)`
                                : undefined
                              }
                            >
                              <TableItem
                                table={displayTable}
                                isStaffView={false}
                                isSelectionMode={true}
                                onTableClick={() => toggleTableSelection(table.id)}
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                                </div>
                              )}
                              {isBookedForDateTime && table.bookingForDateTime && (
                                <div className="absolute bottom-1 left-1 right-1">
                                  <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4 w-full justify-center truncate">
                                    {table.bookingForDateTime.customerName}
                                  </Badge>
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
    </div>
  )
}


