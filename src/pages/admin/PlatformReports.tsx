import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { statsAPI, agenciesAPI, bookingsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Stats {
  totalAgencies: number;
  totalAgents: number;
  totalBookings: number;
  todayBookings: number;
  totalRevenue: number;
  pendingAmount: number;
  activePackages: number;
}

interface Agency {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  subscription: { plan: string };
  createdAt: string;
}

interface Booking {
  id: string;
  bookingId: string;
  guestName: string;
  guestPhone: string;
  totalAmount: number;
  dueAmount: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

export const PlatformReports: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsResult, agenciesResult] = await Promise.all([
        statsAPI.get({ role: 'system_admin' }),
        agenciesAPI.getAll(),
      ]);
      setStats(statsResult.stats);
      setAgencies(agenciesResult.agencies);

      // Fetch recent bookings from all agencies
      const allBookings: Booking[] = [];
      for (const agency of agenciesResult.agencies.slice(0, 3)) {
        try {
          const bookingsResult = await bookingsAPI.getAll({ agencyId: agency.id });
          allBookings.push(...bookingsResult.bookings);
        } catch (e) {
          // Skip if no bookings
        }
      }
      // Sort by date and take latest 10
      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentBookings(allBookings.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sand-800 font-display">
          Platform Reports
        </h1>
        <p className="text-sand-500 mt-1">
          Overview of platform-wide metrics and analytics
          <span className="font-bengali ml-2">(প্ল্যাটফর্ম রিপোর্ট)</span>
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Pending Amount</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats?.pendingAmount || 0)}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sand-500 text-sm">Total Bookings</p>
              <p className="text-3xl font-bold text-sand-800 mt-1">{stats?.totalBookings || 0}</p>
              <p className="text-green-600 text-sm mt-1">+{stats?.todayBookings || 0} today</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sand-500 text-sm">Active Packages</p>
              <p className="text-3xl font-bold text-sand-800 mt-1">{stats?.activePackages || 0}</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-4xl font-bold text-sand-800">{stats?.totalAgencies || 0}</p>
              <p className="text-sand-500">Total Agencies</p>
              <p className="font-bengali text-sand-400 text-sm">মোট এজেন্সি</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-4xl font-bold text-sand-800">{stats?.totalAgents || 0}</p>
              <p className="text-sand-500">Total Users</p>
              <p className="font-bengali text-sand-400 text-sm">মোট ব্যবহারকারী</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-4xl font-bold text-sand-800">
                {stats?.totalRevenue ? Math.round((stats.totalRevenue - (stats.pendingAmount || 0)) / stats.totalRevenue * 100) : 0}%
              </p>
              <p className="text-sand-500">Collection Rate</p>
              <p className="font-bengali text-sand-400 text-sm">সংগ্রহের হার</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agency List */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-sand-800">Registered Agencies</h2>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              {agencies.length} total
            </span>
          </div>
          <div className="space-y-3">
            {agencies.slice(0, 5).map((agency) => (
              <div key={agency.id} className="flex items-center justify-between p-3 bg-sand-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-bold">
                    {agency.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sand-800">{agency.name}</p>
                    <p className="text-sm text-sand-500">/{agency.slug}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  agency.subscription?.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                  agency.subscription?.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {agency.subscription?.plan || 'basic'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-sand-800">Recent Bookings</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              {stats?.todayBookings || 0} today
            </span>
          </div>
          <div className="space-y-3">
            {recentBookings.length > 0 ? recentBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-sand-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-100 text-secondary-700 rounded-xl flex items-center justify-center font-mono text-sm font-bold">
                    #{booking.bookingId}
                  </div>
                  <div>
                    <p className="font-semibold text-sand-800">{booking.guestName}</p>
                    <p className="text-sm text-sand-500">{formatDate(booking.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sand-800">{formatCurrency(booking.totalAmount)}</p>
                  <span className={`text-xs ${
                    booking.paymentStatus === 'fully_paid' ? 'text-green-600' :
                    booking.paymentStatus === 'advance_paid' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {booking.paymentStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-center text-sand-500 py-4">No recent bookings</p>
            )}
          </div>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <h2 className="text-lg font-bold text-sand-800 mb-6">Revenue Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-2xl">
            <p className="text-green-600 text-sm font-medium mb-2">Collected Amount</p>
            <p className="text-3xl font-bold text-green-700">
              {formatCurrency((stats?.totalRevenue || 0) - (stats?.pendingAmount || 0))}
            </p>
            <div className="mt-4 h-2 bg-green-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${stats?.totalRevenue ? Math.round(((stats.totalRevenue - (stats.pendingAmount || 0)) / stats.totalRevenue) * 100) : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center p-6 bg-yellow-50 rounded-2xl">
            <p className="text-yellow-600 text-sm font-medium mb-2">Pending Collection</p>
            <p className="text-3xl font-bold text-yellow-700">
              {formatCurrency(stats?.pendingAmount || 0)}
            </p>
            <div className="mt-4 h-2 bg-yellow-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${stats?.totalRevenue ? Math.round((stats.pendingAmount || 0) / stats.totalRevenue * 100) : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center p-6 bg-primary-50 rounded-2xl">
            <p className="text-primary-600 text-sm font-medium mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-primary-700">
              {formatCurrency(stats?.totalRevenue || 0)}
            </p>
            <div className="mt-4 h-2 bg-primary-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
