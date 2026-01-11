import React from 'react';

type DeckType = 'lower' | 'upper';

interface DeckTabsProps {
  activeDeck: DeckType;
  onDeckChange: (deck: DeckType) => void;
  hasUpperDeck: boolean;
  lowerDeckSeats?: number;
  upperDeckSeats?: number;
  lowerDeckAvailable?: number;
  upperDeckAvailable?: number;
  showBilingual?: boolean;
}

export const DeckTabs: React.FC<DeckTabsProps> = ({
  activeDeck,
  onDeckChange,
  hasUpperDeck,
  lowerDeckSeats,
  upperDeckSeats,
  lowerDeckAvailable,
  upperDeckAvailable,
  showBilingual = false,
}) => {
  if (!hasUpperDeck) {
    return null;
  }

  const tabs = [
    {
      id: 'lower' as DeckType,
      label: 'Lower Deck',
      labelBn: 'নিচের ডেক',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      ),
      seats: lowerDeckSeats,
      available: lowerDeckAvailable,
    },
    {
      id: 'upper' as DeckType,
      label: 'Upper Deck',
      labelBn: 'উপরের ডেক',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      ),
      seats: upperDeckSeats,
      available: upperDeckAvailable,
    },
  ];

  return (
    <div className="flex gap-2 p-1 bg-sand-100 rounded-xl">
      {tabs.map((tab) => {
        const isActive = activeDeck === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onDeckChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2
              px-4 py-3 rounded-lg
              font-medium text-sm
              transition-all duration-200
              ${
                isActive
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-sand-600 hover:text-sand-800 hover:bg-sand-50'
              }
            `}
          >
            {tab.icon}
            <div className="flex flex-col items-start">
              <span>{tab.label}</span>
              {showBilingual && (
                <span className="text-[10px] font-bengali opacity-70">{tab.labelBn}</span>
              )}
            </div>
            {tab.seats !== undefined && (
              <span
                className={`
                  ml-2 px-2 py-0.5 rounded-full text-xs
                  ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-sand-200 text-sand-600'}
                `}
              >
                {tab.available !== undefined ? `${tab.available}/${tab.seats}` : tab.seats}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Compact version for mobile
export const CompactDeckTabs: React.FC<DeckTabsProps> = ({
  activeDeck,
  onDeckChange,
  hasUpperDeck,
}) => {
  if (!hasUpperDeck) {
    return null;
  }

  return (
    <div className="flex gap-1 p-0.5 bg-sand-100 rounded-lg">
      <button
        onClick={() => onDeckChange('lower')}
        className={`
          flex-1 px-3 py-1.5 rounded-md text-xs font-medium
          transition-all duration-200
          ${
            activeDeck === 'lower'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-sand-600 hover:text-sand-800'
          }
        `}
      >
        Lower
      </button>
      <button
        onClick={() => onDeckChange('upper')}
        className={`
          flex-1 px-3 py-1.5 rounded-md text-xs font-medium
          transition-all duration-200
          ${
            activeDeck === 'upper'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-sand-600 hover:text-sand-800'
          }
        `}
      >
        Upper
      </button>
    </div>
  );
};
