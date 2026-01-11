# 🤖 Claude Code Development Instructions

## BD Tour Connect - Complete Implementation Guide

This document provides comprehensive instructions for building the BD Tour Connect travel booking portal using Claude Code.

---

## 📋 Project Initialization

### Step 1: Create Firebase Project

```bash
# Create new Firebase project named "bd-tour-connect"
# Project ID: bd-tour-connect-[random]
# Enable these services:
# - Firebase Authentication (Email/Password)
# - Cloud Firestore
# - Firebase Hosting
# - Cloud Functions
# - Cloud Storage (for attachments)
```

### Step 2: Initialize React Project

```bash
npx create-react-app bd-tour-connect --template typescript
cd bd-tour-connect
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install dependencies
npm install firebase react-router-dom @headlessui/react @heroicons/react
npm install jspdf html2canvas react-to-print
npm install socket.io-client axios date-fns
npm install react-hot-toast zustand
npm install -D @tailwindcss/forms @tailwindcss/typography
```

### Step 3: GitHub Repository Setup

```bash
git init
git remote add origin https://github.com/[username]/bd-tour-connect.git
git branch -M main
```

---

## 🏗️ Architecture Overview

### Multi-Tenant Data Structure

```
Firebase Project: bd-tour-connect
│
├── Authentication
│   └── Users (with custom claims for roles)
│
├── Firestore Collections
│   ├── systemAdmins/          # Platform administrators
│   ├── agencies/              # Travel agency tenants
│   │   └── {agencyId}/
│   │       ├── info           # Agency profile
│   │       ├── owners/        # Agency owner accounts
│   │       ├── agents/        # Sales agent accounts
│   │       ├── packages/      # Tour packages
│   │       ├── bookings/      # Guest bookings
│   │       ├── vehicles/      # Vehicle configurations
│   │       └── settings/      # Agency settings
│   │
│   ├── conversations/         # Messaging threads
│   └── messageAttachments/    # Stored files
│
└── Cloud Functions
    ├── Auth triggers
    ├── Booking webhooks
    └── Messaging handlers
```

---

## 🎨 Design System Implementation

### Color Palette (Festive Travel Theme)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary - Sunset Orange
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',  // Main primary
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // Secondary - Ocean Blue
        secondary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',  // Main secondary
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Accent - Tropical Teal
        accent: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',  // Main accent
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        // Success - Palm Green
        success: {
          500: '#22C55E',
          600: '#16A34A',
        },
        // Warning - Golden Sun
        warning: {
          500: '#F59E0B',
          600: '#D97706',
        },
        // Danger - Coral Red
        danger: {
          500: '#EF4444',
          600: '#DC2626',
        },
        // Neutral - Sand
        sand: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        }
      },
      fontFamily: {
        'bengali': ['Noto Sans Bengali', 'sans-serif'],
        'display': ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-festive': 'linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDBA74 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)',
        'gradient-sunset': 'linear-gradient(180deg, #F97316 0%, #EA580C 50%, #DC2626 100%)',
      },
      boxShadow: {
        'festive': '0 4px 20px rgba(249, 115, 22, 0.25)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 25px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      }
    }
  }
}
```

### Typography Scale

```css
/* Global styles */
.font-display { font-family: 'Poppins', sans-serif; }
.font-bengali { font-family: 'Noto Sans Bengali', sans-serif; }

/* Headings */
.heading-xl { @apply text-4xl md:text-5xl font-bold font-display; }
.heading-lg { @apply text-3xl md:text-4xl font-bold font-display; }
.heading-md { @apply text-2xl md:text-3xl font-semibold font-display; }
.heading-sm { @apply text-xl md:text-2xl font-semibold font-display; }

/* Body */
.body-lg { @apply text-lg leading-relaxed; }
.body-md { @apply text-base leading-relaxed; }
.body-sm { @apply text-sm leading-relaxed; }
```

---

## 🔐 Authentication Flow

### User Roles & Custom Claims

```typescript
// types/auth.ts
export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  AGENCY_OWNER = 'agency_owner',
  SALES_AGENT = 'sales_agent'
}

export interface UserClaims {
  role: UserRole;
  agencyId?: string;      // For agency_owner and sales_agent
  agentId?: string;       // For sales_agent only
  permissions?: string[];
}

