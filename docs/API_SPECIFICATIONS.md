# 🔌 API Specifications

## Firebase Cloud Functions API

### Base URL
```
Production: https://us-central1-bd-tour-connect.cloudfunctions.net/api
```

---

## Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "phone": "01XXXXXXXXX",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "uid": "user_abc123",
    "token": "eyJhbG...",
    "role": "sales_agent",
    "agencyId": "agency_123"
  }
}
```

---

## Packages

### Create Package
```http
POST /agencies/:agencyId/packages
Authorization: Bearer <token>

{
  "name": "Cox's Bazar Tour",
  "nameBn": "কক্সবাজার ট্যুর",
  "departureDate": "2026-02-15",
  "returnDate": "2026-02-17",
  "vehicle": { "type": "sleeper_coach", "totalSeats": 40 },
  "pricing": { "perPerson": 4500, "advanceAmount": 3000 }
}
```

### List Packages
```http
GET /agencies/:agencyId/packages?status=current
```

### Get Seat Availability
```http
GET /agencies/:agencyId/packages/:packageId/seats

Response:
{
  "totalSeats": 40,
  "availableSeats": 28,
  "seats": [
    { "seatNumber": "L-A1", "status": "available", "price": 1400 },
    { "seatNumber": "L-A2", "status": "booked", "bookingId": "000001" }
  ]
}
```

---

## Bookings

### Create Booking
```http
POST /agencies/:agencyId/packages/:packageId/bookings

{
  "guest": {
    "name": "Mohammad Rahman",
    "phone": "01712345678"
  },
  "seats": [
    { "seatNumber": "L-E2", "passengerName": "Mohammad Rahman" }
  ],
  "boardingPoint": { "id": "bp_1", "name": "Gabtoli" },
  "payment": { "advanceAmount": 3000, "method": "bkash" }
}

Response:
{
  "success": true,
  "data": {
    "bookingId": "000001",
    "status": "confirmed"
  }
}
```

### Search Bookings
```http
GET /agencies/:agencyId/bookings/search?bookingId=000001
GET /agencies/:agencyId/bookings/search?phone=01712345678
```

### Record Payment
```http
POST /agencies/:agencyId/packages/:packageId/bookings/:bookingId/payments

{
  "amount": 1500,
  "method": "cash",
  "type": "due"
}
```

---

## Reports

### Generate Guest List PDF
```http
POST /agencies/:agencyId/packages/:packageId/reports/guest-list

Response:
{
  "downloadUrl": "https://storage.../GuestList.pdf"
}
```

### Generate Invoice
```http
POST /agencies/:agencyId/packages/:packageId/bookings/:bookingId/invoice

Response:
{
  "downloadUrl": "https://storage.../Invoice_000001.pdf"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_INVALID_TOKEN | Invalid or expired token |
| BOOKING_SEATS_UNAVAILABLE | Seats already booked |
| VALIDATION_ERROR | Request validation failed |

---

*API Specifications v1.0*
