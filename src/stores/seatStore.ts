import { create } from 'zustand';
import { Seat, SeatLayout, SeatUpdateEvent, SeatSelectionState } from '../types';
import { updateSeatStatus } from '../utils/seatUtils';

interface SeatStore {
  // Layout data by package ID
  layouts: Record<string, SeatLayout>;

  // Selection state for current booking
  selection: SeatSelectionState | null;

  // Loading states
  loadingPackageId: string | null;
  error: string | null;

  // Layout actions
  setLayout: (packageId: string, layout: SeatLayout) => void;
  updateSeat: (packageId: string, seatId: string, updates: Partial<Seat>) => void;
  handleRealtimeUpdate: (event: SeatUpdateEvent) => void;
  clearLayout: (packageId: string) => void;

  // Selection actions
  initSelection: (packageId: string) => void;
  selectSeat: (seatId: string) => void;
  deselectSeat: (seatId: string) => void;
  toggleSeat: (seatId: string) => void;
  clearSelection: () => void;
  setSelectedSeats: (seatIds: string[]) => void;

  // Loading actions
  setLoading: (packageId: string | null) => void;
  setError: (error: string | null) => void;
}

export const useSeatStore = create<SeatStore>((set, get) => ({
  layouts: {},
  selection: null,
  loadingPackageId: null,
  error: null,

  // Layout actions
  setLayout: (packageId, layout) => {
    set((state) => ({
      layouts: {
        ...state.layouts,
        [packageId]: layout,
      },
      loadingPackageId: null,
    }));
  },

  updateSeat: (packageId, seatId, updates) => {
    set((state) => {
      const layout = state.layouts[packageId];
      if (!layout) return state;

      return {
        layouts: {
          ...state.layouts,
          [packageId]: {
            ...layout,
            seats: layout.seats.map((seat) =>
              seat.id === seatId ? { ...seat, ...updates } : seat
            ),
            lastUpdated: new Date().toISOString(),
          },
        },
      };
    });
  },

  handleRealtimeUpdate: (event) => {
    const { packageId, seatId, status, bookedBy } = event;

    set((state) => {
      const layout = state.layouts[packageId];
      if (!layout) return state;

      // Update the seat
      const updatedSeats = updateSeatStatus(layout.seats, seatId, status, bookedBy);

      // If this seat was in our selection and is now booked by someone else, remove it
      let selection = state.selection;
      if (
        selection?.packageId === packageId &&
        selection.selectedSeats.includes(seatId) &&
        (status === 'booked' || status === 'sold' || status === 'blocked')
      ) {
        selection = {
          ...selection,
          selectedSeats: selection.selectedSeats.filter((id) => id !== seatId),
        };
      }

      return {
        layouts: {
          ...state.layouts,
          [packageId]: {
            ...layout,
            seats: updatedSeats,
            lastUpdated: event.timestamp,
          },
        },
        selection,
      };
    });
  },

  clearLayout: (packageId) => {
    set((state) => {
      const { [packageId]: _, ...rest } = state.layouts;
      return { layouts: rest };
    });
  },

  // Selection actions
  initSelection: (packageId) => {
    set({
      selection: {
        packageId,
        selectedSeats: [],
      },
    });
  },

  selectSeat: (seatId) => {
    set((state) => {
      if (!state.selection) return state;

      // Check if seat is available in layout
      const layout = state.layouts[state.selection.packageId];
      if (layout) {
        const seat = layout.seats.find((s) => s.id === seatId);
        if (seat && seat.status !== 'available') {
          return state; // Can't select non-available seats
        }
      }

      if (state.selection.selectedSeats.includes(seatId)) {
        return state; // Already selected
      }

      return {
        selection: {
          ...state.selection,
          selectedSeats: [...state.selection.selectedSeats, seatId],
        },
      };
    });
  },

  deselectSeat: (seatId) => {
    set((state) => {
      if (!state.selection) return state;

      return {
        selection: {
          ...state.selection,
          selectedSeats: state.selection.selectedSeats.filter((id) => id !== seatId),
        },
      };
    });
  },

  toggleSeat: (seatId) => {
    const state = get();
    if (!state.selection) return;

    if (state.selection.selectedSeats.includes(seatId)) {
      get().deselectSeat(seatId);
    } else {
      get().selectSeat(seatId);
    }
  },

  clearSelection: () => {
    set({ selection: null });
  },

  setSelectedSeats: (seatIds) => {
    set((state) => {
      if (!state.selection) return state;

      return {
        selection: {
          ...state.selection,
          selectedSeats: seatIds,
        },
      };
    });
  },

  // Loading actions
  setLoading: (packageId) => {
    set({ loadingPackageId: packageId });
  },

  setError: (error) => {
    set({ error, loadingPackageId: null });
  },
}));

// Selector hooks for convenience
export const useLayout = (packageId: string) =>
  useSeatStore((state) => state.layouts[packageId]);

export const useSelection = () => useSeatStore((state) => state.selection);

export const useSelectedSeats = () =>
  useSeatStore((state) => state.selection?.selectedSeats ?? []);

export const useIsLoading = (packageId: string) =>
  useSeatStore((state) => state.loadingPackageId === packageId);
