import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || !password) {
      setError('Please enter phone number and password');
      return;
    }

    const success = await login(phone, password);

    if (success) {
      const user = useAuthStore.getState().user;
      if (user?.role === 'system_admin') {
        navigate('/admin');
      } else if (user?.role === 'agency_admin') {
        navigate('/agency');
      } else {
        navigate('/agent');
      }
    } else {
      setError('Invalid phone number or password');
    }
  };

  const fillDemoCredentials = (type: 'admin' | 'agency' | 'agent') => {
    if (type === 'admin') {
      setPhone('01700000001');
      setPassword('admin123');
    } else if (type === 'agency') {
      setPhone('01700000002');
      setPassword('agency123');
    } else {
      setPhone('01700000003');
      setPassword('agent123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-festive rounded-2xl shadow-festive mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-sand-800 font-display">BD Tour Connect</h1>
          <p className="text-sand-500 mt-2">Travel Agency Management Portal</p>
          <p className="text-sand-400 font-bengali text-sm mt-1">ভ্রমণ এজেন্সি ম্যানেজমেন্ট পোর্টাল</p>
        </div>

        {/* Login Card */}
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Phone Number"
              labelBn="ফোন নম্বর"
              type="tel"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />

            <Input
              label="Password"
              labelBn="পাসওয়ার্ড"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {error && (
              <div className="p-3 bg-danger-500/10 border border-danger-500/20 rounded-xl">
                <p className="text-danger-500 text-sm text-center">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Login
            </Button>
          </form>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-sand-50">
          <h3 className="text-sm font-semibold text-sand-600 mb-4 text-center">
            Demo Accounts (Click to fill)
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => fillDemoCredentials('admin')}
              className="w-full p-3 bg-white rounded-xl border-2 border-transparent hover:border-primary-500 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sand-800 group-hover:text-primary-600">System Admin</p>
                  <p className="text-sm text-sand-500">01700000001 / admin123</p>
                </div>
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-lg">
                  Platform Owner
                </span>
              </div>
            </button>

            <button
              onClick={() => fillDemoCredentials('agency')}
              className="w-full p-3 bg-white rounded-xl border-2 border-transparent hover:border-secondary-500 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sand-800 group-hover:text-secondary-600">Agency Admin</p>
                  <p className="text-sm text-sand-500">01700000002 / agency123</p>
                </div>
                <span className="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs font-medium rounded-lg">
                  Agency Owner
                </span>
              </div>
            </button>

            <button
              onClick={() => fillDemoCredentials('agent')}
              className="w-full p-3 bg-white rounded-xl border-2 border-transparent hover:border-accent-500 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sand-800 group-hover:text-accent-600">Sales Agent</p>
                  <p className="text-sm text-sand-500">01700000003 / agent123</p>
                </div>
                <span className="px-2 py-1 bg-accent-100 text-accent-700 text-xs font-medium rounded-lg">
                  Agent SA001
                </span>
              </div>
            </button>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sand-400 text-sm mt-6">
          &copy; 2024 BD Tour Connect. All rights reserved.
        </p>
      </div>
    </div>
  );
};
