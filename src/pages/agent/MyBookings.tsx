import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { ShareModal } from '../../components/common/ShareModal';
import { HoldTimer, HoldStatusBadge } from '../../components/booking/HoldTimer';
import { bookingsAPI } from '../../services/api';
import { generateInvoicePDF } from '../../utils/invoice';
import { Clock, CreditCard, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  bookingId: string;
  packageId: string;
  agencyId: string;
  agentId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestNid: string;
  emergencyContact: string;
  passengers: { name: string; age: number; seatNumber: string; type: string }[];
  boardingPoint: string;
  droppingPoint: string;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentHistory?: { method: string; transactionId: string; amount: number; paidAt: string }[];
  status: string;
  isHold?: boolean;
  holdExpiresAt?: string;
  source: string;
  notes: string;
  createdAt: string;
  agentName?: string;
}

const STATUS_OPTIONS = [
  { value: 'hold', label: 'On Hold', labelBn: 'হোল্ড', color: 'bg-amber-100 text-amber-700' },
  { value: 'pending', label: 'Pending', labelBn: 'মুলতুবি', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Confirmed', labelBn: 'নিশ্চিত', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', labelBn: 'বাতিল', color: 'bg-red-100 text-red-700' },
  { value: 'completed', label: 'Completed', labelBn: 'সম্পন্ন', color: 'bg-blue-100 text-blue-700' },
  { value: 'expired', label: 'Expired', labelBn: 'মেয়াদ শেষ', color: 'bg-gray-100 text-gray-700' },
];

