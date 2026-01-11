# 🚌 Bus Seat Layout Configurations

## Vehicle Types Overview

| Type | Code | Seats | Layout |
|------|------|-------|--------|
| Microbus | microbus | 7-15 | Varies |
| Mini Bus | mini_bus | 20-30 | 2+1 or 2+2 |
| Non-AC Bus | non_ac_bus | 40-52 | 2+2 |
| AC Bus | ac_bus | 40-48 | 2+2 |
| Sleeper Coach | sleeper_coach | 30-40 | Lower + Upper deck |

---

## Sleeper Coach Layout (Like bdtickets.com)

### Visual Representation

```
LOWER DECK (নিচের ডেক)
═══════════════════════════════════════
┌─────┬───────┬─────┬─────┐
│ L-A1│ AISLE │ L-A2│ L-A3│  Row 1
├─────┼───────┼─────┼─────┤
│ L-B1│ AISLE │ L-B2│ L-B3│  Row 2
├─────┼───────┼─────┼─────┤
│ L-C1│ AISLE │ L-C2│ L-C3│  Row 3
├─────┼───────┼─────┼─────┤
│ L-D1│ AISLE │ L-D2│ L-D3│  Row 4
├─────┼───────┼─────┼─────┤
│ L-E1│ 🚪DOOR│ L-E2│ L-E3│  Row 5
├─────┼───────┼─────┼─────┤
│ L-F1│ AISLE │     │ L-F2│  Row 6
├─────┼───────┼─────┼─────┤
│ L-G1│ AISLE │ L-G2│ L-G3│  Row 7
├─────┼───────┼─────┼─────┤
│ L-H1│ AISLE │ L-H2│ L-H3│  Row 8
└─────┴───────┴─────┴─────┘

UPPER DECK (উপরের ডেক)
═══════════════════════════════════════
┌─────┬─────┬─────┐
│ U-A1│ U-A2│ U-A3│  Row 1
├─────┼─────┼─────┤
│ U-B1│ U-B2│ U-B3│  Row 2
├─────┼─────┼─────┤
│ U-C1│ U-C2│ U-C3│  Row 3
├─────┼─────┼─────┤
│ U-D1│ U-D2│ U-D3│  Row 4
├─────┼─────┼─────┤
│ U-E1│ U-E2│ U-E3│  Row 5
├─────┼─────┼─────┤
│ U-F1│ U-F2│ U-F3│  Row 6
└─────┴─────┴─────┘
```

### TypeScript Configuration

```typescript
// src/configs/seatLayouts/sleeperCoach.ts
export const sleeperCoachLayout = {
  id: 'sleeper_coach_standard',
  name: 'Standard Sleeper Coach',
  nameBn: 'স্ট্যান্ডার্ড স্লিপার কোচ',
  type: 'sleeper_coach',
  hasUpperDeck: true,
  totalSeats: 36,
  
  lowerDeck: {
    name: 'Lower Deck',
    nameBn: 'নিচের ডেক',
    rows: 8,
    columns: 4,
    seats: [
      // Row 1
      { seatNumber: 'L-A1', row: 1, column: 1, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: null, row: 1, column: 2, type: 'aisle' },
      { seatNumber: 'L-A2', row: 1, column: 3, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: 'L-A3', row: 1, column: 4, type: 'regular', class: 'B-Class', basePrice: 1400 },
      // ... more rows
    ]
  },
  
  upperDeck: {
    name: 'Upper Deck',
    nameBn: 'উপরের ডেক',
    rows: 6,
    columns: 3,
    seats: [
      { seatNumber: 'U-A1', row: 1, column: 1, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-A2', row: 1, column: 2, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-A3', row: 1, column: 3, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      // ... more rows
    ]
  }
};
```

---

## AC Bus Layout (2+2)

