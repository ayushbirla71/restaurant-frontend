"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getWaitingList, assignTableFromWaiting, cancelWaitingEntry, notifyCustomer, getAvailableTables } from "@/lib/api"
import { useSocketEvents } from "@/hooks/use-socket-events"
import { Users, Phone, Mail, Clock, Star, Bell, X, CheckCircle, Calendar } from "lucide-react"
import type { WaitingList, Table } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AvailableTablesResponse {
  tables: (Table & { Floor?: { id: string; floorNumber: number; name: string } })[]
  recommendedSize: string
}

type DateFilter = "TODAY" | "TOMORROW" | "ALL"

export function WaitingListManager() {
  const { toast } = useToast()
  const [waitingList, setWaitingList] = useState<WaitingList[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<WaitingList | null>(null)
  const [availableTables, setAvailableTables] = useState<AvailableTablesResponse | null>(null)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>("TODAY")

  const fetchWaitingList = async () => {
    try {
      setLoading(true)
      const data = await getWaitingList()
      setWaitingList(data)
    } catch (error) {
      console.error("Failed to fetch waiting list:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWaitingList()
  }, [])

  useSocketEvents(["waitingListUpdated"], () => {
    fetchWaitingList()
  })

  // Filter waiting list by date
  const filteredWaitingList = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    return waitingList.filter((entry) => {
      if (dateFilter === "ALL") return true

      // For walk-ins, check createdAt date
      if (entry.bookingType === "WALK_IN") {
        const entryDate = new Date(entry.createdAt).toISOString().split('T')[0]
        if (dateFilter === "TODAY") return entryDate === todayStr
        if (dateFilter === "TOMORROW") return entryDate === tomorrowStr
      }

      // For pre-bookings, check bookingDate
      if (entry.bookingType === "PRE_BOOKING" && entry.bookingDate) {
        if (dateFilter === "TODAY") return entry.bookingDate === todayStr
        if (dateFilter === "TOMORROW") return entry.bookingDate === tomorrowStr
      }

      // If no date info, show in TODAY by default
      return dateFilter === "TODAY"
    })
  }, [waitingList, dateFilter])

  const handleAssignTable = async (entry: WaitingList) => {
    try {
      const data = await getAvailableTables(entry.peopleCount, entry.bookingDate, entry.bookingTimeSlot)
      setAvailableTables(data)
      setSelectedEntry(entry)
      setShowAssignDialog(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch available tables",
        variant: "destructive",
      })
    }
  }

  const handleConfirmAssign = async (tableId: string) => {
    if (!selectedEntry) return

    try {
      await assignTableFromWaiting(selectedEntry.id, tableId, 60)
      toast({
        title: "Table Assigned",
        description: `Table assigned to ${selectedEntry.customerName}`,
      })
      setShowAssignDialog(false)
      setSelectedEntry(null)
      setAvailableTables(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign table",
        variant: "destructive",
      })
    }
  }

  const handleNotify = async (entry: WaitingList) => {
    try {
      await notifyCustomer(entry.id)
      toast({
        title: "Customer Notified",
        description: `${entry.customerName} has been notified`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to notify customer",
        variant: "destructive",
      })
    }
  }

  const handleCancel = async (entry: WaitingList) => {
    try {
      await cancelWaitingEntry(entry.id)
      toast({
        title: "Entry Cancelled",
        description: `Waiting list entry for ${entry.customerName} has been cancelled`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel entry",
        variant: "destructive",
      })
    }
  }

  const getSizeLabel = (size: string) => {
    const labels = {
      SMALL: "2 seats",
      MEDIUM: "4 seats",
      LARGE: "6+ seats",
    }
    return labels[size as keyof typeof labels] || size
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Today"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (loading && waitingList.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">Loading waiting list...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Date Filter Tabs */}
      <Card className="w-full">
        <CardContent className="pt-6">
          <Tabs value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="TODAY" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today
                <Badge variant="secondary" className="ml-1">
                  {waitingList.filter(e => {
                    const today = new Date().toISOString().split('T')[0]
                    if (e.bookingType === "WALK_IN") {
                      return new Date(e.createdAt).toISOString().split('T')[0] === today
                    }
                    return e.bookingDate === today
                  }).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="TOMORROW" className="flex items-center gap-2">
                Tomorrow
                <Badge variant="secondary" className="ml-1">
                  {waitingList.filter(e => {
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    const tomorrowStr = tomorrow.toISOString().split('T')[0]
                    if (e.bookingType === "WALK_IN") {
                      return new Date(e.createdAt).toISOString().split('T')[0] === tomorrowStr
                    }
                    return e.bookingDate === tomorrowStr
                  }).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="ALL">
                All
                <Badge variant="secondary" className="ml-1">
                  {waitingList.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Waiting List */}
      {filteredWaitingList.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex items-center justify-center p-6 sm:p-8">
            <p className="text-sm text-muted-foreground">
              No customers waiting for {dateFilter === "TODAY" ? "today" : dateFilter === "TOMORROW" ? "tomorrow" : "any date"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          {filteredWaitingList.map((entry) => (
          <Card key={entry.id} className={entry.bookingType === "PRE_BOOKING" ? "border-primary" : ""}>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg truncate">{entry.customerName}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {entry.bookingType === "PRE_BOOKING" ? (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary shrink-0" />
                        Pre-Booking
                      </span>
                    ) : (
                      "Walk-In"
                    )}
                  </CardDescription>
                </div>
                <Badge variant={entry.status === "NOTIFIED" ? "default" : "secondary"} className="text-xs shrink-0">
                  {entry.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{entry.peopleCount} people • {getSizeLabel(entry.preferredTableSize)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{entry.mobile}</span>
                </div>
                {entry.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{entry.email}</span>
                  </div>
                )}
                {entry.bookingDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {formatDate(entry.bookingDate)} at {entry.bookingTimeSlot}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1 sm:pt-2">
                <Button
                  size="sm"
                  onClick={() => handleAssignTable(entry)}
                  className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  <span className="hidden xs:inline">Assign</span>
                  <span className="xs:hidden">✓</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleNotify(entry)}
                  disabled={entry.status === "NOTIFIED"}
                  className="h-8 sm:h-9 px-2 sm:px-3"
                >
                  <Bell className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancel(entry)}
                  className="h-8 sm:h-9 px-2 sm:px-3"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Assign Table to {selectedEntry?.customerName}</DialogTitle>
            <DialogDescription>
              {selectedEntry?.peopleCount} people • {selectedEntry && getSizeLabel(selectedEntry.preferredTableSize)}
            </DialogDescription>
          </DialogHeader>

          {availableTables && availableTables.tables.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
              {availableTables.tables.map((table) => (
                <Card key={table.id} className="cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">Table {table.tableNumber}</h3>
                        <p className="text-sm text-muted-foreground">
                          Floor {table.Floor?.floorNumber || "N/A"}
                        </p>
                      </div>
                      <Badge variant="secondary">{getSizeLabel(table.size)}</Badge>
                    </div>
                    <Button
                      onClick={() => handleConfirmAssign(table.id)}
                      className="w-full"
                      size="sm"
                    >
                      Assign This Table
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tables currently available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}


