"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { AllFloorsView } from "@/components/all-floors-view"
import { WalkInBooking } from "@/components/walk-in-booking"
import { PreBookingForm } from "@/components/pre-booking-form"
import { WaitingListSection } from "@/components/waiting-list-section"
import { NotificationPanel } from "@/components/notification-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Calendar, Clock, Users, Bell, BarChart3 } from "lucide-react"
import { syncTableStatuses, getWaitingList, getPendingNotifications } from "@/lib/api"
import { useSocketEvents } from "@/hooks/use-socket-events"
import { connectSocket } from "@/lib/socket"
import { FloorsProvider } from "@/contexts/floors-context"
import Link from "next/link"

function AdminDashboardContent() {
  const [showWalkInBooking, setShowWalkInBooking] = useState(false)
  const [showPreBooking, setShowPreBooking] = useState(false)
  const [showWaitingList, setShowWaitingList] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [waitingListCount, setWaitingListCount] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)
  const [isWalkInBookingActive, setIsWalkInBookingActive] = useState(false)
  const [isPreBookingActive, setIsPreBookingActive] = useState(false)
  const [isWaitingListAssigning, setIsWaitingListAssigning] = useState(false)

  // Fetch waiting list count
  const fetchWaitingListCount = async () => {
    try {
      const data = await getWaitingList()
      setWaitingListCount(data.length)
    } catch (error) {
      console.error("Failed to fetch waiting list:", error)
    }
  }

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const data = await getPendingNotifications()
      setNotificationCount(data.length)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  // Sync table statuses on mount and periodically
  useEffect(() => {
    const syncStatuses = async () => {
      try {
        await syncTableStatuses()
      } catch (error) {
        console.error("Failed to sync table statuses:", error)
      }
    }

    // Sync on mount
    syncStatuses()
    fetchWaitingListCount()
    fetchNotificationCount()

    // Sync every 2 minutes
    const interval = setInterval(syncStatuses, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Update waiting list count on socket events
  useSocketEvents(["waitingListUpdated"], () => {
    fetchWaitingListCount()
  })

  // Listen for notification events
  useEffect(() => {
    const socketInstance = connectSocket()

    socketInstance.on("upcomingBookingNotification", () => {
      fetchNotificationCount()
      setShowNotifications(true) // Auto-open notifications
    })

    socketInstance.on("bookingConfirmed", () => {
      fetchNotificationCount()
    })

    socketInstance.on("bookingDelayed", () => {
      fetchNotificationCount()
    })

    return () => {
      socketInstance.off("upcomingBookingNotification")
      socketInstance.off("bookingConfirmed")
      socketInstance.off("bookingDelayed")
    }
  }, [])

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 max-w-full">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">Restaurant Table Management</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Manage walk-ins, pre-bookings, and waiting list
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6">
          {/* Action Buttons - All in one row */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              onClick={() => {
                setShowWalkInBooking(!showWalkInBooking)
                setShowPreBooking(false)
                setShowWaitingList(false)
              }}
              className="flex-1 min-w-[140px] h-10 sm:h-11 text-sm sm:text-base"
              variant={showWalkInBooking ? "default" : "outline"}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Walk-In Booking
            </Button>

            <Button
              onClick={() => {
                setShowPreBooking(!showPreBooking)
                setShowWalkInBooking(false)
                setShowWaitingList(false)
              }}
              className="flex-1 min-w-[140px] h-10 sm:h-11 text-sm sm:text-base"
              variant={showPreBooking ? "default" : "outline"}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Pre-Booking
            </Button>

            <Button
              onClick={() => {
                setShowWaitingList(!showWaitingList)
                setShowWalkInBooking(false)
                setShowPreBooking(false)
              }}
              className="flex-1 min-w-[140px] h-10 sm:h-11 text-sm sm:text-base"
              variant={showWaitingList ? "default" : "outline"}
            >
              <Users className="mr-2 h-4 w-4" />
              Waiting List
              {waitingListCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {waitingListCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Content Area - Shows selected section below buttons */}
          <div className="min-h-[200px]">
            {showWalkInBooking && (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold">Walk-In Booking</h2>
                <WalkInBooking onBookingActive={setIsWalkInBookingActive} />
              </div>
            )}

            {showPreBooking && (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold">Pre-Booking</h2>
                <PreBookingForm onClose={() => setShowPreBooking(false)} />
              </div>
            )}

            {showWaitingList && (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold">Waiting List</h2>
                <WaitingListSection
                  onAssignSuccess={fetchWaitingListCount}
                  onAssignActive={setIsWaitingListAssigning}
                />
              </div>
            )}

            {/* Default view when no section is selected */}
            {!showWalkInBooking && !showPreBooking && !showWaitingList && (
              <div className="text-center p-8 sm:p-12 border-2 border-dashed rounded-lg">
                <div className="flex justify-center gap-4 mb-4">
                  <UserPlus className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                  <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                  <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Select an option above to manage bookings and waiting list
                </p>
              </div>
            )}
          </div>

          {/* All Tables View - Hidden when booking is active */}
          {!isWalkInBookingActive && !isPreBookingActive && !isWaitingListAssigning && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">All Tables</h2>
              <AllFloorsView isStaffView={false} />
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button - Notifications Only */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Notification Button */}
        <Button
          onClick={() => setShowNotifications(true)}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          size="icon"
          variant={notificationCount > 0 ? "default" : "secondary"}
        >
          <div className="relative">
            <Bell className="h-6 w-6" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notificationCount}
              </Badge>
            )}
          </div>
        </Button>
      </div>

      {/* Modals */}
      <NotificationPanel open={showNotifications} onOpenChange={setShowNotifications} />
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <FloorsProvider>
      <AdminDashboardContent />
    </FloorsProvider>
  )
}
