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
  status: "AVAILABLE" | "BOOKED" | "OCCUPIED"
  floorId: string
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
  durationMinutes: number
  status: "BOOKED" | "CANCELLED" | "COMPLETED"
  tableId: string
  Table?: Table
  createdAt: string
  updatedAt: string
}

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
