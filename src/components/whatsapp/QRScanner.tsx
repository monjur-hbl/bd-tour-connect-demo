import React, { useState, useEffect } from 'react';
import { WhatsAppAccount } from '../../types';
import { QrCode, RefreshCw, CheckCircle, XCircle, Smartphone, Loader2 } from 'lucide-react';

interface QRScannerProps {
  qrCode: string | null;
  accounts: WhatsAppAccount[];
  maxAccounts?: number;
  isLoading?: boolean;
  onRequestQR: (accountSlot: number) => void;
  onCancel: () => void;
  onDisconnect: (accountId: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  qrCode,
  accounts,
  maxAccounts = 2,
  isLoading,
  onRequestQR,
  onCancel,
  onDisconnect,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [qrExpiry, setQrExpiry] = useState(60);

  // QR code expiry countdown
  useEffect(() => {
    if (!qrCode) {
      setQrExpiry(60);
      return;
    }

    const interval = setInterval(() => {
      setQrExpiry((t) => {
        if (t <= 1) {
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [qrCode]);

  const handleRequestQR = (slot: number) => {
    setSelectedSlot(slot);
    onRequestQR(slot);
  };

  const getAccountForSlot = (slot: number) => {
    return accounts[slot - 1];
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect WhatsApp</h2>
        <p className="text-gray-600">
          Scan the QR code with your WhatsApp to connect your account
        </p>
      </div>

      {/* Account slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {Array.from({ length: maxAccounts }, (_, i) => i + 1).map((slot) => {
          const account = getAccountForSlot(slot);
          const isConnected = account?.status === 'connected';
          const isConnecting = account?.status === 'connecting' || (selectedSlot === slot && isLoading);

          return (
            <div
              key={slot}
              className={`p-4 rounded-xl border-2 transition-all ${
                isConnected
                  ? 'border-green-500 bg-green-50'
                  : isConnecting
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Account {slot}</span>
                {isConnected && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </span>
                )}
                {isConnecting && (
                  <span className="flex items-center gap-1 text-xs text-orange-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </span>
                )}
              </div>

              {account ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {account.profilePicture ? (
                      <img
                        src={account.profilePicture}
                        alt={account.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 text-white text-lg font-semibold">
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{account.name}</p>
                    <p className="text-sm text-gray-500">{account.phoneNumber}</p>
                  </div>
                  {isConnected && (
                    <button
                      onClick={() => onDisconnect(account.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Disconnect"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleRequestQR(slot)}
                  disabled={isLoading || !!qrCode}
                  className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" />
                  Scan QR Code
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* QR Code display */}
      {qrCode && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {/* QR Code */}
              <div className="w-64 h-64 bg-white p-4 rounded-lg shadow-lg">
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="QR Code"
                  className="w-full h-full"
                />
              </div>

              {/* Expiry overlay */}
              {qrExpiry <= 10 && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <p className="text-lg font-bold">{qrExpiry}s</p>
                    <p className="text-sm">QR expiring</p>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>1.</strong> Open WhatsApp on your phone
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>2.</strong> Tap Menu or Settings and select Linked Devices
              </p>
              <p className="text-sm text-gray-600">
                <strong>3.</strong> Point your phone at this screen to capture the QR code
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {qrExpiry === 0 ? (
                <button
                  onClick={() => selectedSlot && onRequestQR(selectedSlot)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh QR
                </button>
              ) : (
                <div className="text-sm text-gray-500">
                  Expires in {qrExpiry}s
                </div>
              )}
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {!qrCode && (
        <div className="bg-blue-50 rounded-xl p-4 mt-6">
          <h3 className="font-medium text-blue-900 mb-2">Tips for best results:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure your phone has a stable internet connection</li>
            <li>• Keep your phone connected to power while using WhatsApp Web</li>
            <li>• You can connect up to {maxAccounts} WhatsApp accounts</li>
            <li>• All agents can see and reply to messages from connected accounts</li>
          </ul>
        </div>
      )}
    </div>
  );
};
