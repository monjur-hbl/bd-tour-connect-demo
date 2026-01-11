import React, { useState, useMemo, useCallback } from 'react';
import { Seat as SeatType, SeatLayout, BusConfiguration } from '../../types';
import { SeatGrid } from './SeatGrid';
import { SeatLegend } from './SeatLegend';
import { SeatInfoPanel } from './SeatInfoPanel';
import { DeckTabs } from './DeckTabs';
import { getSeatsByDeck, countAvailableSeats, getSeatById } from '../../utils/seatUtils';

interface BusSeatLayoutPickerProps {
  seatLayout: SeatLayout;
  maxSeats?: number;
  selectedSeatIds: string[];
  onSelectionChange: (seatIds: string[]) => void;
  pricePerSeat: number;
  disabled?: boolean;
  showBilingual?: boolean;
  className?: string;
}

export const BusSeatLayoutPicker: React.FC<BusSeatLayoutPickerProps> = ({
  seatLayout,
  maxSeats,
  selectedSeatIds,
  onSelectionChange,
  pricePerSeat,
  disabled = false,
  showBilingual = false,
  className = '',
}) => {
  const [activeDeck, setActiveDeck] = useState<'lower' | 'upper'>('lower');
  const { busConfiguration, seats } = seatLayout;
  const hasUpperDeck = busConfiguration.numberOfFloors === 2;

  // Get seats by deck
  const lowerDeckSeats = useMemo(() => getSeatsByDeck(seats, 'lower'), [seats]);
  const upperDeckSeats = useMemo(() => getSeatsByDeck(seats, 'upper'), [seats]);

  // Count available seats per deck
  const lowerDeckAvailable = useMemo(() => countAvailableSeats(lowerDeckSeats), [lowerDeckSeats]);
  const upperDeckAvailable = useMemo(() => countAvailableSeats(upperDeckSeats), [upperDeckSeats]);

  // Get selected seat objects
  const selectedSeats = useMemo(
    () => selectedSeatIds.map((id) => getSeatById(seats, id)).filter(Boolean) as SeatType[],
    [selectedSeatIds, seats]
  );

  // Handle seat click
  const handleSeatClick = useCallback(
    (seatId: string) => {
      if (disabled) return;

      const seat = getSeatById(seats, seatId);
      if (!seat || seat.status !== 'available') return;

      const isSelected = selectedSeatIds.includes(seatId);

      if (isSelected) {
        // Deselect
        onSelectionChange(selectedSeatIds.filter((id) => id !== seatId));
      } else {
        // Check max seats limit
        if (maxSeats && selectedSeatIds.length >= maxSeats) {
          // Optionally show a toast/alert here
          return;
        }
        // Select
        onSelectionChange([...selectedSeatIds, seatId]);
      }
    },
    [disabled, seats, selectedSeatIds, maxSeats, onSelectionChange]
  );

  // Handle remove from info panel
  const handleRemoveSeat = useCallback(
    (seatId: string) => {
      onSelectionChange(selectedSeatIds.filter((id) => id !== seatId));
    },
    [selectedSeatIds, onSelectionChange]
  );

  const currentDeckSeats = activeDeck === 'lower' ? lowerDeckSeats : upperDeckSeats;
  const currentFloorConfig =
    activeDeck === 'lower' ? busConfiguration.lowerDeck : busConfiguration.upperDeck;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with deck tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-sand-800">
            Select Your Seats
            {showBilingual && (
              <span className="font-bengali text-sand-500 font-normal text-sm ml-2">
                (আসন নির্বাচন করুন)
              </span>
            )}
          </h3>
          <p className="text-sm text-sand-500 mt-1">
            {maxSeats
              ? `Select up to ${maxSeats} seat${maxSeats > 1 ? 's' : ''}`
              : 'Click on available seats to select them'}
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

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seat Grid */}
        <div className="lg:col-span-2">
          <SeatLegend compact className="mb-4" />

          <div className="flex justify-center">
            {currentFloorConfig && (
              <SeatGrid
                deck={activeDeck}
                seats={currentDeckSeats}
                floorConfig={currentFloorConfig}
                selectedSeats={selectedSeatIds}
                onSeatClick={handleSeatClick}
                readonly={disabled}
                size="md"
              />
            )}
          </div>

          {/* Selection limit warning */}
          {maxSeats && selectedSeatIds.length >= maxSeats && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 text-center">
              <svg
                className="w-4 h-4 inline-block mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Maximum {maxSeats} seat{maxSeats > 1 ? 's' : ''} allowed. Remove a seat to select a
              different one.
            </div>
          )}
        </div>

        {/* Seat Info Panel */}
        <div className="lg:col-span-1">
          <SeatInfoPanel
            selectedSeats={selectedSeats}
            pricePerSeat={pricePerSeat}
            onRemoveSeat={!disabled ? handleRemoveSeat : undefined}
            showBilingual={showBilingual}
          />
        </div>
      </div>
    </div>
  );
};

// Compact picker for inline use
export const CompactSeatPicker: React.FC<{
  seatLayout: SeatLayout;
  selectedSeatIds: string[];
  onSelectionChange: (seatIds: string[]) => void;
  maxSeats?: number;
  disabled?: boolean;
}> = ({ seatLayout, selectedSeatIds, onSelectionChange, maxSeats, disabled }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { seats } = seatLayout;

  const selectedSeats = useMemo(
    () => selectedSeatIds.map((id) => getSeatById(seats, id)).filter(Boolean) as SeatType[],
    [selectedSeatIds, seats]
  );

  const availableCount = useMemo(() => countAvailableSeats(seats), [seats]);

  if (!isExpanded) {
    return (
      <div className="bg-sand-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-sand-600 mb-1">
              {selectedSeatIds.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat.id}
                      className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium"
                    >
                      {seat.label}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sand-500">No seats selected</span>
              )}
            </div>
            <div className="text-xs text-sand-500">{availableCount} seats available</div>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            disabled={disabled}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {selectedSeatIds.length > 0 ? 'Change Seats' : 'Select Seats'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-sand-200 p-4 flex items-center justify-between">
          <h3 className="font-semibold text-sand-800">Select Seats</h3>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-sand-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <BusSeatLayoutPicker
            seatLayout={seatLayout}
            selectedSeatIds={selectedSeatIds}
            onSelectionChange={onSelectionChange}
            pricePerSeat={0}
            maxSeats={maxSeats}
            disabled={disabled}
          />
        </div>

        <div className="sticky bottom-0 bg-white border-t border-sand-200 p-4">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            Confirm Selection ({selectedSeatIds.length} seat{selectedSeatIds.length !== 1 ? 's' : ''}
            )
          </button>
        </div>
      </div>
    </div>
  );
};
