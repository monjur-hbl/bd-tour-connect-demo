import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../common/Card';
import { packagesAPI, bookingsAPI } from '../../services/api';
import { BusSeatLayoutPicker } from '../seats';
import { SeatLayout, BusConfiguration, PassengerGender, PaymentMethod, Agency } from '../../types';
import { HoldSeatsModal } from './HoldSeatsModal';
import { ShoppingCart, Lock, Clock, CreditCard, Smartphone, Banknote, Building2, CircleDollarSign, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// Types
interface Package {
  id: string;
  title: string;
  titleBn: string;
  destination: string;
  destinationBn: string;
  departureDate: string;
  returnDate: string;
  departureTime: string;
  vehicleType: string;
  totalSeats: number;
  availableSeats: number;
  pricePerPerson: number;
  couplePrice: number;
  childPrice: number;
  advanceAmount: number;
  boardingPoints: { id: string; name: string; nameBn: string; time: string }[];
  droppingPoints: { id: string; name: string; nameBn: string }[];
  hosts?: { id: string; name: string; nameBn?: string; mobile: string; role?: string }[];
  status: string;
  busConfiguration?: BusConfiguration;
  seatLayout?: SeatLayout;
}

type GuestType = 'adult' | 'couple' | 'child';

interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nid?: string;
  emergencyContact?: string;
  age: number;
  type: GuestType;
  gender: PassengerGender;
  seatId?: string;
  seatLabel?: string;
}

interface PackageBooking {
  id: string;
  packageId: string;
  package: Package;
  guests: Guest[];
  boardingPoint: string;
  droppingPoint: string;
  customDroppingPoint?: string;
  useCustomDroppingPoint: boolean;
  selectedSeatIds: string[];
  subtotal: number;
}

interface MultiPackageBookingProps {
  userRole: 'agency_admin' | 'sales_agent';
  onComplete?: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; labelBn: string; icon: React.ReactNode; requiresTxn: boolean }[] = [
  { value: 'cash', label: 'Cash', labelBn: 'নগদ', icon: <Banknote className="w-5 h-5" />, requiresTxn: false },
  { value: 'bkash', label: 'bKash', labelBn: 'বিকাশ', icon: <Smartphone className="w-5 h-5" />, requiresTxn: true },
  { value: 'nagad', label: 'Nagad', labelBn: 'নগদ', icon: <Smartphone className="w-5 h-5" />, requiresTxn: true },
  { value: 'card', label: 'Card', labelBn: 'কার্ড', icon: <CreditCard className="w-5 h-5" />, requiresTxn: true },
  { value: 'bank', label: 'Bank Transfer', labelBn: 'ব্যাংক', icon: <Building2 className="w-5 h-5" />, requiresTxn: true },
  { value: 'other', label: 'Other', labelBn: 'অন্যান্য', icon: <CircleDollarSign className="w-5 h-5" />, requiresTxn: true },
];

