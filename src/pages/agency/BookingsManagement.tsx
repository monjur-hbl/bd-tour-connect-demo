import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { ShareModal } from '../../components/common/ShareModal';
import { HoldTimer, HoldStatusBadge } from '../../components/booking/HoldTimer';
import { bookingsAPI, agenciesAPI } from '../../services/api';
import { generateInvoicePDF } from '../../utils/invoice';
import {
  Clock,
  AlertTriangle,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  CircleDollarSign,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Download,
  XCircle,
  CheckCircle,
  User,
  Users,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentHistoryItem {
  method: string;
  transactionId: string;
  amount: number;
  paidAt: string;
  collectedBy?: string;
  notes?: string;
}

interface Booking {
  id: string;
  bookingId: string;
  packageId: string;
  agencyId: string;
  agentId: string;
  agentName?: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestNid: string;
  emergencyContact: string;
  passengers: { name: string; age: number; seatNumber: string; type: string }[];
  boardingPoint: string;
  droppingPoint: string;
  subtotal?: number;
  discountAmount?: number;
  discountReason?: string;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentHistory?: PaymentHistoryItem[];
  status: string;
  isHold?: boolean;
  holdExpiresAt?: string;
  holdCreatedBy?: 'agent' | 'agency_admin';
  source: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

const STATUS_OPTIONS = [
  { value: 'hold', label: 'On Hold', labelBn: 'হোল্ড', color: 'bg-amber-100 text-amber-700' },
  { value: 'pending', label: 'Pending', labelBn: 'মুলতুবি', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Confirmed', labelBn: 'নিশ্চিত', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', labelBn: 'বাতিল', color: 'bg-red-100 text-red-700' },
  { value: 'completed', label: 'Completed', labelBn: 'সম্পন্ন', color: 'bg-blue-100 text-blue-700' },
  { value: 'expired', label: 'Expired', labelBn: 'মেয়াদ শেষ', color: 'bg-gray-100 text-gray-700' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid', color: 'bg-red-100 text-red-700' },
  { value: 'advance_paid', label: 'Advance Paid', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'fully_paid', label: 'Fully Paid', color: 'bg-green-100 text-green-700' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', labelBn: 'নগদ', icon: <Banknote className="w-4 h-4" />, requiresTxn: false },
  { value: 'bkash', label: 'bKash', labelBn: 'বিকাশ', icon: <Smartphone className="w-4 h-4" />, requiresTxn: true },
  { value: 'nagad', label: 'Nagad', labelBn: 'নগদ', icon: <Smartphone className="w-4 h-4" />, requiresTxn: true },
  { value: 'card', label: 'Card', labelBn: 'কার্ড', icon: <CreditCard className="w-4 h-4" />, requiresTxn: true },
  { value: 'bank', label: 'Bank Transfer', labelBn: 'ব্যাংক', icon: <Building2 className="w-4 h-4" />, requiresTxn: true },
  { value: 'other', label: 'Other', labelBn: 'অন্যান্য', icon: <CircleDollarSign className="w-4 h-4" />, requiresTxn: true },
];

export const BookingsManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [bookingToShare, setBookingToShare] = useState<Booking | null>(null);
  const [agencyName, setAgencyName] = useState<string>('');
  const [agencyData, setAgencyData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'guest' | 'payment' | 'status'>('guest');

  // Full edit form for agency admin
  const [editFormData, setEditFormData] = useState({
    // Guest Info
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guestNid: '',
    emergencyContact: '',
    // Passengers
    passengers: [] as { name: string; age: number; seatNumber: string; type: string }[],
    // Travel Details
    boardingPoint: '',
    droppingPoint: '',
    // Financial
    subtotal: 0,
    discountAmount: 0,
    discountReason: '',
    totalAmount: 0,
    // Status
    status: '',
    notes: '',
    cancelReason: '',
  });

  // New payment form
  const [newPayment, setNewPayment] = useState({
    method: 'cash',
    transactionId: '',
    amount: 0,
    notes: '',
  });

  useEffect(() => {
    fetchBookings();
    fetchAgency();
  }, [user?.agencyId, filterStatus]);

  const fetchAgency = async () => {
    if (!user?.agencyId) return;
    try {
      const result = await agenciesAPI.getById(user.agencyId);
      const agency = result.agency;
      setAgencyName(agency.name);
      setAgencyData(agency);
    } catch (error) {
      console.error('Failed to fetch agency:', error);
    }
  };

  const handleShare = (booking: Booking) => {
    setBookingToShare(booking);
    setShowShareModal(true);
  };

  const handleDownloadInvoice = (booking: Booking) => {
    if (!agencyData) {
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
      null,
      {
        name: agencyData.name,
        nameBn: agencyData.nameBn,
        phone: agencyData.phone,
        email: agencyData.email,
        address: agencyData.address,
      }
    );
    toast.success('Invoice downloaded!');
  };

  const fetchBookings = async () => {
    if (!user?.agencyId) return;

    try {
      const params: { agencyId: string; status?: string } = { agencyId: user.agencyId };
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
      setBookings(result.bookings);
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

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditFormData({
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      guestEmail: booking.guestEmail || '',
      guestNid: booking.guestNid || '',
      emergencyContact: booking.emergencyContact || '',
      passengers: [...booking.passengers],
      boardingPoint: booking.boardingPoint || '',
      droppingPoint: booking.droppingPoint || '',
      subtotal: booking.subtotal || booking.totalAmount + (booking.discountAmount || 0),
      discountAmount: booking.discountAmount || 0,
      discountReason: booking.discountReason || '',
      totalAmount: booking.totalAmount,
      status: booking.status,
      notes: booking.notes || '',
      cancelReason: booking.cancelReason || '',
    });
    setActiveEditTab('guest');
    setShowEditModal(true);
  };

  const handleAddPayment = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewPayment({
      method: 'cash',
      transactionId: '',
      amount: Math.min(booking.dueAmount, booking.dueAmount),
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const paymentMethod = PAYMENT_METHODS.find(m => m.value === newPayment.method);
    if (paymentMethod?.requiresTxn && !newPayment.transactionId.trim()) {
      toast.error('Transaction ID is required for this payment method');
      return;
    }

    if (newPayment.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (newPayment.amount > selectedBooking.dueAmount) {
      toast.error('Amount cannot exceed due amount');
      return;
    }

    setSaving(true);
    try {
      const newAdvancePaid = selectedBooking.advancePaid + newPayment.amount;
      const newDueAmount = selectedBooking.totalAmount - newAdvancePaid;
      const newPaymentStatus = newDueAmount <= 0 ? 'fully_paid' : 'advance_paid';

      const paymentHistoryItem: PaymentHistoryItem = {
        method: newPayment.method,
        transactionId: newPayment.transactionId || `CASH-${Date.now()}`,
        amount: newPayment.amount,
        paidAt: new Date().toISOString(),
        collectedBy: user?.id,
        notes: newPayment.notes,
      };

      const existingHistory = selectedBooking.paymentHistory || [];

      await bookingsAPI.update(selectedBooking.id, {
        advancePaid: newAdvancePaid,
        dueAmount: newDueAmount,
        paymentStatus: newPaymentStatus,
        paymentMethod: newPayment.method,
        paymentHistory: [...existingHistory, paymentHistoryItem],
        // If it was on hold, convert to confirmed
        status: selectedBooking.isHold || selectedBooking.status === 'hold' ? 'confirmed' : selectedBooking.status,
        isHold: false,
        confirmedAt: selectedBooking.isHold || selectedBooking.status === 'hold' ? new Date().toISOString() : selectedBooking.confirmedAt,
      });

      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setSaving(true);
    try {
      const totalAmount = editFormData.subtotal - editFormData.discountAmount;
      const dueAmount = totalAmount - selectedBooking.advancePaid;

      const updateData: any = {
        guestName: editFormData.guestName,
        guestPhone: editFormData.guestPhone,
        guestEmail: editFormData.guestEmail,
        guestNid: editFormData.guestNid,
        emergencyContact: editFormData.emergencyContact,
        passengers: editFormData.passengers,
        boardingPoint: editFormData.boardingPoint,
        droppingPoint: editFormData.droppingPoint,
        subtotal: editFormData.subtotal,
        discountAmount: editFormData.discountAmount,
        discountReason: editFormData.discountReason,
        totalAmount,
        dueAmount,
        status: editFormData.status,
        notes: editFormData.notes,
        updatedAt: new Date().toISOString(),
      };

      // Handle status changes
      if (editFormData.status === 'cancelled' && selectedBooking.status !== 'cancelled') {
        updateData.cancelledAt = new Date().toISOString();
        updateData.cancelReason = editFormData.cancelReason;
      }
      if (editFormData.status === 'confirmed' && selectedBooking.status !== 'confirmed') {
        updateData.confirmedAt = new Date().toISOString();
        updateData.isHold = false;
      }

      await bookingsAPI.update(selectedBooking.id, updateData);
      toast.success('Booking updated successfully');
      setShowEditModal(false);
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    const reason = prompt('Please enter cancellation reason:');
    if (!reason) {
      toast.error('Cancellation reason is required');
      return;
    }

    setSaving(true);
    try {
      await bookingsAPI.update(booking.id, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelReason: reason,
        isHold: false,
      });
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBooking = async (booking: Booking) => {
    if (!confirm('Are you sure you want to DELETE this booking permanently? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      await bookingsAPI.delete(booking.id);
      toast.success('Booking deleted');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete booking');
    } finally {
      setSaving(false);
    }
  };

  const updatePassenger = (index: number, field: string, value: string | number) => {
    setEditFormData(prev => {
      const passengers = [...prev.passengers];
      passengers[index] = { ...passengers[index], [field]: value };
      return { ...prev, passengers };
    });
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
    const option = PAYMENT_STATUS_OPTIONS.find(o => o.value === status);
    return option?.color || 'bg-gray-100 text-gray-700';
  };

  const filteredBookings = bookings.filter(b => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.bookingId.toLowerCase().includes(query) ||
      b.guestName.toLowerCase().includes(query) ||
      b.guestPhone.includes(query)
    );
  });

  // Calculate stats
  const stats = {
    total: bookings.length,
    onHold: bookings.filter(b => b.isHold || b.status === 'hold').length,
    pending: bookings.filter(b => b.status === 'pending' && !b.isHold).length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
    collected: bookings.reduce((sum, b) => sum + b.advancePaid, 0),
    due: bookings.reduce((sum, b) => sum + b.dueAmount, 0),
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
          Bookings Management
        </h1>
        <p className="text-sand-500 mt-1">
          View and manage all bookings
          <span className="font-bengali ml-2">(বুকিং ব্যবস্থাপনা)</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
            <p className="text-xl font-bold text-primary-600">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sand-500 text-sm">Total Value</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">{formatCurrency(stats.collected)}</p>
            <p className="text-sand-500 text-sm">Collected</p>
          </div>
        </Card>
        <Card className={stats.due > 0 ? 'bg-red-50 border-red-200' : ''}>
          <div className="text-center">
            <p className="text-xl font-bold text-red-600">{formatCurrency(stats.due)}</p>
            <p className="text-red-500 text-sm">Due</p>
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

      {/* Bookings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand-100">
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Booking</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Guest</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Pax</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Payment</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Agent</th>
                <th className="text-right py-3 px-4 text-sand-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className={`border-b border-sand-50 hover:bg-sand-50 transition-colors ${
                    booking.isHold || booking.status === 'hold'
                      ? 'bg-amber-50/50'
                      : booking.status === 'cancelled'
                      ? 'bg-red-50/30'
                      : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <div>
                      <span className={`font-mono font-bold ${
                        booking.isHold || booking.status === 'hold'
                          ? 'text-amber-600'
                          : 'text-primary-600'
                      }`}>
                        #{booking.bookingId}
                      </span>
                      {(booking.isHold || booking.status === 'hold') && booking.holdExpiresAt && (
                        <div className="mt-1">
                          <HoldTimer holdExpiresAt={booking.holdExpiresAt} size="sm" variant="inline" />
                        </div>
                      )}
                      <p className="text-xs text-sand-400 mt-1">{formatDate(booking.createdAt)}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-sand-800">{booking.guestName}</p>
                      <p className="text-sm text-sand-500">{booking.guestPhone}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-sand-700">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{booking.passengers.length}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-sand-800">{formatCurrency(booking.totalAmount)}</p>
                      {booking.advancePaid > 0 && (
                        <p className="text-xs text-green-600">Paid: {formatCurrency(booking.advancePaid)}</p>
                      )}
                      {booking.dueAmount > 0 && (
                        <p className="text-xs text-red-500">Due: {formatCurrency(booking.dueAmount)}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <HoldStatusBadge
                      status={booking.status}
                      isHold={booking.isHold}
                      paymentStatus={booking.paymentStatus}
                    />
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(booking.status, booking.isHold)}`}>
                      {booking.isHold || booking.status === 'hold' ? 'On Hold' : booking.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sand-600 text-sm">
                    {booking.agentName || '-'}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* Collect Payment Button - shown if there's due amount */}
                      {booking.dueAmount > 0 && booking.status !== 'cancelled' && (
                        <button
                          onClick={() => handleAddPayment(booking)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="Collect Payment"
                        >
                          <DollarSign className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadInvoice(booking)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Download Invoice"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="p-2 text-sand-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditBooking(booking)}
                        className="p-2 text-sand-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit Booking"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      {booking.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelBooking(booking)}
                          className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Cancel Booking"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBooking(booking)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Booking"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sand-500">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-sand-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-sand-800">
                Booking #{selectedBooking.bookingId}
              </h2>
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
                  {selectedBooking.emergencyContact && (
                    <div>
                      <p className="text-sand-500">Emergency Contact</p>
                      <p className="font-medium">{selectedBooking.emergencyContact}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sand-500">Source</p>
                    <p className="font-medium capitalize">{selectedBooking.source}</p>
                  </div>
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

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold text-sand-700 mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-sand-50 rounded-lg">
                    <p className="text-sand-500 text-sm">Total</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedBooking.totalAmount)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-green-600 text-sm">Paid</p>
                    <p className="font-bold text-lg text-green-700">{formatCurrency(selectedBooking.advancePaid)}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-red-600 text-sm">Due</p>
                    <p className="font-bold text-lg text-red-700">{formatCurrency(selectedBooking.dueAmount)}</p>
                  </div>
                  <div className="p-4 bg-sand-50 rounded-lg">
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
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Edit Modal for Agency Admin */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-sand-100 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-sand-800">
                    Edit Booking #{selectedBooking.bookingId}
                  </h2>
                  <p className="text-sm text-sand-500 mt-1">
                    Full edit access as Agency Admin
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-sand-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                {(['guest', 'payment', 'status'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveEditTab(tab)}
                    className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                      activeEditTab === tab
                        ? 'bg-primary-500 text-white'
                        : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                    }`}
                  >
                    {tab === 'guest' ? 'Guest & Passengers' : tab === 'payment' ? 'Pricing' : 'Status'}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleUpdateBooking} className="p-6 space-y-6">
              {/* Guest & Passengers Tab */}
              {activeEditTab === 'guest' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Guest Name *</label>
                      <input
                        type="text"
                        value={editFormData.guestName}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, guestName: e.target.value }))}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        value={editFormData.guestPhone}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, guestPhone: e.target.value }))}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editFormData.guestEmail}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">NID</label>
                      <input
                        type="text"
                        value={editFormData.guestNid}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, guestNid: e.target.value }))}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Emergency Contact</label>
                      <input
                        type="tel"
                        value={editFormData.emergencyContact}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Boarding Point</label>
                      <input
                        type="text"
                        value={editFormData.boardingPoint}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, boardingPoint: e.target.value }))}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Dropping Point</label>
                      <input
                        type="text"
                        value={editFormData.droppingPoint}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, droppingPoint: e.target.value }))}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Passengers */}
                  <div>
                    <h3 className="font-semibold text-sand-700 mb-3">Passengers ({editFormData.passengers.length})</h3>
                    <div className="space-y-3">
                      {editFormData.passengers.map((passenger, index) => (
                        <div key={index} className="p-4 bg-sand-50 rounded-xl">
                          <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-2">
                              <label className="block text-xs text-sand-500 mb-1">Name</label>
                              <input
                                type="text"
                                value={passenger.name}
                                onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-sand-500 mb-1">Age</label>
                              <input
                                type="number"
                                value={passenger.age}
                                onChange={(e) => updatePassenger(index, 'age', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                min={0}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-sand-500 mb-1">Seat</label>
                              <input
                                type="text"
                                value={passenger.seatNumber || ''}
                                onChange={(e) => updatePassenger(index, 'seatNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Pricing Tab */}
              {activeEditTab === 'payment' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Subtotal</label>
                      <input
                        type="number"
                        value={editFormData.subtotal}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, subtotal: Number(e.target.value) }))}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Discount Amount</label>
                      <input
                        type="number"
                        value={editFormData.discountAmount}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, discountAmount: Number(e.target.value) }))}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        min={0}
                      />
                    </div>
                  </div>

                  {editFormData.discountAmount > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Discount Reason</label>
                      <input
                        type="text"
                        value={editFormData.discountReason}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, discountReason: e.target.value }))}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Early bird, Group discount..."
                      />
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-sand-50 rounded-xl p-4">
                    <h4 className="font-semibold text-sand-700 mb-3">Pricing Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-sand-600">Subtotal</span>
                        <span className="font-medium">{formatCurrency(editFormData.subtotal)}</span>
                      </div>
                      {editFormData.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-{formatCurrency(editFormData.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-sand-200 pt-2 font-bold text-base">
                        <span>Total</span>
                        <span>{formatCurrency(editFormData.subtotal - editFormData.discountAmount)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Already Paid</span>
                        <span>{formatCurrency(selectedBooking.advancePaid)}</span>
                      </div>
                      <div className="flex justify-between text-red-600 font-medium">
                        <span>New Due Amount</span>
                        <span>{formatCurrency(editFormData.subtotal - editFormData.discountAmount - selectedBooking.advancePaid)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment History */}
                  {selectedBooking.paymentHistory && selectedBooking.paymentHistory.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sand-700 mb-3">Payment History</h4>
                      <div className="space-y-2">
                        {selectedBooking.paymentHistory.map((payment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <p className="font-medium text-green-700">{formatCurrency(payment.amount)}</p>
                              <p className="text-xs text-green-600">
                                {payment.method.toUpperCase()} • {payment.transactionId}
                              </p>
                            </div>
                            <p className="text-xs text-sand-500">
                              {new Date(payment.paidAt).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Status Tab */}
              {activeEditTab === 'status' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Booking Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {editFormData.status === 'cancelled' && (
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Cancellation Reason *</label>
                      <textarea
                        value={editFormData.cancelReason}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, cancelReason: e.target.value }))}
                        rows={2}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required={editFormData.status === 'cancelled'}
                        placeholder="Enter reason for cancellation..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Internal Notes</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Add any internal notes..."
                    />
                  </div>

                  {/* Booking Info */}
                  <div className="bg-sand-50 rounded-xl p-4 text-sm">
                    <h4 className="font-semibold text-sand-700 mb-3">Booking Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sand-500">Created At</p>
                        <p className="font-medium">{formatDate(selectedBooking.createdAt)}</p>
                      </div>
                      {selectedBooking.confirmedAt && (
                        <div>
                          <p className="text-sand-500">Confirmed At</p>
                          <p className="font-medium">{formatDate(selectedBooking.confirmedAt)}</p>
                        </div>
                      )}
                      {selectedBooking.cancelledAt && (
                        <div>
                          <p className="text-sand-500">Cancelled At</p>
                          <p className="font-medium text-red-600">{formatDate(selectedBooking.cancelledAt)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sand-500">Source</p>
                        <p className="font-medium capitalize">{selectedBooking.source}</p>
                      </div>
                      <div>
                        <p className="text-sand-500">Booked By</p>
                        <p className="font-medium">{selectedBooking.agentName || 'Agency Admin'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4 border-t border-sand-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-sand-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-sand-800">
                    Collect Payment
                  </h2>
                  <p className="text-sm text-sand-500 mt-1">
                    Booking #{selectedBooking.bookingId}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-sand-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              {/* Amount Summary */}
              <div className="bg-sand-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-sand-600">Total Amount</span>
                  <span className="font-medium">{formatCurrency(selectedBooking.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2 text-green-600">
                  <span>Already Paid</span>
                  <span>{formatCurrency(selectedBooking.advancePaid)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-red-600 border-t border-sand-200 pt-2">
                  <span>Due Amount</span>
                  <span>{formatCurrency(selectedBooking.dueAmount)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setNewPayment(prev => ({ ...prev, method: method.value, transactionId: '' }))}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        newPayment.method === method.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-sand-200 hover:border-sand-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {method.icon}
                        <span className="text-xs font-medium">{method.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Amount *</label>
                <input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min={1}
                  max={selectedBooking.dueAmount}
                  required
                />
                <p className="text-xs text-sand-500 mt-1">
                  Max: {formatCurrency(selectedBooking.dueAmount)}
                </p>
              </div>

              {/* Transaction ID */}
              {PAYMENT_METHODS.find(m => m.value === newPayment.method)?.requiresTxn && (
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Transaction ID *</label>
                  <input
                    type="text"
                    value={newPayment.transactionId}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, transactionId: e.target.value }))}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter transaction reference"
                    required
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Notes</label>
                <textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Optional notes..."
                />
              </div>

              {/* Hold Booking Notice */}
              {(selectedBooking.isHold || selectedBooking.status === 'hold') && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700">Booking will be confirmed</p>
                    <p className="text-sm text-green-600">This hold booking will be automatically confirmed once payment is received.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-3 border border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5" />
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </form>
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
          agencyName={agencyName}
        />
      )}
    </div>
  );
};
