import React from 'react';

interface LegendItem {
  label: string;
  labelBn?: string;
  color: string;
  borderColor: string;
  badge?: string;
  badgeColor?: string;
  pattern?: boolean;
}

const legendItems: LegendItem[] = [
  {
    label: 'Available',
    labelBn: 'খালি',
    color: 'bg-white',
    borderColor: 'border-sand-300',
  },
  {
    label: 'Selected',
    labelBn: 'নির্বাচিত',
    color: 'bg-primary-500',
    borderColor: 'border-primary-600',
  },
  {
    label: 'Booked (M)',
    labelBn: 'বুকড (পুরুষ)',
    color: 'bg-gradient-to-br from-blue-100 to-blue-200',
    borderColor: 'border-blue-300',
    badge: 'M',
    badgeColor: 'bg-blue-500',
  },
  {
    label: 'Booked (F)',
    labelBn: 'বুকড (মহিলা)',
    color: 'bg-gradient-to-br from-blue-100 to-blue-200',
    borderColor: 'border-blue-300',
    badge: 'F',
    badgeColor: 'bg-pink-500',
  },
  {
    label: 'Blocked',
    labelBn: 'ব্লকড',
    color: 'bg-sand-100',
    borderColor: 'border-sand-300',
    pattern: true,
  },
  {
    label: 'Sold',
    labelBn: 'বিক্রিত',
    color: 'bg-gradient-to-br from-red-100 to-red-200',
    borderColor: 'border-red-300',
  },
];

interface SeatLegendProps {
  showBilingual?: boolean;
  compact?: boolean;
  className?: string;
}

export const SeatLegend: React.FC<SeatLegendProps> = ({
  showBilingual = false,
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className={`
                relative w-5 h-5 rounded border-2
                ${item.color} ${item.borderColor}
              `}
            >
              {item.pattern && (
                <div
                  className="absolute inset-0 rounded overflow-hidden opacity-30"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 2px,
                      #9CA3AF 2px,
                      #9CA3AF 3px
                    )`,
                  }}
                />
              )}
              {item.badge && (
                <div
                  className={`
                    absolute -top-1 -right-1
                    w-3 h-3 rounded-full
                    flex items-center justify-center
                    text-white text-[8px] font-bold
                    ${item.badgeColor}
                  `}
                >
                  {item.badge}
                </div>
              )}
            </div>
            <span className="text-xs text-sand-600">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`bg-sand-50 rounded-xl p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-sand-700 mb-3">
        Seat Legend
        {showBilingual && <span className="font-bengali text-sand-500 ml-2">(সিট নির্দেশিকা)</span>}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className={`
                relative w-8 h-8 rounded-lg border-2
                flex items-center justify-center
                ${item.color} ${item.borderColor}
              `}
            >
              {item.pattern && (
                <div
                  className="absolute inset-0 rounded-lg overflow-hidden opacity-30"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 3px,
                      #9CA3AF 3px,
                      #9CA3AF 4px
                    )`,
                  }}
                />
              )}
              {item.badge && (
                <div
                  className={`
                    absolute -top-1 -right-1
                    w-4 h-4 rounded-full
                    flex items-center justify-center
                    text-white text-[10px] font-bold
                    ${item.badgeColor}
                  `}
                >
                  {item.badge}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-sand-700">{item.label}</span>
              {showBilingual && item.labelBn && (
                <span className="text-[10px] font-bengali text-sand-500">{item.labelBn}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
