export interface Floor {
  id: string
  floorNumber: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface Table {
  id: string
  tableNumber: string
  size: "SMALL" | "MEDIUM" | "LARGE"
  seats: number
  status: "AVAILABLE" | "BOOKED" | "OCCUPIED"
  floorId: string
  occupiedSince?: string | null
  availableInMinutes?: number | null
  Bookings?: Booking[]
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  customerName: string
  mobile: string
  email?: string
  peopleCount: number
  bookingTime: string
  bookingDate?: string
  bookingTimeSlot?: string
  durationMinutes: number
  bookingType: "WALK_IN" | "PRE_BOOKING"
  status: "BOOKED" | "CANCELLED" | "COMPLETED" | "WAITING" | "CONFIRMED"
  priority: number
  confirmationStatus: "PENDING" | "CONFIRMED" | "CLIENT_DELAYED" | "CANCELLED"
  confirmedAt?: string
  delayMinutes: number
  notificationsSent: string[]
  tableId: string
  Table?: Table
  createdAt: string
  updatedAt: string
}

export interface WaitingList {
  id: string
  customerName: string
  mobile: string
  email?: string
  peopleCount: number
  preferredTableSize: "SMALL" | "MEDIUM" | "LARGE"
  bookingType: "WALK_IN" | "PRE_BOOKING"
  bookingDate?: string
  bookingTimeSlot?: string
  priority: number
  status: "WAITING" | "NOTIFIED" | "ASSIGNED" | "CANCELLED"
  estimatedWaitMinutes?: number
  notifiedAt?: string
  createdAt: string
  updatedAt: string
}

export type WaitingListEntry = WaitingList

export interface DashboardStats {
  summary: {
    totalFloors: number
    totalTables: number
    availableTables: number
    bookedTables: number
    occupiedTables: number
    todayBookingCount: number
    totalGuestsToday: number
  }
  floorStats: Array<{
    floorId: string
    floorName: string
    totalTables: number
  }>
  sizeStats: {
    SMALL: number
    MEDIUM: number
    LARGE: number
  }
}
