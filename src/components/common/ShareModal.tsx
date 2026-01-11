import React, { useState } from 'react';
import {
  generateBookingMessage,
  shareViaWhatsApp,
  shareToWhatsApp,
  shareToFacebook,
  copyToClipboard,
  callPhone,
  generateSmsLink,
} from '../../utils/sharing';
import toast from 'react-hot-toast';

interface BookingData {
  bookingId: string;
  guestName: string;
  guestPhone: string;
  destination?: string;
  departureDate?: string;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  passengers: number;
  boardingPoint?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingData;
  agencyName?: string;
  agencyPhone?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  booking,
  agencyName,
  agencyPhone,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const message = generateBookingMessage({
    ...booking,
    agencyName,
    agencyPhone,
  });

  const handleWhatsAppToGuest = () => {
    shareViaWhatsApp(booking.guestPhone, message);
  };

  const handleWhatsAppGeneral = () => {
    shareToWhatsApp(message);
  };

  const handleFacebook = () => {
    shareToFacebook(undefined, `Booking #${booking.bookingId} confirmed for ${booking.guestName}`);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(message);
    if (success) {
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy');
    }
  };

  const handleCall = () => {
    callPhone(booking.guestPhone);
  };

  const handleSms = () => {
    window.location.href = generateSmsLink(booking.guestPhone, message);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-sand-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-sand-800">
              Share Booking
              <span className="font-bengali text-sm font-normal text-sand-500 ml-2">(শেয়ার করুন)</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-sand-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sand-500 text-sm mt-1">Booking #{booking.bookingId}</p>
        </div>

        <div className="p-6 space-y-4">
          {/* WhatsApp Options */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-sand-700">WhatsApp</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleWhatsAppToGuest}
                className="flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Send to Guest
              </button>
              <button
                onClick={handleWhatsAppGeneral}
                className="flex items-center justify-center gap-2 p-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share
              </button>
            </div>
          </div>

          {/* Facebook */}
          <button
            onClick={handleFacebook}
            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Share on Facebook
          </button>

          {/* Contact Options */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-sand-700">Contact Guest</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCall}
                className="flex items-center justify-center gap-2 p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </button>
              <button
                onClick={handleSms}
                className="flex items-center justify-center gap-2 p-3 bg-secondary-500 text-white rounded-xl hover:bg-secondary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                SMS
              </button>
            </div>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 p-3 bg-sand-100 text-sand-700 rounded-xl hover:bg-sand-200 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Message
              </>
            )}
          </button>

          {/* Preview */}
          <div className="mt-4">
            <p className="text-sm font-medium text-sand-700 mb-2">Message Preview</p>
            <div className="bg-sand-50 p-4 rounded-xl text-sm text-sand-600 whitespace-pre-wrap max-h-40 overflow-y-auto font-mono text-xs">
              {message}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
