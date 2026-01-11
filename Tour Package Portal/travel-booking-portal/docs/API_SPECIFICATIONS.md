# 🔌 API Specifications - BD Tour Connect

## Overview

This document outlines all API endpoints, data structures, and integration specifications for the BD Tour Connect booking portal.

---

## 🔥 Firebase Cloud Functions API

### Base URL
```
Production: https://us-central1-bd-tour-connect.cloudfunctions.net/api
Development: http://localhost:5001/bd-tour-connect/us-central1/api
```

---

## 📋 Authentication APIs

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "phone": "01XXXXXXXXX",
  "password": "securePassword123",
  "name": "Agent Name",
  "nameBn": "এজেন্ট নাম",
  "role": "sales_agent",
  "agencyId": "agency_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "user_abc123",
    "phone": "01XXXXXXXXX",
    "name": "Agent Name",
    "role": "sales_agent",
    "agencyId": "agency_123",
    "token": "eyJhbGciOiJSUzI1NiIs..."
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "phone": "01XXXXXXXXX",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "user_abc123",
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "AMf-vBw...",
    "expiresIn": 3600,
    "user": {
      "name": "Agent Name",
      "role": "sales_agent",
      "agencyId": "agency_123",
      "permissions": ["create_booking", "view_bookings"]
    }
  }
}
```

### Set Custom Claims (Admin Only)
```http
POST /auth/set-claims
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "uid": "user_abc123",
  "claims": {
    "role": "agency_owner",
    "agencyId": "agency_123",
    "permissions": ["manage_packages", "manage_agents"]
  }
}
```

---

## 🏢 Agency APIs

### Create Agency (System Admin Only)
```http
POST /agencies
```

**Request Body:**
```json
{
  "name": "Sarbik Travels",
  "nameBn": "সার্বিক ট্রাভেলস",
  "email": "info@sarbiktravels.com",
  "phone": "01XXXXXXXXX",
  "address": {
    "street": "123 Main Road",
    "area": "Mirpur-1",
    "city": "Dhaka",
    "district": "Dhaka",
    "postalCode": "1216"
  },
  "subscription": {
    "plan": "premium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "agency_xyz789",
    "name": "Sarbik Travels",
    "nameBn": "সার্বিক ট্রাভেলস",
    "slug": "sarbik-travels",
    "status": "active",
    "createdAt": "2026-01-11T08:00:00Z"
  }
}
```

### Get Agency
```http
GET /agencies/:agencyId
```

### Update Agency
```http
PUT /agencies/:agencyId
```

### List Agencies (System Admin)
```http
GET /agencies?status=active&page=1&limit=20
```

---

## 📦 Package APIs

### Create Package
```http
POST /agencies/:agencyId/packages
```

**Request Body:**
```json
{
  "name": "Cox's Bazar Premium Tour",
  "nameBn": "কক্সবাজার প্রিমিয়াম ট্যুর",
  "description": "Experience the world's longest sea beach...",
  "descriptionBn": "বিশ্বের দীর্ঘতম সমুদ্র সৈকত উপভোগ করুন...",
  "destination": "Cox's Bazar",
  "destinationBn": "কক্সবাজার",
  "coverImage": "https://storage.googleapis.com/...",
  
  "departureDate": "2026-02-15T00:00:00Z",
  "returnDate": "2026-02-17T00:00:00Z",
  "departureTime": "21:00",
  "returnTime": "20:30",
  
  "vehicle": {
    "type": "sleeper_coach",
    "layoutId": "layout_sleeper_01",
    "totalSeats": 40
  },
  
  "pricing": {
    "perPerson": 4500,
    "perPersonLabel": "1 রুমে 4 জন",
    "couple": 11000,
    "coupleLabel": "1 রুমে 2 জন",
    "childFreeAge": 3,
    "childDiscountAge": 10,
    "childDiscountPercent": 50,
    "advanceAmount": 3000,
    "platformFee": 100,
    "paymentFee": 288
  },
  
  "boardingPoints": [
    {
      "id": "bp_1",
      "name": "Gabtoli",
      "nameBn": "গাবতলী",
      "address": "Gabtoli Bus Stand",
      "time": "21:00",
      "mapLink": "https://maps.google.com/..."
    },
    {
      "id": "bp_2",
      "name": "Mohakhali",
      "nameBn": "মহাখালী",
      "address": "Mohakhali Bus Terminal",
      "time": "21:30"
    }
  ],
  
  "droppingPoints": [
    {
      "id": "dp_1",
      "name": "Cox's Bazar Bus Stand",
      "nameBn": "কক্সবাজার বাস স্ট্যান্ড",
      "estimatedArrival": "07:00"
    }
  ],
  
  "mealPlan": [
    {
      "dayNumber": 1,
      "date": "2026-02-15",
      "label": "Day 1",
      "labelBn": "দিন ১",
      "meals": {
        "breakfast": null,
        "lunch": null,
        "eveningSnack": null,
        "dinner": {
          "included": true,
          "time": "21:30",
          "menu": ["Paratha", "Dal", "Chicken"],
          "menuBn": ["পরটা", "ডাল", "মুরগি"],
          "venue": "On Bus"
        }
      }
    },
    {
      "dayNumber": 2,
      "date": "2026-02-16",
      "label": "Day 2",
      "labelBn": "দিন ২",
      "meals": {
        "breakfast": {
          "included": true,
          "menu": ["Paratha", "Egg", "Dal"],
          "menuBn": ["পরটা", "ডিম", "ডাল"]
        },
        "lunch": {
          "included": true,
          "menu": ["Rice", "Fish Curry", "Dal", "Salad"],
          "menuBn": ["ভাত", "মাছের তরকারি", "ডাল", "সালাদ"]
        },
        "eveningSnack": {
          "included": true,
          "menu": ["Tea", "Singara"],
          "menuBn": ["চা", "সিঙ্গারা"]
        },
        "dinner": {
          "included": true,
          "menu": ["Rice", "Chicken", "Dal", "Vegetable"],
          "menuBn": ["ভাত", "মুরগি", "ডাল", "সবজি"]
        }
      }
    }
  ],
  
  "inclusions": [
    { "text": "AC Sleeper Bus", "textBn": "এসি স্লিপার বাস", "icon": "🚌" },
    { "text": "AC Hotel (4 sharing)", "textBn": "এসি হোটেল (৪ জন)", "icon": "🏨" },
    { "text": "6 Meals", "textBn": "৬ বেলা খাবার", "icon": "🍽️" },
    { "text": "All Sightseeing", "textBn": "সব দর্শনীয় স্থান", "icon": "📸" }
  ],
  
  "exclusions": [
    { "text": "Personal expenses", "textBn": "ব্যক্তিগত খরচ", "icon": "💰" },
    { "text": "Entry tickets", "textBn": "প্রবেশ টিকিট", "icon": "🎫" }
  ],
  
  "refundPolicy": {
    "fullRefundDays": 7,
    "partialRefundDays": 3,
    "cancellationFee": 500,
    "replacementAllowed": true,
    "conditions": [
      "Full refund if cancelled 7 days before departure",
      "50% refund if cancelled 3-7 days before",
      "No refund within 3 days of departure"
    ],
    "conditionsBn": [
      "যাত্রার ৭ দিন আগে বাতিল করলে সম্পূর্ণ রিফান্ড",
      "৩-৭ দিন আগে বাতিল করলে ৫০% রিফান্ড",
      "৩ দিনের মধ্যে কোনো রিফান্ড নেই"
    ]
  },
  
  "termsAndConditions": [
    "Advance payment is non-refundable",
    "Full payment required before departure"
  ],
  "termsAndConditionsBn": [
    "অগ্রিম অর্থ ফেরতযোগ্য নয়",
    "যাত্রার আগে সম্পূর্ণ অর্থ প্রদান করতে হবে"
  ],
  
  "status": "future",
  "isPublished": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pkg_abc123",
    "name": "Cox's Bazar Premium Tour",
    "status": "future",
    "vehicle": {
      "totalSeats": 40,
      "availableSeats": 40
    },
    "createdAt": "2026-01-11T08:00:00Z"
  }
}
```

### List Packages
```http
GET /agencies/:agencyId/packages?status=current&page=1&limit=20
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | `current`, `future`, `past`, `all` |
| destination | string | Filter by destination |
| fromDate | string | Filter packages starting from this date |
| toDate | string | Filter packages ending by this date |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |

### Get Package Details
```http
GET /agencies/:agencyId/packages/:packageId
```

### Update Package
```http
PUT /agencies/:agencyId/packages/:packageId
```

### Update Package Status
```http
PATCH /agencies/:agencyId/packages/:packageId/status
```

**Request Body:**
```json
{
  "status": "current"
}
```

### Get Seat Availability
```http
GET /agencies/:agencyId/packages/:packageId/seats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSeats": 40,
    "availableSeats": 28,
    "bookedSeats": 12,
    "seats": [
      {
        "seatNumber": "L-E2",
        "deck": "lower",
        "class": "B-Class",
        "price": 1400,
        "status": "booked",
        "bookingId": "000001"
      },
      {
        "seatNumber": "L-G3",
        "deck": "lower",
        "class": "B-Class",
        "price": 1400,
        "status": "available"
      },
      {
        "seatNumber": "U-A5",
        "deck": "upper",
        "class": "Sleeper",
        "price": 1600,
        "status": "available"
      }
    ]
  }
}
```

---

## 🎫 Booking APIs

### Create Booking
```http
POST /agencies/:agencyId/packages/:packageId/bookings
```

**Request Body:**
```json
{
  "guest": {
    "name": "Mohammad Rahman",
    "nameBn": "মোহাম্মদ রহমান",
    "phone": "01712345678",
    "email": "rahman@email.com",
    "nid": "1234567890123",
    "address": "House 10, Road 5, Dhanmondi, Dhaka",
    "emergencyContact": {
      "name": "Fatima Rahman",
      "phone": "01898765432",
      "relation": "Spouse"
    }
  },
  "seats": [
    {
      "seatNumber": "L-E2",
      "passengerName": "Mohammad Rahman",
      "passengerAge": 35,
      "passengerGender": "male"
    },
    {
      "seatNumber": "L-G3",
      "passengerName": "Fatima Rahman",
      "passengerAge": 32,
      "passengerGender": "female"
    }
  ],
  "boardingPoint": {
    "id": "bp_1",
    "name": "Gabtoli",
    "nameBn": "গাবতলী",
    "time": "21:00"
  },
  "droppingPoint": {
    "id": "dp_1",
    "name": "Cox's Bazar Bus Stand",
    "nameBn": "কক্সবাজার বাস স্ট্যান্ড"
  },
  "payment": {
    "advanceAmount": 6000,
    "advanceMethod": "bkash"
  },
  "source": {
    "platform": "web",
    "agentId": "agent_001",
    "agentCode": "SA001"
  },
  "guestNotes": "Window seat preferred"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "booking_xyz",
    "bookingId": "000001",
    "guest": {
      "name": "Mohammad Rahman",
      "phone": "01712345678"
    },
    "seats": ["L-E2", "L-G3"],
    "pricing": {
      "seatFare": 2800,
      "discount": 388,
      "totalAmount": 2800
    },
    "payment": {
      "advanceAmount": 6000,
      "dueAmount": 0,
      "status": "fully_paid"
    },
    "status": "confirmed",
    "createdAt": "2026-01-11T08:30:00Z"
  }
}
```

