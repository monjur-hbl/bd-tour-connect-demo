# 🚌 Bus Seat Layout Configurations

## Overview

This document defines the seat layout configurations for different vehicle types used in BD Tour Connect.

---

## Vehicle Types

| Type | Code | Typical Seats | Layout |
|------|------|---------------|--------|
| Microbus | `microbus` | 7-15 | Varies |
| Mini Bus | `mini_bus` | 20-30 | 2+1 or 2+2 |
| Non-AC Bus | `non_ac_bus` | 40-52 | 2+2 |
| AC Bus | `ac_bus` | 40-48 | 2+2 |
| Sleeper Coach | `sleeper_coach` | 30-40 | Lower + Upper deck |

---

## 1. Sleeper Coach Layout (Like bdtickets.com)

Based on the screenshot provided, this is the most complex layout.

### Layout Structure

```typescript
// configs/seatLayouts/sleeperCoach.ts

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
    rows: 10,
    columns: 4,
    seats: [
      // Row 1 (Front)
      { seatNumber: 'L-A1', row: 1, column: 1, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: null, row: 1, column: 2, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: 'L-A2', row: 1, column: 3, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: 'L-A3', row: 1, column: 4, type: 'regular', class: 'B-Class', basePrice: 1400 },
      
      // Row 2
      { seatNumber: 'L-B1', row: 2, column: 1, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: null, row: 2, column: 2, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: 'L-B2', row: 2, column: 3, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: 'L-B3', row: 2, column: 4, type: 'regular', class: 'B-Class', basePrice: 1400 },
      
      // Row 3
      { seatNumber: 'L-C1', row: 3, column: 1, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: null, row: 3, column: 2, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: 'L-C2', row: 3, column: 3, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: 'L-C3', row: 3, column: 4, type: 'regular', class: 'B-Class', basePrice: 1400 },
      
      // Row 4
      { seatNumber: 'L-D1', row: 4, column: 1, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: null, row: 4, column: 2, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: 'L-D2', row: 4, column: 3, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: 'L-D3', row: 4, column: 4, type: 'regular', class: 'B-Class', basePrice: 1400 },
      
      // Row 5 - with door
      { seatNumber: 'L-E1', row: 5, column: 1, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: null, row: 5, column: 2, type: 'door', class: null, basePrice: 0 },
      { seatNumber: 'L-E2', row: 5, column: 3, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: 'L-E3', row: 5, column: 4, type: 'regular', class: 'B-Class', basePrice: 1400 },
      
      // Row 6
      { seatNumber: 'L-F1', row: 6, column: 1, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: null, row: 6, column: 2, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: null, row: 6, column: 3, type: 'empty', class: null, basePrice: 0 },
      { seatNumber: 'L-F2', row: 6, column: 4, type: 'regular', class: 'B-Class', basePrice: 1400 },
      
      // Row 7
      { seatNumber: 'L-G1', row: 7, column: 1, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: null, row: 7, column: 2, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: 'L-G2', row: 7, column: 3, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: 'L-G3', row: 7, column: 4, type: 'regular', class: 'B-Class', basePrice: 1400 },
      
      // Row 8
      { seatNumber: 'L-H1', row: 8, column: 1, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: null, row: 8, column: 2, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: 'L-H2', row: 8, column: 3, type: 'regular', class: 'B-Class', basePrice: 1400 },
      { seatNumber: 'L-H3', row: 8, column: 4, type: 'regular', class: 'B-Class', basePrice: 1400 },
    ]
  },
  
  upperDeck: {
    name: 'Upper Deck',
    nameBn: 'উপরের ডেক',
    rows: 6,
    columns: 3,
    seats: [
      // Row 1 (Sleeper berths)
      { seatNumber: 'U-A1', row: 1, column: 1, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-A2', row: 1, column: 2, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-A3', row: 1, column: 3, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      
      // Row 2
      { seatNumber: 'U-B1', row: 2, column: 1, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-B2', row: 2, column: 2, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-B3', row: 2, column: 3, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      
      // Row 3
      { seatNumber: 'U-C1', row: 3, column: 1, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-C2', row: 3, column: 2, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-C3', row: 3, column: 3, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      
      // Row 4
      { seatNumber: 'U-D1', row: 4, column: 1, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-D2', row: 4, column: 2, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-D3', row: 4, column: 3, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      
      // Row 5
      { seatNumber: 'U-E1', row: 5, column: 1, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-E2', row: 5, column: 2, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-E3', row: 5, column: 3, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      
      // Row 6
      { seatNumber: 'U-F1', row: 6, column: 1, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-F2', row: 6, column: 2, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
      { seatNumber: 'U-F3', row: 6, column: 3, type: 'sleeper', class: 'Sleeper', basePrice: 1600 },
    ]
  }
};
```

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

