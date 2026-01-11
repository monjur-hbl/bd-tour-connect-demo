import React from 'react';
import { Seat as SeatType } from '../../types';

interface SeatInfoPanelProps {
  selectedSeats: SeatType[];
  pricePerSeat: number;
  onRemoveSeat?: (seatId: string) => void;
  showBilingual?: boolean;
  className?: string;
}

export const SeatInfoPanel: React.FC<SeatInfoPanelProps> = ({
  selectedSeats,
  pricePerSeat,
  onRemoveSeat,
  showBilingual = false,
  className = '',
}) => {
  const totalFare = selectedSeats.length * pricePerSeat;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (selectedSeats.length === 0) {
    return (
      <div className={`bg-sand-50 rounded-xl p-4 ${className}`}>
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-8 h-8 text-sand-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <p className="text-sand-500 text-sm">
            Click on seats to select them
            {showBilingual && (
              <span className="block font-bengali text-xs mt-1">সিট নির্বাচন করতে ক্লিক করুন</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-sand-200 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-primary-50 px-4 py-3 border-b border-primary-100">
        <h3 className="font-semibold text-primary-800">
          Seat Information
          {showBilingual && (
            <span className="font-bengali text-primary-600 font-normal ml-2 text-sm">
              (সিট তথ্য)
            </span>
          )}
        </h3>
      </div>

      {/* Selected Seats List */}
      <div className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-sand-500 text-xs uppercase tracking-wider">
              <th className="text-left pb-2 font-medium">Seat</th>
              <th className="text-left pb-2 font-medium">Deck</th>
              <th className="text-right pb-2 font-medium">Fare</th>
              {onRemoveSeat && <th className="w-8"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {selectedSeats.map((seat) => (
              <tr key={seat.id} className="group">
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded flex items-center justify-center text-xs font-bold">
                      {seat.label}
                    </span>
                    <span className="text-sand-700 font-medium">{seat.id}</span>
                  </span>
                </td>
                <td className="py-2">
                  <span
                    className={`
                      px-2 py-0.5 rounded text-xs font-medium
                      ${seat.deck === 'lower' ? 'bg-sand-100 text-sand-600' : 'bg-blue-100 text-blue-600'}
                    `}
                  >
                    {seat.deck === 'lower' ? 'Lower' : 'Upper'}
                  </span>
                </td>
                <td className="py-2 text-right font-medium text-sand-700">
                  {formatCurrency(pricePerSeat)}
                </td>
                {onRemoveSeat && (
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveSeat(seat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                      aria-label={`Remove seat ${seat.label}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="bg-sand-50 px-4 py-3 border-t border-sand-200">
        <div className="flex items-center justify-between">
          <div className="text-sand-600">
            <span className="font-medium">{selectedSeats.length}</span>
            <span className="text-sm ml-1">seat{selectedSeats.length > 1 ? 's' : ''} selected</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-sand-500">Total Fare</div>
            <div className="text-xl font-bold text-primary-600">{formatCurrency(totalFare)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact version for inline display
export const CompactSeatInfo: React.FC<{
  selectedSeats: SeatType[];
  pricePerSeat: number;
  className?: string;
}> = ({ selectedSeats, pricePerSeat, className = '' }) => {
  if (selectedSeats.length === 0) {
    return (
      <div className={`text-sand-500 text-sm ${className}`}>
        No seats selected
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex flex-wrap gap-1">
        {selectedSeats.map((seat) => (
          <span
            key={seat.id}
            className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium"
          >
            {seat.label}
          </span>
        ))}
      </div>
      <div className="text-sm">
        <span className="text-sand-500">{selectedSeats.length} seats • </span>
        <span className="font-semibold text-primary-600">
          {formatCurrency(selectedSeats.length * pricePerSeat)}
        </span>
      </div>
    </div>
  );
};