### Search Bookings
```http
GET /agencies/:agencyId/bookings/search
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| bookingId | string | 6-digit booking ID |
| phone | string | Guest phone number |
| name | string | Guest name (partial match) |
| packageId | string | Filter by package |
| agentId | string | Filter by agent |
| status | string | `pending`, `confirmed`, `cancelled` |
| paymentStatus | string | `unpaid`, `advance_paid`, `fully_paid` |
| fromDate | string | Booking date from |
| toDate | string | Booking date to |

### Get Booking Details
```http
GET /agencies/:agencyId/packages/:packageId/bookings/:bookingId
```

### Update Booking
```http
PUT /agencies/:agencyId/packages/:packageId/bookings/:bookingId
```

### Record Payment
```http
POST /agencies/:agencyId/packages/:packageId/bookings/:bookingId/payments
```

**Request Body:**
```json
{
  "amount": 2800,
  "method": "cash",
  "type": "due",
  "notes": "Paid at boarding point"
}
```

### Cancel Booking
```http
POST /agencies/:agencyId/packages/:packageId/bookings/:bookingId/cancel
```

**Request Body:**
```json
{
  "reason": "Customer request",
  "refundAmount": 5000,
  "refundMethod": "bkash"
}
```

---

## 👤 Agent APIs

### Create Agent
```http
POST /agencies/:agencyId/agents
```

**Request Body:**
```json
{
  "name": "Karim Ahmed",
  "nameBn": "করিম আহমেদ",
  "phone": "01XXXXXXXXX",
  "email": "karim@agency.com",
  "permissions": ["create_booking", "view_bookings", "access_messaging"],
  "canAccessMessaging": true,
  "assignedWhatsApp": "whatsapp1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "agent_abc",
    "agentCode": "SA001",
    "name": "Karim Ahmed",
    "isActive": true,
    "createdAt": "2026-01-11T08:00:00Z"
  }
}
```

### List Agents
```http
GET /agencies/:agencyId/agents?active=true
```

### Get Agent Performance
```http
GET /agencies/:agencyId/agents/:agentId/performance
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | `today`, `week`, `month`, `year` |
| fromDate | string | Custom date range start |
| toDate | string | Custom date range end |

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "agent_abc",
    "agentCode": "SA001",
    "period": "month",
    "stats": {
      "totalBookings": 45,
      "confirmedBookings": 42,
      "cancelledBookings": 3,
      "totalRevenue": 189000,
      "advanceCollected": 135000,
      "averageBookingValue": 4500
    },
    "breakdown": [
      { "date": "2026-01-01", "bookings": 3, "revenue": 13500 },
      { "date": "2026-01-02", "bookings": 5, "revenue": 22500 }
    ]
  }
}
```

---

## 💬 Messaging APIs

### Get Conversations
```http
GET /agencies/:agencyId/conversations
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| platform | string | `whatsapp1`, `whatsapp2`, `messenger` |
| status | string | `active`, `resolved`, `archived` |
| assignedTo | string | Agent ID filter |
| unreadOnly | boolean | Only show unread conversations |