---

## 2. AC Bus Layout (2+2 Configuration)

```typescript
// configs/seatLayouts/acBus.ts

export const acBusLayout = {
  id: 'ac_bus_standard',
  name: 'Standard AC Bus',
  nameBn: 'স্ট্যান্ডার্ড এসি বাস',
  type: 'ac_bus',
  
  hasUpperDeck: false,
  totalSeats: 40,
  configuration: '2+2',
  
  mainDeck: {
    name: 'Main Deck',
    nameBn: 'মেইন ডেক',
    rows: 11,
    columns: 5,
    seats: [
      // Driver row
      { seatNumber: null, row: 0, column: 1, type: 'driver', class: null, basePrice: 0 },
      { seatNumber: null, row: 0, column: 2, type: 'empty', class: null, basePrice: 0 },
      { seatNumber: null, row: 0, column: 3, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: null, row: 0, column: 4, type: 'door', class: null, basePrice: 0 },
      { seatNumber: null, row: 0, column: 5, type: 'empty', class: null, basePrice: 0 },
      
      // Row 1
      { seatNumber: 'A1', row: 1, column: 1, type: 'regular', class: 'AC', basePrice: 1200 },
      { seatNumber: 'A2', row: 1, column: 2, type: 'regular', class: 'AC', basePrice: 1200 },
      { seatNumber: null, row: 1, column: 3, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: 'A3', row: 1, column: 4, type: 'regular', class: 'AC', basePrice: 1200 },
      { seatNumber: 'A4', row: 1, column: 5, type: 'regular', class: 'AC', basePrice: 1200 },
      
      // Row 2
      { seatNumber: 'B1', row: 2, column: 1, type: 'regular', class: 'AC', basePrice: 1200 },
      { seatNumber: 'B2', row: 2, column: 2, type: 'regular', class: 'AC', basePrice: 1200 },
      { seatNumber: null, row: 2, column: 3, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: 'B3', row: 2, column: 4, type: 'regular', class: 'AC', basePrice: 1200 },
      { seatNumber: 'B4', row: 2, column: 5, type: 'regular', class: 'AC', basePrice: 1200 },
      
      // ... continue for rows 3-10
      
      // Last row (5 seats across)
      { seatNumber: 'K1', row: 11, column: 1, type: 'regular', class: 'AC', basePrice: 1200 },
      { seatNumber: 'K2', row: 11, column: 2, type: 'regular', class: 'AC', basePrice: 1200 },
      { seatNumber: 'K3', row: 11, column: 3, type: 'regular', class: 'AC', basePrice: 1200 },
      { seatNumber: 'K4', row: 11, column: 4, type: 'regular', class: 'AC', basePrice: 1200 },
      { seatNumber: 'K5', row: 11, column: 5, type: 'regular', class: 'AC', basePrice: 1200 },
    ]
  }
};
```

