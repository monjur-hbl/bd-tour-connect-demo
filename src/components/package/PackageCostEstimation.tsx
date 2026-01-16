import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calculator,
  Bus,
  Hotel,
  Utensils,
  Users,
  Ticket,
  Package,
  Save,
  X,
} from 'lucide-react';
import { Card } from '../common/Card';
import { PackageCostItem, PackageCostEstimation as CostEstimationType } from '../../types';
import toast from 'react-hot-toast';

interface PackageCostEstimationProps {
  packageId: string;
  pricePerPerson: number;
  totalSeats: number;
  bookedSeats?: number;
  totalEarnings?: number; // Sum of all booking totals
  costEstimation?: CostEstimationType;
  onSave: (costEstimation: CostEstimationType) => Promise<void>;
  readOnly?: boolean;
}

const COST_CATEGORIES = [
  { value: 'transport', label: 'Transport', labelBn: 'পরিবহন', icon: <Bus className="w-4 h-4" /> },
  { value: 'accommodation', label: 'Accommodation', labelBn: 'থাকা', icon: <Hotel className="w-4 h-4" /> },
  { value: 'food', label: 'Food & Meals', labelBn: 'খাবার', icon: <Utensils className="w-4 h-4" /> },
  { value: 'guide', label: 'Guide/Staff', labelBn: 'গাইড', icon: <Users className="w-4 h-4" /> },
  { value: 'entry_fees', label: 'Entry Fees', labelBn: 'প্রবেশ ফি', icon: <Ticket className="w-4 h-4" /> },
  { value: 'miscellaneous', label: 'Miscellaneous', labelBn: 'বিবিধ', icon: <Package className="w-4 h-4" /> },
  { value: 'other', label: 'Other', labelBn: 'অন্যান্য', icon: <DollarSign className="w-4 h-4" /> },
];

