import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { ShareModal } from '../../components/common/ShareModal';
import { bookingsAPI, agenciesAPI } from '../../services/api';
import { generateInvoicePDF } from '../../utils/invoice';
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
  status: string;
  source: string;
  notes: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', labelBn: 'মুলতুবি', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Confirmed', labelBn: 'নিশ্চিত', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', labelBn: 'বাতিল', color: 'bg-red-100 text-red-700' },
  { value: 'completed', label: 'Completed', labelBn: 'সম্পন্ন', color: 'bg-blue-100 text-blue-700' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid', color: 'bg-red-100 text-red-700' },
  { value: 'advance_paid', label: 'Advance Paid', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'fully_paid', label: 'Fully Paid', color: 'bg-green-100 text-green-700' },
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [bookingToShare, setBookingToShare] = useState<Booking | null>(null);
  const [agencyName, setAgencyName] = useState<string>('');
  const [agencyData, setAgencyData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [editFormData, setEditFormData] = useState({
    status: '',
    advancePaid: 0,
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
      status: booking.status,
      advancePaid: booking.advancePaid,
      notes: booking.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setSaving(true);
    try {
      const dueAmount = selectedBooking.totalAmount - editFormData.advancePaid;
      await bookingsAPI.update(selectedBooking.id, {
        ...editFormData,
        dueAmount,
        totalAmount: selectedBooking.totalAmount,
      });
      toast.success('Booking updated successfully');
      setShowEditModal(false);
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setSaving(false);
    }
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

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option?.color || 'bg-gray-100 text-gray-700';
  };

  const getPaymentStatusBadge = (status: string) => {
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
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Booking ID</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Guest</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Passengers</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Payment</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Date</th>
                <th className="text-right py-3 px-4 text-sand-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-sand-50 hover:bg-sand-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-mono font-bold text-primary-600">#{booking.bookingId}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-sand-800">{booking.guestName}</p>
                      <p className="text-sm text-sand-500">{booking.guestPhone}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium">{booking.passengers.length}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-sand-800">{formatCurrency(booking.totalAmount)}</p>
                      {booking.dueAmount > 0 && (
                        <p className="text-sm text-red-500">Due: {formatCurrency(booking.dueAmount)}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(booking.paymentStatus)}`}>
                      {booking.paymentStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sand-600 text-sm">
                    {formatDate(booking.createdAt)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownloadInvoice(booking)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Download Invoice"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleShare(booking)}
                        className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Share via WhatsApp"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="p-2 text-sand-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditBooking(booking)}
                        className="p-2 text-sand-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
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

      {/* Edit Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-sand-100">
              <h2 className="text-xl font-bold text-sand-800">
                Update Booking #{selectedBooking.bookingId}
              </h2>
            </div>

            <form onSubmit={handleUpdateBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Status</label>
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

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">
                  Amount Paid (Total: {formatCurrency(selectedBooking.totalAmount)})
                </label>
                <input
                  type="number"
                  value={editFormData.advancePaid}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, advancePaid: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min={0}
                  max={selectedBooking.totalAmount}
                />
                <p className="text-sm text-sand-500 mt-1">
                  Due: {formatCurrency(selectedBooking.totalAmount - editFormData.advancePaid)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Notes</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
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
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Update Booking'}
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