### Visual Representation

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
│  F1 │  F2 │ AISLE │  F3 │  F4 │ Row 6
├─────┼─────┼───────┼─────┼─────┤
│  G1 │  G2 │ AISLE │  G3 │  G4 │ Row 7
├─────┼─────┼───────┼─────┼─────┤
│  H1 │  H2 │ AISLE │  H3 │  H4 │ Row 8
├─────┼─────┼───────┼─────┼─────┤
│  I1 │  I2 │ AISLE │  I3 │  I4 │ Row 9
├─────┼─────┼───────┼─────┼─────┤
│  J1 │  J2 │ AISLE │  J3 │  J4 │ Row 10
├─────┼─────┼─────┼─────┼─────┤
│  K1 │  K2 │  K3 │  K4 │  K5 │ Row 11 (Back)
└─────┴─────┴─────┴─────┴─────┘
```

---

## 3. Microbus Layout

```typescript
// configs/seatLayouts/microbus.ts

export const microbusLayouts = {
  // 7-seater
  microbus_7: {
    id: 'microbus_7',
    name: '7 Seater Microbus',
    nameBn: '৭ সিটের মাইক্রোবাস',
    type: 'microbus',
    totalSeats: 7,
    
    mainDeck: {
      rows: 3,
      columns: 3,
      seats: [
        // Row 1 (Front)
        { seatNumber: null, row: 1, column: 1, type: 'driver', class: null, basePrice: 0 },
        { seatNumber: null, row: 1, column: 2, type: 'empty', class: null, basePrice: 0 },
        { seatNumber: 'A1', row: 1, column: 3, type: 'regular', class: 'Standard', basePrice: 800 },
        
        // Row 2 (Middle)
        { seatNumber: 'B1', row: 2, column: 1, type: 'regular', class: 'Standard', basePrice: 800 },
        { seatNumber: 'B2', row: 2, column: 2, type: 'regular', class: 'Standard', basePrice: 800 },
        { seatNumber: 'B3', row: 2, column: 3, type: 'regular', class: 'Standard', basePrice: 800 },
        
        // Row 3 (Back)
        { seatNumber: 'C1', row: 3, column: 1, type: 'regular', class: 'Standard', basePrice: 800 },
        { seatNumber: 'C2', row: 3, column: 2, type: 'regular', class: 'Standard', basePrice: 800 },
        { seatNumber: 'C3', row: 3, column: 3, type: 'regular', class: 'Standard', basePrice: 800 },
      ]
    }
  },
  
  // 11-seater
  microbus_11: {
    id: 'microbus_11',
    name: '11 Seater Microbus',
    nameBn: '১১ সিটের মাইক্রোবাস',
    type: 'microbus',
    totalSeats: 11,
    
    mainDeck: {
      rows: 4,
      columns: 4,
      seats: [
        // Row 1 (Front)
        { seatNumber: null, row: 1, column: 1, type: 'driver', class: null, basePrice: 0 },
        { seatNumber: 'A1', row: 1, column: 2, type: 'regular', class: 'Standard', basePrice: 700 },
        { seatNumber: null, row: 1, column: 3, type: 'aisle', class: null, basePrice: 0 },
        { seatNumber: 'A2', row: 1, column: 4, type: 'regular', class: 'Standard', basePrice: 700 },
        
        // Row 2
        { seatNumber: 'B1', row: 2, column: 1, type: 'regular', class: 'Standard', basePrice: 700 },
        { seatNumber: 'B2', row: 2, column: 2, type: 'regular', class: 'Standard', basePrice: 700 },
        { seatNumber: null, row: 2, column: 3, type: 'aisle', class: null, basePrice: 0 },
        { seatNumber: 'B3', row: 2, column: 4, type: 'regular', class: 'Standard', basePrice: 700 },
        
        // Row 3
        { seatNumber: 'C1', row: 3, column: 1, type: 'regular', class: 'Standard', basePrice: 700 },
        { seatNumber: 'C2', row: 3, column: 2, type: 'regular', class: 'Standard', basePrice: 700 },
        { seatNumber: null, row: 3, column: 3, type: 'aisle', class: null, basePrice: 0 },
        { seatNumber: 'C3', row: 3, column: 4, type: 'regular', class: 'Standard', basePrice: 700 },
        
        // Row 4 (Back)
        { seatNumber: 'D1', row: 4, column: 1, type: 'regular', class: 'Standard', basePrice: 700 },
        { seatNumber: 'D2', row: 4, column: 2, type: 'regular', class: 'Standard', basePrice: 700 },
        { seatNumber: 'D3', row: 4, column: 3, type: 'regular', class: 'Standard', basePrice: 700 },
        { seatNumber: 'D4', row: 4, column: 4, type: 'regular', class: 'Standard', basePrice: 700 },
      ]
    }
  }
};
```

---

## 4. Mini Bus Layout (2+1)

```typescript
// configs/seatLayouts/miniBus.ts

