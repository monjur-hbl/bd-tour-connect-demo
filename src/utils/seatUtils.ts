import {
  BusConfiguration,
  FloorConfiguration,
  Seat,
  SeatArrangement,
  SeatLayout,
  VehicleCategory,
} from '../types';

/**
 * Get number of seats per row based on arrangement
 */
export function getSeatsFromArrangement(arrangement: SeatArrangement): number {
  const mapping: Record<SeatArrangement, number> = {
    '2x2': 4,
    '2x1': 3,
    '1x1': 2,
    '2x3': 5,
    '3x2': 5,
  };
  return mapping[arrangement];
}

/**
 * Get aisle position (column index after which aisle appears)
 */
export function getAislePosition(arrangement: SeatArrangement): number {
  const mapping: Record<SeatArrangement, number> = {
    '2x2': 2, // Aisle after column 2
    '2x1': 2, // Aisle after column 2
    '1x1': 1, // Aisle after column 1
    '2x3': 2, // Aisle after column 2
    '3x2': 3, // Aisle after column 3
  };
  return mapping[arrangement];
}

/**
 * Get columns on left side of aisle
 */
export function getLeftColumns(arrangement: SeatArrangement): number {
  const mapping: Record<SeatArrangement, number> = {
    '2x2': 2,
    '2x1': 2,
    '1x1': 1,
    '2x3': 2,
    '3x2': 3,
  };
  return mapping[arrangement];
}

/**
 * Get columns on right side of aisle
 */
export function getRightColumns(arrangement: SeatArrangement): number {
  const mapping: Record<SeatArrangement, number> = {
    '2x2': 2,
    '2x1': 1,
    '1x1': 1,
    '2x3': 3,
    '3x2': 2,
  };
  return mapping[arrangement];
}

/**
 * Generate all seats for a single deck
 */
function generateDeckSeats(
  deck: 'lower' | 'upper',
  floorConfig: FloorConfiguration
): Seat[] {
  const seats: Seat[] = [];
  const prefix = deck === 'lower' ? 'L' : 'U';

  const startCharCode = floorConfig.serialStart.charCodeAt(0);
  const endCharCode = floorConfig.serialEnd.charCodeAt(0);

  for (let charCode = startCharCode; charCode <= endCharCode; charCode++) {
    const rowLetter = String.fromCharCode(charCode);
    const isFirstRow = charCode === startCharCode;
    const isLastRow = charCode === endCharCode;

    // Determine arrangement and seat count for this row
    let arrangement = floorConfig.arrangement;
    let seatsInRow = floorConfig.seatsPerSerial;

    if (isFirstRow && floorConfig.firstRowLayout) {
      arrangement = floorConfig.firstRowLayout;
      seatsInRow = floorConfig.firstRowSeats || getSeatsFromArrangement(arrangement);
    }

    if (isLastRow && floorConfig.lastRowLayout) {
      arrangement = floorConfig.lastRowLayout;
      seatsInRow = floorConfig.lastRowSeats || getSeatsFromArrangement(arrangement);
    }

    // Generate seats for this row
    for (let col = 1; col <= seatsInRow; col++) {
      const seatId = `${prefix}-${rowLetter}${col}`;
      seats.push({
        id: seatId,
        deck,
        position: { row: rowLetter, column: col },
        label: `${rowLetter}${col}`,
        status: 'available',
      });
    }
  }

  return seats;
}

/**
 * Generate all seats from bus configuration
 */
export function generateSeatsFromConfig(config: BusConfiguration): Seat[] {
  const seats: Seat[] = [];

  // Generate lower deck seats
  seats.push(...generateDeckSeats('lower', config.lowerDeck));

  // Generate upper deck if double decker
  if (config.numberOfFloors === 2 && config.upperDeck) {
    seats.push(...generateDeckSeats('upper', config.upperDeck));
  }

  return seats;
}

/**
 * Calculate total seats for a single deck
 */
function calculateDeckSeats(floorConfig: FloorConfiguration): number {
  const startCharCode = floorConfig.serialStart.charCodeAt(0);
  const endCharCode = floorConfig.serialEnd.charCodeAt(0);
  const totalRows = endCharCode - startCharCode + 1;

  let seats = totalRows * floorConfig.seatsPerSerial;

  // Adjust for first row if different
  if (floorConfig.firstRowLayout || floorConfig.firstRowSeats) {
    seats -= floorConfig.seatsPerSerial;
    seats += floorConfig.firstRowSeats || getSeatsFromArrangement(floorConfig.firstRowLayout!);
  }

  // Adjust for last row if different
  if (floorConfig.lastRowLayout || floorConfig.lastRowSeats) {
    seats -= floorConfig.seatsPerSerial;
    seats += floorConfig.lastRowSeats || getSeatsFromArrangement(floorConfig.lastRowLayout!);
  }

  return seats;
}

/**
 * Calculate total seats from bus configuration
 */
export function calculateTotalSeats(config: BusConfiguration): number {
  let total = 0;

  total += calculateDeckSeats(config.lowerDeck);

  if (config.numberOfFloors === 2 && config.upperDeck) {
    total += calculateDeckSeats(config.upperDeck);
  }

  return total;
}

/**
 * Create a complete seat layout from configuration
 */
