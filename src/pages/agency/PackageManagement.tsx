import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/common/Card';
import { packagesAPI } from '../../services/api';
import { BusSeatLayoutBuilder } from '../../components/seats';
import { BusConfiguration } from '../../types';
import { getDefaultBusConfig, createSeatLayout } from '../../utils/seatUtils';
import toast from 'react-hot-toast';

interface Package {
  id: string;
  title: string;
  titleBn: string;
  destination: string;
  destinationBn: string;
  description: string;
  descriptionBn: string;
  departureDate: string;
  returnDate: string;
  departureTime: string;
  vehicleType: string;
  totalSeats: number;
  availableSeats: number;
  pricePerPerson: number;
  couplePrice: number;
  childPrice: number;
  advanceAmount: number;
  boardingPoints: { id: string; name: string; nameBn: string; time: string; address: string }[];
  droppingPoints: { id: string; name: string; nameBn: string; time: string; address: string }[];
  inclusions: string[];
  exclusions: string[];
  status: string;
  createdAt: string;
  busConfiguration?: BusConfiguration;
}

const VEHICLE_TYPES = [
  'AC Bus (Hino AK)',
  'AC Bus (Scania)',
  'Non-AC Bus',
  'AC Microbus',
  'Non-AC Microbus',
  'Hiace',
  'Private Car',
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', labelBn: 'খসড়া' },
  { value: 'current', label: 'Current', labelBn: 'চলমান' },
  { value: 'future', label: 'Future', labelBn: 'আসন্ন' },
  { value: 'past', label: 'Past', labelBn: 'অতীত' },
  { value: 'cancelled', label: 'Cancelled', labelBn: 'বাতিল' },
];

