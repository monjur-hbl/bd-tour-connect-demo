import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { agenciesAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const AgencySettings: React.FC = () => {
  const { user, agency } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Agency form state
  const [formData, setFormData] = useState({
    name: '',
    nameBn: '',
    phone: '',
    email: '',
    address: '',
    addressBn: '',
    tagline: '',
    taglineBn: '',
    primaryColor: '#F97316',
    logo: '',
    loginBgImage: '',
    loginLogo: '',
    loginWelcomeText: '',
    loginWelcomeTextBn: '',
  });

  useEffect(() => {
    const fetchAgency = async () => {
      if (!user?.agencyId) return;

      try {
        const result = await agenciesAPI.getById(user.agencyId);
        const a = result.agency;
        setFormData({
          name: a.name || '',
          nameBn: a.nameBn || '',
          phone: a.phone || '',
          email: a.email || '',
          address: a.address || '',
          addressBn: a.addressBn || '',
          tagline: a.tagline || '',
          taglineBn: a.taglineBn || '',
          primaryColor: a.primaryColor || '#F97316',
          logo: a.logo || '',
          loginBgImage: a.loginBgImage || '',
          loginLogo: a.loginLogo || '',
          loginWelcomeText: a.loginWelcomeText || '',
          loginWelcomeTextBn: a.loginWelcomeTextBn || '',
        });
      } catch (error) {
        console.error('Failed to fetch agency:', error);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchAgency();
  }, [user?.agencyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.agencyId) return;

    setLoading(true);

    try {
      await agenciesAPI.update(user.agencyId, formData);
      toast.success('Agency settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update agency settings');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
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
          Agency Settings
        </h1>
        <p className="text-sand-500 mt-1">
          Manage your agency profile and branding
          <span className="font-bengali ml-2">(এজেন্সি সেটিংস)</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <h2 className="text-lg font-bold text-sand-800 mb-6">
            Basic Information
            <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(মূল তথ্য)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Agency Name (English)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Agency Name (Bengali) <span className="font-bengali">(বাংলা নাম)</span>
              </label>
              <input
                type="text"
                name="nameBn"
                value={formData.nameBn}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-bengali"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Address (English)
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Address (Bengali) <span className="font-bengali">(ঠিকানা)</span>
              </label>
              <input
                type="text"
                name="addressBn"
                value={formData.addressBn}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-bengali"
              />
            </div>
          </div>
        </Card>

        {/* Branding */}
        <Card>
          <h2 className="text-lg font-bold text-sand-800 mb-6">
            Branding
            <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(ব্র্যান্ডিং)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Tagline (English)
              </label>
              <input
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Your journey starts here"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Tagline (Bengali) <span className="font-bengali">(স্লোগান)</span>
              </label>
              <input
                type="text"
                name="taglineBn"
                value={formData.taglineBn}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-bengali"
                placeholder="আপনার যাত্রা এখানেই শুরু"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Primary Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-14 h-12 rounded-lg border border-sand-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="flex-1 px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono"
                  placeholder="#F97316"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                name="logo"
                value={formData.logo}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </Card>

        {/* Login Page Customization */}
        <Card>
          <h2 className="text-lg font-bold text-sand-800 mb-6">
            Login Page Customization
            <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(লগইন পেজ কাস্টমাইজেশন)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Login Background Image URL
              </label>
              <input
                type="url"
                name="loginBgImage"
                value={formData.loginBgImage}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="https://example.com/bg.jpg"
              />
              <p className="text-xs text-sand-400 mt-1">Recommended size: 1920x1080px</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Login Page Logo URL
              </label>
              <input
                type="url"
                name="loginLogo"
                value={formData.loginLogo}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="https://example.com/login-logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Welcome Text (English)
              </label>
              <input
                type="text"
                name="loginWelcomeText"
                value={formData.loginWelcomeText}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Welcome to our travel portal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Welcome Text (Bengali) <span className="font-bengali">(স্বাগত বার্তা)</span>
              </label>
              <input
                type="text"
                name="loginWelcomeTextBn"
                value={formData.loginWelcomeTextBn}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-bengali"
                placeholder="আমাদের ট্রাভেল পোর্টালে স্বাগতম"
              />
            </div>
          </div>

          {/* Preview */}
          {(formData.loginBgImage || formData.loginLogo) && (
            <div className="mt-6 p-4 bg-sand-50 rounded-xl">
              <p className="text-sm font-medium text-sand-700 mb-3">Preview</p>
              <div
                className="relative h-40 rounded-lg overflow-hidden bg-sand-200"
                style={{
                  backgroundImage: formData.loginBgImage ? `url(${formData.loginBgImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  {formData.loginLogo && (
                    <img
                      src={formData.loginLogo}
                      alt="Login Logo"
                      className="h-16 object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Subscription Info */}
        <Card className="bg-gradient-to-r from-secondary-50 to-secondary-100">
          <h2 className="text-lg font-bold text-sand-800 mb-4">
            Subscription Plan
            <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(সাবস্ক্রিপশন)</span>
          </h2>

          <div className="flex items-center gap-4">
            <span className="px-4 py-2 bg-secondary-500 text-white rounded-lg font-medium text-lg">
              {agency?.slug ? 'Pro' : 'Basic'} Plan
            </span>
            <p className="text-sand-600">
              Contact admin to upgrade your subscription
            </p>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
