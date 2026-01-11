# 🗄️ Database Schema - BD Tour Connect

## Firestore Collections Overview

This document defines the complete Firestore database structure for the BD Tour Connect multi-tenant booking portal.

---

## Collection Structure

```
├── systemAdmins/{adminId}
├── agencies/{agencyId}/
│   ├── owners/{ownerId}
│   ├── agents/{agentId}
│   ├── packages/{packageId}/
│   │   └── bookings/{bookingId}
│   ├── vehicles/{vehicleId}
│   ├── boardingPoints/{pointId}
│   ├── droppingPoints/{pointId}
│   ├── counters/booking
│   └── settings/
├── conversations/{conversationId}/
│   └── messages/{messageId}
└── attachments/{attachmentId}
```

---

## 1. System Admins Collection

```typescript
interface SystemAdmin {
  uid: string;
  name: string;
  phone: string;
  email: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  isActive: boolean;
}
```

---

## 2. Agencies Collection

```typescript
interface Agency {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  
  contact: {
    phone: string;
    alternatePhone?: string;
    email: string;
    website?: string;
  };
  
  address: {
    street: string;
    area: string;
    city: string;
    district: string;
    postalCode?: string;
  };
  
  branding: {
    logo?: string;
    primaryColor?: string;
    tagline?: string;
    taglineBn?: string;
  };
  
  subscription: {
    plan: 'basic' | 'standard' | 'premium';
    startDate: Timestamp;
    endDate: Timestamp;
    maxAgents: number;
    maxPackagesPerMonth: number;
  };
  
  messagingConfig: {
    whatsapp1?: {
      instanceId: string;
      phoneNumber: string;
      isConnected: boolean;
      lastConnectedAt?: Timestamp;
    };
    whatsapp2?: {
      instanceId: string;
      phoneNumber: string;
      isConnected: boolean;
      lastConnectedAt?: Timestamp;
    };
    messenger?: {
      pageId: string;
      pageName: string;
      accessToken: string; // Encrypted
      isConnected: boolean;
    };
  };
  
  status: 'active' | 'suspended' | 'trial';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 3. Owners & Agents

```typescript
interface AgencyOwner {
  uid: string;
  agencyId: string;
  name: string;
  nameBn?: string;
  phone: string;
  email?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
}

interface SalesAgent {
  uid: string;
  agencyId: string;
  agentCode: string; // SA001, SA002, etc.
  name: string;
  nameBn?: string;
  phone: string;
  email?: string;
  avatar?: string;
  
  permissions: string[];
  // Possible: create_booking, edit_booking, cancel_booking, view_all_bookings, access_messaging
  
  canAccessMessaging: boolean;
  assignedWhatsApp?: 'whatsapp1' | 'whatsapp2';
  
  performance: {
    totalBookings: number;
    totalRevenue: number;
    lastBookingAt?: Timestamp;
  };
  
