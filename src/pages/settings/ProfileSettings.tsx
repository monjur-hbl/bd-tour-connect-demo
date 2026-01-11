import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { profileAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const ProfileSettings: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [nameBn, setNameBn] = useState(user?.nameBn || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await profileAPI.update({ name, nameBn, email });
      setUser(result.user);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);

    try {
      await profileAPI.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sand-800 font-display">
          Profile Settings
        </h1>
        <p className="text-sand-500 mt-1">
          Manage your personal information and password
          <span className="font-bengali ml-2">(প্রোফাইল সেটিংস)</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <h2 className="text-lg font-bold text-sand-800 mb-6">
            Personal Information
            <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(ব্যক্তিগত তথ্য)</span>
          </h2>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={user?.phone || ''}
                disabled
                className="w-full px-4 py-3 bg-sand-100 border border-sand-200 rounded-xl text-sand-500 cursor-not-allowed"
              />
              <p className="text-xs text-sand-400 mt-1">Phone number cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Name (English)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Name (Bengali) <span className="font-bengali">(বাংলা নাম)</span>
              </label>
              <input
                type="text"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-bengali"
                placeholder="আপনার নাম লিখুন"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
              />
            </div>

            {/* Role Badge */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-sand-700 mb-2">
                Role
              </label>
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${
                user?.role === 'system_admin' ? 'bg-primary-100 text-primary-700' :
                user?.role === 'agency_admin' ? 'bg-secondary-100 text-secondary-700' :
                'bg-accent-100 text-accent-700'
              }`}>
                {user?.role === 'system_admin' ? 'System Administrator' :
                 user?.role === 'agency_admin' ? 'Agency Administrator' :
                 `Sales Agent - ${user?.agentCode}`}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Card>

        {/* Change Password */}
        <Card>
          <h2 className="text-lg font-bold text-sand-800 mb-6">
            Change Password
            <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(পাসওয়ার্ড পরিবর্তন)</span>
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full mt-4 px-6 py-3 bg-sand-800 text-white rounded-xl font-medium hover:bg-sand-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </Card>
      </div>

      {/* Permissions (for agents) */}
      {user?.role === 'sales_agent' && user?.permissions && user.permissions.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold text-sand-800 mb-4">
            Your Permissions
            <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(আপনার অনুমতি)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((perm: string) => (
              <span key={perm} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