const SOURCE_OPTIONS = [
  { value: 'walk-in', label: 'Walk-in', labelBn: 'সরাসরি' },
  { value: 'phone', label: 'Phone', labelBn: 'ফোন' },
  { value: 'whatsapp', label: 'WhatsApp', labelBn: 'হোয়াটসঅ্যাপ' },
  { value: 'messenger', label: 'Messenger', labelBn: 'মেসেঞ্জার' },
  { value: 'web', label: 'Website', labelBn: 'ওয়েবসাইট' },
];

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const MultiPackageBooking: React.FC<MultiPackageBookingProps> = ({ userRole, onComplete }) => {
  const navigate = useNavigate();
  const { user, agency } = useAuthStore();

  // State
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Step: 1 = Package Selection, 2 = Guest Details, 3 = Seat Selection, 4 = Payment
  const [step, setStep] = useState(1);

  // Package bookings (multi-package support)
  const [packageBookings, setPackageBookings] = useState<PackageBooking[]>([]);
  const [activeBookingIndex, setActiveBookingIndex] = useState(0);

  // Payment state
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'cash' as PaymentMethod,
    transactionId: '',
    advancePaid: 0,
    discountAmount: 0,
    discountReason: '',
    source: 'walk-in',
    notes: '',
  });

  // Hold booking state
  const [isHoldBooking, setIsHoldBooking] = useState(false);

  // Hold modal state
  const [holdModalPackage, setHoldModalPackage] = useState<Package | null>(null);

  // Agency settings for minimum advance
  const bookingSettings = agency?.bookingSettings || {
    minimumAdvanceAmount: 1000,
    minimumAdvancePercentage: 20,
    usePercentage: false,
    holdDurationMinutes: 60,
    allowAgentHold: true,
    requireTransactionId: true,
  };

  // Fetch packages on mount
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    if (!user?.agencyId) return;

    try {
      const [currentResult, futureResult] = await Promise.all([
        packagesAPI.getAll({ agencyId: user.agencyId, status: 'current' }),
        packagesAPI.getAll({ agencyId: user.agencyId, status: 'future' }),
      ]);
      setPackages([...currentResult.packages, ...futureResult.packages]);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  // Calculate minimum advance required
  const calculateMinimumAdvance = (total: number): number => {
    if (bookingSettings.usePercentage) {
      return Math.ceil((total * bookingSettings.minimumAdvancePercentage) / 100);
    }
    return bookingSettings.minimumAdvanceAmount;
  };

  // Add a new package booking
  const addPackageBooking = (pkg: Package) => {
    const newBooking: PackageBooking = {
      id: generateId(),
      packageId: pkg.id,
      package: pkg,
      guests: [createNewGuest()],
      boardingPoint: pkg.boardingPoints?.[0]?.name || '',
      droppingPoint: pkg.droppingPoints?.[0]?.name || '',
      useCustomDroppingPoint: false,
      selectedSeatIds: [],
      subtotal: 0,
    };

    setPackageBookings(prev => [...prev, newBooking]);
    setActiveBookingIndex(packageBookings.length);
    setStep(2);
  };

  // Remove a package booking
  const removePackageBooking = (index: number) => {
    setPackageBookings(prev => prev.filter((_, i) => i !== index));
    if (activeBookingIndex >= index && activeBookingIndex > 0) {
      setActiveBookingIndex(prev => prev - 1);
    }
  };

  // Create a new guest
  const createNewGuest = (): Guest => ({
    id: generateId(),
    name: '',
    phone: '',
    age: 30,
    type: 'adult',
    gender: 'male',
  });

  // Add guest to current booking
  const addGuest = (bookingIndex: number) => {
    setPackageBookings(prev => {
      const updated = [...prev];
      const booking = updated[bookingIndex];
      if (booking.guests.length < booking.package.availableSeats) {
        booking.guests.push(createNewGuest());
        booking.subtotal = calculatePackageSubtotal(booking);
      }
      return updated;
    });
  };

  // Remove guest from booking
  const removeGuest = (bookingIndex: number, guestIndex: number) => {
    setPackageBookings(prev => {
      const updated = [...prev];
      if (updated[bookingIndex].guests.length > 1) {
        updated[bookingIndex].guests.splice(guestIndex, 1);
        // Remove corresponding seat selection
        const seatIds = updated[bookingIndex].selectedSeatIds;
        if (seatIds.length > guestIndex) {
          seatIds.splice(guestIndex, 1);
        }
        updated[bookingIndex].subtotal = calculatePackageSubtotal(updated[bookingIndex]);
      }
      return updated;
    });
  };

  // Update guest details
  const updateGuest = (bookingIndex: number, guestIndex: number, field: keyof Guest, value: any) => {
    setPackageBookings(prev => {
      const updated = [...prev];
      const guest = updated[bookingIndex].guests[guestIndex];
      (guest as any)[field] = value;

      // Auto-set type based on age
      if (field === 'age') {
        const age = Number(value);
        if (age < 12) {
          guest.type = 'child';
        } else {
          guest.type = 'adult';
        }
      }

      updated[bookingIndex].subtotal = calculatePackageSubtotal(updated[bookingIndex]);
      return updated;
    });
  };

  // Update guest type (adult/couple/child)
  const updateGuestType = (bookingIndex: number, guestIndex: number, type: GuestType) => {
    setPackageBookings(prev => {
      const updated = [...prev];
      updated[bookingIndex].guests[guestIndex].type = type;

      // If changing to couple, auto-set age to adult
      if (type === 'couple' || type === 'adult') {
        updated[bookingIndex].guests[guestIndex].age = 30;
      } else if (type === 'child') {
        updated[bookingIndex].guests[guestIndex].age = 8;
      }

      updated[bookingIndex].subtotal = calculatePackageSubtotal(updated[bookingIndex]);
      return updated;
    });
  };

  // Calculate price for a single guest
  const calculateGuestPrice = (guest: Guest, pkg: Package): number => {
    switch (guest.type) {
      case 'couple':
        return pkg.couplePrice || pkg.pricePerPerson * 2;
      case 'child':
        return pkg.childPrice || Math.round(pkg.pricePerPerson * 0.7);
      case 'adult':
      default:
        return pkg.pricePerPerson;
    }
  };

  // Calculate subtotal for a package booking
  const calculatePackageSubtotal = (booking: PackageBooking): number => {
    return booking.guests.reduce((total, guest) => {
      return total + calculateGuestPrice(guest, booking.package);
    }, 0);
  };

  // Calculate subtotal (before discount)
  const subtotalBeforeDiscount = useMemo(() => {
    return packageBookings.reduce((total, booking) => {
      return total + calculatePackageSubtotal(booking);
    }, 0);
  }, [packageBookings]);

  // Calculate grand total (after discount)
  const grandTotal = useMemo(() => {
    return Math.max(0, subtotalBeforeDiscount - (paymentData.discountAmount || 0));
  }, [subtotalBeforeDiscount, paymentData.discountAmount]);

  // Calculate minimum advance for this booking
  const minimumAdvance = useMemo(() => {
    return calculateMinimumAdvance(grandTotal);
  }, [grandTotal, bookingSettings]);

  // Check if current payment method requires transaction ID
  const requiresTransactionId = useMemo(() => {
    const method = PAYMENT_METHODS.find(m => m.value === paymentData.paymentMethod);
    return method?.requiresTxn && bookingSettings.requireTransactionId;
  }, [paymentData.paymentMethod, bookingSettings.requireTransactionId]);

  // Update booking field
  const updateBookingField = (bookingIndex: number, field: keyof PackageBooking, value: any) => {
    setPackageBookings(prev => {
      const updated = [...prev];
      (updated[bookingIndex] as any)[field] = value;
      return updated;
    });
  };

  // Handle seat selection
  const handleSeatSelection = (bookingIndex: number, seatIds: string[]) => {
    setPackageBookings(prev => {
      const updated = [...prev];
      updated[bookingIndex].selectedSeatIds = seatIds;
      return updated;
    });
  };

  // Validate current step
  const validateStep = (stepNumber: number): boolean => {
    if (stepNumber === 1) {
      return packageBookings.length > 0;
    }

    if (stepNumber === 2) {
      for (const booking of packageBookings) {
        const validGuests = booking.guests.filter(g => g.name.trim());
        if (validGuests.length === 0) {
          toast.error('Each package must have at least one guest');
          return false;
        }
      }
      return true;
    }

    if (stepNumber === 3) {
      for (const booking of packageBookings) {
        if (booking.package.seatLayout) {
          const validGuests = booking.guests.filter(g => g.name.trim()).length;
          if (booking.selectedSeatIds.length < validGuests) {
            toast.error(`Please select ${validGuests} seat(s) for ${booking.package.destination}`);
            return false;
          }
        }
      }
      return true;
    }

    return true;
  };

  // Validate payment step
  const validatePayment = (): boolean => {
    // For hold bookings, no payment validation needed
    if (isHoldBooking) {
      return true;
    }

    // Check minimum advance
    if (paymentData.advancePaid < minimumAdvance) {
      toast.error(`Minimum advance of ৳${minimumAdvance.toLocaleString()} is required`);
      return false;
    }

    // Check transaction ID for digital payments
    if (requiresTransactionId && !paymentData.transactionId.trim()) {
      toast.error('Transaction ID is required for this payment method');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user?.agencyId) return;

    if (!validateStep(3)) return;
    if (!validatePayment()) return;

    setSubmitting(true);

    try {
      const bookingPromises = packageBookings.map(async (booking) => {
        const validGuests = booking.guests.filter(g => g.name.trim());
        const subtotal = calculatePackageSubtotal(booking);

        // Assign seats to guests
        const passengersWithSeats = validGuests.map((guest, index) => ({
          name: guest.name,
          age: guest.age,
          type: guest.type === 'couple' ? 'adult' : guest.type,
          gender: guest.gender,
          seatNumber: booking.selectedSeatIds[index] || '',
          seatId: booking.selectedSeatIds[index] || undefined,
        }));

        const droppingPoint = booking.useCustomDroppingPoint
          ? booking.customDroppingPoint
          : booking.droppingPoint;

        // Calculate proportional discount for this booking
        const discountProportion = subtotalBeforeDiscount > 0 ? subtotal / subtotalBeforeDiscount : 0;
        const bookingDiscount = Math.round(paymentData.discountAmount * discountProportion);
        const finalAmount = subtotal - bookingDiscount;

        // Calculate hold expiry time (1 hour for agents)
        const holdExpiresAt = isHoldBooking
          ? new Date(Date.now() + bookingSettings.holdDurationMinutes * 60 * 1000).toISOString()
          : undefined;

        const bookingData = {
          packageId: booking.package.id,
          agencyId: user.agencyId,
          agentId: userRole === 'sales_agent' ? user.id : undefined,
          agentName: user.name,
          guestName: validGuests[0].name,
          guestPhone: validGuests[0].phone || '',
          guestEmail: validGuests[0].email || undefined,
          guestNid: validGuests[0].nid || undefined,
          emergencyContact: validGuests[0].emergencyContact || undefined,
          passengers: passengersWithSeats,
          boardingPoint: booking.boardingPoint || undefined,
          droppingPoint: droppingPoint || undefined,
          subtotal,
          discountAmount: bookingDiscount,
          discountReason: paymentData.discountReason || undefined,
          totalAmount: finalAmount,
          advancePaid: isHoldBooking ? 0 : (grandTotal > 0 ? Math.round((Number(paymentData.advancePaid) / grandTotal) * finalAmount) : 0),
          paymentMethod: isHoldBooking ? 'cash' : paymentData.paymentMethod,
          paymentHistory: isHoldBooking ? [] : [{
            method: paymentData.paymentMethod,
            transactionId: paymentData.transactionId || `CASH-${Date.now()}`,
            amount: grandTotal > 0 ? Math.round((Number(paymentData.advancePaid) / grandTotal) * finalAmount) : 0,
            paidAt: new Date().toISOString(),
            collectedBy: user.id,
          }],
          // Hold booking fields
          isHold: isHoldBooking,
          status: isHoldBooking ? 'hold' : 'pending',
          holdExpiresAt: holdExpiresAt,
          holdCreatedBy: isHoldBooking ? (userRole === 'sales_agent' ? 'agent' : 'agency_admin') : undefined,
          source: paymentData.source,
          notes: paymentData.notes || undefined,
          selectedSeatIds: booking.selectedSeatIds.length > 0 ? booking.selectedSeatIds : undefined,
        };

        return bookingsAPI.create(bookingData);
      });

      const results = await Promise.all(bookingPromises);
      const bookingIds = results.map(r => r.bookingId).join(', ');

      if (isHoldBooking) {
        toast.success(`Booking(s) on HOLD! IDs: ${bookingIds}. Payment must be made within ${bookingSettings.holdDurationMinutes} minutes.`);
      } else {
        toast.success(`Booking(s) created! IDs: ${bookingIds}`);
      }

      if (onComplete) {
        onComplete();
      } else {
        navigate(userRole === 'agency_admin' ? '/agency/bookings' : '/agent/my-bookings');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  // Format helpers
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const activeBooking = packageBookings[activeBookingIndex];
  const hasPackagesWithSeats = packageBookings.some(b => b.package.seatLayout);

  // Can this user create hold bookings?
  const canCreateHoldBooking = userRole === 'sales_agent' ? bookingSettings.allowAgentHold : true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sand-800 font-display">
          Create Booking
        </h1>
        <p className="text-sand-500 mt-1">
          Book tour packages for your customers
          <span className="font-bengali ml-2">(বুকিং তৈরি করুন)</span>
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 md:gap-4 overflow-x-auto pb-2">
        {[
          { num: 1, label: 'Packages', labelBn: 'প্যাকেজ' },
          { num: 2, label: 'Guests', labelBn: 'অতিথি' },
          { num: 3, label: 'Seats', labelBn: 'সিট' },
          { num: 4, label: 'Payment', labelBn: 'পেমেন্ট' },
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <button
              onClick={() => {
                if (s.num < step || (s.num === 3 && !hasPackagesWithSeats)) {
                  setStep(s.num === 3 && !hasPackagesWithSeats ? 4 : s.num);
                }
              }}
              className={`flex items-center gap-2 ${step >= s.num ? 'text-primary-600' : 'text-sand-400'} ${s.num < step ? 'cursor-pointer' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step >= s.num ? 'bg-primary-500 text-white' : 'bg-sand-200'
              }`}>
                {step > s.num ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : s.num}
              </div>
              <span className="font-medium hidden md:inline text-sm">{s.label}</span>
            </button>
            {idx < 3 && <div className={`w-8 md:w-16 h-1 ${step > s.num ? 'bg-primary-500' : 'bg-sand-200'}`}></div>}
          </React.Fragment>
        ))}
      </div>

      {/* Selected Packages Summary Bar */}
      {packageBookings.length > 0 && step > 1 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {packageBookings.map((booking, index) => (
                <button
                  key={booking.id}
                  onClick={() => setActiveBookingIndex(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeBookingIndex === index
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-primary-700 hover:bg-primary-100'
                  }`}
                >
                  {booking.package.destination}
                  <span className="ml-2 opacity-75">({booking.guests.length} guests)</span>
                </button>
              ))}
              <button
                onClick={() => setStep(1)}
                className="px-3 py-2 text-primary-600 hover:bg-primary-100 rounded-lg text-sm font-medium"
              >
                + Add Package
              </button>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-600">Grand Total</p>
              <p className="text-xl font-bold text-primary-700">{formatCurrency(grandTotal)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Package Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-sand-700">
              Select Tour Package(s)
              <span className="font-bengali text-sand-500 font-normal ml-2">(প্যাকেজ নির্বাচন করুন)</span>
            </h2>
            {packageBookings.length > 0 && (
              <button
                onClick={() => {
                  if (validateStep(1)) setStep(2);
                }}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Continue with {packageBookings.length} Package(s)
              </button>
            )}
          </div>

          {/* Already selected packages */}
          {packageBookings.length > 0 && (
            <Card className="bg-green-50 border border-green-200">
              <h3 className="font-medium text-green-800 mb-3">Selected Packages</h3>
              <div className="space-y-2">
                {packageBookings.map((booking, index) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium text-sand-800">{booking.package.destination}</p>
                      <p className="text-sm text-sand-500">{formatDate(booking.package.departureDate)}</p>
                    </div>
                    <button
                      onClick={() => removePackageBooking(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Available packages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages
              .filter(p => p.availableSeats > 0)
              .filter(p => !packageBookings.some(b => b.packageId === p.id))
              .map((pkg) => (
                <Card
                  key={pkg.id}
                  className="transition-all hover:shadow-lg hover:border-primary-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sand-800">{pkg.destination}</h3>
                        <p className="text-sm text-sand-500">{pkg.title}</p>
                        {pkg.titleBn && <p className="text-sm text-sand-400 font-bengali">{pkg.titleBn}</p>}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        pkg.status === 'current' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {pkg.status}
                      </span>
                    </div>
                    <div className="text-sm text-sand-600 space-y-1">
                      <p>{formatDate(pkg.departureDate)} - {formatDate(pkg.returnDate)}</p>
                      <p className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${pkg.availableSeats > 10 ? 'bg-green-500' : pkg.availableSeats > 5 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                        {pkg.availableSeats} seats available
                      </p>
                      {pkg.busConfiguration && (
                        <p className="text-xs text-accent-600">
                          <svg className="w-3 h-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Seat selection available
                        </p>
                      )}
                    </div>
                    <div className="pt-3 border-t border-sand-100">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-xl font-bold text-primary-600">{formatCurrency(pkg.pricePerPerson)}</p>
                          <p className="text-xs text-sand-500">per adult</p>
                        </div>
                        <div className="text-right text-xs text-sand-500">
                          {pkg.couplePrice && <p>Couple: {formatCurrency(pkg.couplePrice)}</p>}
                          {pkg.childPrice && <p>Child: {formatCurrency(pkg.childPrice)}</p>}
                        </div>
                      </div>
                    </div>
                    {/* Book and Hold buttons */}
                    <div className="pt-3 border-t border-sand-100 flex gap-2">
                      <button
                        onClick={() => addPackageBooking(pkg)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Book
                      </button>
                      {pkg.seatLayout && userRole === 'agency_admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setHoldModalPackage(pkg);
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                          title="Hold seats without booking"
                        >
                          <Lock className="w-4 h-4" />
                          Hold
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>

          {packages.filter(p => p.availableSeats > 0).length === 0 && (
            <Card>
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-sand-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sand-500">No packages available for booking.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: Guest Details */}
      {step === 2 && activeBooking && (
        <div className="space-y-6">
          {/* Active package header */}
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{activeBooking.package.destination}</h2>
                <p className="opacity-90">{activeBooking.package.title}</p>
                <p className="text-sm opacity-75 mt-1">
                  {formatDate(activeBooking.package.departureDate)} - {formatDate(activeBooking.package.returnDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-75">Package Subtotal</p>
                <p className="text-2xl font-bold">{formatCurrency(activeBooking.subtotal)}</p>
              </div>
            </div>
          </Card>

          {/* Guest type quick selector */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sand-700">
                Add Guests
                <span className="font-bengali text-sand-500 font-normal ml-2">(অতিথি যোগ করুন)</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const booking = packageBookings[activeBookingIndex];
                    if (booking.guests.length < booking.package.availableSeats) {
                      addGuest(activeBookingIndex);
                      updateGuestType(activeBookingIndex, booking.guests.length, 'adult');
                    }
                  }}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                >
                  + Adult
                </button>
                <button
                  onClick={() => {
                    const booking = packageBookings[activeBookingIndex];
                    if (booking.guests.length < booking.package.availableSeats) {
                      addGuest(activeBookingIndex);
                      updateGuestType(activeBookingIndex, booking.guests.length, 'couple');
                    }
                  }}
                  className="px-3 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-200"
                >
                  + Couple
                </button>
                <button
                  onClick={() => {
                    const booking = packageBookings[activeBookingIndex];
                    if (booking.guests.length < booking.package.availableSeats) {
                      addGuest(activeBookingIndex);
                      updateGuestType(activeBookingIndex, booking.guests.length, 'child');
                    }
                  }}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                >
                  + Child
                </button>
              </div>
            </div>

            {/* Pricing info */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-sand-50 rounded-xl mb-6">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{formatCurrency(activeBooking.package.pricePerPerson)}</p>
                <p className="text-xs text-sand-500">Per Adult</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-pink-600">
                  {formatCurrency(activeBooking.package.couplePrice || activeBooking.package.pricePerPerson * 2)}
                </p>
                <p className="text-xs text-sand-500">Per Couple</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(activeBooking.package.childPrice || Math.round(activeBooking.package.pricePerPerson * 0.7))}
                </p>
                <p className="text-xs text-sand-500">Per Child</p>
              </div>
            </div>

            {/* Guest list */}
            <div className="space-y-4">
              {activeBooking.guests.map((guest, guestIndex) => (
                <div key={guest.id} className="p-4 border-2 border-sand-100 rounded-xl hover:border-sand-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        guest.type === 'adult' ? 'bg-blue-100 text-blue-700' :
                        guest.type === 'couple' ? 'bg-pink-100 text-pink-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {guest.type === 'couple' ? 'Couple' : guest.type === 'child' ? 'Child' : 'Adult'}
                      </span>
                      <p className="font-medium text-sand-600">
                        {formatCurrency(calculateGuestPrice(guest, activeBooking.package))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Type selector */}
                      <select
                        value={guest.type}
                        onChange={(e) => updateGuestType(activeBookingIndex, guestIndex, e.target.value as GuestType)}
                        className="px-3 py-1 border border-sand-200 rounded-lg text-sm"
                      >
                        <option value="adult">Adult</option>
                        <option value="couple">Couple</option>
                        <option value="child">Child</option>
                      </select>
                      {activeBooking.guests.length > 1 && (
                        <button
                          onClick={() => removeGuest(activeBookingIndex, guestIndex)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-sand-700 mb-1">
                        {guest.type === 'couple' ? 'Primary Guest Name' : 'Name'} *
                      </label>
                      <input
                        type="text"
                        value={guest.name}
                        onChange={(e) => updateGuest(activeBookingIndex, guestIndex, 'name', e.target.value)}
                        placeholder={guest.type === 'couple' ? 'Enter couple primary name...' : 'Enter guest name...'}
                        className="w-full px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Gender</label>
                      <select
                        value={guest.gender}
                        onChange={(e) => updateGuest(activeBookingIndex, guestIndex, 'gender', e.target.value)}
                        className="w-full px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Expandable contact fields for first guest or if needed */}
                  {guestIndex === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={guest.phone}
                          onChange={(e) => updateGuest(activeBookingIndex, guestIndex, 'phone', e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={guest.email || ''}
                          onChange={(e) => updateGuest(activeBookingIndex, guestIndex, 'email', e.target.value)}
                          className="w-full px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">NID</label>
                        <input
                          type="text"
                          value={guest.nid || ''}
                          onChange={(e) => updateGuest(activeBookingIndex, guestIndex, 'nid', e.target.value)}
                          className="w-full px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Emergency Contact</label>
                        <input
                          type="tel"
                          value={guest.emergencyContact || ''}
                          onChange={(e) => updateGuest(activeBookingIndex, guestIndex, 'emergencyContact', e.target.value)}
                          className="w-full px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Travel Details */}
          <Card>
            <h3 className="font-semibold text-sand-700 mb-4">
              Travel Details
              <span className="font-bengali text-sand-500 font-normal ml-2">(ভ্রমণের বিবরণ)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBooking.package.boardingPoints?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Boarding Point</label>
                  <select
                    value={activeBooking.boardingPoint}
                    onChange={(e) => updateBookingField(activeBookingIndex, 'boardingPoint', e.target.value)}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select boarding point</option>
                    {activeBooking.package.boardingPoints.map(bp => (
                      <option key={bp.id} value={bp.name}>
                        {bp.name} {bp.time ? `(${bp.time})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-sand-700">Dropping Point</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateBookingField(activeBookingIndex, 'useCustomDroppingPoint', false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !activeBooking.useCustomDroppingPoint
                        ? 'bg-primary-500 text-white'
                        : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                    }`}
                  >
                    Predefined
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBookingField(activeBookingIndex, 'useCustomDroppingPoint', true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeBooking.useCustomDroppingPoint
                        ? 'bg-primary-500 text-white'
                        : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                    }`}
                  >
                    Custom / Mid-way
                  </button>
                </div>

                {!activeBooking.useCustomDroppingPoint ? (
                  activeBooking.package.droppingPoints?.length > 0 ? (
                    <select
                      value={activeBooking.droppingPoint}
                      onChange={(e) => updateBookingField(activeBookingIndex, 'droppingPoint', e.target.value)}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select dropping point</option>
                      {activeBooking.package.droppingPoints.map(dp => (
                        <option key={dp.id} value={dp.name}>{dp.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-sand-500 italic">No predefined dropping points</p>
                  )
                ) : (
                  <input
                    type="text"
                    value={activeBooking.customDroppingPoint || ''}
                    onChange={(e) => updateBookingField(activeBookingIndex, 'customDroppingPoint', e.target.value)}
                    placeholder="Enter custom dropping location..."
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 border border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStep(2)) {
                  setStep(hasPackagesWithSeats ? 3 : 4);
                }
              }}
              className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              {hasPackagesWithSeats ? 'Continue to Seat Selection' : 'Continue to Payment'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Seat Selection */}
      {step === 3 && activeBooking && activeBooking.package.seatLayout && (
        <div className="space-y-6">
          <Card className="bg-accent-50 border border-accent-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-accent-800">
                  Select Seats for {activeBooking.package.destination}
                </h2>
                <p className="text-accent-600 text-sm">
                  {activeBooking.guests.filter(g => g.name.trim()).length} guest(s) - Select seats below
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-accent-600">Selected</p>
                <p className="text-xl font-bold text-accent-700">
                  {activeBooking.selectedSeatIds.length} / {activeBooking.guests.filter(g => g.name.trim()).length}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <BusSeatLayoutPicker
              seatLayout={activeBooking.package.seatLayout}
              maxSeats={activeBooking.guests.filter(g => g.name.trim()).length}
              selectedSeatIds={activeBooking.selectedSeatIds}
              onSelectionChange={(seatIds) => handleSeatSelection(activeBookingIndex, seatIds)}
              pricePerSeat={activeBooking.package.pricePerPerson}
              showBilingual
            />
          </Card>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-3 border border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStep(3)) setStep(4);
              }}
              className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <div className="space-y-6">
          {/* Hold Booking Option - Only for agents or if allowed */}
          {canCreateHoldBooking && (
            <Card className={`border-2 transition-all ${isHoldBooking ? 'border-amber-400 bg-amber-50' : 'border-sand-200'}`}>
              <div className="flex items-start gap-4">
                <button
                  onClick={() => setIsHoldBooking(!isHoldBooking)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    isHoldBooking ? 'bg-amber-500 border-amber-500 text-white' : 'border-sand-300'
                  }`}
                >
                  {isHoldBooking && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-sand-800">Hold Booking Without Payment</h3>
                  </div>
                  <p className="text-sm text-sand-600 mt-1">
                    Reserve the seat for <span className="font-bold text-amber-600">{bookingSettings.holdDurationMinutes} minutes</span> without collecting payment.
                    The booking will automatically expire if payment is not received within this time.
                  </p>
                  {isHoldBooking && (
                    <div className="mt-3 p-3 bg-amber-100 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        <strong>Important:</strong> Once a hold booking is created, you cannot modify booking details.
                        To make changes, you must cancel and create a new booking.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Booking Summary */}
          <Card>
            <h3 className="font-semibold text-sand-700 mb-4">
              Booking Summary
              <span className="font-bengali text-sand-500 font-normal ml-2">(বুকিং সারাংশ)</span>
            </h3>

            <div className="space-y-4">
              {packageBookings.map((booking, index) => (
                <div key={booking.id} className="p-4 bg-sand-50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-sand-800">{booking.package.destination}</h4>
                      <p className="text-sm text-sand-500">{formatDate(booking.package.departureDate)}</p>
                      <div className="mt-2 space-y-1">
                        {booking.guests.filter(g => g.name.trim()).map((guest, gi) => (
                          <p key={gi} className="text-sm text-sand-600">
                            <span className={`inline-block w-16 px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                              guest.type === 'adult' ? 'bg-blue-100 text-blue-700' :
                              guest.type === 'couple' ? 'bg-pink-100 text-pink-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {guest.type}
                            </span>
                            {guest.name}
                            {booking.selectedSeatIds[gi] && (
                              <span className="ml-2 text-accent-600">Seat: {booking.selectedSeatIds[gi]}</span>
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">{formatCurrency(calculatePackageSubtotal(booking))}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Subtotal, Discount, and Grand Total */}
              <div className="pt-4 border-t-2 border-sand-200 space-y-2">
                <div className="flex items-center justify-between text-sand-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotalBeforeDiscount)}</span>
                </div>
                {paymentData.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Discount {paymentData.discountReason && `(${paymentData.discountReason})`}</span>
                    <span>-{formatCurrency(paymentData.discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xl font-bold pt-2 border-t border-sand-200">
                  <span>Grand Total</span>
                  <span className="text-primary-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Discount Section */}
          <Card className="border-2 border-dashed border-green-200 bg-green-50/50">
            <h3 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Apply Discount
              <span className="font-bengali text-green-500 font-normal text-sm">(ছাড় দিন)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">
                  Discount Amount (BDT)
                </label>
                <input
                  type="number"
                  value={paymentData.discountAmount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, discountAmount: Math.min(Number(e.target.value), subtotalBeforeDiscount) }))}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min={0}
                  max={subtotalBeforeDiscount}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">
                  Discount Reason (optional)
                </label>
                <input
                  type="text"
                  value={paymentData.discountReason}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, discountReason: e.target.value }))}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Loyalty discount, Group booking..."
                />
              </div>
            </div>
            {paymentData.discountAmount > 0 && (
              <p className="mt-3 text-sm text-green-700">
                Saving {formatCurrency(paymentData.discountAmount)} ({Math.round((paymentData.discountAmount / subtotalBeforeDiscount) * 100)}% off)
              </p>
            )}
          </Card>

          {/* Payment Details - Hidden for Hold Bookings */}
          {!isHoldBooking && (
            <Card>
              <h3 className="font-semibold text-sand-700 mb-4">
                Payment Details
                <span className="font-bengali text-sand-500 font-normal ml-2">(পেমেন্টের বিবরণ)</span>
              </h3>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-sand-700 mb-3">Payment Method *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: method.value, transactionId: '' }))}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        paymentData.paymentMethod === method.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-sand-200 hover:border-sand-300 text-sand-600'
                      }`}
                    >
                      {method.icon}
                      <span className="text-sm font-medium">{method.label}</span>
                      <span className="text-xs font-bengali">{method.labelBn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction ID - Required for digital payments */}
              {requiresTransactionId && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Transaction ID / Reference Number *
                    <span className="font-bengali ml-2">(ট্রানজেকশন আইডি)</span>
                  </label>
                  <input
                    type="text"
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, transactionId: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    placeholder={`Enter ${paymentData.paymentMethod} transaction ID...`}
                    required
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    Please enter the transaction reference from your {paymentData.paymentMethod} payment
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">
                    Advance Amount *
                    <span className="text-xs text-sand-500 ml-2">(Min: {formatCurrency(minimumAdvance)})</span>
                  </label>
                  <input
                    type="number"
                    value={paymentData.advancePaid}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, advancePaid: Number(e.target.value) }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent ${
                      paymentData.advancePaid < minimumAdvance
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-sand-200 focus:ring-primary-500'
                    }`}
                    min={minimumAdvance}
                    max={grandTotal}
                  />
                  {paymentData.advancePaid < minimumAdvance && (
                    <p className="text-xs text-red-500 mt-1">
                      Minimum advance of {formatCurrency(minimumAdvance)} is required
                    </p>
                  )}
                  {/* Quick amount buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setPaymentData(prev => ({ ...prev, advancePaid: minimumAdvance }))}
                      className="px-3 py-1 text-xs bg-sand-100 hover:bg-sand-200 rounded-lg"
                    >
                      Min ({formatCurrency(minimumAdvance)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentData(prev => ({ ...prev, advancePaid: Math.round(grandTotal / 2) }))}
                      className="px-3 py-1 text-xs bg-sand-100 hover:bg-sand-200 rounded-lg"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentData(prev => ({ ...prev, advancePaid: grandTotal }))}
                      className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"
                    >
                      Full ({formatCurrency(grandTotal)})
                    </button>
                  </div>
                </div>
                <div className="flex items-end">
                  <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-800 font-medium">Due Amount</span>
                      <span className="text-xl font-bold text-yellow-700">
                        {formatCurrency(grandTotal - (paymentData.advancePaid || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Booking Source</label>
                  <select
                    value={paymentData.source}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {SOURCE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-sand-700 mb-1">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Any special requests or notes..."
                />
              </div>
            </Card>
          )}

          {/* Hold Booking Summary - Shown only for hold bookings */}
          {isHoldBooking && (
            <Card className="bg-amber-50 border-2 border-amber-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800">Hold Booking Summary</h3>
                  <p className="text-amber-700 mt-2">
                    This booking will be held for <strong>{bookingSettings.holdDurationMinutes} minutes</strong>.
                  </p>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-sand-500">Hold Duration</p>
                        <p className="font-bold text-amber-700">{bookingSettings.holdDurationMinutes} minutes</p>
                      </div>
                      <div>
                        <p className="text-sand-500">Amount Due</p>
                        <p className="font-bold text-primary-600">{formatCurrency(grandTotal)}</p>
                      </div>
                      <div>
                        <p className="text-sand-500">Status</p>
                        <p className="font-bold text-amber-600">ON HOLD</p>
                      </div>
                      <div>
                        <p className="text-sand-500">Payment Required</p>
                        <p className="font-bold text-red-600">Before expiry</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(hasPackagesWithSeats ? 3 : 2)}
              className="px-6 py-3 border border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 ${
                isHoldBooking
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                  : 'bg-gradient-festive text-white hover:shadow-festive'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : isHoldBooking ? (
                <>
                  <Clock className="w-5 h-5" />
                  Create Hold Booking
                </>
              ) : (
                `Create ${packageBookings.length > 1 ? `${packageBookings.length} Bookings` : 'Booking'}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Hold Seats Modal */}
      {holdModalPackage && (
        <HoldSeatsModal
          isOpen={!!holdModalPackage}
          onClose={() => setHoldModalPackage(null)}
          package={holdModalPackage}
          onSuccess={() => {
            // Refresh packages to update seat availability
            fetchPackages();
          }}
        />
      )}
    </div>
  );
};

export default MultiPackageBooking;
