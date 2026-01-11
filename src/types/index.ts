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
