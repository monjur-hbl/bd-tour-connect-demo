# 🗄️ Database Schema - BD Tour Connect

## Firestore Data Model

This document outlines the complete Firestore database structure for the BD Tour Connect travel booking portal.

---

## Collection Structure Overview

```
bd-tour-connect (Firebase Project)
│
├── systemAdmins/                    # Platform super admins
│   └── {adminId}/
│
├── agencies/                        # Travel agency tenants (main collection)
│   └── {agencyId}/
│       ├── owners/                  # Agency owner accounts
│       │   └── {ownerId}/
│       ├── agents/                  # Sales agent accounts
│       │   └── {agentId}/
│       ├── packages/                # Tour packages
│       │   └── {packageId}/
│       │       └── bookings/        # Package bookings
│       │           └── {bookingId}/
│       ├── vehicles/                # Vehicle configurations
│       │   └── {vehicleId}/
│       ├── boardingPoints/          # Reusable boarding points
│       │   └── {pointId}/
│       ├── droppingPoints/          # Reusable dropping points
│       │   └── {pointId}/
│       └── settings/                # Agency settings
│           └── {settingId}/
│
├── conversations/                   # Messaging threads
│   └── {conversationId}/
│       └── messages/                # Individual messages
│           └── {messageId}/
│
└── attachments/                     # Media files metadata
    └── {attachmentId}/
```

---

## 1. System Admins Collection

```typescript
// Collection: systemAdmins/{adminId}
interface SystemAdmin {
  id: string;                        // Firebase Auth UID
  email: string;
  phone: string;
  name: string;
  avatar?: string;
  role: 'super_admin';
  permissions: string[];             // ['manage_agencies', 'view_reports', 'manage_admins']
  isActive: boolean;
  lastLogin: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 2. Agencies Collection (Main Tenant)

```typescript
// Collection: agencies/{agencyId}
interface Agency {
  id: string;
  
  // Basic Info
  name: string;                      // "Sarbik Travels"
  nameBn: string;                    // "সার্বিক ট্রাভেলস"
  slug: string;                      // "sarbik-travels" (unique)
  
  // Contact
  email: string;
  phone: string;
  whatsapp?: string;
  
  // Address
  address: {
    street: string;
    area: string;
    city: string;
    district: string;
    postalCode: string;
    fullAddress: string;
    fullAddressBn: string;
    mapLink?: string;
  };
  
  // Branding
  logo?: string;                     // Storage URL
  coverImage?: string;
  primaryColor: string;              // "#F97316"
  
  // Social Links
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  
  // Business Info
  tradeLicense?: string;
  tinNumber?: string;
  
  // Subscription & Billing
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'trial' | 'expired' | 'suspended';
    trialEndsAt?: Timestamp;
    currentPeriodEnd?: Timestamp;
    features: string[];
  };
  
  // Messaging Connections
  messagingConfig?: {
    whatsapp1?: WhatsAppConfig;
    whatsapp2?: WhatsAppConfig;
    messenger?: MessengerConfig;
  };
  
  // Status
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  verifiedAt?: Timestamp;
  
  // Metadata
  createdBy: string;                 // System admin who created
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface WhatsAppConfig {
  sessionId: string;
  isConnected: boolean;
  phoneNumber?: string;
  lastConnectedAt?: Timestamp;
}

interface MessengerConfig {
  pageId: string;
  pageName: string;
  pageAccessToken: string;           // Encrypted
  isConnected: boolean;
  connectedAt?: Timestamp;
}
```

---

## 3. Agency Owners Sub-collection

```typescript
// Collection: agencies/{agencyId}/owners/{ownerId}
interface AgencyOwner {
  id: string;                        // Firebase Auth UID
  agencyId: string;
  
  // Personal Info
  name: string;
  nameBn?: string;
  email: string;
  phone: string;
  avatar?: string;
  
  // Role & Permissions
  role: 'owner' | 'manager';
  permissions: OwnerPermission[];
  
  // Status
  isActive: boolean;
  lastLogin?: Timestamp;
  
