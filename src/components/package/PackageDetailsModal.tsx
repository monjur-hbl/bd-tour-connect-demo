import React, { useState } from 'react';
import { SeatAvailabilityViewer } from '../seats';
import { SeatLayout, BusConfiguration } from '../../types';

interface PackageData {
  id: string;
  title: string;
  titleBn?: string;
  destination: string;
  destinationBn?: string;
  description?: string;
  descriptionBn?: string;
  departureDate: string;
  returnDate: string;
  departureTime?: string;
  vehicleType?: string;
  totalSeats: number;
  availableSeats: number;
  pricePerPerson: number;
  couplePrice?: number;
  childPrice?: number;
  advanceAmount?: number;
  boardingPoints?: { id: string; name: string; nameBn?: string; time: string; address?: string }[];
  droppingPoints?: { id: string; name: string; nameBn?: string; time?: string; address?: string }[];
  inclusions?: string[];
  exclusions?: string[];
  status: string;
  busConfiguration?: BusConfiguration;
  seatLayout?: SeatLayout;
}

interface PackageDetailsModalProps {
  package: PackageData;
  onClose: () => void;
  onBook?: () => void;
  showBilingual?: boolean;
}

export const PackageDetailsModal: React.FC<PackageDetailsModalProps> = ({
  package: pkg,
  onClose,
  onBook,
  showBilingual = true,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'seats'>('details');

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

  const hasSeatLayout = pkg.seatLayout && pkg.busConfiguration;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
          <div className="flex items-start justify-between">
            <div className="text-white">
              <h2 className="text-2xl font-bold">{pkg.destination}</h2>
              {showBilingual && pkg.destinationBn && (
                <p className="text-primary-100 font-bengali">{pkg.destinationBn}</p>
              )}
              <p className="mt-2 text-primary-100">{pkg.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-sand-200 bg-sand-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'details'
                  ? 'text-primary-600'
                  : 'text-sand-500 hover:text-sand-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Details</span>
                {showBilingual && <span className="font-bengali text-xs">(বিবরণ)</span>}
              </div>
              {activeTab === 'details' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('seats')}
              disabled={!hasSeatLayout}
              className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'seats'
                  ? 'text-primary-600'
                  : !hasSeatLayout
                  ? 'text-sand-300 cursor-not-allowed'
                  : 'text-sand-500 hover:text-sand-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span>Seat Availability</span>
                {showBilingual && <span className="font-bengali text-xs">(সিট)</span>}
                {!hasSeatLayout && (
                  <span className="text-xs text-sand-400 ml-1">(N/A)</span>
                )}
              </div>
              {activeTab === 'seats' && hasSeatLayout && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Schedule */}
              <div>
                <h3 className="font-semibold text-sand-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                  {showBilingual && <span className="font-bengali text-sand-400 font-normal text-sm">(সময়সূচী)</span>}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-sand-50 rounded-lg">
                    <p className="text-sand-500">Departure</p>
                    <p className="font-medium">{formatDate(pkg.departureDate)}</p>
                    {pkg.departureTime && <p className="text-primary-600">{pkg.departureTime}</p>}
                  </div>
                  <div className="p-3 bg-sand-50 rounded-lg">
                    <p className="text-sand-500">Return</p>
                    <p className="font-medium">{formatDate(pkg.returnDate)}</p>
                  </div>
                  <div className="p-3 bg-sand-50 rounded-lg">
                    <p className="text-sand-500">Duration</p>
                    <p className="font-medium">{getDaysCount(pkg.departureDate, pkg.returnDate)} days</p>
                  </div>
                  <div className="p-3 bg-sand-50 rounded-lg">
                    <p className="text-sand-500">Vehicle</p>
                    <p className="font-medium">{pkg.vehicleType || 'TBA'}</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="font-semibold text-sand-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pricing
                  {showBilingual && <span className="font-bengali text-sand-400 font-normal text-sm">(মূল্য)</span>}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-primary-50 rounded-xl text-center">
                    <p className="text-primary-600 text-sm">Per Person</p>
                    <p className="font-bold text-xl text-primary-700">{formatCurrency(pkg.pricePerPerson)}</p>
                  </div>
                  {pkg.couplePrice && pkg.couplePrice > 0 && (
                    <div className="p-4 bg-secondary-50 rounded-xl text-center">
                      <p className="text-secondary-600 text-sm">Couple</p>
                      <p className="font-bold text-xl text-secondary-700">{formatCurrency(pkg.couplePrice)}</p>
                    </div>
                  )}
                  {pkg.childPrice && pkg.childPrice > 0 && (
                    <div className="p-4 bg-accent-50 rounded-xl text-center">
                      <p className="text-accent-600 text-sm">Child</p>
                      <p className="font-bold text-xl text-accent-700">{formatCurrency(pkg.childPrice)}</p>
                    </div>
                  )}
                  {pkg.advanceAmount && pkg.advanceAmount > 0 && (
                    <div className="p-4 bg-sand-100 rounded-xl text-center">
                      <p className="text-sand-600 text-sm">Advance</p>
                      <p className="font-bold text-xl text-sand-700">{formatCurrency(pkg.advanceAmount)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="font-semibold text-sand-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Availability
                  {showBilingual && <span className="font-bengali text-sand-400 font-normal text-sm">(প্রাপ্যতা)</span>}
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-4 bg-sand-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${((pkg.totalSeats - pkg.availableSeats) / pkg.totalSeats) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium text-sand-700 whitespace-nowrap">
                    {pkg.availableSeats} / {pkg.totalSeats} seats
                  </span>
                </div>
              </div>

              {/* Boarding Points */}
              {pkg.boardingPoints && pkg.boardingPoints.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sand-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Boarding Points
                    {showBilingual && <span className="font-bengali text-sand-400 font-normal text-sm">(উঠার স্থান)</span>}
                  </h3>
                  <div className="space-y-2">
                    {pkg.boardingPoints.map((point) => (
                      <div key={point.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg text-sm">
                        <span className="font-medium text-green-700">{point.time}</span>
                        <span className="text-green-800">{point.name}</span>
                        {showBilingual && point.nameBn && (
                          <span className="text-green-600 font-bengali">({point.nameBn})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dropping Points */}
              {pkg.droppingPoints && pkg.droppingPoints.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sand-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Dropping Points
                    {showBilingual && <span className="font-bengali text-sand-400 font-normal text-sm">(নামার স্থান)</span>}
                  </h3>
                  <div className="space-y-2">
                    {pkg.droppingPoints.map((point) => (
                      <div key={point.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg text-sm">
                        {point.time && <span className="font-medium text-red-700">{point.time}</span>}
                        <span className="text-red-800">{point.name}</span>
                        {showBilingual && point.nameBn && (
                          <span className="text-red-600 font-bengali">({point.nameBn})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions */}
              {pkg.inclusions && pkg.inclusions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sand-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Inclusions
                    {showBilingual && <span className="font-bengali text-sand-400 font-normal text-sm">(অন্তর্ভুক্ত)</span>}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {pkg.inclusions.map((item, i) => (
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
              {pkg.exclusions && pkg.exclusions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sand-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Exclusions
                    {showBilingual && <span className="font-bengali text-sand-400 font-normal text-sm">(বাদ)</span>}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {pkg.exclusions.map((item, i) => (
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
              {pkg.description && (
                <div>
                  <h3 className="font-semibold text-sand-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Description
                    {showBilingual && <span className="font-bengali text-sand-400 font-normal text-sm">(বিবরণ)</span>}
                  </h3>
                  <p className="text-sand-600">{pkg.description}</p>
                  {showBilingual && pkg.descriptionBn && (
                    <p className="text-sand-500 font-bengali mt-2">{pkg.descriptionBn}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              {hasSeatLayout ? (
                <SeatAvailabilityViewer
                  seatLayout={pkg.seatLayout!}
                  showBilingual={showBilingual}
                />
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-sand-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <p className="text-sand-500">Seat layout not configured for this package.</p>
                  {showBilingual && <p className="font-bengali text-sand-400 text-sm mt-1">সিট লেআউট সেট করা হয়নি</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sand-100 bg-sand-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-100 transition-colors"
            >
              Close
            </button>
            {onBook && (
              <button
                onClick={onBook}
                disabled={pkg.availableSeats === 0}
                className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {pkg.availableSeats > 0 ? 'Book This Package' : 'No Seats Available'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