export const PackageManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    titleBn: '',
    destination: '',
    destinationBn: '',
    description: '',
    descriptionBn: '',
    departureDate: '',
    returnDate: '',
    departureTime: '',
    vehicleType: '',
    totalSeats: 40,
    pricePerPerson: 0,
    couplePrice: 0,
    childPrice: 0,
    advanceAmount: 0,
    inclusions: '',
    exclusions: '',
    status: 'draft',
  });

  const [enableSeatLayout, setEnableSeatLayout] = useState(false);
  const [busConfiguration, setBusConfiguration] = useState<BusConfiguration | undefined>(undefined);

  useEffect(() => {
    fetchPackages();
  }, [user?.agencyId, filterStatus]);

  const fetchPackages = async () => {
    if (!user?.agencyId) return;

    try {
      const params: { agencyId: string; status?: string } = { agencyId: user.agencyId };
      if (filterStatus) params.status = filterStatus;
      const result = await packagesAPI.getAll(params);
      setPackages(result.packages);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pkg?: Package) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        title: pkg.title,
        titleBn: pkg.titleBn || '',
        destination: pkg.destination,
        destinationBn: pkg.destinationBn || '',
        description: pkg.description || '',
        descriptionBn: pkg.descriptionBn || '',
        departureDate: pkg.departureDate,
        returnDate: pkg.returnDate,
        departureTime: pkg.departureTime || '',
        vehicleType: pkg.vehicleType || '',
        totalSeats: pkg.totalSeats,
        pricePerPerson: pkg.pricePerPerson,
        couplePrice: pkg.couplePrice || 0,
        childPrice: pkg.childPrice || 0,
        advanceAmount: pkg.advanceAmount || 0,
        inclusions: pkg.inclusions?.join(', ') || '',
        exclusions: pkg.exclusions?.join(', ') || '',
        status: pkg.status,
      });
      // Load bus configuration if exists
      setEnableSeatLayout(!!pkg.busConfiguration);
      setBusConfiguration(pkg.busConfiguration);
    } else {
      setEditingPackage(null);
      setFormData({
        title: '',
        titleBn: '',
        destination: '',
        destinationBn: '',
        description: '',
        descriptionBn: '',
        departureDate: '',
        returnDate: '',
        departureTime: '',
        vehicleType: '',
        totalSeats: 40,
        pricePerPerson: 0,
        couplePrice: 0,
        childPrice: 0,
        advanceAmount: 0,
        inclusions: '',
        exclusions: '',
        status: 'draft',
      });
      setEnableSeatLayout(false);
      setBusConfiguration(undefined);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPackage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.agencyId) return;

    setSaving(true);

    try {
      // Determine total seats from bus configuration or form
      const totalSeats = enableSeatLayout && busConfiguration
        ? busConfiguration.totalSeats
        : Number(formData.totalSeats);

      // Generate seat layout if bus configuration is enabled
      let seatLayout = undefined;
      if (enableSeatLayout && busConfiguration) {
        seatLayout = createSeatLayout(editingPackage?.id || 'temp', busConfiguration);
      }

      const packageData = {
        ...formData,
        agencyId: user.agencyId,
        pricePerPerson: Number(formData.pricePerPerson),
        couplePrice: Number(formData.couplePrice) || null,
        childPrice: Number(formData.childPrice) || null,
        advanceAmount: Number(formData.advanceAmount) || 0,
        totalSeats,
        inclusions: formData.inclusions.split(',').map(s => s.trim()).filter(Boolean),
        exclusions: formData.exclusions.split(',').map(s => s.trim()).filter(Boolean),
        busConfiguration: enableSeatLayout ? busConfiguration : null,
        seatLayout: enableSeatLayout ? seatLayout : null,
      };

      if (editingPackage) {
        await packagesAPI.update(editingPackage.id, packageData);
        toast.success('Package updated successfully');
      } else {
        await packagesAPI.create(packageData);
        toast.success('Package created successfully');
      }

      handleCloseModal();
      fetchPackages();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (pkg: Package) => {
    setPackageToDelete(pkg);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return;

    setDeleting(true);
    try {
      await packagesAPI.delete(packageToDelete.id);
      toast.success('Package deleted successfully');
      setShowDeleteConfirm(false);
      setPackageToDelete(null);
      fetchPackages();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete package');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      current: 'bg-green-100 text-green-700',
      future: 'bg-blue-100 text-blue-700',
      past: 'bg-sand-100 text-sand-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
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
            Package Management
          </h1>
          <p className="text-sand-500 mt-1">
            Create and manage tour packages
            <span className="font-bengali ml-2">(প্যাকেজ ব্যবস্থাপনা)</span>
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Package
        </button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-sand-700">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Packages</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.length > 0 ? packages.map((pkg) => (
          <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-sand-800 text-lg">{pkg.title}</h3>
                  {pkg.titleBn && <p className="text-sand-500 text-sm font-bengali">{pkg.titleBn}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(pkg.status)}`}>
                  {pkg.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-sand-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {pkg.destination}
                </div>
                <div className="flex items-center gap-2 text-sand-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(pkg.departureDate)} - {formatDate(pkg.returnDate)}
                </div>
                <div className="flex items-center gap-2 text-sand-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {pkg.availableSeats} / {pkg.totalSeats} seats available
                </div>
              </div>

              <div className="pt-4 border-t border-sand-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary-600">{formatCurrency(pkg.pricePerPerson)}</p>
                    <p className="text-xs text-sand-500">per person</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(pkg)}
                      className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(pkg)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )) : (
          <div className="col-span-full">
            <Card>
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-sand-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sand-500">No packages found. Create your first tour package!</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-sand-100 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-sand-800">
                {editingPackage ? 'Edit Package' : 'Create New Package'}
                <span className="font-bengali text-sm font-normal text-sand-500 ml-2">
                  {editingPackage ? '(প্যাকেজ সম্পাদনা)' : '(নতুন প্যাকেজ)'}
                </span>
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sand-700">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Title (English) *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Title (Bengali)</label>
                    <input
                      type="text"
                      name="titleBn"
                      value={formData.titleBn}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-bengali"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Destination (English) *</label>
                    <input
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Destination (Bengali)</label>
                    <input
                      type="text"
                      name="destinationBn"
                      value={formData.destinationBn}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-bengali"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Description (English)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Description (Bengali)</label>
                  <textarea
                    name="descriptionBn"
                    value={formData.descriptionBn}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-bengali"
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sand-700">Schedule & Transport</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Departure Date *</label>
                    <input
                      type="date"
                      name="departureDate"
                      value={formData.departureDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Return Date *</label>
                    <input
                      type="date"
                      name="returnDate"
                      value={formData.returnDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Departure Time</label>
                    <input
                      type="time"
                      name="departureTime"
                      value={formData.departureTime}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Vehicle Type</label>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select vehicle</option>
                      {VEHICLE_TYPES.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Total Seats *</label>
                    <input
                      type="number"
                      name="totalSeats"
                      value={enableSeatLayout && busConfiguration ? busConfiguration.totalSeats : formData.totalSeats}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={1}
                      required
                      disabled={enableSeatLayout}
                    />
                  </div>
                </div>

                {/* Seat Layout Toggle */}
                <div className="mt-4 p-4 bg-sand-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-sand-700">
                        Configure Seat Layout
                        <span className="font-bengali text-sand-500 font-normal ml-2">(সিট লেআউট সেটআপ)</span>
                      </label>
                      <p className="text-xs text-sand-500 mt-1">
                        Enable to design a custom seat arrangement for buses
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!enableSeatLayout) {
                          setBusConfiguration(getDefaultBusConfig());
                        }
                        setEnableSeatLayout(!enableSeatLayout);
                      }}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full
                        transition-colors
                        ${enableSeatLayout ? 'bg-primary-500' : 'bg-sand-300'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${enableSeatLayout ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Seat Layout Builder */}
              {enableSeatLayout && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sand-700">
                    Seat Layout Configuration
                    <span className="font-bengali text-sand-500 font-normal text-sm ml-2">(সিট কনফিগারেশন)</span>
                  </h3>
                  <BusSeatLayoutBuilder
                    value={busConfiguration}
                    onChange={(config) => {
                      setBusConfiguration(config);
                      // Update total seats in form to match
                      setFormData(prev => ({ ...prev, totalSeats: config.totalSeats }));
                    }}
                    showPreview={true}
                  />
                </div>
              )}

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sand-700">Pricing (BDT)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Per Person *</label>
                    <input
                      type="number"
                      name="pricePerPerson"
                      value={formData.pricePerPerson}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={0}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Couple Price</label>
                    <input
                      type="number"
                      name="couplePrice"
                      value={formData.couplePrice}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Child Price</label>
                    <input
                      type="number"
                      name="childPrice"
                      value={formData.childPrice}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Advance Amount</label>
                    <input
                      type="number"
                      name="advanceAmount"
                      value={formData.advanceAmount}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              {/* Inclusions/Exclusions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sand-700">Package Details</h3>
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Inclusions (comma-separated)</label>
                  <input
                    type="text"
                    name="inclusions"
                    value={formData.inclusions}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="AC Bus, Hotel, Breakfast, Guide"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Exclusions (comma-separated)</label>
                  <input
                    type="text"
                    name="exclusions"
                    value={formData.exclusions}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Lunch, Dinner, Personal Expenses"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
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
                  {saving ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && packageToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-sand-800 text-center mb-2">
                Delete Package?
              </h3>
              <p className="text-sand-600 text-center mb-6">
                Are you sure you want to delete <strong>"{packageToDelete.title}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPackageToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 border border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
