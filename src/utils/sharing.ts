// Sharing utilities for WhatsApp, Facebook, etc.

interface BookingShareData {
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
  agencyName?: string;
  agencyPhone?: string;
}

// Format currency in BDT
const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString('en-BD')}`;
};

// Generate booking confirmation message
export const generateBookingMessage = (data: BookingShareData): string => {
  const lines = [
    `🎫 *Booking Confirmation*`,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    `📋 *Booking ID:* #${data.bookingId}`,
    `👤 *Guest:* ${data.guestName}`,
    `📱 *Phone:* ${data.guestPhone}`,
  ];

  if (data.destination) {
    lines.push(`📍 *Destination:* ${data.destination}`);
  }

  if (data.departureDate) {
    lines.push(`📅 *Departure:* ${data.departureDate}`);
  }

  if (data.boardingPoint) {
    lines.push(`🚌 *Boarding:* ${data.boardingPoint}`);
  }

  lines.push(
    `👥 *Passengers:* ${data.passengers}`,
    ``,
    `💰 *Payment Details:*`,
    `   Total: ${formatCurrency(data.totalAmount)}`,
    `   Paid: ${formatCurrency(data.advancePaid)}`,
    `   Due: ${formatCurrency(data.dueAmount)}`,
  );

  if (data.agencyName) {
    lines.push(
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `🏢 *${data.agencyName}*`,
    );
    if (data.agencyPhone) {
      lines.push(`📞 ${data.agencyPhone}`);
    }
  }

  lines.push(
    ``,
    `Thank you for booking with us!`,
    `ধন্যবাদ! 🙏`
  );

  return lines.join('\n');
};

// Share via WhatsApp
export const shareViaWhatsApp = (phone: string, message: string): void => {
  // Remove any non-numeric characters from phone
  let cleanPhone = phone.replace(/\D/g, '');

  // Add Bangladesh country code if not present
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '88' + cleanPhone;
  } else if (!cleanPhone.startsWith('88')) {
    cleanPhone = '88' + cleanPhone;
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

// Share via WhatsApp (without specific phone - for general sharing)
export const shareToWhatsApp = (message: string): void => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

// Open WhatsApp chat with agency
export const openWhatsAppChat = (phone: string, message?: string): void => {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '88' + cleanPhone;
  } else if (!cleanPhone.startsWith('88')) {
    cleanPhone = '88' + cleanPhone;
  }

  let url = `https://wa.me/${cleanPhone}`;
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  window.open(url, '_blank');
};

// Share via Facebook Messenger
export const shareViaMessenger = (message: string): void => {
  // Facebook Messenger share link
  const encodedMessage = encodeURIComponent(message);
  // Using FB Send dialog (requires app_id for full functionality)
  const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(window.location.href)}&redirect_uri=${encodeURIComponent(window.location.href)}`;
  window.open(messengerUrl, '_blank', 'width=600,height=400');
};

// Share via Facebook
export const shareToFacebook = (url?: string, quote?: string): void => {
  const shareUrl = url || window.location.href;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}${quote ? `&quote=${encodeURIComponent(quote)}` : ''}`;
  window.open(fbUrl, '_blank', 'width=600,height=400');
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Share via native share API (mobile)
export const nativeShare = async (data: { title: string; text: string; url?: string }): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      return false;
    }
  }
  return false;
};

// Generate SMS link
export const generateSmsLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  // Different formats for iOS and Android
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';
  return `sms:${cleanPhone}${separator}body=${encodeURIComponent(message)}`;
};

// Call phone number
export const callPhone = (phone: string): void => {
  const cleanPhone = phone.replace(/\D/g, '');
  window.location.href = `tel:${cleanPhone}`;
};
