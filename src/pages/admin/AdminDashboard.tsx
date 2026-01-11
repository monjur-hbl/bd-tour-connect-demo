import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { statsAPI, agenciesAPI } from '../../services/api';

const formatCurrency = (amount: number): string => `৳${amount.toLocaleString('en-BD')}`;

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>({});
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, agenciesData] = await Promise.all([
          statsAPI.get({ role: 'system_admin' }),
          agenciesAPI.getAll()
        ]);
        setStats(statsData.stats);
        setAgencies(agenciesData.agencies);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sand-800 font-display">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sand-500 mt-1">
            Platform overview and analytics
            <span className="font-bengali ml-2">(প্ল্যাটফর্ম ওভারভিউ)</span>
          </p>
        </div>
        <div className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium">
          System Administrator
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Agencies"
          titleBn="মোট এজেন্সি"
          value={stats.totalAgencies || 0}
          color="primary"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Total Bookings"
          titleBn="মোট বুকিং"
          value={stats.totalBookings || 0}
          color="secondary"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          trend={{ value: 23, isPositive: true }}
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
          trend={{ value: 18, isPositive: true }}
        />
        <StatCard
          title="Total Agents"
          titleBn="মোট এজেন্ট"
          value={stats.totalAgents || 0}
          color="accent"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Agency List */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-sand-800 font-display">
            Registered Agencies
            <span className="font-bengali text-base font-normal text-sand-500 ml-2">(নিবন্ধিত এজেন্সি)</span>
          </h2>
          <button
            onClick={() => navigate('/admin/agencies')}
            className="btn-primary text-sm py-2"
          >
            + Add Agency
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand-100">
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Agency Name</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Plan</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Max Agents</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((agency) => (
                <tr key={agency.id} className="border-b border-sand-50 hover:bg-sand-50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-sand-800">{agency.name}</p>
                      <p className="text-sm text-sand-500 font-bengali">{agency.nameBn}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      agency.subscription?.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                      agency.subscription?.plan === 'pro' ? 'bg-secondary-100 text-secondary-700' :
                      'bg-sand-100 text-sand-700'
                    }`}>
                      {agency.subscription?.plan?.charAt(0).toUpperCase() + agency.subscription?.plan?.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sand-600">
                    {agency.subscription?.maxAgents || 0}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      agency.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {agency.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sand-600">
                    {agency.phone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover className="cursor-pointer group" onClick={() => navigate('/admin/agencies')}>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-100 transition-colors">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sand-800">Add New Agency</h3>
              <p className="text-sm text-sand-500">Register a new travel agency</p>
            </div>
          </div>
        </Card>

        <Card hover className="cursor-pointer group" onClick={() => navigate('/admin/reports')}>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-secondary-50 rounded-xl text-secondary-600 group-hover:bg-secondary-100 transition-colors">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sand-800">View Reports</h3>
              <p className="text-sm text-sand-500">Platform analytics & insights</p>
            </div>
          </div>
        </Card>

        <Card hover className="cursor-pointer group" onClick={() => navigate('/admin/users')}>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-accent-50 rounded-xl text-accent-600 group-hover:bg-accent-100 transition-colors">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sand-800">Manage Users</h3>
              <p className="text-sm text-sand-500">View and manage all users</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
