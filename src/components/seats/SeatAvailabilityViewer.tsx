import React, { useState, useMemo } from 'react';
import { SeatLayout, BusConfiguration } from '../../types';
import { SeatGrid } from './SeatGrid';
import { SeatLegend } from './SeatLegend';
import { DeckTabs } from './DeckTabs';
import { getSeatsByDeck, countAvailableSeats, countSeatsByStatus } from '../../utils/seatUtils';

interface SeatAvailabilityViewerProps {
  seatLayout: SeatLayout;
  showBilingual?: boolean;
  className?: string;
}

export const SeatAvailabilityViewer: React.FC<SeatAvailabilityViewerProps> = ({
  seatLayout,
  showBilingual = false,
  className = '',
}) => {
  const [activeDeck, setActiveDeck] = useState<'lower' | 'upper'>('lower');
  const { busConfiguration, seats } = seatLayout;
  const hasUpperDeck = busConfiguration.numberOfFloors === 2;

  // Get seats by deck
  const lowerDeckSeats = useMemo(() => getSeatsByDeck(seats, 'lower'), [seats]);
  const upperDeckSeats = useMemo(() => getSeatsByDeck(seats, 'upper'), [seats]);

  // Count seats by status
  const totalSeats = seats.length;
  const availableSeats = useMemo(() => countAvailableSeats(seats), [seats]);
  const bookedSeats = useMemo(() => countSeatsByStatus(seats, 'booked'), [seats]);
  const blockedSeats = useMemo(() => countSeatsByStatus(seats, 'blocked'), [seats]);
  const soldSeats = useMemo(() => countSeatsByStatus(seats, 'sold'), [seats]);

  // Per-deck counts
  const lowerDeckAvailable = useMemo(() => countAvailableSeats(lowerDeckSeats), [lowerDeckSeats]);
  const upperDeckAvailable = useMemo(() => countAvailableSeats(upperDeckSeats), [upperDeckSeats]);

  const currentDeckSeats = activeDeck === 'lower' ? lowerDeckSeats : upperDeckSeats;
  const currentFloorConfig =
    activeDeck === 'lower' ? busConfiguration.lowerDeck : busConfiguration.upperDeck;

  // Calculate occupancy percentage
  const occupancyPercent = Math.round(((bookedSeats + soldSeats) / totalSeats) * 100);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-sand-800">
            Seat Availability
            {showBilingual && (
              <span className="font-bengali text-sand-500 font-normal text-sm ml-2">
                (সিট প্রাপ্যতা)
              </span>
            )}
          </h3>
          <p className="text-sm text-sand-500 mt-1">
            Real-time view of bus seat status
            {showBilingual && (
              <span className="font-bengali ml-1">(বাস সিট স্ট্যাটাস)</span>
            )}
          </p>
        </div>

        {hasUpperDeck && (
          <DeckTabs
            activeDeck={activeDeck}
            onDeckChange={setActiveDeck}
            hasUpperDeck={hasUpperDeck}
            lowerDeckSeats={lowerDeckSeats.length}
            upperDeckSeats={upperDeckSeats.length}
            lowerDeckAvailable={lowerDeckAvailable}
            upperDeckAvailable={upperDeckAvailable}
          />
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-green-50 rounded-xl text-center">
          <p className="text-2xl font-bold text-green-600">{availableSeats}</p>
          <p className="text-xs text-green-700">Available</p>
          {showBilingual && <p className="text-xs text-green-600 font-bengali">খালি</p>}
        </div>
        <div className="p-3 bg-blue-50 rounded-xl text-center">
          <p className="text-2xl font-bold text-blue-600">{bookedSeats}</p>
          <p className="text-xs text-blue-700">Booked</p>
          {showBilingual && <p className="text-xs text-blue-600 font-bengali">বুক করা</p>}
        </div>
        <div className="p-3 bg-gray-50 rounded-xl text-center">
          <p className="text-2xl font-bold text-gray-600">{blockedSeats}</p>
          <p className="text-xs text-gray-700">Blocked</p>
          {showBilingual && <p className="text-xs text-gray-600 font-bengali">ব্লক</p>}
        </div>
        <div className="p-3 bg-purple-50 rounded-xl text-center">
          <p className="text-2xl font-bold text-purple-600">{soldSeats}</p>
          <p className="text-xs text-purple-700">Sold</p>
          {showBilingual && <p className="text-xs text-purple-600 font-bengali">বিক্রিত</p>}
        </div>
      </div>

      {/* Occupancy Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-sand-600">Occupancy</span>
          <span className="font-medium text-sand-800">{occupancyPercent}% filled</span>
        </div>
        <div className="h-3 bg-sand-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              occupancyPercent > 80 ? 'bg-red-500' : occupancyPercent > 50 ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>

      {/* Legend */}
      <SeatLegend compact className="mb-2" />

      {/* Seat Grid */}
      <div className="flex justify-center py-4">
        {currentFloorConfig && (
          <SeatGrid
            deck={activeDeck}
            seats={currentDeckSeats}
            floorConfig={currentFloorConfig}
            selectedSeats={[]}
            onSeatClick={() => {}}
            readonly={true}
            size="md"
          />
        )}
      </div>

      {/* Bus Info */}
      <div className="p-4 bg-sand-50 rounded-xl">
        <h4 className="font-medium text-sand-700 mb-2">Bus Configuration</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-sand-500">Vehicle:</span>
            <span className="ml-2 font-medium text-sand-800 capitalize">
              {busConfiguration.vehicleCategory}
            </span>
          </div>
          <div>
            <span className="text-sand-500">AC Type:</span>
            <span className="ml-2 font-medium text-sand-800">
              {busConfiguration.acType === 'ac' ? 'AC' : 'Non-AC'}
            </span>
          </div>
          <div>
            <span className="text-sand-500">Brand:</span>
            <span className="ml-2 font-medium text-sand-800 capitalize">
              {busConfiguration.brand === 'other' ? busConfiguration.brandOther : busConfiguration.brand?.replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="text-sand-500">Total Seats:</span>
            <span className="ml-2 font-medium text-sand-800">{totalSeats}</span>
          </div>
          <div>
            <span className="text-sand-500">Layout:</span>
            <span className="ml-2 font-medium text-sand-800">
              {busConfiguration.lowerDeck?.arrangement || '2x2'}
            </span>
          </div>
          <div>
            <span className="text-sand-500">Floors:</span>
            <span className="ml-2 font-medium text-sand-800">
              {busConfiguration.numberOfFloors === 2 ? 'Double Decker' : 'Single Deck'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