// Firebase Cloud Function to set claims
export const setUserClaims = functions.https.onCall(async (data, context) => {
  // Verify caller is system admin or agency owner
  const { uid, role, agencyId, agentId } = data;
  
  await admin.auth().setCustomUserClaims(uid, {
    role,
    agencyId,
    agentId,
    updatedAt: Date.now()
  });
  
  return { success: true };
});
```

### Login Flow

```typescript
// components/auth/LoginForm.tsx
const LoginForm: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async () => {
    setLoading(true);
    try {
      // Convert phone to email format for Firebase Auth
      const email = `${phone.replace('+880', '')}@bdtourconnect.com`;
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Get custom claims
      const token = await result.user.getIdTokenResult();
      const claims = token.claims as UserClaims;
      
      // Redirect based on role
      switch(claims.role) {
        case UserRole.SYSTEM_ADMIN:
          navigate('/admin');
          break;
        case UserRole.AGENCY_OWNER:
          navigate('/agency');
          break;
        case UserRole.SALES_AGENT:
          navigate('/agent');
          break;
      }
    } catch (error) {
      toast.error('Login failed. Please check credentials.');
    }
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-festive flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-festive p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="heading-lg text-primary-600">BD Tour Connect</h1>
          <p className="body-md text-sand-500 mt-2">ট্রাভেল এজেন্সি পোর্টাল</p>
        </div>
        
        {/* Phone input with BD flag */}
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sand-500">
              🇧🇩 +880
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="1XXXXXXXXX"
              className="w-full pl-20 pr-4 py-3 border-2 border-sand-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />
          </div>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="পাসওয়ার্ড"
            className="w-full px-4 py-3 border-2 border-sand-200 rounded-xl focus:border-primary-500"
          />
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-gradient-festive text-white font-semibold rounded-xl hover:shadow-festive transition-all duration-300"
          >
            {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 📦 Tour Package Management

### Package Creation Form Structure

```typescript
// types/package.ts
export interface TourPackage {
  id: string;
  agencyId: string;
  
  // Basic Info
  name: string;
  nameBn: string;          // Bengali name
  description: string;
  descriptionBn: string;
  
  // Destination
  destination: string;
  destinationBn: string;
  
  // Dates & Times
  departureDate: Timestamp;
  returnDate: Timestamp;
  departureTime: string;   // "21:00"
  returnTime: string;      // "20:30"
  
  // Vehicle
  vehicleType: VehicleType;
  vehicleLayout: VehicleLayout;
  totalSeats: number;
  
  // Pricing
  pricing: PackagePricing;
  
  // Boarding/Dropping
  boardingPoints: BoardingPoint[];
  droppingPoints: DroppingPoint[];
  
  // Meals
  mealPlan: DayMealPlan[];
  
  // Inclusions & Exclusions
  inclusions: string[];
  exclusions: string[];
  
  // Policies
  bookingPolicy: BookingPolicy;
  refundPolicy: RefundPolicy;
  
  // Status
  status: PackageStatus;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export enum VehicleType {
  MICROBUS = 'microbus',
  MINI_BUS = 'mini_bus',
  NON_AC_BUS = 'non_ac_bus',
  AC_BUS = 'ac_bus',
  SLEEPER_COACH = 'sleeper_coach'
}

export interface VehicleLayout {
  type: VehicleType;
  
  // For regular buses
  rows?: number;
  seatsPerRow?: number;    // e.g., 2+2, 2+1
  
  // For sleeper coach
  hasUpperDeck?: boolean;
  lowerDeckLayout?: DeckLayout;
  upperDeckLayout?: DeckLayout;
}

export interface DeckLayout {
  rows: number;
  columns: number;
  seatPositions: SeatPosition[];
}

export interface SeatPosition {
  seatNumber: string;      // "L-E2", "U-A5"
  type: 'regular' | 'sleeper' | 'door' | 'aisle' | 'driver';
  class: 'B-Class' | 'Sleeper';
  price: number;
  row: number;
  column: number;
}

export interface PackagePricing {
  perPerson: number;          // ৳4500 (4 sharing)
  couple: number;             // ৳11000 (2 sharing)
  childFree: number;          // Age limit for free (3)
  childDiscountAge: number;   // Age limit for discount
  childDiscountPercent: number;
  advanceAmount: number;      // ৳3000
  platformFee: number;
  paymentFee: number;
}

export interface BoardingPoint {
  id: string;
  name: string;
  nameBn: string;
  address: string;
  time: string;
  mapLink?: string;
}

export interface DayMealPlan {
  dayNumber: number;
  date: string;
  meals: {
    breakfast?: MealDetails;
    lunch?: MealDetails;
    eveningSnack?: MealDetails;
    dinner?: MealDetails;
  };
}

export interface MealDetails {
  included: boolean;
  menu: string[];
  menuBn: string[];
}

export enum PackageStatus {
  DRAFT = 'draft',
  CURRENT = 'current',      // Active and bookable
  FUTURE = 'future',        // Scheduled but not bookable
  PAST = 'past',            // Completed
  CANCELLED = 'cancelled'
}
```

### Package Creation Component

```typescript
// components/agency/PackageCreationWizard.tsx
const PackageCreationWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [packageData, setPackageData] = useState<Partial<TourPackage>>({});
  
  const steps = [
    { number: 1, title: 'বেসিক তথ্য', titleEn: 'Basic Info' },
    { number: 2, title: 'যানবাহন', titleEn: 'Vehicle' },
    { number: 3, title: 'মূল্য', titleEn: 'Pricing' },
    { number: 4, title: 'বোর্ডিং পয়েন্ট', titleEn: 'Boarding Points' },
    { number: 5, title: 'খাবার', titleEn: 'Meals' },
    { number: 6, title: 'নীতিমালা', titleEn: 'Policies' },
    { number: 7, title: 'পর্যালোচনা', titleEn: 'Review' }
  ];
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-semibold
              ${step >= s.number 
                ? 'bg-primary-500 text-white' 
                : 'bg-sand-200 text-sand-500'}
            `}>
              {s.number}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-1 mx-2 ${step > s.number ? 'bg-primary-500' : 'bg-sand-200'}`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-card p-8">
        {step === 1 && <BasicInfoStep data={packageData} onChange={setPackageData} />}
        {step === 2 && <VehicleStep data={packageData} onChange={setPackageData} />}
        {step === 3 && <PricingStep data={packageData} onChange={setPackageData} />}
        {step === 4 && <BoardingPointsStep data={packageData} onChange={setPackageData} />}
        {step === 5 && <MealsStep data={packageData} onChange={setPackageData} />}
        {step === 6 && <PoliciesStep data={packageData} onChange={setPackageData} />}
        {step === 7 && <ReviewStep data={packageData} onSubmit={handleSubmit} />}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="px-6 py-3 border-2 border-primary-500 text-primary-500 rounded-xl font-semibold disabled:opacity-50"
        >
          ← পূর্ববর্তী
        </button>
        <button
          onClick={() => step < 7 ? setStep(s => s + 1) : handleSubmit()}
          className="px-6 py-3 bg-gradient-festive text-white rounded-xl font-semibold"
        >
          {step < 7 ? 'পরবর্তী →' : 'প্যাকেজ তৈরি করুন'}
        </button>
      </div>
    </div>
  );
};
```

---

## 🚌 Seat Booking System

### Bus Seat Layout Component

```typescript
// components/booking/BusSeatLayout.tsx
interface BusSeatLayoutProps {
  layout: VehicleLayout;
  bookedSeats: string[];
  selectedSeats: string[];
  onSeatSelect: (seatNumber: string) => void;
}

const BusSeatLayout: React.FC<BusSeatLayoutProps> = ({
  layout,
  bookedSeats,
  selectedSeats,
  onSeatSelect
}) => {
  const getSeatStatus = (seatNumber: string): 'available' | 'booked' | 'selected' => {
    if (bookedSeats.includes(seatNumber)) return 'booked';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    return 'available';
  };
  
  const renderSeat = (seat: SeatPosition) => {
    const status = getSeatStatus(seat.seatNumber);
    
    if (seat.type === 'door' || seat.type === 'aisle' || seat.type === 'driver') {
      return (
        <div
          key={seat.seatNumber}
          className="w-12 h-12 flex items-center justify-center text-sand-400 text-xs"
        >
          {seat.type === 'driver' && '🚗'}
          {seat.type === 'door' && '🚪'}
        </div>
      );
    }
    
    return (
      <button
        key={seat.seatNumber}
        onClick={() => status !== 'booked' && onSeatSelect(seat.seatNumber)}
        disabled={status === 'booked'}
        className={`
          w-12 h-12 rounded-lg flex flex-col items-center justify-center
          transition-all duration-200 border-2
          ${status === 'available' 
            ? 'bg-white border-sand-300 hover:border-primary-500 hover:shadow-card cursor-pointer' 
            : ''}
          ${status === 'booked' 
            ? 'bg-danger-500/20 border-danger-300 cursor-not-allowed' 
            : ''}
          ${status === 'selected' 
            ? 'bg-success-500 border-success-600 text-white shadow-card' 
            : ''}
        `}
      >
        {/* Seat Icon */}
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 18v3h3v-3h10v3h3v-3h1a1 1 0 0 0 1-1V8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v9a1 1 0 0 0 1 1h1z"/>
        </svg>
        <span className="text-xs font-medium mt-0.5">{seat.seatNumber}</span>
      </button>
    );
  };
  
  if (layout.type === VehicleType.SLEEPER_COACH) {
    return (
      <div className="space-y-8">
        {/* Lower Deck */}
        <div className="bg-gradient-to-b from-sand-100 to-white rounded-2xl p-6">
          <div className="bg-danger-500 text-white text-center py-2 rounded-t-xl font-semibold mb-4">
            Lower Deck
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${layout.lowerDeckLayout?.columns || 3}, 1fr)` }}>
            {layout.lowerDeckLayout?.seatPositions.map(renderSeat)}
          </div>
        </div>
        
        {/* Upper Deck */}
        {layout.hasUpperDeck && (
          <div className="bg-gradient-to-b from-sand-100 to-white rounded-2xl p-6">
            <div className="bg-danger-500 text-white text-center py-2 rounded-t-xl font-semibold mb-4">
              Upper Deck
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${layout.upperDeckLayout?.columns || 3}, 1fr)` }}>
              {layout.upperDeckLayout?.seatPositions.map(renderSeat)}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Regular bus layout
  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="bg-sand-800 text-white text-center py-2 rounded-t-xl font-semibold mb-4">
        Driver
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${layout.seatsPerRow || 4}, 1fr)` }}>
        {/* Generate seat grid */}
      </div>
    </div>
  );
};
```

### Seat Information Panel

```typescript
// components/booking/SeatInfoPanel.tsx
interface SeatInfoPanelProps {
  selectedSeats: SeatPosition[];
  pricing: PackagePricing;
  boardingPoints: BoardingPoint[];
  droppingPoints: DroppingPoint[];
  onBook: () => void;
}