  // Metadata
  invitedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type OwnerPermission = 
  | 'manage_packages'
  | 'manage_bookings'
  | 'manage_agents'
  | 'view_reports'
  | 'manage_settings'
  | 'manage_messaging';
```

---

## 4. Sales Agents Sub-collection

```typescript
// Collection: agencies/{agencyId}/agents/{agentId}
interface SalesAgent {
  id: string;                        // Firebase Auth UID
  agencyId: string;
  
  // Personal Info
  name: string;
  nameBn?: string;
  phone: string;
  email?: string;
  avatar?: string;
  
  // Agent Code (for tracking)
  agentCode: string;                 // "SA001", "SA002"
  
  // Role & Permissions
  role: 'sales_agent';
  permissions: AgentPermission[];
  
  // Performance Tracking
  stats: {
    totalBookings: number;
    totalRevenue: number;
    thisMonthBookings: number;
    thisMonthRevenue: number;
  };
  
  // Messaging Access
  canAccessMessaging: boolean;
  assignedWhatsApp?: 'whatsapp1' | 'whatsapp2';
  
  // Status
  isActive: boolean;
  lastLogin?: Timestamp;
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type AgentPermission =
  | 'create_booking'
  | 'view_bookings'
  | 'edit_booking'
  | 'cancel_booking'
  | 'access_messaging'
  | 'view_reports';
```

---

## 5. Tour Packages Sub-collection

```typescript
// Collection: agencies/{agencyId}/packages/{packageId}
interface TourPackage {
  id: string;
  agencyId: string;
  
  // Basic Info
  name: string;                      // "Cox's Bazar Premium Tour"
  nameBn: string;                    // "কক্সবাজার প্রিমিয়াম ট্যুর"
  description: string;
  descriptionBn: string;
  
  // Destination
  destination: string;
  destinationBn: string;
  coverImage?: string;
  galleryImages?: string[];
  
  // Schedule
  departureDate: Timestamp;
  returnDate: Timestamp;
  departureTime: string;             // "21:00"
  returnTime: string;                // "20:30"
  duration: {
    days: number;
    nights: number;
  };
  
  // Vehicle Configuration
  vehicle: {
    type: VehicleType;
    name: string;                    // "Sleeper AC Bus"
    nameBn: string;
    layoutId: string;                // Reference to vehicle layout
    totalSeats: number;
    availableSeats: number;
  };
  
  // Pricing
  pricing: {
    perPerson: number;               // ৳4500 (4 sharing)
    perPersonLabel: string;          // "1 রুমে 4 জন"
    couple: number;                  // ৳11000 (2 sharing)
    coupleLabel: string;             // "1 রুমে 2 জন"
    
    // Child pricing
    childFreeAge: number;            // 3 (0-3 years free)
    childDiscountAge: number;        // 10 (3-10 years discounted)
    childDiscountPercent: number;    // 50
    
    // Booking
    advanceAmount: number;           // ৳3000
    advancePercentage?: number;
    
    // Fees
    platformFee: number;
    paymentFee: number;
    
    // Discounts
    earlyBirdDiscount?: {
      percentage: number;
      validUntil: Timestamp;
    };
    groupDiscount?: {
      minPeople: number;
      percentage: number;
    };
  };
  
  // Boarding Points
  boardingPoints: BoardingPoint[];
  
  // Dropping Points
  droppingPoints: DroppingPoint[];
  
  // Meals
  mealPlan: DayMealPlan[];
  
  // Inclusions & Exclusions
  inclusions: PackageItem[];
  exclusions: PackageItem[];
  
  // Policies
  bookingPolicy: {
    lastBookingTime: string;         // "Hours before departure"
    minAdvanceBooking: number;       // Days
    maxGroupSize?: number;
    acceptMouthBooking: boolean;
  };
  
  refundPolicy: {
    fullRefundDays?: number;         // Days before departure for full refund
    partialRefundDays?: number;
    cancellationFee?: number;
    replacementAllowed: boolean;
    conditions: string[];
    conditionsBn: string[];
  };
  
