// Type definitions for BD Tour Connect

export type UserRole = 'system_admin' | 'agency_admin' | 'sales_agent';

export interface User {
  id: string;
  phone: string;
  name: string;
  nameBn: string;
  email: string;
  role: UserRole;
  agencyId?: string;
  agentCode?: string;
  permissions?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Agency {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  addressBn: string;
  logo?: string;
  primaryColor: string;
  tagline: string;
  taglineBn: string;
  subscription: {
    plan: 'basic' | 'pro' | 'enterprise';
    maxAgents: number;
    maxPackagesPerMonth: number;
  };
  isActive: boolean;
  createdAt: string;
}

export interface TourPackage {
  id: string;
  agencyId: string;
  title: string;
  titleBn: string;
  destination: string;
  destinationBn: string;
  description: string;
  descriptionBn: string;
  departureDate: string;
  returnDate: string;
  departureTime: string;
  vehicleType: string;
  totalSeats: number;
  availableSeats: number;
  pricePerPerson: number;
  couplePrice?: number;
  childPrice?: number;
  advanceAmount: number;
  boardingPoints: BoardingPoint[];
  droppingPoints: BoardingPoint[];
  inclusions: string[];
  exclusions: string[];
  mealPlan: MealDay[];
  status: 'draft' | 'current' | 'future' | 'past' | 'cancelled';
  coverImage?: string;
  createdAt: string;
  // Bus seat layout configuration
  busConfiguration?: BusConfiguration;
  seatLayout?: SeatLayout;
}

export interface BoardingPoint {
  id: string;
  name: string;
  nameBn: string;
  time: string;
  address: string;
}

export interface MealDay {
  day: number;
  breakfast?: string;
  lunch?: string;
  snack?: string;
  dinner?: string;
}

export interface Booking {
  id: string;
  bookingId: string; // 6-digit unique ID
  packageId: string;
  agencyId: string;
  agentId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestNid?: string;
  emergencyContact?: string;
  passengers: Passenger[];
  boardingPoint: string;
  droppingPoint: string;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank' | 'card';
  paymentStatus: 'unpaid' | 'advance_paid' | 'fully_paid';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  source: 'web' | 'whatsapp' | 'messenger' | 'phone' | 'walk-in';
  notes?: string;
  createdAt: string;
}

export interface Passenger {
  name: string;
  age: number;
  seatNumber: string;
  type: 'adult' | 'child';
}

export interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  totalRevenue: number;
  pendingAmount: number;
  activePackages: number;
  totalAgents?: number;
  totalAgencies?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// ============================================
// BUS SEAT LAYOUT TYPES
// ============================================

export type SeatArrangement = '2x2' | '2x1' | '1x1' | '2x3' | '3x2';
export type ACType = 'ac' | 'non_ac';
export type BusBrand = 'hino' | 'mercedes' | 'volvo' | 'scania' | 'ashok_leyland' | 'other';
export type VehicleCategory = 'bus' | 'microbus' | 'hiace' | 'car';
export type SeatStatus = 'available' | 'booked' | 'blocked' | 'selected' | 'sold';
export type PassengerGender = 'male' | 'female' | 'other';

export interface SeatPosition {
  row: string;        // A, B, C, ... K
  column: number;     // 1, 2, 3, 4
}

export interface Seat {
  id: string;                    // e.g., "L-A1", "U-B2"
  deck: 'lower' | 'upper';
  position: SeatPosition;
  label: string;                 // Display label e.g., "A1", "B2"
  status: SeatStatus;
  bookedBy?: {
    bookingId: string;
    passengerName: string;
    gender: PassengerGender;
  };
  blockedReason?: string;        // "Damaged", "Staff Reserved", etc.
}

export interface FloorConfiguration {
  arrangement: SeatArrangement;
  serialStart: string;           // A
  serialEnd: string;             // K
  seatsPerSerial: number;        // How many seats per row (e.g., 4 for 2x2)
  firstRowLayout?: SeatArrangement;  // Can be different
  firstRowSeats?: number;        // Override for first row
  lastRowLayout?: SeatArrangement;   // Usually 5-seater for buses
  lastRowSeats?: number;         // Override for last row
}

export interface BusConfiguration {
  id: string;
  vehicleCategory: VehicleCategory;
  numberOfFloors: 1 | 2;         // Single deck or Double decker
  acType: ACType;
  brand: BusBrand;
  brandOther?: string;           // If brand is 'other'
  modelName?: string;
  lowerDeck: FloorConfiguration;
  upperDeck?: FloorConfiguration; // Only if numberOfFloors === 2
  totalSeats: number;            // Calculated from configuration
}

export interface SeatLayout {
  packageId: string;
  busConfiguration: BusConfiguration;
  seats: Seat[];
  lastUpdated: string;
}

// Extended Passenger interface with seat and gender
export interface PassengerWithSeat extends Passenger {
  seatId: string;                // Reference to Seat.id
  gender: PassengerGender;
  boardingPointId?: string;
  droppingPointId?: string;
  customDroppingPoint?: string;  // For mid-way drop-offs
}

// Real-time seat update event
export interface SeatUpdateEvent {
  packageId: string;
  seatId: string;
  status: SeatStatus;
  bookedBy?: Seat['bookedBy'];
  timestamp: string;
}

// Seat selection state for booking flow
export interface SeatSelectionState {
  packageId: string;
  selectedSeats: string[];       // Array of seat IDs
  lockedUntil?: string;          // Temporary lock for checkout
}