### Get Conversation Messages
```http
GET /conversations/:conversationId/messages?limit=50&before=<messageId>
```

### Send Message
```http
POST /conversations/:conversationId/messages
```

**Request Body:**
```json
{
  "content": "Thank you for your inquiry!",
  "contentType": "text"
}
```

**For attachments:**
```json
{
  "content": "Here is your invoice",
  "contentType": "document",
  "attachments": [
    {
      "type": "document",
      "url": "https://storage.googleapis.com/.../invoice.pdf",
      "fileName": "Invoice_000001.pdf"
    }
  ]
}
```

### Set Typing Indicator
```http
POST /conversations/:conversationId/typing
```

**Request Body:**
```json
{
  "isTyping": true
}
```

### Assign Conversation
```http
POST /conversations/:conversationId/assign
```

**Request Body:**
```json
{
  "agentId": "agent_abc"
}
```

### Mark Conversation Resolved
```http
POST /conversations/:conversationId/resolve
```

---

## 📊 Reports & Downloads

### Generate Guest List PDF
```http
POST /agencies/:agencyId/packages/:packageId/reports/guest-list
```

**Request Body:**
```json
{
  "format": "pdf",
  "filters": {
    "status": "confirmed",
    "paymentStatus": "all"
  },
  "includeFields": [
    "bookingId", "guestName", "phone", "seats",
    "boardingPoint", "totalAmount", "paidAmount", "dueAmount", "bookedBy"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.googleapis.com/.../GuestList_pkg_abc123.pdf",
    "expiresAt": "2026-01-11T09:00:00Z",
    "totalGuests": 28,
    "generatedAt": "2026-01-11T08:30:00Z"
  }
}
```

