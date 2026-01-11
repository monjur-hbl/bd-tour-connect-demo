import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { agenciesAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Agency {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  addressBn: string;
  primaryColor: string;
  tagline: string;
  taglineBn: string;
  subscription: {
    plan: string;
    maxAgents: number;
    maxPackagesPerMonth: number;
  };
  isActive: boolean;
  createdAt: string;
}

const SUBSCRIPTION_PLANS = [
  { value: 'basic', label: 'Basic', agents: 3, packages: 10 },
  { value: 'pro', label: 'Pro', agents: 10, packages: 50 },
  { value: 'enterprise', label: 'Enterprise', agents: 25, packages: 100 },
];

export const AgenciesManagement: React.FC = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nameBn: '',
    slug: '',
    phone: '',
    email: '',
    address: '',
    addressBn: '',
    primaryColor: '#F97316',
    tagline: '',
    taglineBn: '',
    subscriptionPlan: 'basic',
  });

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const result = await agenciesAPI.getAll();
      setAgencies(result.agencies);
    } catch (error) {
      console.error('Failed to fetch agencies:', error);
      toast.error('Failed to load agencies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (agency?: Agency) => {
    if (agency) {
      setEditingAgency(agency);
      setFormData({
        name: agency.name,
        nameBn: agency.nameBn || '',
        slug: agency.slug,
        phone: agency.phone,
        email: agency.email || '',
        address: agency.address || '',
        addressBn: agency.addressBn || '',
        primaryColor: agency.primaryColor || '#F97316',
        tagline: agency.tagline || '',
        taglineBn: agency.taglineBn || '',
        subscriptionPlan: agency.subscription?.plan || 'basic',
      });
    } else {
      setEditingAgency(null);
      setFormData({
        name: '',
        nameBn: '',
        slug: '',
        phone: '',
        email: '',
        address: '',
        addressBn: '',
        primaryColor: '#F97316',
        tagline: '',
        taglineBn: '',
        subscriptionPlan: 'basic',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgency(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-generate slug from name
    if (name === 'name' && !editingAgency) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.value === formData.subscriptionPlan);
      const agencyData = {
        ...formData,
        subscription: {
          plan: formData.subscriptionPlan,
          maxAgents: selectedPlan?.agents || 3,
          maxPackagesPerMonth: selectedPlan?.packages || 10,
        },
      };

      if (editingAgency) {
        await agenciesAPI.update(editingAgency.id, agencyData);
        toast.success('Agency updated successfully');
      } else {
        await agenciesAPI.create(agencyData);
        toast.success('Agency created successfully');
      }

      handleCloseModal();
      fetchAgencies();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-gray-100 text-gray-700',
      pro: 'bg-blue-100 text-blue-700',
      enterprise: 'bg-purple-100 text-purple-700',
    };
    return colors[plan] || 'bg-gray-100 text-gray-700';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sand-800 font-display">
            Agencies Management
          </h1>
          <p className="text-sand-500 mt-1">
            Manage all travel agencies on the platform
            <span className="font-bengali ml-2">(এজেন্সি ব্যবস্থাপনা)</span>
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Agency
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-sand-800">{agencies.length}</p>
              <p className="text-sand-500 text-sm">Total Agencies</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-sand-800">{agencies.filter(a => a.isActive).length}</p>
              <p className="text-sand-500 text-sm">Active</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-sand-800">{agencies.filter(a => a.subscription?.plan === 'pro').length}</p>
              <p className="text-sand-500 text-sm">Pro Plan</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-sand-800">{agencies.filter(a => a.subscription?.plan === 'enterprise').length}</p>
              <p className="text-sand-500 text-sm">Enterprise</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Agencies Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand-100">
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Agency</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Contact</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Plan</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Limits</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Created</th>
                <th className="text-right py-3 px-4 text-sand-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agencies.length > 0 ? agencies.map((agency) => (
                <tr key={agency.id} className="border-b border-sand-50 hover:bg-sand-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: agency.primaryColor || '#F97316' }}
                      >
                        {agency.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sand-800">{agency.name}</p>
                        {agency.nameBn && <p className="text-sm text-sand-500 font-bengali">{agency.nameBn}</p>}
                        <p className="text-xs text-sand-400">/{agency.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sand-800">{agency.phone}</p>
                    {agency.email && <p className="text-sm text-sand-500">{agency.email}</p>}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getPlanBadge(agency.subscription?.plan)}`}>
                      {agency.subscription?.plan || 'basic'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-sand-600">
                    <p>{agency.subscription?.maxAgents || 3} agents</p>
                    <p>{agency.subscription?.maxPackagesPerMonth || 10} packages/mo</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${agency.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {agency.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sand-600 text-sm">
                    {formatDate(agency.createdAt)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(agency)}
                        className="p-2 text-sand-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sand-500">
                    No agencies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-sand-100">
              <h2 className="text-xl font-bold text-sand-800">
                {editingAgency ? 'Edit Agency' : 'Add New Agency'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Name (English) *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Name (Bengali)</label>
                  <input
                    type="text"
                    name="nameBn"
                    value={formData.nameBn}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-bengali"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                    required
                    disabled={!!editingAgency}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Primary Color</label>
                  <div className="flex gap-2">
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
                      className="flex-1 px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Subscription Plan</label>
                <select
                  name="subscriptionPlan"
                  value={formData.subscriptionPlan}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {SUBSCRIPTION_PLANS.map(plan => (
                    <option key={plan.value} value={plan.value}>
                      {plan.label} ({plan.agents} agents, {plan.packages} packages/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : editingAgency ? 'Update Agency' : 'Create Agency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
