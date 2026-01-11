import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { packagesAPI, bookingsAPI } from '../../services/api';
import { BusSeatLayoutPicker } from '../../components/seats';
import { SeatLayout, BusConfiguration, PassengerGender } from '../../types';
import { getSeatById } from '../../utils/seatUtils';
import toast from 'react-hot-toast';

interface Package {
  id: string;
  title: string;
  titleBn: string;
  destination: string;
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
  status: string;
  busConfiguration?: BusConfiguration;
  seatLayout?: SeatLayout;
}

interface Passenger {
  name: string;
  age: number;
  type: 'adult' | 'child';
  seatNumber: string;
  gender: PassengerGender;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', labelBn: 'নগদ' },
  { value: 'bkash', label: 'bKash', labelBn: 'বিকাশ' },
  { value: 'nagad', label: 'Nagad', labelBn: 'নগদ' },
  { value: 'bank', label: 'Bank Transfer', labelBn: 'ব্যাংক ট্রান্সফার' },
  { value: 'card', label: 'Card', labelBn: 'কার্ড' },
];

const SOURCE_OPTIONS = [
  { value: 'walk-in', label: 'Walk-in', labelBn: 'সরাসরি' },
  { value: 'phone', label: 'Phone', labelBn: 'ফোন' },
  { value: 'whatsapp', label: 'WhatsApp', labelBn: 'হোয়াটসঅ্যাপ' },
  { value: 'messenger', label: 'Messenger', labelBn: 'মেসেঞ্জার' },
  { value: 'web', label: 'Website', labelBn: 'ওয়েবসাইট' },
];