### Generate Invoice PDF
```http
POST /agencies/:agencyId/packages/:packageId/bookings/:bookingId/invoice
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.googleapis.com/.../Invoice_000001.pdf",
    "invoiceNumber": "INV-2026-000001",
    "generatedAt": "2026-01-11T08:30:00Z"
  }
}
```

### Dashboard Statistics
```http
GET /agencies/:agencyId/dashboard/stats
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | `today`, `week`, `month`, `year` |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "overview": {
      "totalBookings": 156,
      "totalRevenue": 702000,
      "advanceCollected": 468000,
      "dueAmount": 234000,
      "activePackages": 8,
      "totalGuests": 312
    },
    "trends": {
      "bookingsChange": 12.5,
      "revenueChange": 8.3
    },
    "topPackages": [
      {
        "id": "pkg_1",
        "name": "Cox's Bazar Tour",
        "bookings": 45,
        "revenue": 202500
      }
    ],
    "topAgents": [
      {
        "id": "agent_1",
        "name": "Karim Ahmed",
        "code": "SA001",
        "bookings": 23,
        "revenue": 103500
      }
    ],
    "recentBookings": [
      {
        "bookingId": "000156",
        "guestName": "Mohammad Rahman",
        "package": "Cox's Bazar Tour",
        "amount": 9000,
        "createdAt": "2026-01-11T08:00:00Z"
      }
    ]
  }
}
```

---

## 🔔 Webhook Events

### Booking Created
```json
{
  "event": "booking.created",
  "timestamp": "2026-01-11T08:30:00Z",
  "data": {
    "bookingId": "000001",
    "agencyId": "agency_123",
    "packageId": "pkg_abc",
    "guestName": "Mohammad Rahman",
    "seats": ["L-E2", "L-G3"],
    "totalAmount": 2800
  }
}
```

### Payment Received
```json
{
  "event": "payment.received",
  "timestamp": "2026-01-11T08:35:00Z",
  "data": {
    "bookingId": "000001",
    "amount": 6000,
    "method": "bkash",
    "type": "advance",
    "newBalance": 0
  }
}
```

### Message Received
```json
{
  "event": "message.received",
  "timestamp": "2026-01-11T08:40:00Z",
  "data": {
    "conversationId": "conv_xyz",
    "platform": "whatsapp1",
    "from": "01712345678",
    "content": "Hello, I want to book for Cox's Bazar",
    "messageId": "msg_abc"
  }
}
```

---

## ⚠️ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_SEATS_UNAVAILABLE",
    "message": "Selected seats are no longer available",
    "details": {
      "unavailableSeats": ["L-E2", "L-G3"]
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_INVALID_TOKEN` | 401 | Invalid or expired token |
| `AUTH_INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `BOOKING_SEATS_UNAVAILABLE` | 409 | Seats already booked |
| `BOOKING_PACKAGE_NOT_ACTIVE` | 400 | Package is not in 'current' status |
| `PAYMENT_INSUFFICIENT` | 400 | Advance amount is less than required |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 🔐 Authentication

All API requests (except login/register) require authentication.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Refresh
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "AMf-vBw..."
}
```

---

## 📝 Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 5 requests/minute |
| Read operations | 100 requests/minute |
| Write operations | 30 requests/minute |
| Report generation | 10 requests/hour |

---

*API Specifications v1.0 - BD Tour Connect*