  // Terms
  termsAndConditions: string[];
  termsAndConditionsBn: string[];
  
  // Important Notes
  importantNotes: string[];
  importantNotesBn: string[];
  
  // Status
  status: PackageStatus;
  
  // Booking Stats
  stats: {
    totalBooked: number;
    totalRevenue: number;
    totalAdvanceCollected: number;
    totalDueAmount: number;
  };
  
  // Visibility
  isPublished: boolean;
  isFeatured: boolean;
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

enum VehicleType {
  MICROBUS = 'microbus',
  MINI_BUS = 'mini_bus',
  NON_AC_BUS = 'non_ac_bus',
  AC_BUS = 'ac_bus',
  SLEEPER_COACH = 'sleeper_coach'
}

enum PackageStatus {
  DRAFT = 'draft',
  CURRENT = 'current',
  FUTURE = 'future',
  PAST = 'past',
  CANCELLED = 'cancelled'
}

interface BoardingPoint {
  id: string;
  name: string;
  nameBn: string;
  address: string;
  addressBn: string;
  time: string;                      // "21:00"
  mapLink?: string;
  isActive: boolean;
}

interface DroppingPoint {
  id: string;
  name: string;
  nameBn: string;
  address: string;
  addressBn: string;
  estimatedArrival?: string;
  mapLink?: string;
  isActive: boolean;
}

interface DayMealPlan {
  dayNumber: number;
  date: Timestamp;
  label: string;                     // "Day 1"
  labelBn: string;                   // "দিন ১"
  meals: {
    breakfast?: MealItem;
    lunch?: MealItem;
    eveningSnack?: MealItem;
    dinner?: MealItem;
  };
}

interface MealItem {
  included: boolean;
  time?: string;                     // "08:00 AM"
  menu: string[];                    // ["Paratha", "Dal", "Egg"]
  menuBn: string[];                  // ["পরটা", "ডাল", "ডিম"]
  venue?: string;
  venueBn?: string;
}

interface PackageItem {
  text: string;
  textBn: string;
  icon?: string;                     // Emoji or icon name
}
```

---

## 6. Bookings Sub-collection

```typescript
// Collection: agencies/{agencyId}/packages/{packageId}/bookings/{bookingId}
interface Booking {
  id: string;
  
  // Unique Booking Reference
  bookingId: string;                 // 6-digit: "000001"
  
  // References
  agencyId: string;
  packageId: string;
  
  // Guest Information
  guest: {
    name: string;
    nameBn?: string;
    phone: string;
    email?: string;
    nid?: string;                    // National ID
    address?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relation: string;
    };
  };
  
  // For search (lowercase versions)
  guestNameLower: string;
  guestPhoneLower: string;
  
  // Seat Information
  seats: BookedSeat[];
  seatNumbers: string[];             // ["L-E2", "L-G3"] for quick display
  totalSeats: number;
  
  // Boarding & Dropping
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
  
  // Pricing & Payment
  pricing: {
    seatFare: number;                // Base fare
    discount: number;
    platformFee: number;
    paymentFee: number;
    totalAmount: number;
  };
  
  payment: {
    advanceAmount: number;
    advancePaidAt?: Timestamp;
    advanceMethod?: PaymentMethod;
    
    dueAmount: number;
    duePaidAt?: Timestamp;
    dueMethod?: PaymentMethod;
    
    totalPaid: number;
    status: PaymentStatus;
  };
  
  // Booking Source
  source: {
    platform: 'web' | 'mobile' | 'whatsapp' | 'messenger' | 'phone' | 'walk_in';
    agentId?: string;
    agentName?: string;
    agentCode?: string;
  };
  
  // Status
  status: BookingStatus;
  cancelledAt?: Timestamp;
  cancelReason?: string;
  
