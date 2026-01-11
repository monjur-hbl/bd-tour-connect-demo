import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { statsAPI, packagesAPI, bookingsAPI } from '../../services/api';

const formatCurrency = (amount: number): string => `৳${amount.toLocaleString('en-BD')}`;

export const AgencyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, agency } = useAuthStore();
  const [stats, setStats] = useState<any>({});
  const [packages, setPackages] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.agencyId) return;

      try {
        const [statsData, packagesData, bookingsData] = await Promise.all([
          statsAPI.get({ agencyId: user.agencyId }),
          packagesAPI.getAll({ agencyId: user.agencyId }),
          bookingsAPI.getAll({ agencyId: user.agencyId })
        ]);
        setStats(statsData.stats);
        setPackages(packagesData.packages);
        setBookings(bookingsData.bookings);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.agencyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const currentPackages = packages.filter(p => p.status === 'current');
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sand-800 font-display">
            {agency?.name || 'Agency'} Dashboard
          </h1>
          <p className="text-sand-500 mt-1 font-bengali">
            {agency?.nameBn}
          </p>
        </div>
        <div className="px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg font-medium">
          Agency Admin
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Bookings"
          titleBn="আজকের বুকিং"
          value={stats.todayBookings || 0}
          color="primary"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Revenue"
          titleBn="মোট আয়"
          value={formatCurrency(stats.totalRevenue || 0)}
          color="success"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={{ value: 28, isPositive: true }}
        />
        <StatCard
          title="Pending Amount"
          titleBn="বাকি টাকা"
          value={formatCurrency(stats.pendingAmount || 0)}
          color="warning"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Active Packages"
          titleBn="সক্রিয় প্যাকেজ"
          value={stats.activePackages || 0}
          color="secondary"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Packages */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-sand-800 font-display">
              Active Packages
              <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(সক্রিয় প্যাকেজ)</span>
            </h2>
          </div>

          <div className="space-y-4">
            {currentPackages.length > 0 ? currentPackages.map((pkg) => (
              <div key={pkg.id} className="p-4 bg-sand-50 rounded-xl hover:bg-sand-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sand-800">{pkg.title}</h3>
                    <p className="text-sm text-sand-500 font-bengali">{pkg.titleBn}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-sand-600">
                      <span>{pkg.departureDate}</span>
                      <span>{pkg.destination}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">{formatCurrency(pkg.pricePerPerson)}</p>
                    <p className="text-sm text-accent-600 mt-1">{pkg.availableSeats}/{pkg.totalSeats} seats</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-sand-500">No active packages</div>
            )}
          </div>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-sand-800 font-display">
              Recent Bookings
              <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(সাম্প্রতিক বুকিং)</span>
            </h2>
          </div>

          <div className="space-y-4">
            {recentBookings.length > 0 ? recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-sand-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary-100 text-secondary-700 rounded-full flex items-center justify-center font-bold">
                    {booking.guestName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sand-800">{booking.guestName}</p>
                    <p className="text-sm text-sand-500">#{booking.bookingId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sand-800">{formatCurrency(booking.totalAmount)}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-sand-500">No bookings yet</div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/agency/packages')}
          className="p-4 bg-gradient-festive text-white rounded-xl flex items-center gap-3 hover:shadow-festive transition-shadow"
        >
          <span className="font-semibold">+ New Package</span>
        </button>
        <button
          onClick={() => navigate('/agency/bookings')}
          className="p-4 bg-secondary-500 text-white rounded-xl flex items-center gap-3 hover:bg-secondary-600 transition-colors"
        >
          <span className="font-semibold">+ New Booking</span>
        </button>
        <button
          onClick={() => navigate('/agency/agents')}
          className="p-4 bg-accent-500 text-white rounded-xl flex items-center gap-3 hover:bg-accent-600 transition-colors"
        >
          <span className="font-semibold">+ Add Agent</span>
        </button>
        <button
          onClick={() => navigate('/agency/settings')}
          className="p-4 bg-sand-600 text-white rounded-xl flex items-center gap-3 hover:bg-sand-700 transition-colors"
        >
          <span className="font-semibold">Settings</span>
        </button>
      </div>
    </div>
  );
};
