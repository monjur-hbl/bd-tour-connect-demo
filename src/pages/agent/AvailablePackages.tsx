import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { packagesAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Package {
  id: string;
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
  couplePrice: number;
  childPrice: number;
  advanceAmount: number;
  boardingPoints: { id: string; name: string; nameBn: string; time: string; address: string }[];
  droppingPoints: { id: string; name: string; nameBn: string; time: string; address: string }[];
  inclusions: string[];
  exclusions: string[];
  status: string;
  createdAt: string;
}

export const AvailablePackages: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('current');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, [user?.agencyId, filterStatus]);

  const fetchPackages = async () => {
    if (!user?.agencyId) return;

    try {
      const params: { agencyId: string; status?: string } = { agencyId: user.agencyId };
      if (filterStatus) params.status = filterStatus;
      const result = await packagesAPI.getAll(params);
      setPackages(result.packages);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowDetailModal(true);
  };

  const handleCreateBooking = (pkg: Package) => {
    // Navigate to new booking page with package ID
    navigate('/agent/new-booking', { state: { packageId: pkg.id, package: pkg } });
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

  const getDaysCount = (departure: string, returnDate: string) => {
    const start = new Date(departure);
    const end = new Date(returnDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const percent = (available / total) * 100;
    if (percent > 50) return 'text-green-600 bg-green-100';
    if (percent > 20) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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
          Available Packages
        </h1>
        <p className="text-sand-500 mt-1">
          Browse and book from available tour packages
          <span className="font-bengali ml-2">(উপলব্ধ প্যাকেজ)</span>
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['current', 'future'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              filterStatus === status
                ? 'bg-primary-500 text-white'
                : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
            }`}
          >
            {status} Packages
          </button>
        ))}
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.length > 0 ? packages.map((pkg) => (
          <Card key={pkg.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            {/* Package Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 -mx-6 -mt-6 px-6 py-4 mb-4">
              <div className="flex items-start justify-between">
                <div className="text-white">
                  <h3 className="font-bold text-lg">{pkg.destination}</h3>
                  {pkg.destinationBn && <p className="text-primary-100 text-sm font-bengali">{pkg.destinationBn}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getAvailabilityColor(pkg.availableSeats, pkg.totalSeats)}`}>
                  {pkg.availableSeats} seats
                </span>
              </div>
            </div>

            {/* Package Content */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sand-800">{pkg.title}</h4>
                {pkg.titleBn && <p className="text-sand-500 text-sm font-bengali">{pkg.titleBn}</p>}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-sand-600">
                  <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(pkg.departureDate)} - {formatDate(pkg.returnDate)}</span>
                  <span className="text-primary-600 font-medium">({getDaysCount(pkg.departureDate, pkg.returnDate)} days)</span>
                </div>

                {pkg.departureTime && (
                  <div className="flex items-center gap-2 text-sand-600">
                    <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Departure: {pkg.departureTime}</span>
                  </div>
                )}

                {pkg.vehicleType && (
                  <div className="flex items-center gap-2 text-sand-600">
                    <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>{pkg.vehicleType}</span>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="pt-4 border-t border-sand-100">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary-600">{formatCurrency(pkg.pricePerPerson)}</p>
                    <p className="text-xs text-sand-500">per person</p>
                    {pkg.advanceAmount > 0 && (
                      <p className="text-sm text-secondary-600 mt-1">
                        Advance: {formatCurrency(pkg.advanceAmount)}
                      </p>
                    )}
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleViewDetails(pkg)}
                      className="px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium text-sm"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleCreateBooking(pkg)}
                      disabled={pkg.availableSeats === 0}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )) : (
          <div className="col-span-full">
            <Card>
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-sand-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sand-500">No {filterStatus} packages available.</p>
                <p className="font-bengali text-sand-400 text-sm mt-1">কোনো প্যাকেজ পাওয়া যায়নি</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{selectedPackage.destination}</h2>
                  {selectedPackage.destinationBn && <p className="text-primary-100 font-bengali">{selectedPackage.destinationBn}</p>}
                  <p className="mt-2 text-primary-100">{selectedPackage.title}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Schedule */}
              <div>
                <h3 className="font-semibold text-sand-700 mb-3">Schedule</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-sand-500">Departure</p>
                    <p className="font-medium">{formatDate(selectedPackage.departureDate)} at {selectedPackage.departureTime || 'TBA'}</p>
                  </div>
                  <div>
                    <p className="text-sand-500">Return</p>
                    <p className="font-medium">{formatDate(selectedPackage.returnDate)}</p>
                  </div>
                  <div>
                    <p className="text-sand-500">Duration</p>
                    <p className="font-medium">{getDaysCount(selectedPackage.departureDate, selectedPackage.returnDate)} days</p>
                  </div>
                  <div>
                    <p className="text-sand-500">Vehicle</p>
                    <p className="font-medium">{selectedPackage.vehicleType || 'TBA'}</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="font-semibold text-sand-700 mb-3">Pricing</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-primary-50 rounded-lg text-center">
                    <p className="text-primary-600 text-sm">Per Person</p>
                    <p className="font-bold text-primary-700">{formatCurrency(selectedPackage.pricePerPerson)}</p>
                  </div>
                  {selectedPackage.couplePrice > 0 && (
                    <div className="p-3 bg-secondary-50 rounded-lg text-center">
                      <p className="text-secondary-600 text-sm">Couple</p>
                      <p className="font-bold text-secondary-700">{formatCurrency(selectedPackage.couplePrice)}</p>
                    </div>
                  )}
                  {selectedPackage.childPrice > 0 && (
                    <div className="p-3 bg-accent-50 rounded-lg text-center">
                      <p className="text-accent-600 text-sm">Child</p>
                      <p className="font-bold text-accent-700">{formatCurrency(selectedPackage.childPrice)}</p>
                    </div>
                  )}
                  {selectedPackage.advanceAmount > 0 && (
                    <div className="p-3 bg-sand-100 rounded-lg text-center">
                      <p className="text-sand-600 text-sm">Advance</p>
                      <p className="font-bold text-sand-700">{formatCurrency(selectedPackage.advanceAmount)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="font-semibold text-sand-700 mb-3">Availability</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-4 bg-sand-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${((selectedPackage.totalSeats - selectedPackage.availableSeats) / selectedPackage.totalSeats) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-medium text-sand-700">
                    {selectedPackage.availableSeats} / {selectedPackage.totalSeats} seats available
                  </span>
                </div>
              </div>

              {/* Inclusions */}
              {selectedPackage.inclusions && selectedPackage.inclusions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sand-700 mb-3">Inclusions</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPackage.inclusions.map((item, i) => (
                      <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Exclusions */}
              {selectedPackage.exclusions && selectedPackage.exclusions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sand-700 mb-3">Exclusions</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPackage.exclusions.map((item, i) => (
                      <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedPackage.description && (
                <div>
                  <h3 className="font-semibold text-sand-700 mb-3">Description</h3>
                  <p className="text-sand-600">{selectedPackage.description}</p>
                  {selectedPackage.descriptionBn && (
                    <p className="text-sand-500 font-bengali mt-2">{selectedPackage.descriptionBn}</p>
                  )}
                </div>
              )}

              {/* Action */}
              <div className="pt-4 border-t border-sand-100">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleCreateBooking(selectedPackage);
                  }}
                  disabled={selectedPackage.availableSeats === 0}
                  className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {selectedPackage.availableSeats > 0 ? 'Book This Package' : 'No Seats Available'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
