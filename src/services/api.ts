// API Service for BD Tour Connect
import { SeatLayout, BusConfiguration, Seat, SeatStatus } from '../types';

const API_BASE = '/api';

// Helper to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  async login(phone: string, password: string) {
    const data = await apiRequest<{
      user: any;
      agency: any;
      token: string;
      expiresAt: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });

    // Store token
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_expires', data.expiresAt);

    return data;
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_expires');
    }
  },

  async getMe() {
    return apiRequest<{ user: any; agency: any }>('/auth/me');
  },

  isTokenValid(): boolean {
    const expires = localStorage.getItem('auth_expires');
    if (!expires) return false;
    return new Date(expires) > new Date();
  },
};

// ============================================
// AGENCIES API
// ============================================

export const agenciesAPI = {
  async getAll() {
    return apiRequest<{ agencies: any[] }>('/agencies');
  },

  async getById(id: string) {
    return apiRequest<{ agency: any }>(`/agencies/${id}`);
  },

  async create(data: any) {
    return apiRequest<{ id: string; message: string }>('/agencies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiRequest<{ message: string; agency: any }>(`/agencies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// PACKAGES API
// ============================================

export const packagesAPI = {
  async getAll(params?: { agencyId?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.agencyId) searchParams.set('agencyId', params.agencyId);
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return apiRequest<{ packages: any[] }>(`/packages${query ? `?${query}` : ''}`);
  },

  async getById(id: string) {
    return apiRequest<{ package: any }>(`/packages/${id}`);
  },

  async create(data: any) {
    return apiRequest<{ id: string; message: string }>('/packages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiRequest<{ message: string }>(`/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiRequest<{ message: string }>(`/packages/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// BOOKINGS API
// ============================================

export const bookingsAPI = {
  async getAll(params?: { agencyId?: string; agentId?: string; packageId?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.agencyId) searchParams.set('agencyId', params.agencyId);
    if (params?.agentId) searchParams.set('agentId', params.agentId);
    if (params?.packageId) searchParams.set('packageId', params.packageId);
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return apiRequest<{ bookings: any[] }>(`/bookings${query ? `?${query}` : ''}`);
  },

  async getById(id: string) {
    return apiRequest<{ booking: any }>(`/bookings/${id}`);
  },

  async create(data: any) {
    return apiRequest<{ id: string; bookingId: string; message: string }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiRequest<{ message: string }>(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async search(query: string, agencyId?: string) {
    const searchParams = new URLSearchParams({ q: query });
    if (agencyId) searchParams.set('agencyId', agencyId);

    return apiRequest<{ bookings: any[] }>(`/bookings/search?${searchParams}`);
  },
};

// ============================================
// USERS API
// ============================================

export const usersAPI = {
  async getAll(params?: { agencyId?: string; role?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.agencyId) searchParams.set('agencyId', params.agencyId);
    if (params?.role) searchParams.set('role', params.role);

    const query = searchParams.toString();
    return apiRequest<{ users: any[] }>(`/users${query ? `?${query}` : ''}`);
  },

  async create(data: any) {
    return apiRequest<{ id: string; agentCode?: string; message: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiRequest<{ message: string }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiRequest<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// PROFILE API (self-update)
// ============================================

export const profileAPI = {
  async update(data: { name?: string; nameBn?: string; email?: string }) {
    return apiRequest<{ message: string; user: any }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiRequest<{ message: string }>('/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// ============================================
// STATS API
// ============================================

export const statsAPI = {
  async get(params?: { agencyId?: string; agentId?: string; role?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.agencyId) searchParams.set('agencyId', params.agencyId);
    if (params?.agentId) searchParams.set('agentId', params.agentId);
    if (params?.role) searchParams.set('role', params.role);

    const query = searchParams.toString();
    return apiRequest<{ stats: any }>(`/stats${query ? `?${query}` : ''}`);
  },
};

// ============================================
// SEATS API
// ============================================

export const seatsAPI = {
  /**
   * Get seat layout for a package
   */
  async getLayout(packageId: string) {
    return apiRequest<{ seatLayout: SeatLayout | null }>(`/packages/${packageId}/seats`);
  },

  /**
   * Update seat layout for a package (admin only)
   */
  async updateLayout(packageId: string, layout: {
    busConfiguration: BusConfiguration;
    seats: Seat[];
  }) {
    return apiRequest<{ message: string; seatLayout: SeatLayout }>(`/packages/${packageId}/seats`, {
      method: 'PUT',
      body: JSON.stringify(layout),
    });
  },

  /**
   * Block specific seats (admin/agent)
   */
  async blockSeats(packageId: string, seatIds: string[], reason?: string) {
    return apiRequest<{ message: string; blockedSeats: string[] }>(`/packages/${packageId}/seats/block`, {
      method: 'POST',
      body: JSON.stringify({ seatIds, reason }),
    });
  },

  /**
   * Unblock specific seats (admin/agent)
   */
  async unblockSeats(packageId: string, seatIds: string[]) {
    return apiRequest<{ message: string; unblockedSeats: string[] }>(`/packages/${packageId}/seats/block`, {
      method: 'DELETE',
      body: JSON.stringify({ seatIds }),
    });
  },

  /**
   * Temporarily lock seats during checkout (prevents double booking)
   * Lock expires after 5 minutes if not confirmed
   */
  async lockSeats(packageId: string, seatIds: string[]) {
    return apiRequest<{
      lockId: string;
      lockedSeats: string[];
      expiresAt: string;
    }>(`/packages/${packageId}/seats/lock`, {
      method: 'POST',
      body: JSON.stringify({ seatIds }),
    });
  },

  /**
   * Release seat lock (if checkout is cancelled)
   */
  async releaseLock(packageId: string, lockId: string) {
    return apiRequest<{ message: string }>(`/packages/${packageId}/seats/lock`, {
      method: 'DELETE',
      body: JSON.stringify({ lockId }),
    });
  },

  /**
   * Confirm seat booking (converts lock to permanent booking)
   */
  async confirmSeats(packageId: string, lockId: string, bookingId: string) {
    return apiRequest<{ message: string; bookedSeats: string[] }>(`/packages/${packageId}/seats/confirm`, {
      method: 'POST',
      body: JSON.stringify({ lockId, bookingId }),
    });
  },

  /**
   * Get real-time seat availability
   */
  async getAvailability(packageId: string) {
    return apiRequest<{
      totalSeats: number;
      available: number;
      booked: number;
      blocked: number;
      sold: number;
      seats: Array<{ id: string; status: SeatStatus; deck: 'lower' | 'upper' }>;
    }>(`/packages/${packageId}/seats/availability`);
  },

  /**
   * Update individual seat status (admin only)
   */
  async updateSeatStatus(
    packageId: string,
    seatId: string,
    status: SeatStatus,
    metadata?: { bookedBy?: string; gender?: 'male' | 'female' | 'other'; blockedReason?: string }
  ) {
    return apiRequest<{ message: string; seat: Seat }>(`/packages/${packageId}/seats/${seatId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...metadata }),
    });
  },

  /**
   * Bulk update seat statuses (admin only)
   */
  async bulkUpdateSeats(
    packageId: string,
    updates: Array<{ seatId: string; status: SeatStatus; metadata?: any }>
  ) {
    return apiRequest<{ message: string; updatedCount: number }>(`/packages/${packageId}/seats/bulk`, {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    });
  },
};