const generateId = () => `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const PackageCostEstimation: React.FC<PackageCostEstimationProps> = ({
  packageId,
  pricePerPerson,
  totalSeats,
  bookedSeats = 0,
  totalEarnings = 0,
  costEstimation,
  onSave,
  readOnly = false,
}) => {
  const [costs, setCosts] = useState<PackageCostItem[]>(costEstimation?.costs || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCost, setNewCost] = useState<Partial<PackageCostItem>>({
    category: 'transport',
    description: '',
    amount: 0,
    notes: '',
  });

  // Calculate totals
  const totalEstimatedCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const projectedIncome = pricePerPerson * totalSeats;
  const actualEarnings = totalEarnings;
  const netProfit = actualEarnings - totalEstimatedCost;
  const profitMargin = actualEarnings > 0 ? ((netProfit / actualEarnings) * 100) : 0;
  const projectedProfit = projectedIncome - totalEstimatedCost;
  const projectedProfitMargin = projectedIncome > 0 ? ((projectedProfit / projectedIncome) * 100) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddCost = () => {
    if (!newCost.description?.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!newCost.amount || newCost.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const costItem: PackageCostItem = {
      id: generateId(),
      category: newCost.category as PackageCostItem['category'],
      description: newCost.description.trim(),
      amount: newCost.amount,
      notes: newCost.notes,
    };

    setCosts(prev => [...prev, costItem]);
    setNewCost({
      category: 'transport',
      description: '',
      amount: 0,
      notes: '',
    });
    setShowAddForm(false);
    toast.success('Cost item added');
  };

  const handleRemoveCost = (id: string) => {
    setCosts(prev => prev.filter(c => c.id !== id));
    toast.success('Cost item removed');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const estimation: CostEstimationType = {
        costs,
        totalEstimatedCost,
        projectedIncome,
        actualEarnings,
        netProfit,
        profitMargin,
        lastUpdated: new Date().toISOString(),
      };
      await onSave(estimation);
      toast.success('Cost estimation saved');
    } catch (error) {
      toast.error('Failed to save cost estimation');
    } finally {
      setSaving(false);
    }
  };

  // Group costs by category
  const costsByCategory = COST_CATEGORIES.map(cat => ({
    ...cat,
    total: costs.filter(c => c.category === cat.value).reduce((sum, c) => sum + c.amount, 0),
    items: costs.filter(c => c.category === cat.value),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-center">
            <p className="text-blue-600 text-sm font-medium mb-1">Projected Income</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(projectedIncome)}</p>
            <p className="text-xs text-blue-500 mt-1">{totalSeats} seats × {formatCurrency(pricePerPerson)}</p>
          </div>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <div className="text-center">
            <p className="text-red-600 text-sm font-medium mb-1">Total Costs</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalEstimatedCost)}</p>
            <p className="text-xs text-red-500 mt-1">{costs.length} expense items</p>
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <div className="text-center">
            <p className="text-green-600 text-sm font-medium mb-1">Actual Earnings</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(actualEarnings)}</p>
            <p className="text-xs text-green-500 mt-1">{bookedSeats} seats booked</p>
          </div>
        </Card>

        <Card className={netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {netProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-orange-600" />
              )}
              <p className={`text-sm font-medium ${netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                Net Profit
              </p>
            </div>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
              {formatCurrency(netProfit)}
            </p>
            <p className={`text-xs mt-1 ${netProfit >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
              {profitMargin.toFixed(1)}% margin
            </p>
          </div>
        </Card>
      </div>

      {/* Projected vs Actual Comparison */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-sand-800">Profit Analysis</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-sand-50 rounded-xl">
            <p className="text-sm text-sand-600 mb-2">Projected Profit (100% Booking)</p>
            <p className={`text-xl font-bold ${projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(projectedProfit)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-sand-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${projectedProfitMargin >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(projectedProfitMargin), 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-sand-600">{projectedProfitMargin.toFixed(1)}%</span>
            </div>
          </div>

          <div className="p-4 bg-sand-50 rounded-xl">
            <p className="text-sm text-sand-600 mb-2">Current Status</p>
            <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-sand-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500"
                  style={{ width: `${(bookedSeats / totalSeats) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-sand-600">
                {((bookedSeats / totalSeats) * 100).toFixed(0)}% booked
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-sand-800">Cost Breakdown</h3>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Cost
              </button>
              {costs.length > 0 && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Cost Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-sand-800">Add New Cost Item</h4>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-sand-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Category</label>
                <select
                  value={newCost.category}
                  onChange={(e) => setNewCost(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {COST_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Amount (BDT)</label>
                <input
                  type="number"
                  value={newCost.amount || ''}
                  onChange={(e) => setNewCost(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter amount"
                  min={0}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-sand-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newCost.description || ''}
                  onChange={(e) => setNewCost(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Bus rental for 2 days"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-sand-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={newCost.notes || ''}
                  onChange={(e) => setNewCost(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 border border-sand-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Any additional notes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-sand-200 text-sand-700 rounded-lg hover:bg-sand-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCost}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
              >
                Add Cost
              </button>
            </div>
          </div>
        )}

        {/* Cost List by Category */}
        {costsByCategory.length > 0 ? (
          <div className="space-y-4">
            {costsByCategory.map(category => (
              <div key={category.value} className="border border-sand-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-sand-50">
                  <div className="flex items-center gap-2">
                    {category.icon}
                    <span className="font-medium text-sand-700">{category.label}</span>
                    <span className="text-sm text-sand-500">({category.items.length} items)</span>
                  </div>
                  <span className="font-bold text-sand-800">{formatCurrency(category.total)}</span>
                </div>
                <div className="divide-y divide-sand-100">
                  {category.items.map(cost => (
                    <div key={cost.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-medium text-sand-700">{cost.description}</p>
                        {cost.notes && (
                          <p className="text-sm text-sand-500">{cost.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sand-800">{formatCurrency(cost.amount)}</span>
                        {!readOnly && (
                          <button
                            onClick={() => handleRemoveCost(cost.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-sand-100 rounded-xl">
              <span className="font-bold text-sand-800">Total Estimated Cost</span>
              <span className="text-xl font-bold text-red-600">{formatCurrency(totalEstimatedCost)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-sand-300 mx-auto mb-4" />
            <p className="text-sand-500">No costs added yet.</p>
            <p className="text-sand-400 text-sm mt-1">Click "Add Cost" to start tracking expenses.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PackageCostEstimation;
