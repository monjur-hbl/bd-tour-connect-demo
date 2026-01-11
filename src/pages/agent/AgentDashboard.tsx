import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import {
  DEMO_STATS,
  DEMO_PACKAGES,
  DEMO_BOOKINGS,
  getAgencyById,
  getBookingsByAgent,
  formatCurrency
} from '../../data/demoData';

export const AgentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const stats = DEMO_STATS['sales_agent'];
  const agency = getAgencyById(user?.agencyId || '');
  const packages = DEMO_PACKAGES.filter(p => p.agencyId === user?.agencyId && p.status === 'current');
  const myBookings = getBookingsByAgent(user?.id || '');
  const recentBookings = myBookings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sand-800 font-display">
            Welcome, {user?.name}!
          </h1>
          <p className="text-sand-500 mt-1">
            Agent ID: <span className="font-mono font-semibold text-accent-600">{user?.agentCode}</span>
            <span className="mx-2">•</span>
            <span className="font-bengali">{agency?.nameBn}</span>
          </p>
        </div>
        <div className="px-4 py-2 bg-accent-100 text-accent-700 rounded-lg font-medium">
          Sales Agent - {user?.agentCode}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="My Bookings"
          titleBn="আমার বুকিং"
          value={stats.totalBookings}
          color="primary"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Today's Bookings"
          titleBn="আজকের বুকিং"
          value={stats.todayBookings}
          color="secondary"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Revenue Generated"
          titleBn="উপার্জিত আয়"
          value={formatCurrency(stats.totalRevenue)}
          color="success"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={{ value: 22, isPositive: true }}
        />
        <StatCard
          title="Pending Due"
          titleBn="বাকি টাকা"
          value={formatCurrency(stats.pendingAmount)}
          color="warning"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="p-6 bg-gradient-festive text-white rounded-2xl flex items-center gap-4 hover:shadow-festive transition-all group">
          <div className="p-4 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">Create New Booking</h3>
            <p className="opacity-80">নতুন বুকিং তৈরি করুন</p>
          </div>
        </button>

        <button className="p-6 bg-gradient-ocean text-white rounded-2xl flex items-center gap-4 hover:shadow-lg transition-all group">
          <div className="p-4 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">Search Booking</h3>
            <p className="opacity-80">বুকিং খুঁজুন (ID / ফোন / নাম)</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Packages */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-sand-800 font-display">
              Available Packages
              <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(উপলব্ধ প্যাকেজ)</span>
            </h2>
            <span className="text-sm text-sand-500">{packages.length} packages</span>
          </div>

          <div className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="p-4 border-2 border-sand-100 rounded-xl hover:border-primary-200 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sand-800 group-hover:text-primary-600 transition-colors">
                      {pkg.title}
                    </h3>
                    <p className="text-sm text-sand-500 font-bengali">{pkg.titleBn}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-sand-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {pkg.departureDate}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        pkg.availableSeats > 10 ? 'bg-green-100 text-green-700' :
                        pkg.availableSeats > 5 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {pkg.availableSeats} seats left
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600 text-lg">{formatCurrency(pkg.pricePerPerson)}</p>
                    <p className="text-xs text-sand-500">per person</p>
                    <button className="mt-2 px-4 py-1.5 bg-primary-50 text-primary-600 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* My Recent Bookings */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-sand-800 font-display">
              My Recent Bookings
              <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(সাম্প্রতিক বুকিং)</span>
            </h2>
            <button className="text-primary-600 text-sm font-medium hover:text-primary-700">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentBookings.length > 0 ? recentBookings.map((booking) => (
              <div key={booking.id} className="p-4 bg-sand-50 rounded-xl hover:bg-sand-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent-100 text-accent-700 rounded-xl flex items-center justify-center font-bold text-lg">
                      {booking.guestName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sand-800">{booking.guestName}</p>
                      <div className="flex items-center gap-2 text-sm text-sand-500">
                        <span className="font-mono">#{booking.bookingId}</span>
                        <span>•</span>
                        <span>{booking.passengers.length} pax</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sand-800">{formatCurrency(booking.totalAmount)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        booking.paymentStatus === 'fully_paid' ? 'bg-green-100 text-green-700' :
                        booking.paymentStatus === 'advance_paid' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.paymentStatus === 'fully_paid' ? 'Paid' :
                         booking.paymentStatus === 'advance_paid' ? 'Advance' : 'Due'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                {booking.dueAmount > 0 && (
                  <div className="mt-3 p-2 bg-amber-50 rounded-lg text-sm text-amber-700 flex items-center justify-between">
                    <span>Due: {formatCurrency(booking.dueAmount)}</span>
                    <button className="text-amber-800 font-medium hover:underline">Collect Payment</button>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-sand-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-sand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No bookings yet</p>
                <p className="font-bengali text-sm">এখনো কোন বুকিং নেই</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Agent Info Card */}
      <Card className="bg-gradient-to-r from-accent-500 to-accent-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold">{user?.name}</h3>
              <p className="opacity-90 font-bengali">{user?.nameBn}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  Agent Code: {user?.agentCode}
                </span>
                <span className="opacity-80 text-sm">{agency?.name}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="opacity-80 text-sm">Performance This Month</p>
            <p className="text-3xl font-bold">{stats.totalBookings}</p>
            <p className="opacity-80 text-sm">Bookings Created</p>
          </div>
        </div>
      </Card>

      {/* Permissions */}
      <Card>
        <h3 className="font-semibold text-sand-800 mb-4">Your Permissions</h3>
        <div className="flex flex-wrap gap-2">
          {user?.permissions?.map((perm) => (
            <span key={perm} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
};