const SeatInfoPanel: React.FC<SeatInfoPanelProps> = ({
  selectedSeats,
  pricing,
  boardingPoints,
  droppingPoints,
  onBook
}) => {
  const [boardingPoint, setBoardingPoint] = useState('');
  const [droppingPoint, setDroppingPoint] = useState('');
  
  const baseFare = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const platformFee = pricing.platformFee;
  const paymentFee = pricing.paymentFee;
  const totalDiscount = platformFee + paymentFee;
  const totalFare = baseFare;
  
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 sticky top-4">
      {/* Boarding Point */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-sand-600 mb-2">
          Boarding Point*
        </label>
        <select
          value={boardingPoint}
          onChange={(e) => setBoardingPoint(e.target.value)}
          className="w-full px-4 py-3 border-2 border-sand-200 rounded-xl focus:border-primary-500"
        >
          <option value="">Select boarding point</option>
          {boardingPoints.map(bp => (
            <option key={bp.id} value={bp.id}>{bp.nameBn} ({bp.time})</option>
          ))}
        </select>
      </div>
      
      {/* Dropping Point */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-sand-600 mb-2">
          Dropping Point*
        </label>
        <select
          value={droppingPoint}
          onChange={(e) => setDroppingPoint(e.target.value)}
          className="w-full px-4 py-3 border-2 border-sand-200 rounded-xl focus:border-primary-500"
        >
          <option value="">Select dropping point</option>
          {droppingPoints.map(dp => (
            <option key={dp.id} value={dp.id}>{dp.nameBn}</option>
          ))}
        </select>
      </div>
      
      {/* Seat Information */}
      <div className="border-t border-sand-200 pt-4">
        <h3 className="font-semibold text-danger-500 mb-3">SEAT INFORMATION:</h3>
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200">
            <tr>
              <th className="text-left py-2">Seats</th>
              <th className="text-left py-2">Class</th>
              <th className="text-right py-2">Fare</th>
            </tr>
          </thead>
          <tbody>
            {selectedSeats.map(seat => (
              <tr key={seat.seatNumber} className="border-b border-sand-100">
                <td className="py-2">{seat.seatNumber}</td>
                <td className="py-2">{seat.class}</td>
                <td className="py-2 text-right">৳ {seat.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Price Breakdown */}
      <div className="mt-4 p-4 bg-sand-50 rounded-xl text-sm">
        <div className="flex justify-between mb-2">
          <span>Seat Fare:</span>
          <span>৳ {baseFare} <span className="text-success-500">(-৳ {platformFee + paymentFee})</span></span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Platform Fee:</span>
          <span>৳ {platformFee} <span className="text-success-500">(-৳ {platformFee})</span></span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Payment Fee:</span>
          <span>৳ {paymentFee} <span className="text-success-500">(-৳ {paymentFee})</span></span>
        </div>
        <div className="flex justify-between font-semibold text-success-500">
          <span>Total Discount:</span>
          <span>-৳ {totalDiscount}</span>
        </div>
      </div>
      
      {/* Submit Button */}
      <button
        onClick={onBook}
        disabled={!boardingPoint || !droppingPoint || selectedSeats.length === 0}
        className="w-full mt-4 py-4 bg-danger-500 hover:bg-danger-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
      >
        Submit
      </button>
    </div>
  );
};
```

---

## 💬 Messaging Integration

### WhatsApp Integration (Using Evolution API or Baileys)

```typescript
// services/whatsapp.ts
import { io, Socket } from 'socket.io-client';

class WhatsAppService {
  private socket: Socket | null = null;
  private qrCode: string | null = null;
  private connected: boolean = false;
  
  async connect(sessionId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket = io('YOUR_WHATSAPP_API_URL', {
        query: { sessionId }
      });
      
      this.socket.on('qr', (qr: string) => {
        this.qrCode = qr;
        resolve(qr);
      });
      
      this.socket.on('authenticated', () => {
        this.connected = true;
      });
      
      this.socket.on('error', reject);
    });
  }
  
  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.socket || !this.connected) {
      throw new Error('WhatsApp not connected');
    }
    
    this.socket.emit('sendMessage', { to, message });
  }
  
  async sendMedia(to: string, mediaUrl: string, caption?: string): Promise<void> {
    if (!this.socket || !this.connected) {
      throw new Error('WhatsApp not connected');
    }
    
    this.socket.emit('sendMedia', { to, mediaUrl, caption });
  }
  
  onMessage(callback: (message: WhatsAppMessage) => void): void {
    this.socket?.on('message', callback);
  }
  
  // Typing indicator
  async setTyping(chatId: string, isTyping: boolean): Promise<void> {
    this.socket?.emit('setTyping', { chatId, isTyping });
  }
}

