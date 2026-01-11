import React, { useState, useMemo, useCallback } from 'react';
import { SeatLayout, BusConfiguration, Seat as SeatType } from '../../types';
import { SeatGrid } from '../seats/SeatGrid';
import { SeatLegend } from '../seats/SeatLegend';
import { DeckTabs } from '../seats/DeckTabs';
import { seatsAPI } from '../../services/api';
import { getSeatsByDeck, countAvailableSeats, getSeatById } from '../../utils/seatUtils';
import toast from 'react-hot-toast';
import { X, Lock, Loader2 } from 'lucide-react';

interface Package {
  id: string;
  title: string;
  titleBn?: string;
  destination: string;
  destinationBn?: string;
  departureDate: string;
  returnDate: string;
  vehicleType: string;
  totalSeats: number;
  availableSeats: number;
  busConfiguration?: BusConfiguration;
  seatLayout?: SeatLayout;
}

interface HoldSeatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  package: Package;
  onSuccess?: () => void;
}

export const HoldSeatsModal: React.FC<HoldSeatsModalProps> = ({
  isOpen,
  onClose,
  package: pkg,
  onSuccess,
}) => {
  const [activeDeck, setActiveDeck] = useState<'lower' | 'upper'>('lower');
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const seatLayout = pkg.seatLayout;
  const busConfiguration = seatLayout?.busConfiguration;
  const seats = seatLayout?.seats || [];
  const hasUpperDeck = busConfiguration?.numberOfFloors === 2;

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
      const seat = getSeatById(seats, seatId);
      if (!seat || seat.status !== 'available') return;

      const isSelected = selectedSeatIds.includes(seatId);

      if (isSelected) {
        setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seatId));
      } else {
        setSelectedSeatIds([...selectedSeatIds, seatId]);
      }
    },
    [seats, selectedSeatIds]
  );

  // Handle hold seats submission
  const handleHoldSeats = async () => {
    if (selectedSeatIds.length === 0) {
      toast.error('Please select at least one seat to hold');
      return;
    }

    setIsSubmitting(true);
    try {
      await seatsAPI.blockSeats(pkg.id, selectedSeatIds, 'Agency Hold');
      toast.success(`${selectedSeatIds.length} seat(s) blocked successfully!`);
      setSelectedSeatIds([]);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to block seats');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close and reset
  const handleClose = () => {
    setSelectedSeatIds([]);
    onClose();
  };

  if (!isOpen || !seatLayout) return null;

  const currentDeckSeats = activeDeck === 'lower' ? lowerDeckSeats : upperDeckSeats;
  const currentFloorConfig =
    activeDeck === 'lower' ? busConfiguration?.lowerDeck : busConfiguration?.upperDeck;

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Hold Seats
            </h2>
            <p className="text-amber-100 text-sm">
              {pkg.destination} - {formatDate(pkg.departureDate)}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Info banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm">
              <strong>Quick Hold:</strong> Select seats below and click "Hold Selected Seats" to instantly block them.
              These seats will appear as blocked in the calendar and won't be available for booking.
            </p>
          </div>

          {/* Deck tabs if double decker */}
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

          {/* Seat legend */}
          <SeatLegend compact className="mb-4" />

          {/* Seat grid */}
          <div className="flex justify-center">
            {currentFloorConfig && (
              <SeatGrid
                deck={activeDeck}
                seats={currentDeckSeats}
                floorConfig={currentFloorConfig}
                selectedSeats={selectedSeatIds}
                onSeatClick={handleSeatClick}
                readonly={false}
                size="md"
              />
            )}
          </div>

          {/* Selected seats info */}
          {selectedSeatIds.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">Selected seats to hold:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSeats.map((seat) => (
                      <span
                        key={seat.id}
                        className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
                      >
                        {seat.label}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSeatIds([])}
                  className="text-amber-600 hover:text-amber-800 text-sm underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-sand-200 p-4 bg-sand-50 flex items-center justify-between gap-4">
          <button
            onClick={handleClose}
            className="px-6 py-3 border border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleHoldSeats}
            disabled={selectedSeatIds.length === 0 || isSubmitting}
            className="flex-1 max-w-xs px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Blocking...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Hold {selectedSeatIds.length} Seat{selectedSeatIds.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HoldSeatsModal;
