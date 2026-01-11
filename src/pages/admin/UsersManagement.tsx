import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { usersAPI, agenciesAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  phone: string;
  name: string;
  nameBn: string;
  email: string;
  role: string;
  agencyId: string;
  agentCode: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

interface Agency {
  id: string;
  name: string;
}

const ROLE_OPTIONS = [
  { value: 'system_admin', label: 'System Admin', labelBn: 'সিস্টেম অ্যাডমিন', color: 'bg-purple-100 text-purple-700' },
  { value: 'agency_admin', label: 'Agency Admin', labelBn: 'এজেন্সি অ্যাডমিন', color: 'bg-blue-100 text-blue-700' },
  { value: 'sales_agent', label: 'Sales Agent', labelBn: 'সেলস এজেন্ট', color: 'bg-green-100 text-green-700' },
];

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterAgency, setFilterAgency] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    name: '',
    nameBn: '',
    email: '',
    role: 'sales_agent',
    agencyId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterAgency]);

  const fetchData = async () => {
    try {
      const [usersResult, agenciesResult] = await Promise.all([
        usersAPI.getAll({}),
        agenciesAPI.getAll(),
      ]);
      setUsers(usersResult.users);
      setAgencies(agenciesResult.agencies);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const params: { role?: string; agencyId?: string } = {};
      if (filterRole) params.role = filterRole;
      if (filterAgency) params.agencyId = filterAgency;
      const result = await usersAPI.getAll(params);
      setUsers(result.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        phone: user.phone,
        password: '',
        name: user.name,
        nameBn: user.nameBn || '',
        email: user.email || '',
        role: user.role,
        agencyId: user.agencyId || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        phone: '',
        password: 'password123',
        name: '',
        nameBn: '',
        email: '',
        role: 'sales_agent',
        agencyId: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, {
          name: formData.name,
          nameBn: formData.nameBn,
          email: formData.email,
          ...(formData.password && { password: formData.password }),
        });
        toast.success('User updated successfully');
      } else {
        await usersAPI.create({
          phone: formData.phone,
          password: formData.password || 'password123',
          name: formData.name,
          nameBn: formData.nameBn,
          email: formData.email,
          role: formData.role,
          agencyId: formData.agencyId || undefined,
        });
        toast.success('User created successfully');
      }

      handleCloseModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await usersAPI.update(user.id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const getRoleBadge = (role: string) => {
    const option = ROLE_OPTIONS.find(o => o.value === role);
    return option?.color || 'bg-gray-100 text-gray-700';
  };

  const getRoleLabel = (role: string) => {
    const option = ROLE_OPTIONS.find(o => o.value === role);
    return option?.label || role;
  };

  const getAgencyName = (agencyId: string) => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency?.name || '-';
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
            Users Management
          </h1>
          <p className="text-sand-500 mt-1">
            Manage all platform users
            <span className="font-bengali ml-2">(ব্যবহারকারী ব্যবস্থাপনা)</span>
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sand-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-sand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-sand-800">{users.length}</p>
              <p className="text-sand-500 text-sm">Total Users</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-sand-800">{users.filter(u => u.role === 'system_admin').length}</p>
              <p className="text-sand-500 text-sm">System Admins</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-sand-800">{users.filter(u => u.role === 'agency_admin').length}</p>
              <p className="text-sand-500 text-sm">Agency Admins</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-sand-800">{users.filter(u => u.role === 'sales_agent').length}</p>
              <p className="text-sand-500 text-sm">Sales Agents</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-sand-700 mb-1">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-sand-700 mb-1">Filter by Agency</label>
            <select
              value={filterAgency}
              onChange={(e) => setFilterAgency(e.target.value)}
              className="px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Agencies</option>
              {agencies.map(agency => (
                <option key={agency.id} value={agency.id}>{agency.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand-100">
                <th className="text-left py-3 px-4 text-sand-500 font-medium">User</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Phone</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Role</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Agency</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-sand-500 font-medium">Created</th>
                <th className="text-right py-3 px-4 text-sand-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((user) => (
                <tr key={user.id} className="border-b border-sand-50 hover:bg-sand-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-sand-800">{user.name}</p>
                        {user.nameBn && <p className="text-sm text-sand-500 font-bengali">{user.nameBn}</p>}
                        {user.agentCode && <p className="text-xs text-primary-600 font-mono">{user.agentCode}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sand-600">{user.phone}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sand-600">
                    {getAgencyName(user.agencyId)}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sand-600 text-sm">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-sand-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sand-500">
                    No users found.
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
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-sand-100">
              <h2 className="text-xl font-bold text-sand-800">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Phone *</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!!editingUser}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-sand-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">
                  {editingUser ? 'New Password (optional)' : 'Password *'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Role *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      {ROLE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {formData.role !== 'system_admin' && (
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Agency</label>
                      <select
                        name="agencyId"
                        value={formData.agencyId}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select Agency</option>
                        {agencies.map(agency => (
                          <option key={agency.id} value={agency.id}>{agency.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

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
                  {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