export function createSeatLayout(
  packageId: string,
  config: BusConfiguration
): SeatLayout {
  return {
    packageId,
    busConfiguration: config,
    seats: generateSeatsFromConfig(config),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get default floor configuration
 */
export function getDefaultFloorConfig(): FloorConfiguration {
  return {
    arrangement: '2x2',
    serialStart: 'A',
    serialEnd: 'K',
    seatsPerSerial: 4,
    lastRowSeats: 5, // Common for buses
  };
}

/**
 * Get default bus configuration
 */
export function getDefaultBusConfig(): BusConfiguration {
  const lowerDeck = getDefaultFloorConfig();
  return {
    id: crypto.randomUUID(),
    vehicleCategory: 'bus',
    numberOfFloors: 1,
    acType: 'ac',
    brand: 'hino',
    lowerDeck,
    totalSeats: calculateDeckSeats(lowerDeck),
  };
}

/**
 * Get available serial letters (A to K)
 */
export function getSerialOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let i = 65; i <= 75; i++) {
    // A (65) to K (75)
    const letter = String.fromCharCode(i);
    options.push({ value: letter, label: letter });
  }
  return options;
}

/**
 * Seat arrangement options with labels
 */
export const SEAT_ARRANGEMENTS: { value: SeatArrangement; label: string; description: string }[] = [
  { value: '2x2', label: '2x2', description: '4 seats per row (2 + aisle + 2)' },
  { value: '2x1', label: '2x1', description: '3 seats per row (2 + aisle + 1)' },
  { value: '1x1', label: '1x1', description: '2 seats per row (1 + aisle + 1)' },
  { value: '2x3', label: '2x3', description: '5 seats per row (2 + aisle + 3)' },
  { value: '3x2', label: '3x2', description: '5 seats per row (3 + aisle + 2)' },
];

/**
 * Vehicle category options
 */
export const VEHICLE_CATEGORIES: { value: VehicleCategory; label: string; labelBn: string }[] = [
  { value: 'bus', label: 'Bus', labelBn: 'বাস' },
  { value: 'microbus', label: 'Microbus', labelBn: 'মাইক্রোবাস' },
  { value: 'hiace', label: 'Hiace', labelBn: 'হায়েস' },
  { value: 'car', label: 'Private Car', labelBn: 'প্রাইভেট কার' },
];

/**
 * Bus brand options
 */
export const BUS_BRANDS: { value: string; label: string }[] = [
  { value: 'hino', label: 'Hino' },
  { value: 'mercedes', label: 'Mercedes-Benz' },
  { value: 'volvo', label: 'Volvo' },
  { value: 'scania', label: 'Scania' },
  { value: 'ashok_leyland', label: 'Ashok Leyland' },
  { value: 'other', label: 'Other' },
];

/**
 * AC type options
 */
export const AC_TYPES: { value: string; label: string; labelBn: string }[] = [
  { value: 'ac', label: 'AC', labelBn: 'এসি' },
  { value: 'non_ac', label: 'Non-AC', labelBn: 'নন-এসি' },
];

/**
 * Group seats by row for rendering
 */
export function groupSeatsByRow(seats: Seat[]): Map<string, Seat[]> {
  const grouped = new Map<string, Seat[]>();

  for (const seat of seats) {
    const row = seat.position.row;
    if (!grouped.has(row)) {
      grouped.set(row, []);
    }
    grouped.get(row)!.push(seat);
  }

  // Sort seats within each row by column
  for (const [_, rowSeats] of grouped) {
    rowSeats.sort((a, b) => a.position.column - b.position.column);
  }

  return grouped;
}

/**
 * Get seats for a specific deck
 */
export function getSeatsByDeck(seats: Seat[], deck: 'lower' | 'upper'): Seat[] {
  return seats.filter((seat) => seat.deck === deck);
}

/**
 * Count available seats
 */
export function countAvailableSeats(seats: Seat[]): number {
  return seats.filter((seat) => seat.status === 'available').length;
}

/**
 * Count booked seats
 */
export function countBookedSeats(seats: Seat[]): number {
  return seats.filter((seat) => seat.status === 'booked' || seat.status === 'sold').length;
}

/**
 * Count blocked seats
 */
export function countBlockedSeats(seats: Seat[]): number {
  return seats.filter((seat) => seat.status === 'blocked').length;
}

/**
 * Get seat by ID
 */
export function getSeatById(seats: Seat[], seatId: string): Seat | undefined {
  return seats.find((seat) => seat.id === seatId);
}

/**
 * Update seat status
 */
export function updateSeatStatus(
  seats: Seat[],
  seatId: string,
  status: Seat['status'],
  bookedBy?: Seat['bookedBy']
): Seat[] {
  return seats.map((seat) =>
    seat.id === seatId ? { ...seat, status, bookedBy } : seat
  );
}

/**
 * Block multiple seats
 */
export function blockSeats(
  seats: Seat[],
  seatIds: string[],
  reason: string
): Seat[] {
  return seats.map((seat) =>
    seatIds.includes(seat.id)
      ? { ...seat, status: 'blocked' as const, blockedReason: reason }
      : seat
  );
}

/**
 * Unblock multiple seats
 */
export function unblockSeats(seats: Seat[], seatIds: string[]): Seat[] {
  return seats.map((seat) =>
    seatIds.includes(seat.id)
      ? { ...seat, status: 'available' as const, blockedReason: undefined }
      : seat
  );
}