export const miniBusLayout = {
  id: 'mini_bus_standard',
  name: 'Standard Mini Bus',
  nameBn: 'স্ট্যান্ডার্ড মিনি বাস',
  type: 'mini_bus',
  
  hasUpperDeck: false,
  totalSeats: 24,
  configuration: '2+1',
  
  mainDeck: {
    rows: 9,
    columns: 4,
    seats: [
      // Driver row
      { seatNumber: null, row: 0, column: 1, type: 'driver', class: null, basePrice: 0 },
      { seatNumber: null, row: 0, column: 2, type: 'empty', class: null, basePrice: 0 },
      { seatNumber: null, row: 0, column: 3, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: null, row: 0, column: 4, type: 'door', class: null, basePrice: 0 },
      
      // Rows 1-8 (2+1 configuration)
      { seatNumber: 'A1', row: 1, column: 1, type: 'regular', class: 'Standard', basePrice: 900 },
      { seatNumber: 'A2', row: 1, column: 2, type: 'regular', class: 'Standard', basePrice: 900 },
      { seatNumber: null, row: 1, column: 3, type: 'aisle', class: null, basePrice: 0 },
      { seatNumber: 'A3', row: 1, column: 4, type: 'regular', class: 'Standard', basePrice: 900 },
      
      // ... continue pattern
    ]
  }
};
```

---

## Seat Status Types

```typescript
export enum SeatStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  SELECTED = 'selected',
  BLOCKED = 'blocked',
  WOMEN_ONLY = 'women',
  RESERVED = 'reserved'
}

export enum SeatType {
  REGULAR = 'regular',
  SLEEPER = 'sleeper',
  DRIVER = 'driver',
  DOOR = 'door',
  AISLE = 'aisle',
  EMPTY = 'empty'
}
```

---

## React Component Usage

```tsx
import { BusSeatLayout } from '@/components/booking/BusSeatLayout';
import { sleeperCoachLayout } from '@/configs/seatLayouts/sleeperCoach';

function BookingPage() {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const bookedSeats = ['L-E2', 'L-G3', 'U-A5']; // From API
  
  return (
    <BusSeatLayout
      layout={sleeperCoachLayout}
      bookedSeats={bookedSeats}
      selectedSeats={selectedSeats}
      onSeatSelect={(seatNumber) => {
        setSelectedSeats(prev => 
          prev.includes(seatNumber)
            ? prev.filter(s => s !== seatNumber)
            : [...prev, seatNumber]
        );
      }}
    />
  );
}
```

---

## Custom Layout Builder

Agency owners can create custom layouts using a visual editor. The layout is stored as JSON in Firestore.

```typescript
interface CustomLayout {
  id: string;
  agencyId: string;
  name: string;
  nameBn: string;
  type: VehicleType;
  configuration: {
    rows: number;
    columns: number;
    hasUpperDeck: boolean;
  };
  seats: SeatConfig[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

*Seat Layout Configurations v1.0 - BD Tour Connect*
