import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { usersAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Agent {
  id: string;
  phone: string;
  name: string;
  nameBn: string;
  email: string;
  agentCode: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

const AVAILABLE_PERMISSIONS = [
  { value: 'create_booking', label: 'Create Booking', labelBn: 'বুকিং তৈরি' },
  { value: 'edit_booking', label: 'Edit Booking', labelBn: 'বুকিং সম্পাদনা' },
  { value: 'view_all_bookings', label: 'View All Bookings', labelBn: 'সব বুকিং দেখুন' },
  { value: 'collect_payment', label: 'Collect Payment', labelBn: 'পেমেন্ট সংগ্রহ' },
  { value: 'cancel_booking', label: 'Cancel Booking', labelBn: 'বুকিং বাতিল' },
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
    permissions: ['create_booking', 'edit_booking'] as string[],
  });

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
      });
    } else {
      setEditingAgent(null);
      setFormData({
        phone: '',
        password: 'agent123',
        name: '',
        nameBn: '',
        email: '',
        permissions: ['create_booking', 'edit_booking'],
      });
    }
    setShowModal(true);
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

    try {
      if (editingAgent) {
        // Update existing agent
        await usersAPI.update(editingAgent.id, {
          name: formData.name,
          nameBn: formData.nameBn,
          email: formData.email,
          permissions: formData.permissions,
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

      {/* Agents List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand-100">
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Agent</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Code</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Phone</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Permissions</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Status</th>
                <th className="text-right py-3 px-4 text-sand-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.length > 0 ? agents.map((agent) => (
                <tr key={agent.id} className="border-b border-sand-50 hover:bg-sand-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent-100 text-accent-700 rounded-full flex items-center justify-center font-bold">
                        {agent.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-sand-800">{agent.name}</p>
                        {agent.nameBn && <p className="text-sm text-sand-500 font-bengali">{agent.nameBn}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono font-medium text-accent-600">{agent.agentCode}</span>
                  </td>
                  <td className="py-4 px-4 text-sand-600">{agent.phone}</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {agent.permissions?.slice(0, 2).map((perm) => (
                        <span key={perm} className="px-2 py-0.5 bg-sand-100 text-sand-600 rounded text-xs">
                          {perm.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {agent.permissions?.length > 2 && (
                        <span className="px-2 py-0.5 bg-sand-100 text-sand-600 rounded text-xs">
                          +{agent.permissions.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      agent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(agent)}
                        className="p-2 text-sand-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAgent(agent)}
                        className="p-2 text-sand-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
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
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-sand-100">
              <h2 className="text-xl font-bold text-sand-800">
                {editingAgent ? 'Edit Agent' : 'Add New Agent'}
                <span className="font-bengali text-sm font-normal text-sand-500 ml-2">
                  {editingAgent ? '(এজেন্ট সম্পাদনা)' : '(নতুন এজেন্ট)'}
                </span>
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  {editingAgent ? 'New Password (leave blank to keep current)' : 'Password *'}
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
                  {saving ? 'Saving...' : editingAgent ? 'Update Agent' : 'Add Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