  // Notes
  internalNotes?: string;
  guestNotes?: string;
  
  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Invoice
  invoiceGenerated: boolean;
  invoiceUrl?: string;
}

interface BookedSeat {
  seatNumber: string;                // "L-E2"
  class: string;                     // "B-Class"
  fare: number;
  passengerName?: string;
  passengerAge?: number;
  passengerGender?: 'male' | 'female';
}

enum PaymentMethod {
  CASH = 'cash',
  BKASH = 'bkash',
  NAGAD = 'nagad',
  ROCKET = 'rocket',
  BANK = 'bank',
  CARD = 'card'
}

enum PaymentStatus {
  UNPAID = 'unpaid',
  ADVANCE_PAID = 'advance_paid',
  FULLY_PAID = 'fully_paid',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show'
}
```

---

## 7. Vehicles Configuration

```typescript
// Collection: agencies/{agencyId}/vehicles/{vehicleId}
interface VehicleConfig {
  id: string;
  agencyId: string;
  
  // Basic Info
  name: string;                      // "Volvo Sleeper AC"
  nameBn: string;
  type: VehicleType;
  
  // Layout
  layout: VehicleLayout;
  
  // Default Pricing
  defaultPricing?: {
    [seatClass: string]: number;     // { "B-Class": 1400, "Sleeper": 1600 }
  };
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface VehicleLayout {
  totalSeats: number;
  
  // For regular buses (2+2, 2+1)
  configuration?: string;            // "2+2", "2+1"
  rows?: number;
  columns?: number;
  
  // For sleeper coach
  hasUpperDeck?: boolean;
  lowerDeck?: DeckLayout;
  upperDeck?: DeckLayout;
  
  // Seat positions
  seats: SeatConfig[];
}

interface DeckLayout {
  name: string;                      // "Lower Deck"
  nameBn: string;
  rows: number;
  columns: number;
}

interface SeatConfig {
  seatNumber: string;                // "L-E2", "U-A5"
  row: number;
  column: number;
  deck?: 'lower' | 'upper';
  type: SeatType;
  class: string;                     // "B-Class", "Sleeper"
  basePrice: number;
  isWomen?: boolean;                 // Reserved for women
}

enum SeatType {
  REGULAR = 'regular',
  SLEEPER = 'sleeper',
  DRIVER = 'driver',
  DOOR = 'door',
  AISLE = 'aisle',
  EMPTY = 'empty'
}
```

---

## 8. Conversations (Messaging)

```typescript
// Collection: conversations/{conversationId}
interface Conversation {
  id: string;
  agencyId: string;
  
  // Platform
  platform: 'whatsapp1' | 'whatsapp2' | 'messenger';
  platformId: string;                // WhatsApp number or FB PSID
  
  // Customer Info
  customer: {
    id: string;                      // Platform-specific ID
    name: string;
    phone?: string;
    avatar?: string;
  };
  
  // Last Message
  lastMessage: {
    content: string;
    timestamp: Timestamp;
    isFromCustomer: boolean;
  };
  
  // Status
  status: ConversationStatus;
  unreadCount: number;
  
  // Assignment
  assignedAgent?: {
    id: string;
    name: string;
    assignedAt: Timestamp;
  };
  
  // Typing Indicator (for "agent is replying")
  isAgentTyping: boolean;
  typingAgentId?: string;
  typingAgentName?: string;
  typingStartedAt?: Timestamp;
  
  // Tags & Labels
  tags?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  // Linked Booking
  linkedBookingId?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

enum ConversationStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ARCHIVED = 'archived'
}
```

```typescript
// Sub-collection: conversations/{conversationId}/messages/{messageId}
interface Message {
  id: string;
  conversationId: string;
  
  // Sender
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'agent';
  
  // Content
  content: string;
  contentType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';
  
  // Attachments
  attachments?: MessageAttachment[];
  
  // Status (for outgoing)
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  
  // Platform-specific
  platformMessageId?: string;
  