export const whatsappService = new WhatsAppService();
```

### Facebook Messenger Integration

```typescript
// services/messenger.ts
import axios from 'axios';

class MessengerService {
  private pageAccessToken: string;
  private pageId: string;
  
  constructor(config: { pageAccessToken: string; pageId: string }) {
    this.pageAccessToken = config.pageAccessToken;
    this.pageId = config.pageId;
  }
  
  async sendMessage(recipientId: string, message: string): Promise<void> {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text: message }
      },
      {
        params: { access_token: this.pageAccessToken }
      }
    );
  }
  
  async sendAttachment(recipientId: string, type: 'image' | 'file', url: string): Promise<void> {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages`,
      {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type,
            payload: { url, is_reusable: true }
          }
        }
      },
      {
        params: { access_token: this.pageAccessToken }
      }
    );
  }
  
  // Typing indicator
  async setTypingIndicator(recipientId: string, isTyping: boolean): Promise<void> {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages`,
      {
        recipient: { id: recipientId },
        sender_action: isTyping ? 'typing_on' : 'typing_off'
      },
      {
        params: { access_token: this.pageAccessToken }
      }
    );
  }
}

export const messengerService = new MessengerService({
  pageAccessToken: process.env.REACT_APP_FB_PAGE_TOKEN!,
  pageId: process.env.REACT_APP_FB_PAGE_ID!
});
```

### Shared Inbox Component

```typescript
// components/messaging/SharedInbox.tsx
interface Message {
  id: string;
  platform: 'whatsapp' | 'messenger';
  senderId: string;
  senderName: string;
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
  isIncoming: boolean;
}

