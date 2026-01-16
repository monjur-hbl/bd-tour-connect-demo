import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { usersAPI } from '../../services/api';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  DollarSign,
  Wallet,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserX,
  Building2,
  Percent,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AgentType, AgentAccountSettings } from '../../types';

interface Agent {
  id: string;
  phone: string;
  name: string;
  nameBn: string;
  email: string;
  agentCode: string;
  agentType?: AgentType;
  agentAccountSettings?: AgentAccountSettings;
  permissions: string[];
  canModifyBookings?: boolean;
  canCancelBookings?: boolean;
  canDeleteBookings?: boolean;
  canCollectPayments?: boolean;
  canCreateHoldBookings?: boolean;
  isActive: boolean;
  createdAt: string;
}

const AVAILABLE_PERMISSIONS = [
  { value: 'create_booking', label: 'Create Booking', labelBn: 'বুকিং তৈরি' },
  { value: 'view_all_bookings', label: 'View All Bookings', labelBn: 'সব বুকিং দেখুন' },
  { value: 'collect_payment', label: 'Collect Payment', labelBn: 'পেমেন্ট সংগ্রহ' },
];

const AGENT_TYPES = [
  {
    value: 'in_house',
    label: 'In-House Agent',
    labelBn: 'ইন-হাউজ এজেন্ট',
    description: 'Company employee - cannot modify package prices',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'third_party',
    label: '3rd Party Agent',
    labelBn: 'থার্ড পার্টি এজেন্ট',
    description: 'External partner - can modify prices within limits',
    color: 'bg-purple-100 text-purple-700',
  },
];