  // Metadata
  timestamp: Timestamp;
}

interface MessageAttachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnail?: string;
}
```

---

## 9. Settings Sub-collection

```typescript
// Collection: agencies/{agencyId}/settings/{settingId}

// Booking Counter
interface BookingCounterSetting {
  id: 'bookingCounter';
  count: number;                     // Current count
  prefix?: string;                   // Optional prefix
}

// Agency Preferences
interface PreferencesSetting {
  id: 'preferences';
  language: 'bn' | 'en' | 'both';
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

// Notification Settings
interface NotificationSetting {
  id: 'notifications';
  email: {
    newBooking: boolean;
    bookingCancellation: boolean;
    paymentReceived: boolean;
    dailySummary: boolean;
  };
  sms: {
    newBooking: boolean;
    reminderBeforeTrip: boolean;
  };
}

// Payment Settings
interface PaymentSetting {
  id: 'payment';
  methods: {
    bkash?: {
      enabled: boolean;
      number: string;
      type: 'personal' | 'merchant';
    };
    nagad?: {
      enabled: boolean;
      number: string;
    };
    bank?: {
      enabled: boolean;
      accountName: string;
      accountNumber: string;
      bankName: string;
      branchName: string;
      routingNumber?: string;
    };
  };
}
```

---

## 📐 Indexes Required

```javascript
// firestore.indexes.json
{
  "indexes": [
    // Bookings by phone
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "phone", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // Bookings by booking ID
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "bookingId", "order": "ASCENDING" }
      ]
    },
    
    // Packages by status and date
    {
      "collectionGroup": "packages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "departureDate", "order": "ASCENDING" }
      ]
    },
    
    // Conversations by agency and platform
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "agencyId", "order": "ASCENDING" },
        { "fieldPath": "platform", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🔒 Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isSystemAdmin() {
      return request.auth.token.role == 'system_admin';
    }
    
    function isAgencyOwner(agencyId) {
      return request.auth.token.role == 'agency_owner' 
        && request.auth.token.agencyId == agencyId;
    }
    
    function isSalesAgent(agencyId) {
      return request.auth.token.role == 'sales_agent'
        && request.auth.token.agencyId == agencyId;
    }
    
    function belongsToAgency(agencyId) {
      return isAgencyOwner(agencyId) || isSalesAgent(agencyId);
    }
    
    // System Admins
    match /systemAdmins/{adminId} {
      allow read, write: if isSystemAdmin();
    }
    
    // Agencies
    match /agencies/{agencyId} {
      allow read: if isSystemAdmin() || belongsToAgency(agencyId);
      allow create: if isSystemAdmin();
      allow update: if isSystemAdmin() || isAgencyOwner(agencyId);
      allow delete: if isSystemAdmin();
      
      // Sub-collections
      match /owners/{ownerId} {
        allow read: if belongsToAgency(agencyId);
        allow write: if isSystemAdmin() || isAgencyOwner(agencyId);
      }
      
      match /agents/{agentId} {
        allow read: if belongsToAgency(agencyId);
        allow write: if isAgencyOwner(agencyId);
      }
      
      match /packages/{packageId} {
        allow read: if belongsToAgency(agencyId);
        allow write: if isAgencyOwner(agencyId);
        
        match /bookings/{bookingId} {
          allow read: if belongsToAgency(agencyId);
          allow create: if belongsToAgency(agencyId);
          allow update: if belongsToAgency(agencyId);
          allow delete: if isAgencyOwner(agencyId);
        }
      }
      
      match /vehicles/{vehicleId} {
        allow read: if belongsToAgency(agencyId);
        allow write: if isAgencyOwner(agencyId);
      }
      
      match /settings/{settingId} {
        allow read: if belongsToAgency(agencyId);
        allow write: if isAgencyOwner(agencyId);
      }
    }
    
    // Conversations
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() 
        && belongsToAgency(resource.data.agencyId);
      allow write: if isAuthenticated()
        && belongsToAgency(request.resource.data.agencyId);
      
      match /messages/{messageId} {
        allow read, write: if isAuthenticated()
          && belongsToAgency(get(/databases/$(database)/documents/conversations/$(conversationId)).data.agencyId);
      }
    }
  }
}
```

---

*This schema is designed for scalability and multi-tenancy support.*