interface Conversation {
  id: string;
  platform: 'whatsapp' | 'messenger';
  customerName: string;
  customerPhone?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  assignedAgent?: string;
  isAgentTyping?: boolean;
  typingAgentName?: string;
}

const SharedInbox: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'whatsapp1' | 'whatsapp2' | 'messenger'>('whatsapp1');
  
  // Real-time listener for "agent is typing"
  useEffect(() => {
    if (!selectedConversation) return;
    
    const unsubscribe = onSnapshot(
      doc(db, 'conversations', selectedConversation.id),
      (doc) => {
        const data = doc.data();
        if (data?.isAgentTyping && data?.typingAgentId !== currentUser.uid) {
          setSelectedConversation(prev => prev ? {
            ...prev,
            isAgentTyping: true,
            typingAgentName: data.typingAgentName
          } : null);
        }
      }
    );
    
    return () => unsubscribe();
  }, [selectedConversation?.id]);
  
  const handleTyping = async () => {
    if (!selectedConversation) return;
    
    await updateDoc(doc(db, 'conversations', selectedConversation.id), {
      isAgentTyping: true,
      typingAgentId: currentUser.uid,
      typingAgentName: currentUser.displayName
    });
    
    // Clear typing indicator after 3 seconds
    setTimeout(async () => {
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        isAgentTyping: false,
        typingAgentId: null,
        typingAgentName: null
      });
    }, 3000);
  };
  
  return (
    <div className="flex h-screen bg-sand-50">
      {/* Platform Tabs */}
      <div className="w-16 bg-sand-900 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={() => setActiveTab('whatsapp1')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            activeTab === 'whatsapp1' ? 'bg-success-500' : 'bg-sand-700 hover:bg-sand-600'
          }`}
        >
          <span className="text-2xl">📱</span>
        </button>
        <button
          onClick={() => setActiveTab('whatsapp2')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            activeTab === 'whatsapp2' ? 'bg-success-500' : 'bg-sand-700 hover:bg-sand-600'
          }`}
        >
          <span className="text-2xl">📱</span>
        </button>
        <button
          onClick={() => setActiveTab('messenger')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            activeTab === 'messenger' ? 'bg-secondary-500' : 'bg-sand-700 hover:bg-sand-600'
          }`}
        >
          <span className="text-2xl">💬</span>
        </button>
      </div>
      
      {/* Conversation List */}
      <div className="w-80 bg-white border-r border-sand-200 overflow-y-auto">
        <div className="p-4 border-b border-sand-200">
          <h2 className="font-semibold text-lg">
            {activeTab.includes('whatsapp') ? 'WhatsApp' : 'Messenger'}
          </h2>
        </div>
        {conversations
          .filter(c => c.platform === (activeTab.includes('whatsapp') ? 'whatsapp' : 'messenger'))
          .map(conv => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`p-4 border-b border-sand-100 cursor-pointer hover:bg-sand-50 ${
                selectedConversation?.id === conv.id ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{conv.customerName}</span>
                {conv.unreadCount > 0 && (
                  <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-sand-500 truncate">{conv.lastMessage}</p>
              {conv.isAgentTyping && (
                <p className="text-xs text-success-500 mt-1">
                  {conv.typingAgentName} is replying...
                </p>
              )}
            </div>
          ))}
      </div>
      
      {/* Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b border-sand-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedConversation.customerName}</h3>
                <p className="text-sm text-sand-500">{selectedConversation.customerPhone}</p>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isIncoming ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-md rounded-2xl px-4 py-2 ${
                    msg.isIncoming 
                      ? 'bg-white shadow-card' 
                      : 'bg-primary-500 text-white'
                  }`}>
                    <p>{msg.content}</p>
                    {msg.attachments?.map(att => (
                      <img key={att.id} src={att.url} className="mt-2 rounded-lg max-w-xs" />
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {selectedConversation.isAgentTyping && (
                <div className="flex items-center text-sand-500 text-sm">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-2 h-2 bg-sand-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-sand-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-sand-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  {selectedConversation.typingAgentName} is replying...
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-4 bg-white border-t border-sand-200">
              <div className="flex items-center space-x-3">
                <button className="p-2 hover:bg-sand-100 rounded-lg">
                  📎
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border-2 border-sand-200 rounded-xl focus:border-primary-500"
                />
                <button className="p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600">
                  ➤
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sand-400">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 📄 PDF Generation

### Guest List PDF

```typescript
// utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateGuestListPDF = (bookings: Booking[], packageInfo: TourPackage) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(249, 115, 22); // Primary orange
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(packageInfo.nameBn, 105, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`যাত্রার তারিখ: ${format(packageInfo.departureDate.toDate(), 'dd MMM yyyy')}`, 105, 25, { align: 'center' });
  doc.text(`মোট যাত্রী: ${bookings.length}`, 105, 35, { align: 'center' });
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  // Guest Table
  const tableData = bookings.map((booking, index) => [
    index + 1,
    booking.bookingId,
    booking.guestName,
    booking.phone,
    booking.seatNumbers.join(', '),
    booking.boardingPoint,
    `৳${booking.totalAmount}`,
    `৳${booking.paidAmount}`,
    `৳${booking.dueAmount}`,
    booking.bookedBy
  ]);
  
  (doc as any).autoTable({
    startY: 50,
    head: [['#', 'Booking ID', 'নাম', 'ফোন', 'সিট', 'বোর্ডিং', 'মোট', 'পরিশোধিত', 'বাকি', 'বুক করেছেন']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [249, 115, 22], textColor: 255 },
    alternateRowStyles: { fillColor: [254, 243, 199] },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} | Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
      105,
      290,
      { align: 'center' }
    );
  }
  
  return doc.save(`Guest_List_${packageInfo.id}.pdf`);
};
```

### Invoice PDF

```typescript
// utils/invoiceGenerator.ts
export const generateInvoicePDF = (booking: Booking, packageInfo: TourPackage, agencyInfo: Agency) => {
  const doc = new jsPDF();
  
  // Agency Header with Logo
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Agency Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text(agencyInfo.nameBn, 20, 20);
  doc.setFontSize(10);
  doc.text(agencyInfo.address, 20, 30);
  doc.text(`📞 ${agencyInfo.phone} | ✉️ ${agencyInfo.email}`, 20, 38);
  
  // Invoice Title
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(130, 55, 60, 25, 3, 3, 'F');
  doc.setTextColor(249, 115, 22);
  doc.setFontSize(18);
  doc.text('INVOICE', 160, 70, { align: 'center' });
  
  // Booking Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  
  let y = 90;
  doc.text(`Booking ID: ${booking.bookingId}`, 20, y);
  doc.text(`Date: ${format(booking.createdAt.toDate(), 'dd MMM yyyy')}`, 140, y);
  
  y += 15;
  doc.setFontSize(14);
  doc.text('Guest Information', 20, y);
  doc.line(20, y + 2, 190, y + 2);
  
  y += 10;
  doc.setFontSize(11);
  doc.text(`Name: ${booking.guestName}`, 20, y);
  doc.text(`Phone: ${booking.phone}`, 120, y);
  
  y += 8;
  doc.text(`Email: ${booking.email || 'N/A'}`, 20, y);
  
  // Package Details
  y += 15;
  doc.setFontSize(14);
  doc.text('Package Details', 20, y);
  doc.line(20, y + 2, 190, y + 2);
  
  y += 10;
  doc.setFontSize(11);
  doc.text(`Package: ${packageInfo.nameBn}`, 20, y);
  y += 8;
  doc.text(`Destination: ${packageInfo.destinationBn}`, 20, y);
  y += 8;
  doc.text(`Travel Date: ${format(packageInfo.departureDate.toDate(), 'dd MMM yyyy')}`, 20, y);
  y += 8;
  doc.text(`Seat(s): ${booking.seatNumbers.join(', ')}`, 20, y);
  y += 8;
  doc.text(`Boarding: ${booking.boardingPoint}`, 20, y);
  
  // Payment Details
  y += 15;
  doc.setFillColor(254, 243, 199);
  doc.rect(15, y - 5, 180, 50, 'F');
  
  doc.setFontSize(14);
  doc.text('Payment Summary', 20, y + 5);
  
  y += 15;
  doc.setFontSize(11);
  doc.text('Seat Fare:', 25, y);
  doc.text(`৳ ${booking.seatFare}`, 170, y, { align: 'right' });
  
  y += 8;
  doc.text('Discount:', 25, y);
  doc.setTextColor(34, 197, 94);
  doc.text(`- ৳ ${booking.discount}`, 170, y, { align: 'right' });
  
  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.text('Total Amount:', 25, y);
  doc.setFontSize(13);
  doc.text(`৳ ${booking.totalAmount}`, 170, y, { align: 'right' });
  
  y += 10;
  doc.setFontSize(11);
  doc.text('Paid Amount:', 25, y);
  doc.setTextColor(34, 197, 94);
  doc.text(`৳ ${booking.paidAmount}`, 170, y, { align: 'right' });
  
  y += 8;
  doc.setTextColor(239, 68, 68);
  doc.text('Due Amount:', 25, y);
  doc.text(`৳ ${booking.dueAmount}`, 170, y, { align: 'right' });
  
  // Terms & Conditions
  y += 25;
  doc.setTextColor(120, 113, 108);
  doc.setFontSize(9);
  doc.text('Terms & Conditions:', 20, y);
  y += 6;
  doc.text('• Remaining amount must be paid before departure.', 20, y);
  y += 5;
  doc.text('• No refund after seat confirmation without replacement.', 20, y);
  y += 5;
  doc.text('• Please arrive at boarding point 30 minutes before departure.', 20, y);
  
  // Footer
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 277, 210, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Thank you for choosing us! Have a safe journey! 🌴', 105, 288, { align: 'center' });
  
  return doc.save(`Invoice_${booking.bookingId}.pdf`);
};
```

---

## 🔍 Search & Unique ID System

### 6-Digit Booking ID Generator

```typescript
// utils/bookingId.ts
export const generateBookingId = async (db: Firestore, agencyId: string): Promise<string> => {
  const counterRef = doc(db, 'agencies', agencyId, 'settings', 'bookingCounter');
  
  return runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let currentCount = counterDoc.exists() ? counterDoc.data()?.count || 0 : 0;
    currentCount++;
    
    // Format as 6-digit with leading zeros
    const bookingId = String(currentCount).padStart(6, '0');
    
    transaction.set(counterRef, { count: currentCount }, { merge: true });
    
    return bookingId;
  });
};

// Usage
const newBookingId = await generateBookingId(db, agencyId);
// Returns: "000001", "000002", etc.
```

### Quick Search Component

```typescript
// components/shared/QuickSearch.tsx
const QuickSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    
    // Search by booking ID
    if (/^\d{6}$/.test(searchQuery)) {
      const bookingQuery = query(
        collectionGroup(db, 'bookings'),
        where('bookingId', '==', searchQuery)
      );
      const snapshot = await getDocs(bookingQuery);
      setResults(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    }
    // Search by phone number
    else if (/^01\d{9}$/.test(searchQuery)) {
      const bookingQuery = query(
        collectionGroup(db, 'bookings'),
        where('phone', '==', searchQuery)
      );
      const snapshot = await getDocs(bookingQuery);
      setResults(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    }
    // Search by name
    else {
      const bookingQuery = query(
        collectionGroup(db, 'bookings'),
        where('guestNameLower', '>=', searchQuery.toLowerCase()),
        where('guestNameLower', '<=', searchQuery.toLowerCase() + '\uf8ff')
      );
      const snapshot = await getDocs(bookingQuery);
      setResults(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    }
    
    setLoading(false);
  };
  
  return (
    <div className="relative">
      <div className="flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by Booking ID, Phone, or Name..."
          className="w-full px-4 py-3 pl-12 border-2 border-sand-200 rounded-xl focus:border-primary-500"
        />
        <span className="absolute left-4 text-sand-400">🔍</span>
        <button
          onClick={handleSearch}
          className="ml-3 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600"
        >
          Search
        </button>
      </div>
      
      {/* Results Dropdown */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-card max-h-80 overflow-y-auto z-50">
          {results.map(booking => (
            <div
              key={booking.id}
              className="p-4 border-b border-sand-100 hover:bg-sand-50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-primary-500 font-semibold">
                    #{booking.bookingId}
                  </span>
                  <span className="ml-3 font-medium">{booking.guestName}</span>
                </div>
                <span className="text-sm text-sand-500">{booking.phone}</span>
              </div>
              <p className="text-sm text-sand-500 mt-1">
                Seats: {booking.seatNumbers.join(', ')} | {booking.packageName}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 📱 Mobile Responsiveness

### Responsive Layout Patterns

```typescript
// components/layouts/ResponsiveLayout.tsx
const ResponsiveLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <div className="min-h-screen bg-sand-50">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white shadow-card">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2">
            ☰
          </button>
          <h1 className="font-bold text-primary-500">BD Tour Connect</h1>
          <button className="p-2">🔔</button>
        </div>
      </header>
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white shadow-card">
        <nav className="p-4 space-y-2">
          {/* Navigation items */}
        </nav>
      </aside>
      
      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white">
            <nav className="p-4 space-y-2">
              {/* Same navigation items */}
            </nav>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-card border-t border-sand-200">
        <div className="flex items-center justify-around py-3">
          <NavLink to="/dashboard" icon="🏠" label="Home" />
          <NavLink to="/bookings" icon="📋" label="Bookings" />
          <NavLink to="/packages" icon="📦" label="Packages" />
          <NavLink to="/messages" icon="💬" label="Messages" />
          <NavLink to="/profile" icon="👤" label="Profile" />
        </div>
      </nav>
    </div>
  );
};
```

---

## 🚀 Deployment Instructions

### GitHub Pages Deployment

```bash
# Install gh-pages
npm install gh-pages --save-dev

# Add to package.json
"homepage": "https://[username].github.io/bd-tour-connect",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}

# Deploy
npm run deploy
```

### Firebase Hosting (Alternative)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Firebase Functions Deployment

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

---

## 📝 Important Notes for Claude Code

1. **Always use TypeScript** for type safety
2. **Follow the color palette** defined in the design system
3. **Make everything responsive** - mobile-first approach
4. **Bengali language support** - use `font-bengali` class
5. **Real-time updates** - use Firestore onSnapshot listeners
6. **Error handling** - wrap async operations in try-catch
7. **Loading states** - show skeleton loaders during data fetch
8. **Toast notifications** - use react-hot-toast for user feedback
9. **Form validation** - validate before submission
10. **Security rules** - implement Firestore security rules

---

## 🎯 Development Priorities

### Phase 1: Core System
1. Authentication & user management
2. Agency CRUD operations
3. Package creation wizard
4. Basic seat booking

### Phase 2: Booking System
1. Visual seat layout
2. Booking form
3. Payment tracking
4. Invoice generation

### Phase 3: Communication
1. WhatsApp integration
2. Facebook Messenger integration
3. Shared inbox

### Phase 4: Reports & Polish
1. PDF exports
2. Dashboard analytics
3. Mobile optimization
4. Performance optimization

---

*Last Updated: January 2026*