export const MyBookings: React.FC = () => {
  const { user, agency } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [bookingToShare, setBookingToShare] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [user?.id, filterStatus]);

  const fetchBookings = async () => {
    if (!user?.id) return;

    try {
      // Fetch bookings for this agent
      const params: { agentId: string; status?: string } = { agentId: user.id };
      if (filterStatus) params.status = filterStatus;
      const result = await bookingsAPI.getAll(params);
      setBookings(result.bookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchBookings();
      return;
    }

    setLoading(true);
    try {
      const result = await bookingsAPI.search(searchQuery, user?.agencyId);
      // Filter to only show this agent's bookings from search results
      const agentBookings = result.bookings.filter((b: Booking) => b.agentId === user?.id);
      setBookings(agentBookings);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleShare = (booking: Booking) => {
    setBookingToShare(booking);
    setShowShareModal(true);
  };

  const handleDownloadInvoice = (booking: Booking) => {
    if (!agency) {
      toast.error('Agency information not available');
      return;
    }

    generateInvoicePDF(
      {
        bookingId: booking.bookingId,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        guestEmail: booking.guestEmail,
        guestNid: booking.guestNid,
        passengers: booking.passengers,
        boardingPoint: booking.boardingPoint,
        droppingPoint: booking.droppingPoint,
        totalAmount: booking.totalAmount,
        advancePaid: booking.advancePaid,
        dueAmount: booking.dueAmount,
        paymentMethod: booking.paymentMethod,
        createdAt: booking.createdAt,
      },
      null, // Package info not available in this context
      {
        name: agency.name,
        nameBn: agency.nameBn,
        phone: agency.phone,
        email: agency.email,
        address: agency.address,
      }
    );
    toast.success('Invoice downloaded!');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string, isHold?: boolean) => {
    if (isHold || status === 'hold') return 'bg-amber-100 text-amber-700';
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option?.color || 'bg-gray-100 text-gray-700';
  };

  const getPaymentStatusBadge = (status: string, isHold?: boolean) => {
    if (isHold) return 'bg-amber-100 text-amber-700';
    switch (status) {
      case 'fully_paid': return 'bg-green-100 text-green-700';
      case 'advance_paid': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-red-100 text-red-700';
    }
  };

  const getPaymentStatusLabel = (status: string, isHold?: boolean) => {
    if (isHold) return 'on hold';
    return status.replace('_', ' ');
  };

  // Calculate stats
  const stats = {
    total: bookings.length,
    onHold: bookings.filter(b => b.isHold || b.status === 'hold').length,
    pending: bookings.filter(b => b.status === 'pending' && !b.isHold).length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
    collected: bookings.reduce((sum, b) => sum + b.advancePaid, 0),
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
          My Bookings
        </h1>
        <p className="text-sand-500 mt-1">
          View all bookings you have created
          <span className="font-bengali ml-2">(আমার বুকিংসমূহ)</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-sand-800">{stats.total}</p>
            <p className="text-sand-500 text-sm">Total</p>
          </div>
        </Card>
        <Card className={stats.onHold > 0 ? 'bg-amber-50 border-amber-200' : ''}>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-600">{stats.onHold}</p>
            <p className="text-amber-600 text-sm flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              On Hold
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sand-500 text-sm">Pending</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-sand-500 text-sm">Confirmed</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sand-500 text-sm">Total Value</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary-600">{formatCurrency(stats.collected)}</p>
            <p className="text-sand-500 text-sm">Collected</p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by Booking ID, Name, or Phone..."
                className="w-full px-4 py-3 pl-10 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-sand-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            Search
          </button>
        </div>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length > 0 ? bookings.map((booking) => (
          <Card
            key={booking.id}
            className={`hover:shadow-lg transition-shadow ${
              booking.isHold || booking.status === 'hold'
                ? 'border-l-4 border-l-amber-500 bg-amber-50/30'
                : ''
            }`}
          >
            {/* Hold Timer Banner */}
            {(booking.isHold || booking.status === 'hold') && booking.holdExpiresAt && (
              <div className="mb-4 -mx-4 -mt-4 px-4 py-3 bg-amber-50 border-b border-amber-200 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Payment required to confirm this booking</span>
                  </div>
                  <HoldTimer holdExpiresAt={booking.holdExpiresAt} size="sm" variant="badge" />
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-mono font-bold ${
                  booking.isHold || booking.status === 'hold'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-primary-100 text-primary-700'
                }`}>
                  #{booking.bookingId}
                </div>
                <div>
                  <h3 className="font-bold text-sand-800">{booking.guestName}</h3>
                  <p className="text-sand-500 text-sm">{booking.guestPhone}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <HoldStatusBadge
                      status={booking.status}
                      isHold={booking.isHold}
                      holdExpiresAt={booking.holdExpiresAt}
                      paymentStatus={booking.paymentStatus}
                    />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentStatusBadge(booking.paymentStatus, booking.isHold)}`}>
                      {getPaymentStatusLabel(booking.paymentStatus, booking.isHold)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm text-sand-500">Passengers</p>
                  <p className="font-bold text-sand-800">{booking.passengers.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-sand-500">Total</p>
                  <p className="font-bold text-primary-600">{formatCurrency(booking.totalAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-sand-500">Due</p>
                  <p className={`font-bold ${booking.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(booking.dueAmount)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadInvoice(booking)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Download Invoice PDF"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleShare(booking)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Share via WhatsApp"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleViewDetails(booking)}
                    className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-sand-100 text-sm text-sand-500">
              Created: {formatDate(booking.createdAt)} | Source: <span className="capitalize">{booking.source}</span>
            </div>
          </Card>
        )) : (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-sand-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sand-500">No bookings found.</p>
              <p className="font-bengali text-sand-400 text-sm mt-1">কোনো বুকিং পাওয়া যায়নি</p>
            </div>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-sand-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-sand-800">
                  Booking #{selectedBooking.bookingId}
                </h2>
                <p className="text-sand-500 text-sm">{formatDate(selectedBooking.createdAt)}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-sand-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badges */}
              <div className="flex gap-2">
                <span className={`px-4 py-2 rounded-lg font-medium ${getStatusBadge(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
                <span className={`px-4 py-2 rounded-lg font-medium ${getPaymentStatusBadge(selectedBooking.paymentStatus)}`}>
                  {selectedBooking.paymentStatus.replace('_', ' ')}
                </span>
              </div>

              {/* Guest Info */}
              <div>
                <h3 className="font-semibold text-sand-700 mb-3">Guest Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-sand-500">Name</p>
                    <p className="font-medium">{selectedBooking.guestName}</p>
                  </div>
                  <div>
                    <p className="text-sand-500">Phone</p>
                    <p className="font-medium">{selectedBooking.guestPhone}</p>
                  </div>
                  {selectedBooking.guestEmail && (
                    <div>
                      <p className="text-sand-500">Email</p>
                      <p className="font-medium">{selectedBooking.guestEmail}</p>
                    </div>
                  )}
                  {selectedBooking.guestNid && (
                    <div>
                      <p className="text-sand-500">NID</p>
                      <p className="font-medium">{selectedBooking.guestNid}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Passengers */}
              <div>
                <h3 className="font-semibold text-sand-700 mb-3">Passengers ({selectedBooking.passengers.length})</h3>
                <div className="space-y-2">
                  {selectedBooking.passengers.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-sand-50 rounded-lg">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-sand-500">Age: {p.age} | {p.type}</p>
                      </div>
                      {p.seatNumber && (
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded font-mono text-sm">
                          Seat {p.seatNumber}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Travel Details */}
              {(selectedBooking.boardingPoint || selectedBooking.droppingPoint) && (
                <div>
                  <h3 className="font-semibold text-sand-700 mb-3">Travel Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedBooking.boardingPoint && (
                      <div>
                        <p className="text-sand-500">Boarding Point</p>
                        <p className="font-medium">{selectedBooking.boardingPoint}</p>
                      </div>
                    )}
                    {selectedBooking.droppingPoint && (
                      <div>
                        <p className="text-sand-500">Dropping Point</p>
                        <p className="font-medium">{selectedBooking.droppingPoint}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold text-sand-700 mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-sand-50 rounded-lg text-center">
                    <p className="text-sand-500 text-sm">Total</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedBooking.totalAmount)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-green-600 text-sm">Paid</p>
                    <p className="font-bold text-lg text-green-700">{formatCurrency(selectedBooking.advancePaid)}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-red-600 text-sm">Due</p>
                    <p className="font-bold text-lg text-red-700">{formatCurrency(selectedBooking.dueAmount)}</p>
                  </div>
                  <div className="p-4 bg-sand-50 rounded-lg text-center">
                    <p className="text-sand-500 text-sm">Method</p>
                    <p className="font-bold text-lg capitalize">{selectedBooking.paymentMethod || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <h3 className="font-semibold text-sand-700 mb-3">Notes</h3>
                  <p className="text-sand-600 bg-sand-50 p-4 rounded-lg">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-sand-100 space-y-3">
                <button
                  onClick={() => handleDownloadInvoice(selectedBooking)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Download Invoice PDF
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleShare(selectedBooking);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Share via WhatsApp / Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {bookingToShare && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setBookingToShare(null);
          }}
          booking={{
            bookingId: bookingToShare.bookingId,
            guestName: bookingToShare.guestName,
            guestPhone: bookingToShare.guestPhone,
            totalAmount: bookingToShare.totalAmount,
            advancePaid: bookingToShare.advancePaid,
            dueAmount: bookingToShare.dueAmount,
            passengers: bookingToShare.passengers.length,
            boardingPoint: bookingToShare.boardingPoint,
          }}
          agencyName={agency?.name}
        />
      )}
    </div>
  );
};
