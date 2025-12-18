# Restaurant Table Booking System - API Documentation

## Base URL
```
http://localhost:5000/api
```

All endpoints are prefixed with `/api`. Set the `NEXT_PUBLIC_API_URL` environment variable to your backend server URL.

---

## Authentication
Currently, the API does not require authentication. For production, implement JWT or session-based auth.

---

## Endpoints

### Dashboard

#### Get Dashboard Statistics
```http
GET /api/dashboard/stats
```

**Response:**
```json
{
  "totalFloors": 3,
  "totalTables": 22,
  "totalBookings": 6,
  "totalGuests": 18,
  "availableTables": 14,
  "bookedTables": 6,
  "occupiedTables": 2
}
```

---

### Floors

#### Get All Floors
```http
GET /api/floors
```

**Response:**
```json
[
  {
    "id": "floor-1",
    "name": "Ground Floor",
    "floorNumber": 1,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

#### Create Floor
```http
POST /api/floors
```

**Request Body:**
```json
{
  "name": "First Floor",
  "floorNumber": 2
}
```

**Response:**
```json
{
  "id": "floor-2",
  "name": "First Floor",
  "floorNumber": 2,
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

---

### Tables

#### Get Tables by Floor
```http
GET /api/tables/floor/:floorId
```

**Parameters:**
- `floorId` (string, required) - The floor ID

**Response:**
```json
[
  {
    "id": "table-1",
    "tableNumber": "T101",
    "size": "SMALL",
    "status": "AVAILABLE",
    "floorId": "floor-1",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

**Table Sizes:**
- `SMALL` - 2 seats
- `MEDIUM` - 4 seats
- `LARGE` - 6 seats

**Table Status:**
- `AVAILABLE` - Free to book
- `BOOKED` - Reserved for a customer
- `OCCUPIED` - Currently seated with guests

#### Create Table
```http
POST /api/tables
```

**Request Body:**
```json
{
  "tableNumber": "T201",
  "size": "MEDIUM",
  "floorId": "floor-2"
}
```

**Response:**
```json
{
  "id": "table-10",
  "tableNumber": "T201",
  "size": "MEDIUM",
  "status": "AVAILABLE",
  "floorId": "floor-2",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

#### Update Table Status
```http
PUT /api/tables/:tableId/status
```

**Parameters:**
- `tableId` (string, required) - The table ID

**Request Body:**
```json
{
  "status": "OCCUPIED"
}
```

**Response:**
```json
{
  "id": "table-1",
  "tableNumber": "T101",
  "size": "SMALL",
  "status": "OCCUPIED",
  "floorId": "floor-1",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

#### Get Table Booking
```http
GET /api/tables/:tableId/booking
```

**Parameters:**
- `tableId` (string, required) - The table ID

**Response:**
```json
{
  "id": "booking-1",
  "tableId": "table-1",
  "customerName": "John Smith",
  "mobile": "+1-555-0100",
  "email": "john.smith@email.com",
  "peopleCount": 2,
  "bookingTime": "2024-01-15T19:00:00.000Z",
  "status": "BOOKED",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

#### Quick Occupy Table
```http
POST /api/tables/:tableId/quick-occupy
```

**Parameters:**
- `tableId` (string, required) - The table ID

**Description:** Marks a table as occupied for walk-in customers (no booking required).

**Response:**
```json
{
  "id": "table-1",
  "tableNumber": "T101",
  "status": "OCCUPIED",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

---

### Bookings

#### Get All Bookings
```http
GET /api/bookings
```

**Response:**
```json
[
  {
    "id": "booking-1",
    "tableId": "table-1",
    "customerName": "John Smith",
    "mobile": "+1-555-0100",
    "email": "john.smith@email.com",
    "peopleCount": 2,
    "bookingTime": "2024-01-15T19:00:00.000Z",
    "status": "BOOKED",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "table": {
      "tableNumber": "T101",
      "size": "SMALL",
      "floor": {
        "name": "Ground Floor"
      }
    }
  }
]
```

#### Create Booking
```http
POST /api/bookings
```

**Request Body:**
```json
{
  "tableId": "table-1",
  "customerName": "Jane Doe",
  "mobile": "+1-555-0200",
  "email": "jane.doe@email.com",
  "peopleCount": 4,
  "bookingTime": "2024-01-15T20:00:00.000Z"
}
```

**Validation:**
- `customerName` - Required, string
- `mobile` - Required, string (phone number)
- `email` - Optional, valid email format
- `peopleCount` - Required, number (1-6)
- `bookingTime` - Required, ISO 8601 date string

**Response:**
```json
{
  "id": "booking-7",
  "tableId": "table-1",
  "customerName": "Jane Doe",
  "mobile": "+1-555-0200",
  "email": "jane.doe@email.com",
  "peopleCount": 4,
  "bookingTime": "2024-01-15T20:00:00.000Z",
  "status": "BOOKED",
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

**Side Effect:** Automatically updates the table status to `BOOKED`.

#### Cancel Booking
```http
PUT /api/bookings/:bookingId/cancel
```

**Parameters:**
- `bookingId` (string, required) - The booking ID

**Response:**
```json
{
  "id": "booking-1",
  "status": "CANCELLED",
  "cancelledAt": "2024-01-15T12:00:00.000Z"
}
```

**Side Effect:** Automatically updates the table status to `AVAILABLE`.

---

## WebSocket Events

The system uses Socket.IO for real-time updates. Connect to the WebSocket server at:
```
ws://localhost:5000
```

### Events to Listen:

#### `tableUpdated`
Emitted when a table status changes.
```json
{
  "id": "table-1",
  "status": "OCCUPIED",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

#### `bookingCreated`
Emitted when a new booking is created.
```json
{
  "id": "booking-7",
  "tableId": "table-1",
  "customerName": "Jane Doe",
  "status": "BOOKED"
}
```

#### `bookingCancelled`
Emitted when a booking is cancelled.
```json
{
  "id": "booking-1",
  "tableId": "table-1",
  "status": "CANCELLED"
}
```

---

## Error Responses

All endpoints return errors in the following format:

**Status Codes:**
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

**Error Response:**
```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## Demo Data Mode

The frontend currently uses **demo data** mode with local state management. To connect to a real backend:

1. Set the `NEXT_PUBLIC_API_URL` environment variable
2. Replace `useDemoData` hooks with real API calls from `lib/api.ts`
3. Ensure your backend implements all the endpoints above
4. Configure Socket.IO connection in `lib/socket.ts`

---

## Notes

- All timestamps are in ISO 8601 format
- Table capacity: SMALL (2), MEDIUM (4), LARGE (6)
- The system automatically manages table status based on booking lifecycle
- Real-time updates require WebSocket connection
