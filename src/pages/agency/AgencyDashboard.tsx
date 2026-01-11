import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import {
  DEMO_STATS,
  DEMO_PACKAGES,
  DEMO_BOOKINGS,
  getAgencyById,
  formatCurrency
} from '../../data/demoData';

export const AgencyDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const stats = DEMO_STATS['agency_admin'];
  const agency = getAgencyById(user?.agencyId || '');
  const packages = DEMO_PACKAGES.filter(p => p.agencyId === user?.agencyId);
  const bookings = DEMO_BOOKINGS.filter(b => b.agencyId === user?.agencyId);
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
            {agency?.nameBn} - {agency?.taglineBn}
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
          value={stats.todayBookings}
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
          value={formatCurrency(stats.totalRevenue)}
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
          value={formatCurrency(stats.pendingAmount)}
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
          value={stats.activePackages}
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
            <button className="text-primary-600 text-sm font-medium hover:text-primary-700">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {packages.filter(p => p.status === 'current').map((pkg) => (
              <div key={pkg.id} className="p-4 bg-sand-50 rounded-xl hover:bg-sand-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sand-800">{pkg.title}</h3>
                    <p className="text-sm text-sand-500 font-bengali">{pkg.titleBn}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-sand-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {pkg.departureDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {pkg.destination}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">{formatCurrency(pkg.pricePerPerson)}</p>
                    <p className="text-xs text-sand-500">per person</p>
                    <p className="text-sm text-accent-600 mt-1">
                      {pkg.availableSeats}/{pkg.totalSeats} seats
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-sand-800 font-display">
              Recent Bookings
              <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(সাম্প্রতিক বুকিং)</span>
            </h2>
            <button className="text-primary-600 text-sm font-medium hover:text-primary-700">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-sand-50 rounded-xl hover:bg-sand-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary-100 text-secondary-700 rounded-full flex items-center justify-center font-bold">
                    {booking.guestName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sand-800">{booking.guestName}</p>
                    <p className="text-sm text-sand-500">#{booking.bookingId} • {booking.passengers.length} passenger(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sand-800">{formatCurrency(booking.totalAmount)}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button className="p-4 bg-gradient-festive text-white rounded-xl flex items-center gap-3 hover:shadow-festive transition-shadow">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="font-semibold">New Package</span>
        </button>
        <button className="p-4 bg-secondary-500 text-white rounded-xl flex items-center gap-3 hover:bg-secondary-600 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="font-semibold">New Booking</span>
        </button>
        <button className="p-4 bg-accent-500 text-white rounded-xl flex items-center gap-3 hover:bg-accent-600 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="font-semibold">Add Agent</span>
        </button>
        <button className="p-4 bg-sand-600 text-white rounded-xl flex items-center gap-3 hover:bg-sand-700 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-semibold">Reports</span>
        </button>
      </div>

      {/* Agency Info Card */}
      <Card className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{agency?.name}</h3>
            <p className="opacity-90 font-bengali">{agency?.nameBn}</p>
            <p className="mt-2 opacity-80">{agency?.address}</p>
            <div className="flex items-center gap-4 mt-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {agency?.subscription.plan.toUpperCase()} Plan
              </span>
              <span className="text-sm opacity-80">
                {stats.totalAgents} Agents • {stats.activePackages} Active Packages
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="opacity-80 text-sm">Contact</p>
            <p className="text-lg font-semibold">{agency?.phone}</p>
            <p className="opacity-80 text-sm mt-1">{agency?.email}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
