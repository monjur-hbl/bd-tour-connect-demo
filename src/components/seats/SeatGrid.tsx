import React, { useMemo } from 'react';
import { Seat as SeatType, SeatArrangement, FloorConfiguration } from '../../types';
import { MemoizedSeat } from './Seat';
import { SteeringIcon } from './SteeringIcon';
import { groupSeatsByRow, getLeftColumns, getRightColumns } from '../../utils/seatUtils';

interface SeatGridProps {
  deck: 'lower' | 'upper';
  seats: SeatType[];
  floorConfig: FloorConfiguration;
  selectedSeats: string[];
  onSeatClick?: (seatId: string) => void;
  readonly?: boolean;
  showDriver?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SeatGrid: React.FC<SeatGridProps> = ({
  deck,
  seats,
  floorConfig,
  selectedSeats,
  onSeatClick,
  readonly = false,
  showDriver = true,
  size = 'md',
}) => {
  // Group seats by row
  const seatsByRow = useMemo(() => groupSeatsByRow(seats), [seats]);

  // Get sorted row keys
  const sortedRows = useMemo(() => {
    return Array.from(seatsByRow.keys()).sort();
  }, [seatsByRow]);

  // Calculate arrangement for a specific row
  const getRowArrangement = (rowLetter: string): SeatArrangement => {
    const isFirstRow = rowLetter === floorConfig.serialStart;
    const isLastRow = rowLetter === floorConfig.serialEnd;

    if (isFirstRow && floorConfig.firstRowLayout) {
      return floorConfig.firstRowLayout;
    }
    if (isLastRow && floorConfig.lastRowLayout) {
      return floorConfig.lastRowLayout;
    }
    return floorConfig.arrangement;
  };

  // Spacing classes based on size
  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  };

  const aisleClasses = {
    sm: 'w-4',
    md: 'w-6',
    lg: 'w-8',
  };

  return (
    <div className="relative">
      {/* Bus Frame */}
      <div className="bg-sand-50 border-2 border-sand-200 rounded-2xl p-4 sm:p-6">
        {/* Driver Section */}
        {showDriver && deck === 'lower' && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-sand-200">
            <SteeringIcon />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-sand-200 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-sand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <span className="text-xs text-sand-400">DOOR</span>
            </div>
          </div>
        )}

        {/* Upper Deck Stairs Indicator */}
        {deck === 'upper' && (
          <div className="flex items-center justify-center mb-6 pb-4 border-b border-sand-200">
            <div className="flex items-center gap-2 text-sand-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <span className="text-xs font-medium">STAIRS FROM LOWER DECK</span>
            </div>
          </div>
        )}

        {/* Seats Container */}
        <div className={`flex flex-col ${gapClasses[size]} items-center`}>
          {sortedRows.map((rowLetter) => {
            const rowSeats = seatsByRow.get(rowLetter) || [];
            const arrangement = getRowArrangement(rowLetter);
            const leftCols = getLeftColumns(arrangement);
            const rightCols = getRightColumns(arrangement);

            // Split seats into left and right groups
            const leftSeats = rowSeats.filter((s) => s.position.column <= leftCols);
            const rightSeats = rowSeats.filter((s) => s.position.column > leftCols);

            return (
              <div key={rowLetter} className={`flex items-center ${gapClasses[size]}`}>
                {/* Row Label (Left) */}
                <div className="w-6 text-center text-xs font-medium text-sand-400">
                  {rowLetter}
                </div>

                {/* Left Side Seats */}
                <div className={`flex ${gapClasses[size]}`}>
                  {leftSeats.map((seat) => (
                    <MemoizedSeat
                      key={seat.id}
                      seat={seat}
                      isSelected={selectedSeats.includes(seat.id)}
                      onClick={
                        !readonly && onSeatClick
                          ? () => onSeatClick(seat.id)
                          : undefined
                      }
                      disabled={readonly}
                      size={size}
                    />
                  ))}
                </div>

                {/* Aisle */}
                <div
                  className={`${aisleClasses[size]} flex items-center justify-center`}
                >
                  <div className="h-full w-px bg-sand-200" />
                </div>

                {/* Right Side Seats */}
                <div className={`flex ${gapClasses[size]}`}>
                  {rightSeats.map((seat) => (
                    <MemoizedSeat
                      key={seat.id}
                      seat={seat}
                      isSelected={selectedSeats.includes(seat.id)}
                      onClick={
                        !readonly && onSeatClick
                          ? () => onSeatClick(seat.id)
                          : undefined
                      }
                      disabled={readonly}
                      size={size}
                    />
                  ))}
                </div>

                {/* Row Label (Right) */}
                <div className="w-6 text-center text-xs font-medium text-sand-400">
                  {rowLetter}
                </div>
              </div>
            );
          })}
        </div>

        {/* Back of Bus */}
        <div className="mt-6 pt-4 border-t border-sand-200 flex justify-center">
          <span className="text-xs text-sand-400 font-medium tracking-wider">REAR</span>
        </div>
      </div>

      {/* Deck Label */}
      <div className="absolute -top-3 left-4 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
        {deck === 'lower' ? 'Lower Deck' : 'Upper Deck'}
      </div>
    </div>
  );
};

// Compact grid for preview/read-only displays
export const CompactSeatGrid: React.FC<{
  seats: SeatType[];
  selectedSeats?: string[];
  className?: string;
}> = ({ seats, selectedSeats = [], className = '' }) => {
  const seatsByRow = useMemo(() => groupSeatsByRow(seats), [seats]);
  const sortedRows = useMemo(() => Array.from(seatsByRow.keys()).sort(), [seatsByRow]);

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {sortedRows.map((rowLetter) => {
        const rowSeats = seatsByRow.get(rowLetter) || [];
        return (
          <div key={rowLetter} className="flex gap-0.5 justify-center">
            {rowSeats.map((seat) => {
              const isSelected = selectedSeats.includes(seat.id);
              let bgColor = 'bg-sand-200';

              if (isSelected) {
                bgColor = 'bg-primary-500';
              } else if (seat.status === 'booked' || seat.status === 'sold') {
                bgColor = 'bg-blue-300';
              } else if (seat.status === 'blocked') {
                bgColor = 'bg-sand-400';
              }

              return (
                <div
                  key={seat.id}
                  className={`w-2 h-2 rounded-sm ${bgColor}`}
                  title={`${seat.label} - ${seat.status}`}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
