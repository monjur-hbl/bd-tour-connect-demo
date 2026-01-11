# 🛠️ Claude Code Development Instructions

## BD Tour Connect - Complete Implementation Guide

This document provides comprehensive instructions for building the BD Tour Connect travel booking portal.

---

## 📋 Table of Contents

1. [Project Initialization](#1-project-initialization)
2. [Architecture Overview](#2-architecture-overview)
3. [Design System](#3-design-system)
4. [Authentication Flow](#4-authentication-flow)
5. [Package Management](#5-package-management)
6. [Seat Booking System](#6-seat-booking-system)
7. [Messaging Integration](#7-messaging-integration)
8. [PDF Generation](#8-pdf-generation)
9. [Search & Booking ID](#9-search--booking-id)
10. [Mobile Responsiveness](#10-mobile-responsiveness)

---

## 1. Project Initialization

### 1.1 Create Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login
firebase init
```

**Firebase Services to Enable:**
- Authentication (Email/Password - we convert phone to email format)
- Cloud Firestore
- Cloud Functions
- Cloud Storage
- Hosting

### 1.2 Initialize React Project

```bash
npx create-react-app bd-tour-connect --template typescript
cd bd-tour-connect
npm install
```

### 1.3 Install Dependencies

```bash
# Core
npm install firebase react-router-dom zustand axios date-fns

# UI Components
npm install @headlessui/react @heroicons/react

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# PDF Generation
npm install jspdf jspdf-autotable html2canvas

# Real-time & Messaging
npm install socket.io-client

# Utilities
npm install clsx tailwind-merge react-hot-toast qrcode.react recharts
```

### 1.4 Tailwind CSS Setup

```bash
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography
npx tailwindcss init -p
```

---

## 2. Architecture Overview

### 2.1 Folder Structure

```
src/
├── components/
│   ├── common/          # Buttons, Cards, Inputs, Modals
│   ├── layout/          # Sidebar, Header, BottomNav
│   ├── booking/         # SeatLayout, GuestForm, PaymentForm
│   ├── package/         # PackageCard, PackageWizard
│   ├── messaging/       # ChatWindow, ConversationList
│   └── pdf/             # InvoiceGenerator, GuestListGenerator
├── pages/
│   ├── auth/            # Login, Register
│   ├── admin/           # System admin pages
│   ├── agency/          # Agency owner pages
│   └── agent/           # Sales agent pages
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── services/            # Firebase & API services
├── utils/               # Helper functions
├── configs/             # Seat layouts, constants
└── types/               # TypeScript interfaces
```

### 2.2 Multi-Tenant Firestore Structure

```
agencies/{agencyId}/
├── owners/{ownerId}
├── agents/{agentId}
├── packages/{packageId}/
│   └── bookings/{bookingId}
├── vehicles/{vehicleId}
├── boardingPoints/{pointId}
├── droppingPoints/{pointId}
└── settings/

conversations/{conversationId}/
└── messages/{messageId}

systemAdmins/{adminId}
```

---

## 3. Design System

### 3.1 Color Palette

```typescript
// src/configs/colors.ts
export const colors = {
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',  // Main - Sunset Orange
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  secondary: {
    500: '#3B82F6',  // Ocean Blue
    600: '#2563EB',
  },
  accent: {
    500: '#14B8A6',  // Tropical Teal
    600: '#0D9488',
  },
  success: { 500: '#22C55E' },
  warning: { 500: '#F59E0B' },
  danger: { 500: '#EF4444' },
};
```

### 3.2 Typography

```css
/* Bengali Font Import */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
```

### 3.3 Component Examples

#### Primary Button
```tsx
// src/components/common/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25 hover:shadow-lg hover:from-primary-600 hover:to-primary-700',
    secondary: 'bg-white border-2 border-primary-500 text-primary-600 hover:bg-primary-50',
    ghost: 'text-primary-600 hover:bg-primary-50',
    danger: 'bg-gradient-to-r from-danger-500 to-danger-600 text-white',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### Input Field
```tsx
// src/components/common/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelBn?: string;
  error?: string;
}

export function Input({ label, labelBn, error, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-sand-700">
          {label}
          {labelBn && <span className="ml-2 font-bengali text-sand-500">({labelBn})</span>}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200
          ${error 
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/10' 
            : 'border-sand-200 focus:border-primary-500 focus:ring-primary-500/10'
          }
          focus:ring-4 placeholder:text-sand-400`}
        {...props}
      />
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  );
}
```

---

## 4. Authentication Flow

### 4.1 Phone to Email Conversion

Since Firebase Auth doesn't directly support phone+password, convert phone to email format:

```typescript
// src/utils/auth.ts
export function phoneToEmail(phone: string): string {
  // Remove +88 or 88 prefix if present
  const cleanPhone = phone.replace(/^(\+88|88)/, '');
  return `${cleanPhone}@bdtourconnect.com`;
}

export function emailToPhone(email: string): string {
  return email.replace('@bdtourconnect.com', '');
}
```

### 4.2 Login Implementation

```typescript
// src/services/authService.ts
import { signInWithEmailAndPassword, getIdTokenResult } from 'firebase/auth';
import { auth } from './firebase';
import { phoneToEmail } from '../utils/auth';

export async function login(phone: string, password: string) {
  const email = phoneToEmail(phone);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Get custom claims for role
  const tokenResult = await getIdTokenResult(userCredential.user);
  const { role, agencyId, permissions } = tokenResult.claims;
  
  return {
    user: userCredential.user,
    role,
    agencyId,
    permissions
  };
}
```

### 4.3 Role-Based Routing

```tsx
// src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('system_admin' | 'agency_owner' | 'sales_agent')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuthStore();
  const location = useLocation();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
}
```

### 4.4 Custom Claims Setup (Cloud Function)

```typescript
// functions/src/auth/setCustomClaims.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const setUserClaims = functions.https.onCall(async (data, context) => {
  // Verify caller is system admin
  if (!context.auth?.token.role || context.auth.token.role !== 'system_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only system admins can set claims');
  }
  
  const { uid, role, agencyId, permissions } = data;
  
  await admin.auth().setCustomUserClaims(uid, {
    role,
    agencyId,
    permissions
  });
  
  return { success: true };
});
```

---

## 5. Package Management

### 5.1 Package Status Logic

```typescript
// src/utils/packageStatus.ts
export type PackageStatus = 'current' | 'future' | 'past';

export function getPackageStatus(departureDate: Date, returnDate: Date): PackageStatus {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const departure = new Date(departureDate);
  const returnD = new Date(returnDate);
  
  if (returnD < today) return 'past';
  if (departure > today) return 'future';
  return 'current';  // Departure passed but return hasn't - currently running
}
```

### 5.2 Package Creation Wizard Steps

```tsx
// src/components/package/PackageWizard.tsx
const WIZARD_STEPS = [
  { id: 'basic', title: 'Basic Info', titleBn: 'প্রাথমিক তথ্য' },
  { id: 'schedule', title: 'Schedule', titleBn: 'সময়সূচী' },
  { id: 'vehicle', title: 'Vehicle', titleBn: 'যানবাহন' },
  { id: 'pricing', title: 'Pricing', titleBn: 'মূল্য' },
  { id: 'boarding', title: 'Boarding Points', titleBn: 'বোর্ডিং পয়েন্ট' },
  { id: 'meals', title: 'Meals', titleBn: 'খাবার' },
  { id: 'policies', title: 'Policies', titleBn: 'নীতিমালা' },
];
```

### 5.3 Meal Planning Component

```tsx
// src/components/package/MealPlanEditor.tsx
interface MealDay {
  dayNumber: number;
  date: string;
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

function MealPlanEditor({ days, onChange }: MealPlanEditorProps) {
  return (
    <div className="space-y-6">
      {days.map((day, index) => (
        <div key={day.dayNumber} className="card p-6">
          <h3 className="heading-sm mb-4">
            Day {day.dayNumber} <span className="font-bengali">দিন {toBengaliNumber(day.dayNumber)}</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MealToggle 
              label="Breakfast" 
              labelBn="সকালের নাস্তা"
              meal={day.meals.breakfast}
              onChange={(meal) => updateMeal(index, 'breakfast', meal)}
            />
            <MealToggle 
              label="Lunch" 
              labelBn="দুপুরের খাবার"
              meal={day.meals.lunch}
              onChange={(meal) => updateMeal(index, 'lunch', meal)}
            />
            <MealToggle 
              label="Evening Snack" 
              labelBn="বিকালের নাস্তা"
              meal={day.meals.eveningSnack}
              onChange={(meal) => updateMeal(index, 'eveningSnack', meal)}
            />
            <MealToggle 
              label="Dinner" 
              labelBn="রাতের খাবার"
              meal={day.meals.dinner}
              onChange={(meal) => updateMeal(index, 'dinner', meal)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 6. Seat Booking System

### 6.1 Seat Layout Component

```tsx
// src/components/booking/BusSeatLayout.tsx
interface SeatLayoutProps {
  layout: VehicleLayout;
  bookedSeats: string[];
  selectedSeats: string[];
  onSeatSelect: (seatNumber: string) => void;
}

export function BusSeatLayout({ layout, bookedSeats, selectedSeats, onSeatSelect }: SeatLayoutProps) {
  const getSeatStatus = (seatNumber: string): SeatStatus => {
    if (bookedSeats.includes(seatNumber)) return 'booked';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    return 'available';
  };
  
  return (
    <div className="space-y-8">
      {/* Seat Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        <LegendItem color="bg-accent-500" label="Available" labelBn="খালি" />
        <LegendItem color="bg-primary-500" label="Selected" labelBn="নির্বাচিত" />
        <LegendItem color="bg-sand-400" label="Booked" labelBn="বুকড" />
        <LegendItem color="bg-pink-400" label="Women Only" labelBn="মহিলা" />
      </div>
      
      {/* Lower Deck */}
      {layout.lowerDeck && (
        <DeckLayout
          deck={layout.lowerDeck}
          getSeatStatus={getSeatStatus}
          onSeatSelect={onSeatSelect}
        />
      )}
      
      {/* Upper Deck (for sleeper) */}
      {layout.upperDeck && (
        <DeckLayout
          deck={layout.upperDeck}
          getSeatStatus={getSeatStatus}
          onSeatSelect={onSeatSelect}
        />
      )}
    </div>
  );
}
```

### 6.2 Individual Seat Button

```tsx
// src/components/booking/SeatButton.tsx
const seatStyles = {
  available: 'bg-accent-500 hover:bg-accent-600 text-white cursor-pointer',
  selected: 'bg-primary-500 hover:bg-primary-600 text-white cursor-pointer ring-2 ring-primary-300',
  booked: 'bg-sand-400 text-sand-600 cursor-not-allowed',
  women: 'bg-pink-400 hover:bg-pink-500 text-white cursor-pointer',
};

export function SeatButton({ seat, status, onSelect }: SeatButtonProps) {
  if (seat.type === 'aisle' || seat.type === 'empty') {
    return <div className="w-12 h-12" />;
  }
  
  if (seat.type === 'driver') {
    return (
      <div className="w-12 h-12 bg-sand-200 rounded-lg flex items-center justify-center">
        🚗
      </div>
    );
  }
  
  if (seat.type === 'door') {
    return (
      <div className="w-12 h-12 bg-sand-100 rounded-lg flex items-center justify-center border-2 border-dashed border-sand-300">
        🚪
      </div>
    );
  }
  
  return (
    <button
      onClick={() => status !== 'booked' && onSelect(seat.seatNumber)}
      disabled={status === 'booked'}
      className={`w-12 h-12 rounded-lg font-semibold text-sm transition-all ${seatStyles[status]}`}
    >
      {seat.seatNumber.split('-').pop()}
    </button>
  );
}
```

### 6.3 Booking Summary Panel

```tsx
// src/components/booking/BookingSummary.tsx
export function BookingSummary({ selectedSeats, pricing, packageInfo }: BookingSummaryProps) {
  const seatFare = selectedSeats.reduce((total, seat) => {
    return total + getSeatPrice(seat, pricing);
  }, 0);
  
  const discount = pricing.platformFee + pricing.paymentFee;
  const totalAmount = seatFare;
  const advanceRequired = pricing.advanceAmount * selectedSeats.length;
  
  return (
    <div className="card p-6 sticky top-4">
      <h3 className="heading-md mb-4">Booking Summary <span className="font-bengali">বুকিং সারাংশ</span></h3>
      
      {/* Selected Seats */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedSeats.map(seat => (
          <span key={seat} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
            {seat}
          </span>
        ))}
      </div>
      
      {/* Price Breakdown */}
      <div className="space-y-2 border-t border-sand-200 pt-4">
        <div className="flex justify-between">
          <span>Seat Fare ({selectedSeats.length} seats)</span>
          <span>৳{seatFare.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-success-600">
          <span>Discount</span>
          <span>-৳{discount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-sand-200 pt-2">
          <span>Total <span className="font-bengali">মোট</span></span>
          <span className="text-primary-600">৳{totalAmount.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Advance Payment */}
      <div className="mt-4 p-4 bg-warning-50 rounded-xl">
        <div className="flex justify-between items-center">
          <span className="text-warning-800">Advance Required <span className="font-bengali">অগ্রিম</span></span>
          <span className="font-bold text-warning-800">৳{advanceRequired.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Messaging Integration

### 7.1 WhatsApp QR Scanner Component

```tsx
// src/components/messaging/WhatsAppQRScanner.tsx
export function WhatsAppQRScanner({ instanceId, onConnected }: QRScannerProps) {
  const [status, setStatus] = useState<'loading' | 'waiting' | 'connected' | 'error'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await evolutionAPI.getConnectionStatus(instanceId);
        if (response.state === 'open') {
          setStatus('connected');
          onConnected();
        } else {
          // Get QR code
          const qr = await evolutionAPI.getQRCode(instanceId);
          setQrCode(qr.base64);
          setStatus('waiting');
        }
      } catch (error) {
        setStatus('error');
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, [instanceId]);
  
  return (
    <div className="card p-6 text-center">
      <h3 className="heading-md mb-4">
        Connect WhatsApp <span className="font-bengali">হোয়াটসঅ্যাপ সংযোগ</span>
      </h3>
      
      {status === 'loading' && <LoadingSpinner />}
      
      {status === 'waiting' && qrCode && (
        <div className="space-y-4">
          <img src={qrCode} alt="WhatsApp QR" className="mx-auto w-64 h-64" />
          <p className="text-sand-600">
            Scan with WhatsApp <span className="font-bengali">হোয়াটসঅ্যাপ দিয়ে স্ক্যান করুন</span>
          </p>
        </div>
      )}
      
      {status === 'connected' && (
        <div className="text-success-600">
          <CheckCircleIcon className="w-16 h-16 mx-auto mb-2" />
          <p>Connected! <span className="font-bengali">সংযুক্ত!</span></p>
        </div>
      )}
    </div>
  );
}
```

### 7.2 Typing Indicator Hook

```typescript
// src/hooks/useTypingIndicator.ts
export function useTypingIndicator(conversationId: string) {
  const { user } = useAuthStore();
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const startTyping = async () => {
    await updateDoc(doc(db, 'conversations', conversationId), {
      isAgentTyping: true,
      typingAgentId: user.uid,
      typingAgentName: user.name,
      typingStartedAt: serverTimestamp()
    });
    
    // Auto-stop after 5 seconds
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(stopTyping, 5000);
  };
  
  const stopTyping = async () => {
    await updateDoc(doc(db, 'conversations', conversationId), {
      isAgentTyping: false,
      typingAgentId: null,
      typingAgentName: null,
      typingStartedAt: null
    });
    clearTimeout(timeoutRef.current);
  };
  
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);
  
  return { startTyping, stopTyping };
}
```

### 7.3 Other Agent Typing Listener

```typescript
// src/hooks/useOtherAgentTyping.ts
export function useOtherAgentTyping(conversationId: string) {
  const { user } = useAuthStore();
  const [otherAgentTyping, setOtherAgentTyping] = useState<{
    isTyping: boolean;
    agentName: string | null;
  }>({ isTyping: false, agentName: null });
  
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'conversations', conversationId),
      (snapshot) => {
        const data = snapshot.data();
        if (data?.isAgentTyping && data.typingAgentId !== user.uid) {
          setOtherAgentTyping({
            isTyping: true,
            agentName: data.typingAgentName
          });
        } else {
          setOtherAgentTyping({ isTyping: false, agentName: null });
        }
      }
    );
    
    return unsubscribe;
  }, [conversationId, user.uid]);
  
  return otherAgentTyping;
}
```

### 7.4 Chat Window with Typing Indicator

```tsx
// src/components/messaging/ChatWindow.tsx
export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const { startTyping, stopTyping } = useTypingIndicator(conversationId);
  const otherAgent = useOtherAgentTyping(conversationId);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value) {
      startTyping();
    }
  };
  
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    await stopTyping();
    await sendMessage(conversationId, inputValue);
    setInputValue('');
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
      
      {/* Other Agent Typing Indicator */}
      {otherAgent.isTyping && (
        <div className="px-4 py-2 bg-warning-50 text-warning-800 text-sm">
          <span className="animate-pulse">●</span> {otherAgent.agentName} is replying...
          <span className="font-bengali ml-1">{otherAgent.agentName} উত্তর দিচ্ছেন...</span>
        </div>
      )}
      
      {/* Input */}
      <div className="p-4 border-t border-sand-200">
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={handleInputChange}
            onBlur={stopTyping}
            placeholder="Type a message..."
            className="input-field flex-1"
          />
          <Button onClick={handleSend}>Send</Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. PDF Generation

### 8.1 Invoice PDF Generator

```typescript
// src/services/pdfService.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function generateInvoicePDF(booking: Booking, agency: Agency): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header with gradient effect simulation
  doc.setFillColor(249, 115, 22); // Primary orange
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Agency Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(agency.name, 20, 25);
  
  // Invoice Title
  doc.setFontSize(12);
  doc.text(`Invoice #${booking.bookingId}`, pageWidth - 20, 25, { align: 'right' });
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  // Guest Info Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Guest Information', 20, 55);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${booking.guest.name}`, 20, 65);
  doc.text(`Phone: ${booking.guest.phone}`, 20, 72);
  doc.text(`Booking ID: ${booking.bookingId}`, 20, 79);
  
  // Package Info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Package Details', 20, 95);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Package: ${booking.package.name}`, 20, 105);
  doc.text(`Departure: ${formatDate(booking.package.departureDate)}`, 20, 112);
  doc.text(`Seats: ${booking.seats.join(', ')}`, 20, 119);
  doc.text(`Boarding: ${booking.boardingPoint.name} - ${booking.boardingPoint.time}`, 20, 126);
  
  // Payment Table
  doc.autoTable({
    startY: 140,
    head: [['Description', 'Amount']],
    body: [
      ['Seat Fare', `BDT ${booking.pricing.seatFare.toLocaleString()}`],
      ['Discount', `- BDT ${booking.pricing.discount.toLocaleString()}`],
      ['Total', `BDT ${booking.pricing.totalAmount.toLocaleString()}`],
      ['Advance Paid', `BDT ${booking.payment.advanceAmount.toLocaleString()}`],
      ['Due Amount', `BDT ${booking.payment.dueAmount.toLocaleString()}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] },
    styles: { fontSize: 11 },
  });
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for traveling with us!', pageWidth / 2, finalY, { align: 'center' });
  doc.text(agency.phone, pageWidth / 2, finalY + 7, { align: 'center' });
  
  return doc.output('blob');
}
```

### 8.2 Guest List PDF

```typescript
export async function generateGuestListPDF(
  bookings: Booking[], 
  packageInfo: Package, 
  agency: Agency
): Promise<Blob> {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(`Guest List - ${packageInfo.name}`, 15, 20);
  doc.setFontSize(10);
  doc.text(`Departure: ${formatDate(packageInfo.departureDate)}`, pageWidth - 15, 20, { align: 'right' });
  
  // Table
  doc.autoTable({
    startY: 40,
    head: [['#', 'Booking ID', 'Guest Name', 'Phone', 'Seats', 'Boarding', 'Total', 'Paid', 'Due', 'Booked By']],
    body: bookings.map((b, i) => [
      i + 1,
      b.bookingId,
      b.guest.name,
      b.guest.phone,
      b.seats.join(', '),
      b.boardingPoint.name,
      `${b.pricing.totalAmount}`,
      `${b.payment.advanceAmount}`,
      `${b.payment.dueAmount}`,
      b.source.agentCode || 'Owner'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22], fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 20 },
      2: { cellWidth: 35 },
    }
  });
  
  // Summary
  const totalGuests = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + b.pricing.totalAmount, 0);
  const totalCollected = bookings.reduce((sum, b) => sum + b.payment.advanceAmount, 0);
  const totalDue = bookings.reduce((sum, b) => sum + b.payment.dueAmount, 0);
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Guests: ${totalGuests} | Revenue: BDT ${totalRevenue.toLocaleString()} | Collected: BDT ${totalCollected.toLocaleString()} | Due: BDT ${totalDue.toLocaleString()}`, 15, finalY);
  
  return doc.output('blob');
}
```

---

## 9. Search & Booking ID

### 9.1 Generate 6-Digit Booking ID

```typescript
// src/services/bookingService.ts
import { runTransaction, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function generateBookingId(agencyId: string): Promise<string> {
  const counterRef = doc(db, 'agencies', agencyId, 'counters', 'booking');
  
  const newId = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    
    let currentCount = 0;
    if (counterDoc.exists()) {
      currentCount = counterDoc.data().value;
    }
    
    const nextCount = currentCount + 1;
    transaction.set(counterRef, { value: nextCount, updatedAt: serverTimestamp() });
    
    // Pad to 6 digits
    return String(nextCount).padStart(6, '0');
  });
  
  return newId;
}
```

### 9.2 Search by Booking ID

```typescript
// src/services/searchService.ts
export async function searchByBookingId(agencyId: string, bookingId: string): Promise<Booking | null> {
  // Search across all packages using collection group query
  const q = query(
    collectionGroup(db, 'bookings'),
    where('agencyId', '==', agencyId),
    where('bookingId', '==', bookingId)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  } as Booking;
}
```

### 9.3 Search by Phone

```typescript
export async function searchByPhone(agencyId: string, phone: string): Promise<Booking[]> {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  const q = query(
    collectionGroup(db, 'bookings'),
    where('agencyId', '==', agencyId),
    where('guest.phone', '==', cleanPhone),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Booking[];
}
```

### 9.4 Search Component

```tsx
// src/components/search/GlobalSearch.tsx
export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const { agencyId } = useAuthStore();
  
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Check if it's a booking ID (6 digits)
      if (/^\d{6}$/.test(query)) {
        const booking = await searchByBookingId(agencyId, query);
        setResults(booking ? [booking] : []);
      }
      // Check if it's a phone number
      else if (/^01\d{9}$/.test(query.replace(/[^0-9]/g, ''))) {
        const bookings = await searchByPhone(agencyId, query);
        setResults(bookings);
      }
      // Otherwise search by name
      else {
        const bookings = await searchByName(agencyId, query);
        setResults(bookings);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by Booking ID, Phone, or Name..."
          className="input-field flex-1"
        />
        <Button onClick={handleSearch} loading={loading}>
          Search
        </Button>
      </div>
      
      {/* Results Dropdown */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 card shadow-lg max-h-96 overflow-y-auto z-50">
          {results.map(booking => (
            <SearchResultItem key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 10. Mobile Responsiveness

### 10.1 Bottom Navigation

```tsx
// src/components/layout/BottomNav.tsx
export function BottomNav() {
  const location = useLocation();
  const { role } = useAuthStore();
  
  const navItems = getNavItemsForRole(role);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-sand-200 safe-area-inset-bottom md:hidden">
      <div className="flex justify-around">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-3 px-4 min-w-[64px] ${
                isActive ? 'text-primary-600' : 'text-sand-500'
              }`
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

### 10.2 Responsive Layout

```tsx
// src/components/layout/DashboardLayout.tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-sand-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>
      
      {/* Main Content */}
      <div className="md:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 bg-white border-b border-sand-200 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-sand-100 md:hidden"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            
            <GlobalSearch />
            
            <UserMenu />
          </div>
        </header>
        
        {/* Page Content */}
        <main className="p-4 pb-24 md:pb-4">
          {children}
        </main>
      </div>
      
      {/* Bottom Nav (Mobile) */}
      <BottomNav />
    </div>
  );
}
```

### 10.3 Touch-Friendly Cards

```tsx
// src/components/common/TouchCard.tsx
export function TouchCard({ children, onClick, className }: TouchCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        card p-4 cursor-pointer
        active:scale-[0.98] active:bg-sand-50
        transition-all duration-200
        touch-manipulation
        min-h-[44px]
        ${className}
      `}
    >
      {children}
    </div>
  );
}
```

---

## 🚀 Deployment

### Firebase Hosting

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

### Environment Variables

```env
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx
REACT_APP_FIREBASE_PROJECT_ID=bd-tour-connect
REACT_APP_FIREBASE_STORAGE_BUCKET=xxx
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=xxx

REACT_APP_EVOLUTION_API_URL=https://your-evolution-api.com
REACT_APP_EVOLUTION_API_KEY=xxx
```

---

*Built with ❤️ for Bangladeshi Travel Agencies*