  isActive: boolean;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

---

## 4. Tour Packages

```typescript
interface TourPackage {
  id: string;
  agencyId: string;
  
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  
  destination: string;
  destinationBn: string;
  
  coverImage: string;
  galleryImages?: string[];
  
  // Schedule
  departureDate: Timestamp;
  returnDate: Timestamp;
  departureTime: string; // "21:00"
  returnTime: string;
  durationDays: number;
  durationNights: number;
  
  // Vehicle
  vehicle: {
    type: 'microbus' | 'mini_bus' | 'non_ac_bus' | 'ac_bus' | 'sleeper_coach';
    layoutId: string;
    name: string;
    totalSeats: number;
    availableSeats: number;
  };
  
  // Pricing
  pricing: {
    perPerson: number;
    perPersonLabel: string;
    perPersonLabelBn: string;
    couple?: number;
    coupleLabel?: string;
    coupleLabelBn?: string;
    childFreeAge: number;
    childDiscountAge: number;
    childDiscountPercent: number;
    advanceAmount: number;
    platformFee?: number;
    paymentFee?: number;
  };
  
  boardingPoints: BoardingPoint[];
  droppingPoints: DroppingPoint[];
  
  // Meals
  mealPlan: MealDay[];
  
  // Inclusions/Exclusions
  inclusions: PackageItem[];
  exclusions: PackageItem[];
  
  // Policies
  refundPolicy: {
    fullRefundDays: number;
    partialRefundDays: number;
    cancellationFee: number;
    conditions: string[];
    conditionsBn: string[];
  };
  
  termsAndConditions: string[];
  termsAndConditionsBn: string[];
  
  // Status
  status: 'draft' | 'current' | 'future' | 'past' | 'cancelled';
  isPublished: boolean;
  
  // Stats
  stats: {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
  };
  
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface BoardingPoint {
  id: string;
  name: string;
  nameBn: string;
  address: string;
  time: string;
  mapLink?: string;
  order: number;
}

interface DroppingPoint {
  id: string;
  name: string;
  nameBn: string;
  address?: string;
  estimatedArrival: string;
  order: number;
}

interface MealDay {
  dayNumber: number;
  date: string;
  label: string;
  labelBn: string;
  meals: {
    breakfast: MealConfig | null;
    lunch: MealConfig | null;
    eveningSnack: MealConfig | null;
    dinner: MealConfig | null;
  };
}

interface MealConfig {
  included: boolean;
  time?: string;
  menu: string[];
  menuBn: string[];
  venue?: string;
}

interface PackageItem {
  text: string;
  textBn: string;
  icon?: string;
}
```

---

## 5. Bookings

```typescript
interface Booking {
  id: string;
  bookingId: string; // 6-digit: "000001"
  agencyId: string;
  packageId: string;
  
  guest: {
    name: string;
    nameBn?: string;
    phone: string;
    email?: string;
    nid?: string;
    address?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relation: string;
    };
  };
  
  // For search optimization
  guestPhoneLower: string;
  guestNameLower: string;
  
  seats: SeatBooking[];
  
  boardingPoint: {
    id: string;
    name: string;
    nameBn: string;
    time: string;
  };
  
  droppingPoint: {
    id: string;
    name: string;
    nameBn: string;
  };
  
  pricing: {
    seatFare: number;
    discount: number;
    totalAmount: number;
  };
  
  payment: {
    advanceAmount: number;
    advanceMethod: 'cash' | 'bkash' | 'nagad' | 'bank' | 'card';
    advancePaidAt: Timestamp;
    dueAmount: number;
    fullPaidAt?: Timestamp;
    status: 'unpaid' | 'advance_paid' | 'fully_paid';
    payments: PaymentRecord[];
  };
  
  source: {
    platform: 'web' | 'whatsapp' | 'messenger' | 'phone' | 'walkin';
    agentId?: string;
    agentCode?: string;
    conversationId?: string;
  };
  
  guestNotes?: string;
  internalNotes?: string;
  
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface SeatBooking {
  seatNumber: string;
  deck?: 'lower' | 'upper';
  class: string;
  price: number;
  passengerName: string;
  passengerAge?: number;
  passengerGender?: 'male' | 'female' | 'other';
}

interface PaymentRecord {
  amount: number;
  method: string;
  type: 'advance' | 'due' | 'refund';
  transactionId?: string;
  notes?: string;
  recordedBy: string;
  recordedAt: Timestamp;
}
```

---

## 6. Conversations & Messages

```typescript
interface Conversation {
  id: string;
  agencyId: string;
  
  platform: 'whatsapp1' | 'whatsapp2' | 'messenger';
  
  customer: {
    id: string; // WhatsApp number or Messenger PSID
    name?: string;
    phone?: string;
    avatar?: string;
  };
  
  lastMessage: {
    content: string;
    timestamp: Timestamp;
    isFromCustomer: boolean;
  };
  
  unreadCount: number;
  
  assignedAgent?: {
    id: string;
    name: string;
    code: string;
  };
  
  // Typing indicator
  isAgentTyping: boolean;
  typingAgentId?: string;
  typingAgentName?: string;
  typingStartedAt?: Timestamp;
  
  // Linked booking
  linkedBookingId?: string;
  
  status: 'active' | 'resolved' | 'archived';
  resolvedAt?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Message {
  id: string;
  conversationId: string;
  
  sender: {
    type: 'customer' | 'agent' | 'system';
    id: string;
    name?: string;
  };
  
  content: string;
  contentType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
  
  attachments?: Attachment[];
  
  // WhatsApp/Messenger message ID
  externalMessageId?: string;
  
  status: 'sent' | 'delivered' | 'read' | 'failed';
  
  createdAt: Timestamp;
}

interface Attachment {
  type: 'image' | 'document' | 'audio' | 'video';
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnail?: string;
}
```

---

## Firestore Indexes

```
// bookings collection group
- agencyId ASC, bookingId ASC
- agencyId ASC, guestPhoneLower ASC, createdAt DESC
- agencyId ASC, status ASC, createdAt DESC

// packages
- agencyId ASC, status ASC, departureDate ASC
- agencyId ASC, isPublished ASC, status ASC

// conversations
- agencyId ASC, platform ASC, updatedAt DESC
- agencyId ASC, status ASC, unreadCount DESC
```

---

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // System Admins - full access to everything
    match /{document=**} {
      allow read, write: if request.auth.token.role == 'system_admin';
    }
    
    // Agencies
    match /agencies/{agencyId} {
      allow read: if request.auth.token.agencyId == agencyId;
      allow write: if request.auth.token.role == 'agency_owner' 
                   && request.auth.token.agencyId == agencyId;
      
      // Packages
      match /packages/{packageId} {
        allow read: if request.auth.token.agencyId == agencyId;
        allow create, update: if request.auth.token.agencyId == agencyId
                              && request.auth.token.role in ['agency_owner', 'sales_agent'];
        
        // Bookings
        match /bookings/{bookingId} {
          allow read: if request.auth.token.agencyId == agencyId;
          allow create: if request.auth.token.agencyId == agencyId;
          allow update: if request.auth.token.agencyId == agencyId
                        && request.auth.token.role in ['agency_owner', 'sales_agent'];
        }
      }
      
      // Agents
      match /agents/{agentId} {
        allow read: if request.auth.token.agencyId == agencyId;
        allow write: if request.auth.token.role == 'agency_owner'
                     && request.auth.token.agencyId == agencyId;
      }
    }
    
    // Conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth.token.agencyId == resource.data.agencyId;
      
      match /messages/{messageId} {
        allow read, write: if request.auth.token.agencyId == get(/databases/$(database)/documents/conversations/$(conversationId)).data.agencyId;
      }
    }
  }
}
```

---

*Database Schema v1.0 - BD Tour Connect*
