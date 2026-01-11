import React, { useState, useEffect, useMemo } from 'react';
import {
  BusConfiguration,
  FloorConfiguration,
  VehicleCategory,
  ACType,
  BusBrand,
  SeatArrangement,
} from '../../types';
import {
  getDefaultBusConfig,
  getDefaultFloorConfig,
  calculateTotalSeats,
  generateSeatsFromConfig,
  getSerialOptions,
  SEAT_ARRANGEMENTS,
  VEHICLE_CATEGORIES,
  BUS_BRANDS,
  AC_TYPES,
  getSeatsByDeck,
} from '../../utils/seatUtils';
import { SeatGrid, CompactSeatGrid } from './SeatGrid';
import { SeatLegend } from './SeatLegend';

interface BusSeatLayoutBuilderProps {
  value?: BusConfiguration;
  onChange: (config: BusConfiguration) => void;
  onValidChange?: (isValid: boolean) => void;
  showPreview?: boolean;
}

export const BusSeatLayoutBuilder: React.FC<BusSeatLayoutBuilderProps> = ({
  value,
  onChange,
  onValidChange,
  showPreview = true,
}) => {
  const [config, setConfig] = useState<BusConfiguration>(() => value || getDefaultBusConfig());
  const [previewDeck, setPreviewDeck] = useState<'lower' | 'upper'>('lower');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update parent when config changes
  useEffect(() => {
    // Recalculate total seats
    const totalSeats = calculateTotalSeats(config);
    const updatedConfig = { ...config, totalSeats };
    onChange(updatedConfig);
    onValidChange?.(true);
  }, [config]);

  // Sync with external value changes
  useEffect(() => {
    if (value && JSON.stringify(value) !== JSON.stringify(config)) {
      setConfig(value);
    }
  }, [value]);

  // Generate preview seats
  const previewSeats = useMemo(() => {
    const configWithSeats = { ...config, totalSeats: calculateTotalSeats(config) };
    return generateSeatsFromConfig(configWithSeats);
  }, [config]);

  const lowerDeckSeats = useMemo(() => getSeatsByDeck(previewSeats, 'lower'), [previewSeats]);
  const upperDeckSeats = useMemo(() => getSeatsByDeck(previewSeats, 'upper'), [previewSeats]);

  const updateConfig = (updates: Partial<BusConfiguration>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateLowerDeck = (updates: Partial<FloorConfiguration>) => {
    setConfig((prev) => ({
      ...prev,
      lowerDeck: { ...prev.lowerDeck, ...updates },
    }));
  };

  const updateUpperDeck = (updates: Partial<FloorConfiguration>) => {
    if (!config.upperDeck) return;
    setConfig((prev) => ({
      ...prev,
      upperDeck: { ...prev.upperDeck!, ...updates },
    }));
  };

  const handleFloorsChange = (floors: 1 | 2) => {
    if (floors === 2 && !config.upperDeck) {
      updateConfig({
        numberOfFloors: 2,
        upperDeck: getDefaultFloorConfig(),
      });
    } else if (floors === 1) {
      updateConfig({
        numberOfFloors: 1,
        upperDeck: undefined,
      });
    } else {
      updateConfig({ numberOfFloors: floors });
    }
  };

  const serialOptions = getSerialOptions();

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <div className="bg-white border border-sand-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-sand-800 mb-4">
          Vehicle Configuration
          <span className="font-bengali text-sand-500 font-normal text-sm ml-2">(যানবাহন সেটআপ)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vehicle Category */}
          <div>
            <label className="block text-sm font-medium text-sand-700 mb-1">
              Vehicle Type
            </label>
            <select
              value={config.vehicleCategory}
              onChange={(e) => updateConfig({ vehicleCategory: e.target.value as VehicleCategory })}
              className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {VEHICLE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Number of Floors - Only for buses */}
          {config.vehicleCategory === 'bus' && (
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-1">
                Number of Decks
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleFloorsChange(1)}
                  className={`
                    flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all
                    ${config.numberOfFloors === 1
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-sand-200 text-sand-600 hover:border-sand-300'}
                  `}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => handleFloorsChange(2)}
                  className={`
                    flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all
                    ${config.numberOfFloors === 2
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-sand-200 text-sand-600 hover:border-sand-300'}
                  `}
                >
                  Double
                </button>
              </div>
            </div>
          )}

          {/* AC Type */}
          <div>
            <label className="block text-sm font-medium text-sand-700 mb-1">
              AC Type
            </label>
            <div className="flex gap-2">
              {AC_TYPES.map((ac) => (
                <button
                  key={ac.value}
                  type="button"
                  onClick={() => updateConfig({ acType: ac.value as ACType })}
                  className={`
                    flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all
                    ${config.acType === ac.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-sand-200 text-sand-600 hover:border-sand-300'}
                  `}
                >
                  {ac.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-sand-700 mb-1">
              Brand
            </label>
            <select
              value={config.brand}
              onChange={(e) => updateConfig({ brand: e.target.value as BusBrand })}
              className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {BUS_BRANDS.map((brand) => (
                <option key={brand.value} value={brand.value}>
                  {brand.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Other Brand Input */}
        {config.brand === 'other' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-sand-700 mb-1">
              Brand Name
            </label>
            <input
              type="text"
              value={config.brandOther || ''}
              onChange={(e) => updateConfig({ brandOther: e.target.value })}
              placeholder="Enter brand name"
              className="w-full sm:w-1/2 px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Seat Layout Configuration */}
      {config.vehicleCategory === 'bus' && (
        <>
          {/* Lower Deck Configuration */}
          <FloorConfigSection
            title="Lower Deck Layout"
            titleBn="নিচের ডেক লেআউট"
            floorConfig={config.lowerDeck}
            onChange={updateLowerDeck}
            serialOptions={serialOptions}
            showAdvanced={showAdvanced}
          />

          {/* Upper Deck Configuration */}
          {config.numberOfFloors === 2 && config.upperDeck && (
            <FloorConfigSection
              title="Upper Deck Layout"
              titleBn="উপরের ডেক লেআউট"
              floorConfig={config.upperDeck}
              onChange={updateUpperDeck}
              serialOptions={serialOptions}
              showAdvanced={showAdvanced}
            />
          )}

          {/* Advanced Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>
        </>
      )}

      {/* Total Seats Summary */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-primary-800 font-semibold">Total Seats</span>
            <span className="font-bengali text-primary-600 text-sm ml-2">(মোট আসন)</span>
          </div>
          <div className="text-3xl font-bold text-primary-700">{calculateTotalSeats(config)}</div>
        </div>
        {config.numberOfFloors === 2 && (
          <div className="mt-2 text-sm text-primary-600">
            Lower: {lowerDeckSeats.length} • Upper: {upperDeckSeats.length}
          </div>
        )}
      </div>

      {/* Preview */}
      {showPreview && config.vehicleCategory === 'bus' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-sand-800">
              Layout Preview
              <span className="font-bengali text-sand-500 font-normal text-sm ml-2">
                (লেআউট প্রিভিউ)
              </span>
            </h3>

            {config.numberOfFloors === 2 && (
              <div className="flex gap-2 p-1 bg-sand-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewDeck('lower')}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${previewDeck === 'lower'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-sand-600 hover:text-sand-800'}
                  `}
                >
                  Lower
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDeck('upper')}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${previewDeck === 'upper'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-sand-600 hover:text-sand-800'}
                  `}
                >
                  Upper
                </button>
              </div>
            )}
          </div>

          <div className="max-w-md mx-auto">
            <SeatGrid
              deck={previewDeck}
              seats={previewDeck === 'lower' ? lowerDeckSeats : upperDeckSeats}
              floorConfig={previewDeck === 'lower' ? config.lowerDeck : config.upperDeck!}
              selectedSeats={[]}
              readonly
              size="sm"
            />
          </div>

          <SeatLegend compact className="justify-center" />
        </div>
      )}
    </div>
  );
};

// Floor Configuration Section Component
interface FloorConfigSectionProps {
  title: string;
  titleBn: string;
  floorConfig: FloorConfiguration;
  onChange: (updates: Partial<FloorConfiguration>) => void;
  serialOptions: { value: string; label: string }[];
  showAdvanced: boolean;
}

const FloorConfigSection: React.FC<FloorConfigSectionProps> = ({
  title,
  titleBn,
  floorConfig,
  onChange,
  serialOptions,
  showAdvanced,
}) => {
  const handleArrangementChange = (arrangement: SeatArrangement) => {
    const seatsPerSerial =
      arrangement === '2x2' ? 4 :
      arrangement === '2x1' ? 3 :
      arrangement === '1x1' ? 2 :
      5;
    onChange({ arrangement, seatsPerSerial });
  };

  return (
    <div className="bg-white border border-sand-200 rounded-xl p-4 sm:p-6">
      <h4 className="font-semibold text-sand-800 mb-4">
        {title}
        <span className="font-bengali text-sand-500 font-normal text-sm ml-2">({titleBn})</span>
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Seat Arrangement */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-sand-700 mb-2">
            Seat Arrangement
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SEAT_ARRANGEMENTS.slice(0, 3).map((arr) => (
              <button
                key={arr.value}
                type="button"
                onClick={() => handleArrangementChange(arr.value)}
                className={`
                  px-3 py-3 rounded-xl border-2 font-medium text-sm transition-all
                  ${floorConfig.arrangement === arr.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-sand-200 text-sand-600 hover:border-sand-300'}
                `}
              >
                {arr.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-sand-500">
            {SEAT_ARRANGEMENTS.find((a) => a.value === floorConfig.arrangement)?.description}
          </p>
        </div>

        {/* Serial Start */}
        <div>
          <label className="block text-sm font-medium text-sand-700 mb-1">
            First Row
          </label>
          <select
            value={floorConfig.serialStart}
            onChange={(e) => onChange({ serialStart: e.target.value })}
            className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {serialOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Row {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Serial End */}
        <div>
          <label className="block text-sm font-medium text-sand-700 mb-1">
            Last Row
          </label>
          <select
            value={floorConfig.serialEnd}
            onChange={(e) => onChange({ serialEnd: e.target.value })}
            className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {serialOptions
              .filter((opt) => opt.value >= floorConfig.serialStart)
              .map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Row {opt.label}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="mt-6 pt-4 border-t border-sand-100 space-y-4">
          <h5 className="text-sm font-medium text-sand-700">Advanced Row Settings</h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Row Override */}
            <div className="bg-sand-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-sand-700">
                  First Row Different?
                </label>
                <input
                  type="checkbox"
                  checked={!!floorConfig.firstRowLayout}
                  onChange={(e) =>
                    onChange({
                      firstRowLayout: e.target.checked ? '2x2' : undefined,
                      firstRowSeats: e.target.checked ? 4 : undefined,
                    })
                  }
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </div>
              {floorConfig.firstRowLayout && (
                <div className="space-y-2">
                  <select
                    value={floorConfig.firstRowLayout}
                    onChange={(e) =>
                      onChange({ firstRowLayout: e.target.value as SeatArrangement })
                    }
                    className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm"
                  >
                    {SEAT_ARRANGEMENTS.map((arr) => (
                      <option key={arr.value} value={arr.value}>
                        {arr.label} - {arr.description}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={floorConfig.firstRowSeats || ''}
                    onChange={(e) =>
                      onChange({ firstRowSeats: parseInt(e.target.value) || undefined })
                    }
                    placeholder="Seats in first row"
                    className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm"
                    min={1}
                    max={6}
                  />
                </div>
              )}
            </div>

            {/* Last Row Override */}
            <div className="bg-sand-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-sand-700">
                  Last Row Different?
                </label>
                <input
                  type="checkbox"
                  checked={!!floorConfig.lastRowSeats || !!floorConfig.lastRowLayout}
                  onChange={(e) =>
                    onChange({
                      lastRowLayout: e.target.checked ? '2x3' : undefined,
                      lastRowSeats: e.target.checked ? 5 : undefined,
                    })
                  }
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </div>
              {(floorConfig.lastRowSeats || floorConfig.lastRowLayout) && (
                <div className="space-y-2">
                  <select
                    value={floorConfig.lastRowLayout || '2x3'}
                    onChange={(e) =>
                      onChange({ lastRowLayout: e.target.value as SeatArrangement })
                    }
                    className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm"
                  >
                    {SEAT_ARRANGEMENTS.map((arr) => (
                      <option key={arr.value} value={arr.value}>
                        {arr.label} - {arr.description}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={floorConfig.lastRowSeats || ''}
                    onChange={(e) =>
                      onChange({ lastRowSeats: parseInt(e.target.value) || undefined })
                    }
                    placeholder="Seats in last row (usually 5)"
                    className="w-full px-3 py-2 border border-sand-200 rounded-lg text-sm"
                    min={1}
                    max={6}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