```
AC BUS (2+2) - এসি বাস
═══════════════════════════════════════
┌─────┬─────┬───────┬─────┬─────┐
│ 🚗  │     │ AISLE │ 🚪  │     │ Driver
├─────┼─────┼───────┼─────┼─────┤
│  A1 │  A2 │ AISLE │  A3 │  A4 │ Row 1
├─────┼─────┼───────┼─────┼─────┤
│  B1 │  B2 │ AISLE │  B3 │  B4 │ Row 2
├─────┼─────┼───────┼─────┼─────┤
│  C1 │  C2 │ AISLE │  C3 │  C4 │ Row 3
├─────┼─────┼───────┼─────┼─────┤
│  D1 │  D2 │ AISLE │  D3 │  D4 │ Row 4
├─────┼─────┼───────┼─────┼─────┤
│  E1 │  E2 │ AISLE │  E3 │  E4 │ Row 5
├─────┼─────┼───────┼─────┼─────┤
   ... continues ...
├─────┼─────┼─────┼─────┼─────┤
│  K1 │  K2 │  K3 │  K4 │  K5 │ Back Row
└─────┴─────┴─────┴─────┴─────┘
```

---

## Microbus Layouts

### 7-Seater
```
┌─────┬─────┬─────┐
│ 🚗  │     │  A1 │ Front
├─────┼─────┼─────┤
│  B1 │  B2 │  B3 │ Middle
├─────┼─────┼─────┤
│  C1 │  C2 │  C3 │ Back
└─────┴─────┴─────┘
```

### 11-Seater
```
┌─────┬─────┬───────┬─────┐
│ 🚗  │  A1 │ AISLE │  A2 │ Front
├─────┼─────┼───────┼─────┤
│  B1 │  B2 │ AISLE │  B3 │ Row 2
├─────┼─────┼───────┼─────┤
│  C1 │  C2 │ AISLE │  C3 │ Row 3
├─────┼─────┼─────┼─────┤
│  D1 │  D2 │  D3 │  D4 │ Back
└─────┴─────┴─────┴─────┘
```

---

## Seat Types

```typescript
export enum SeatType {
  REGULAR = 'regular',    // Standard seat
  SLEEPER = 'sleeper',    // Sleeper berth
  DRIVER = 'driver',      // Driver position
  DOOR = 'door',          // Door area
  AISLE = 'aisle',        // Walking aisle
  EMPTY = 'empty'         // Empty space
}

export enum SeatStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  SELECTED = 'selected',
  BLOCKED = 'blocked',
  WOMEN_ONLY = 'women'
}
```

---

## Seat Button Component

```tsx
const seatStyles = {
  available: 'bg-accent-500 hover:bg-accent-600 text-white cursor-pointer',
  selected: 'bg-primary-500 text-white ring-2 ring-primary-300',
  booked: 'bg-sand-400 text-sand-600 cursor-not-allowed',
  women: 'bg-pink-400 hover:bg-pink-500 text-white'
};

export function SeatButton({ seat, status, onSelect }: SeatButtonProps) {
  if (seat.type === 'aisle') return <div className="w-12 h-12" />;
  if (seat.type === 'driver') return <div className="w-12 h-12 bg-sand-200 rounded-lg flex items-center justify-center">🚗</div>;
  if (seat.type === 'door') return <div className="w-12 h-12 bg-sand-100 rounded-lg border-2 border-dashed flex items-center justify-center">🚪</div>;

  return (
    <button
      onClick={() => status !== 'booked' && onSelect(seat.seatNumber)}
      disabled={status === 'booked'}
      className={`w-12 h-12 rounded-lg font-semibold text-sm transition-all ${seatStyles[status]}`}
    >
      {seat.seatNumber.split('-').pop()}
    </button>
  );
}
```

---

## Seat Legend Component

```tsx
export function SeatLegend() {
  return (
    <div className="flex flex-wrap gap-4 justify-center p-4 bg-sand-50 rounded-xl">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-accent-500 rounded" />
        <span className="text-sm">Available <span className="font-bengali">খালি</span></span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-primary-500 rounded" />
        <span className="text-sm">Selected <span className="font-bengali">নির্বাচিত</span></span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-sand-400 rounded" />
        <span className="text-sm">Booked <span className="font-bengali">বুকড</span></span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-pink-400 rounded" />
        <span className="text-sm">Women Only <span className="font-bengali">মহিলা</span></span>
      </div>
    </div>
  );
}
```

---

*Seat Layout Configurations v1.0 - BD Tour Connect*