export const AgentManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    name: '',
    nameBn: '',
    email: '',
    permissions: ['create_booking'] as string[],
    agentType: 'in_house' as AgentType,
    accountBalance: 0,
    creditLimit: 50000,
    canModifyPrices: false,
    priceModificationLimit: 10, // 10% default
    canCollectPayments: true,
    canCreateHoldBookings: true, // Allow agent to create hold bookings
  });

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedAgentForBalance, setSelectedAgentForBalance] = useState<Agent | null>(null);
  const [topUpAmount, setTopUpAmount] = useState(0);

  useEffect(() => {
    fetchAgents();
  }, [user?.agencyId]);

  const fetchAgents = async () => {
    if (!user?.agencyId) return;

    try {
      const result = await usersAPI.getAll({ agencyId: user.agencyId, role: 'sales_agent' });
      setAgents(result.users);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        phone: agent.phone,
        password: '',
        name: agent.name,
        nameBn: agent.nameBn || '',
        email: agent.email || '',
        permissions: agent.permissions || [],
        agentType: agent.agentType || 'in_house',
        accountBalance: agent.agentAccountSettings?.accountBalance || 0,
        creditLimit: agent.agentAccountSettings?.creditLimit || 50000,
        canModifyPrices: agent.agentAccountSettings?.canModifyPrices || false,
        priceModificationLimit: agent.agentAccountSettings?.priceModificationLimit || 10,
        canCollectPayments: agent.canCollectPayments ?? true,
        canCreateHoldBookings: agent.canCreateHoldBookings ?? true,
      });
    } else {
      setEditingAgent(null);
      setFormData({
        phone: '',
        password: 'agent123',
        name: '',
        nameBn: '',
        email: '',
        permissions: ['create_booking'],
        agentType: 'in_house',
        accountBalance: 0,
        creditLimit: 50000,
        canModifyPrices: false,
        priceModificationLimit: 10,
        canCollectPayments: true,
        canCreateHoldBookings: true,
      });
    }
    setShowModal(true);
  };

  const handleOpenBalanceModal = (agent: Agent) => {
    setSelectedAgentForBalance(agent);
    setTopUpAmount(0);
    setShowBalanceModal(true);
  };

  const handleTopUp = async () => {
    if (!selectedAgentForBalance || topUpAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      const currentSettings = selectedAgentForBalance.agentAccountSettings || {
        accountBalance: 0,
        creditLimit: 50000,
        usedBalance: 0,
        availableBalance: 0,
        canModifyPrices: false,
      };

      const newBalance = currentSettings.accountBalance + topUpAmount;
      const newAvailableBalance = newBalance - (currentSettings.usedBalance || 0);

      await usersAPI.update(selectedAgentForBalance.id, {
        agentAccountSettings: {
          ...currentSettings,
          accountBalance: newBalance,
          availableBalance: newAvailableBalance,
          lastTopUpDate: new Date().toISOString(),
          lastTopUpAmount: topUpAmount,
        },
      });

      toast.success(`Added ${formatCurrency(topUpAmount)} to ${selectedAgentForBalance.name}'s account`);
      setShowBalanceModal(false);
      fetchAgents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to top up');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgent(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.agencyId) return;

    setSaving(true);

    // Build agent account settings
    const agentAccountSettings: AgentAccountSettings = {
      accountBalance: formData.accountBalance,
      creditLimit: formData.creditLimit,
      usedBalance: editingAgent?.agentAccountSettings?.usedBalance || 0,
      availableBalance: formData.accountBalance - (editingAgent?.agentAccountSettings?.usedBalance || 0),
      canModifyPrices: formData.agentType === 'third_party' ? formData.canModifyPrices : false,
      priceModificationLimit: formData.agentType === 'third_party' ? formData.priceModificationLimit : undefined,
      lastTopUpDate: editingAgent?.agentAccountSettings?.lastTopUpDate,
      lastTopUpAmount: editingAgent?.agentAccountSettings?.lastTopUpAmount,
    };

    try {
      if (editingAgent) {
        // Update existing agent
        await usersAPI.update(editingAgent.id, {
          name: formData.name,
          nameBn: formData.nameBn,
          email: formData.email,
          permissions: formData.permissions,
          agentType: formData.agentType,
          agentAccountSettings,
          canCollectPayments: formData.canCollectPayments,
          canCreateHoldBookings: formData.canCreateHoldBookings,
          // In-house agents cannot modify bookings with payments
          canModifyBookings: false,
          canCancelBookings: false,
          canDeleteBookings: false,
          ...(formData.password && { password: formData.password }),
        });
        toast.success('Agent updated successfully');
      } else {
        // Create new agent
        await usersAPI.create({
          phone: formData.phone,
          password: formData.password || 'agent123',
          name: formData.name,
          nameBn: formData.nameBn,
          email: formData.email,
          role: 'sales_agent',
          agencyId: user.agencyId,
          permissions: formData.permissions,
          agentType: formData.agentType,
          agentAccountSettings,
          canCollectPayments: formData.canCollectPayments,
          canCreateHoldBookings: formData.canCreateHoldBookings,
          canModifyBookings: false,
          canCancelBookings: false,
          canDeleteBookings: false,
        });
        toast.success('Agent created successfully');
      }

      handleCloseModal();
      fetchAgents();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    if (!window.confirm(`Are you sure you want to remove ${agent.name}?`)) {
      return;
    }

    try {
      await usersAPI.delete(agent.id);
      toast.success('Agent removed successfully');
      fetchAgents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove agent');
    }
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
            Agent Management
          </h1>
          <p className="text-sand-500 mt-1">
            Add, edit, and manage your sales agents
            <span className="font-bengali ml-2">(এজেন্ট ব্যবস্থাপনা)</span>
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Agent
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-sand-800">{agents.length}</p>
              <p className="text-sm text-sand-500">Total Agents</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {agents.filter(a => a.agentType === 'in_house').length}
              </p>
              <p className="text-sm text-sand-500">In-House</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {agents.filter(a => a.agentType === 'third_party').length}
              </p>
              <p className="text-sm text-sand-500">3rd Party</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(agents.reduce((sum, a) => sum + (a.agentAccountSettings?.availableBalance || 0), 0))}
              </p>
              <p className="text-sm text-sand-500">Total Balance</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Agents List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand-100">
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Agent</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Balance / Limit</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Phone</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Status</th>
                <th className="text-right py-3 px-4 text-sand-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.length > 0 ? agents.map((agent) => {
                const settings = agent.agentAccountSettings;
                const availableBalance = settings?.availableBalance || 0;
                const creditLimit = settings?.creditLimit || 0;
                const usagePercent = creditLimit > 0 ? ((creditLimit - availableBalance) / creditLimit) * 100 : 0;
                const isLowBalance = availableBalance < creditLimit * 0.2;

                return (
                  <tr key={agent.id} className="border-b border-sand-50 hover:bg-sand-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          agent.agentType === 'third_party'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {agent.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-sand-800">{agent.name}</p>
                          <p className="text-xs text-sand-500 font-mono">{agent.agentCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          agent.agentType === 'third_party'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {agent.agentType === 'third_party' ? '3rd Party' : 'In-House'}
                        </span>
                        {agent.agentType === 'third_party' && settings?.canModifyPrices && (
                          <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            ±{settings.priceModificationLimit}% price mod
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {agent.canCreateHoldBookings !== false && (
                            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Hold
                            </span>
                          )}
                          {agent.canCollectPayments !== false && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Payment
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isLowBalance ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(availableBalance)}
                          </span>
                          {isLowBalance && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <div className="w-24 h-1.5 bg-sand-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${100 - usagePercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-sand-500">of {formatCurrency(creditLimit)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sand-600">{agent.phone}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        agent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenBalanceModal(agent)}
                          className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Top Up Balance"
                        >
                          <DollarSign className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(agent)}
                          className="p-2 text-sand-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent)}
                          className="p-2 text-sand-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sand-500">
                    No agents found. Click "Add Agent" to create one.
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
                {editingAgent ? 'Edit Agent' : 'Add New Agent'}
                <span className="font-bengali text-sm font-normal text-sand-500 ml-2">
                  {editingAgent ? '(এজেন্ট সম্পাদনা)' : '(নতুন এজেন্ট)'}
                </span>
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!!editingAgent}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-sand-100 disabled:cursor-not-allowed"
                    placeholder="01700000000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">
                    {editingAgent ? 'New Password' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder={editingAgent ? 'Leave blank to keep current' : 'agent123'}
                    required={!editingAgent}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">
                    Name (English) *
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
                    Name (Bengali)
                  </label>
                  <input
                    type="text"
                    name="nameBn"
                    value={formData.nameBn}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-bengali"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="agent@agency.com"
                />
              </div>

              {/* Agent Type Selection */}
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-2">
                  Agent Type <span className="font-bengali">(এজেন্ট ধরন)</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {AGENT_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.agentType === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-sand-200 hover:border-sand-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="agentType"
                        value={type.value}
                        checked={formData.agentType === type.value}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          agentType: e.target.value as AgentType,
                          canModifyPrices: e.target.value === 'third_party' ? prev.canModifyPrices : false
                        }))}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${type.color}`}>
                          {type.value === 'in_house' ? <Building2 className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-sand-800">{type.label}</p>
                          <p className="text-xs text-sand-500">{type.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Account Settings */}
              <div className="bg-sand-50 rounded-xl p-4 space-y-4">
                <h3 className="font-medium text-sand-800 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary-500" />
                  Account Settings
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">
                      Initial Balance (BDT)
                    </label>
                    <input
                      type="number"
                      value={formData.accountBalance}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountBalance: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">
                      Credit Limit (BDT)
                    </label>
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={0}
                    />
                    <p className="text-xs text-sand-500 mt-1">Maximum booking value allowed</p>
                  </div>
                </div>

                {/* 3rd Party Agent Price Modification */}
                {formData.agentType === 'third_party' && (
                  <div className="pt-4 border-t border-sand-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.canModifyPrices}
                        onChange={(e) => setFormData(prev => ({ ...prev, canModifyPrices: e.target.checked }))}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                      />
                      <div>
                        <span className="font-medium text-sand-800">Allow Price Modification</span>
                        <p className="text-xs text-sand-500">Agent can modify package prices for customers</p>
                      </div>
                    </label>

                    {formData.canModifyPrices && (
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-sand-700 mb-1">
                            Price Modification Limit (%)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              value={formData.priceModificationLimit}
                              onChange={(e) => setFormData(prev => ({ ...prev, priceModificationLimit: Number(e.target.value) }))}
                              className="flex-1"
                              min={0}
                              max={50}
                              step={5}
                            />
                            <span className="text-lg font-bold text-primary-600 w-16 text-center">
                              ±{formData.priceModificationLimit}%
                            </span>
                          </div>
                          <p className="text-xs text-sand-500 mt-1">
                            Agent can adjust prices between -{formData.priceModificationLimit}% to +{formData.priceModificationLimit}%
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          <strong>Important:</strong> Price modifications only affect customer invoices.
                          Agency accounting always uses original package prices.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-2">
                  Permissions <span className="font-bengali">(অনুমতি)</span>
                </label>
                <div className="space-y-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.value}
                      className="flex items-center gap-3 p-3 bg-sand-50 rounded-lg cursor-pointer hover:bg-sand-100 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.value)}
                        onChange={() => handlePermissionToggle(perm.value)}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sand-800">{perm.label}</span>
                        <span className="text-sand-500 text-sm ml-2 font-bengali">({perm.labelBn})</span>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Agent Restrictions Notice */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Agent Restrictions:</strong> Agents cannot modify, cancel, or delete bookings with payment.
                    Only hold bookings (without payment) can be modified by agents.
                  </p>
                </div>
              </div>

              {/* Additional Capabilities */}
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-2">
                  Additional Capabilities <span className="font-bengali">(অতিরিক্ত ক্ষমতা)</span>
                </label>
                <div className="space-y-2">
                  {/* Hold Booking Permission */}
                  <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors border border-amber-200">
                    <input
                      type="checkbox"
                      checked={formData.canCreateHoldBookings}
                      onChange={(e) => setFormData(prev => ({ ...prev, canCreateHoldBookings: e.target.checked }))}
                      className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sand-800 font-medium">Can Create Hold Bookings</span>
                        <span className="text-sand-500 text-sm font-bengali">(হোল্ড বুকিং)</span>
                      </div>
                      <p className="text-xs text-amber-700 mt-1">
                        Allow agent to reserve seats without immediate payment
                      </p>
                    </div>
                  </label>

                  {/* Collect Payments */}
                  <label className="flex items-center gap-3 p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors border border-green-200">
                    <input
                      type="checkbox"
                      checked={formData.canCollectPayments}
                      onChange={(e) => setFormData(prev => ({ ...prev, canCollectPayments: e.target.checked }))}
                      className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sand-800 font-medium">Can Collect Payments</span>
                        <span className="text-sand-500 text-sm font-bengali">(পেমেন্ট সংগ্রহ)</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Allow agent to receive and record customer payments
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-sand-100">
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
                  {saving ? 'Saving...' : editingAgent ? 'Update Agent' : 'Add Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Top-Up Modal */}
      {showBalanceModal && selectedAgentForBalance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-sand-100">
              <h2 className="text-xl font-bold text-sand-800">
                Top Up Balance
              </h2>
              <p className="text-sand-500 text-sm mt-1">
                {selectedAgentForBalance.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Balance */}
              <div className="bg-sand-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-sand-500">Current Balance</p>
                    <p className="text-xl font-bold text-sand-800">
                      {formatCurrency(selectedAgentForBalance.agentAccountSettings?.accountBalance || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sand-500">Available Balance</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedAgentForBalance.agentAccountSettings?.availableBalance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">
                  Top Up Amount (BDT)
                </label>
                <input
                  type="number"
                  value={topUpAmount || ''}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xl font-bold text-center"
                  placeholder="Enter amount"
                  min={0}
                />
              </div>

              {topUpAmount > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    New balance will be: <strong>
                      {formatCurrency((selectedAgentForBalance.agentAccountSettings?.accountBalance || 0) + topUpAmount)}
                    </strong>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="flex-1 px-6 py-3 border border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopUp}
                  disabled={saving || topUpAmount <= 0}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5" />
                      Add {topUpAmount > 0 ? formatCurrency(topUpAmount) : 'Balance'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