export const NewBooking: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Package, 2: Guest Details, 3: Payment

  // Form state
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guestNid: '',
    emergencyContact: '',
    boardingPoint: '',
    droppingPoint: '',
    customDroppingPoint: '',
    useCustomDroppingPoint: false,
    paymentMethod: 'cash',
    advancePaid: 0,
    source: 'walk-in',
    notes: '',
  });

  const [passengers, setPassengers] = useState<Passenger[]>([
    { name: '', age: 30, type: 'adult', seatNumber: '', gender: 'male' }
  ]);

  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  useEffect(() => {
    fetchPackages();

    // Check if package was passed from AvailablePackages page
    if (location.state?.package) {
      setSelectedPackage(location.state.package);
      setStep(2);
    }
  }, [location.state]);

  const fetchPackages = async () => {
    if (!user?.agencyId) return;

    try {
      const result = await packagesAPI.getAll({ agencyId: user.agencyId, status: 'current' });
      setPackages(result.packages);

      // Also fetch future packages
      const futureResult = await packagesAPI.getAll({ agencyId: user.agencyId, status: 'future' });
      setPackages(prev => [...prev, ...futureResult.packages]);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormData(prev => ({
      ...prev,
      advancePaid: pkg.advanceAmount,
      boardingPoint: pkg.boardingPoints?.[0]?.name || '',
      droppingPoint: pkg.droppingPoints?.[0]?.name || '',
    }));
    setStep(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePassengerChange = (index: number, field: keyof Passenger, value: any) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-set type based on age
      if (field === 'age') {
        updated[index].type = Number(value) < 12 ? 'child' : 'adult';
      }

      return updated;
    });
  };

  const addPassenger = () => {
    setPassengers(prev => [...prev, { name: '', age: 30, type: 'adult', seatNumber: '', gender: 'male' }]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    if (!selectedPackage) return { total: 0, adults: 0, children: 0 };

    const adults = passengers.filter(p => p.type === 'adult').length;
    const children = passengers.filter(p => p.type === 'child').length;

    const adultTotal = adults * selectedPackage.pricePerPerson;
    const childTotal = children * (selectedPackage.childPrice || selectedPackage.pricePerPerson * 0.7);

    return {
      total: adultTotal + childTotal,
      adults,
      children,
      adultTotal,
      childTotal,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !user?.agencyId) return;

    // Validation
    if (!formData.guestName || !formData.guestPhone) {
      toast.error('Guest name and phone are required');
      return;
    }

    const validPassengers = passengers.filter(p => p.name.trim());
    if (validPassengers.length === 0) {
      toast.error('At least one passenger is required');
      return;
    }

    // Validate seat selection if seat layout is available
    if (selectedPackage.seatLayout && selectedSeatIds.length !== validPassengers.length) {
      toast.error(`Please select ${validPassengers.length} seat(s) for your passengers`);
      return;
    }

    setSubmitting(true);

    try {
      const { total } = calculateTotal();

      // Assign seats to passengers
      const passengersWithSeats = validPassengers.map((p, index) => ({
        ...p,
        seatNumber: selectedSeatIds[index] || p.seatNumber,
        seatId: selectedSeatIds[index] || undefined,
      }));

      // Determine dropping point
      const droppingPoint = formData.useCustomDroppingPoint
        ? formData.customDroppingPoint
        : formData.droppingPoint;

      const bookingData = {
        packageId: selectedPackage.id,
        agencyId: user.agencyId,
        agentId: user.id,
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        guestEmail: formData.guestEmail || undefined,
        guestNid: formData.guestNid || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        passengers: passengersWithSeats,
        boardingPoint: formData.boardingPoint || undefined,
        droppingPoint: droppingPoint || undefined,
        customDroppingPoint: formData.useCustomDroppingPoint ? formData.customDroppingPoint : undefined,
        totalAmount: total,
        advancePaid: Number(formData.advancePaid) || 0,
        paymentMethod: formData.paymentMethod,
        source: formData.source,
        notes: formData.notes || undefined,
        selectedSeatIds: selectedSeatIds.length > 0 ? selectedSeatIds : undefined,
      };

      const result = await bookingsAPI.create(bookingData);
      toast.success(`Booking created! ID: #${result.bookingId}`);
      navigate('/agent/bookings');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sand-800 font-display">
          Create New Booking
        </h1>
        <p className="text-sand-500 mt-1">
          Book a tour package for your customer
          <span className="font-bengali ml-2">(নতুন বুকিং করুন)</span>
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${step >= s ? 'text-primary-600' : 'text-sand-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-primary-500 text-white' : 'bg-sand-200'
              }`}>
                {s}
              </div>
              <span className="font-medium hidden md:inline">
                {s === 1 ? 'Select Package' : s === 2 ? 'Guest Details' : 'Payment'}
              </span>
            </div>
            {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-primary-500' : 'bg-sand-200'}`}></div>}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Package */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-sand-700">Select a Tour Package</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.filter(p => p.availableSeats > 0).map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPackage?.id === pkg.id ? 'ring-2 ring-primary-500' : ''
                }`}
                onClick={() => handlePackageSelect(pkg)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sand-800">{pkg.destination}</h3>
                      <p className="text-sm text-sand-500">{pkg.title}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pkg.status === 'current' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {pkg.status}
                    </span>
                  </div>
                  <div className="text-sm text-sand-600">
                    <p>{formatDate(pkg.departureDate)} - {formatDate(pkg.returnDate)}</p>
                    <p>{pkg.availableSeats} seats available</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-primary-600">{formatCurrency(pkg.pricePerPerson)}</p>
                    <span className="text-sm text-sand-500">per person</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {packages.filter(p => p.availableSeats > 0).length === 0 && (
            <Card>
              <div className="text-center py-8">
                <p className="text-sand-500">No packages available for booking.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Step 2 & 3: Booking Form */}
      {step >= 2 && selectedPackage && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected Package Summary */}
          <Card className="bg-primary-50 border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-primary-800">{selectedPackage.destination}</h3>
                <p className="text-primary-600 text-sm">{selectedPackage.title}</p>
                <p className="text-primary-500 text-sm mt-1">
                  {formatDate(selectedPackage.departureDate)} - {formatDate(selectedPackage.returnDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setStep(1); setSelectedPackage(null); }}
                className="px-4 py-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
              >
                Change
              </button>
            </div>
          </Card>

          {step === 2 && (
            <>
              {/* Guest Information */}
              <Card>
                <h3 className="font-semibold text-sand-700 mb-4">Guest Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Guest Name *</label>
                    <input
                      type="text"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      name="guestPhone"
                      value={formData.guestPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="01XXXXXXXXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="guestEmail"
                      value={formData.guestEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">NID Number</label>
                    <input
                      type="text"
                      name="guestNid"
                      value={formData.guestNid}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Source</label>
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {SOURCE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Passengers */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sand-700">Passengers</h3>
                  <button
                    type="button"
                    onClick={addPassenger}
                    disabled={passengers.length >= selectedPackage.availableSeats}
                    className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    + Add Passenger
                  </button>
                </div>
                <div className="space-y-4">
                  {passengers.map((passenger, index) => (
                    <div key={index} className="flex gap-4 items-start p-4 bg-sand-50 rounded-xl">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-sand-700 mb-1">Name *</label>
                          <input
                            type="text"
                            value={passenger.name}
                            onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-sand-700 mb-1">Age</label>
                          <input
                            type="number"
                            value={passenger.age}
                            onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                            className="w-full px-3 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min={1}
                            max={100}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-sand-700 mb-1">Gender</label>
                          <select
                            value={passenger.gender}
                            onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                            className="w-full px-3 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-sand-700 mb-1">Type</label>
                          <span className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${
                            passenger.type === 'adult' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {passenger.type === 'adult' ? 'Adult' : 'Child'}
                          </span>
                        </div>
                      </div>
                      {passengers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePassenger(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Seat Selection - only show if package has seat layout */}
              {selectedPackage.seatLayout && (
                <Card>
                  <BusSeatLayoutPicker
                    seatLayout={selectedPackage.seatLayout}
                    maxSeats={passengers.filter(p => p.name.trim()).length || 1}
                    selectedSeatIds={selectedSeatIds}
                    onSelectionChange={setSelectedSeatIds}
                    pricePerSeat={selectedPackage.pricePerPerson}
                    showBilingual
                  />
                </Card>
              )}

              {/* Travel Details */}
              <Card>
                <h3 className="font-semibold text-sand-700 mb-4">
                  Travel Details
                  <span className="font-bengali text-sand-500 font-normal ml-2">(ভ্রমণের বিবরণ)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPackage.boardingPoints && selectedPackage.boardingPoints.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">
                        Boarding Point
                        <span className="font-bengali text-sand-500 ml-1">(বোর্ডিং পয়েন্ট)</span>
                      </label>
                      <select
                        name="boardingPoint"
                        value={formData.boardingPoint}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select boarding point</option>
                        {selectedPackage.boardingPoints.map(bp => (
                          <option key={bp.id} value={bp.name}>
                            {bp.name} {bp.time ? `(${bp.time})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Dropping Point with Custom Option */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-sand-700">
                      Dropping Point
                      <span className="font-bengali text-sand-500 ml-1">(ড্রপিং পয়েন্ট)</span>
                    </label>

                    {/* Toggle for custom dropping point */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, useCustomDroppingPoint: false }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          !formData.useCustomDroppingPoint
                            ? 'bg-primary-500 text-white'
                            : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                        }`}
                      >
                        Predefined
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, useCustomDroppingPoint: true }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.useCustomDroppingPoint
                            ? 'bg-primary-500 text-white'
                            : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                        }`}
                      >
                        Custom / Mid-way
                        <span className="font-bengali ml-1">(মাঝপথে)</span>
                      </button>
                    </div>

                    {/* Predefined dropdown or custom input */}
                    {!formData.useCustomDroppingPoint ? (
                      selectedPackage.droppingPoints && selectedPackage.droppingPoints.length > 0 ? (
                        <select
                          name="droppingPoint"
                          value={formData.droppingPoint}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select dropping point</option>
                          {selectedPackage.droppingPoints.map(dp => (
                            <option key={dp.id} value={dp.name}>{dp.name}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-sand-500 italic">No predefined dropping points available</p>
                      )
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          name="customDroppingPoint"
                          value={formData.customDroppingPoint}
                          onChange={handleChange}
                          placeholder="Enter custom dropping location..."
                          className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <p className="text-xs text-sand-500">
                          <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          For passengers dropping off at a location not in the predefined list
                          <span className="font-bengali block mt-0.5">যাত্রীদের জন্য যারা তালিকাভুক্ত নয় এমন স্থানে নামবেন</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                >
                  Continue to Payment
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Payment Details */}
              <Card>
                <h3 className="font-semibold text-sand-700 mb-4">Payment Details</h3>

                {/* Price Summary */}
                <div className="mb-6 p-4 bg-sand-50 rounded-xl">
                  <div className="space-y-2">
                    {calculateTotal().adults > 0 && (
                      <div className="flex justify-between">
                        <span>{calculateTotal().adults} Adult(s) x {formatCurrency(selectedPackage.pricePerPerson)}</span>
                        <span>{formatCurrency(calculateTotal().adultTotal || 0)}</span>
                      </div>
                    )}
                    {calculateTotal().children > 0 && (
                      <div className="flex justify-between">
                        <span>{calculateTotal().children} Child(ren) x {formatCurrency(selectedPackage.childPrice || selectedPackage.pricePerPerson * 0.7)}</span>
                        <span>{formatCurrency(calculateTotal().childTotal || 0)}</span>
                      </div>
                    )}
                    <div className="border-t border-sand-200 pt-2 mt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount</span>
                        <span className="text-primary-600">{formatCurrency(calculateTotal().total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {PAYMENT_METHODS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">
                      Advance Paid (Min: {formatCurrency(selectedPackage.advanceAmount)})
                    </label>
                    <input
                      type="number"
                      name="advancePaid"
                      value={formData.advancePaid}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={0}
                      max={calculateTotal().total}
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-800 font-medium">Due Amount</span>
                    <span className="text-2xl font-bold text-yellow-700">
                      {formatCurrency(calculateTotal().total - (Number(formData.advancePaid) || 0))}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              <Card>
                <h3 className="font-semibold text-sand-700 mb-4">Additional Notes</h3>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Any special requests or notes..."
                />
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Creating Booking...' : 'Create Booking'}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
};
