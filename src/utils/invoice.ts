import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PaymentDetails, PaymentMethod, BookingStatus } from '../types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface InvoiceBooking {
  bookingId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestNid?: string;
  emergencyContact?: string;
  passengers: { name: string; age: number; seatNumber?: string; type: string; gender?: string }[];
  boardingPoint?: string;
  droppingPoint?: string;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  paymentMethod?: PaymentMethod | string;
  paymentHistory?: PaymentDetails[];
  transactionId?: string;
  createdAt: string;
  status?: BookingStatus | string;
  isHold?: boolean;
  holdExpiresAt?: string;
  agentName?: string;
  discountAmount?: number;
  discountReason?: string;
}

interface InvoicePackage {
  title?: string;
  titleBn?: string;
  destination?: string;
  destinationBn?: string;
  departureDate?: string;
  returnDate?: string;
  departureTime?: string;
  vehicleType?: string;
  boardingPoints?: { name: string; time?: string }[];
  hosts?: { name: string; nameBn?: string; mobile: string; role?: string }[];
  inclusions?: string[];
}

interface InvoiceAgency {
  name: string;
  nameBn?: string;
  phone?: string;
  email?: string;
  address?: string;
  addressBn?: string;
  logo?: string;
  tagline?: string;
  taglineBn?: string;
}

// Professional color palette
const COLORS = {
  primary: [41, 128, 185] as [number, number, number], // Blue
  secondary: [52, 73, 94] as [number, number, number], // Dark gray
  accent: [230, 126, 34] as [number, number, number], // Orange
  success: [39, 174, 96] as [number, number, number], // Green
  warning: [241, 196, 15] as [number, number, number], // Yellow
  danger: [231, 76, 60] as [number, number, number], // Red
  light: [236, 240, 241] as [number, number, number], // Light gray
  dark: [44, 62, 80] as [number, number, number], // Dark
  white: [255, 255, 255] as [number, number, number],
  holdOrange: [243, 156, 18] as [number, number, number], // Hold status
  muted: [149, 165, 166] as [number, number, number], // Muted gray
};

// Format date
const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// Format date with time
const formatDateTime = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

// Format currency
const formatCurrency = (amount: number): string => {
  return `BDT ${amount.toLocaleString('en-BD')}`;
};

// Get payment method display name
const getPaymentMethodLabel = (method?: PaymentMethod | string): string => {
  if (!method) return '-';
  const methods: Record<string, string> = {
    cash: 'Cash',
    bkash: 'bKash',
    nagad: 'Nagad',
    card: 'Card',
    bank: 'Bank Transfer',
    other: 'Other',
  };
  return methods[method] || method;
};

// Get status color
const getStatusColor = (status?: BookingStatus | string, isHold?: boolean): [number, number, number] => {
  if (isHold || status === 'hold') return COLORS.holdOrange;
  switch (status) {
    case 'confirmed':
      return COLORS.success;
    case 'pending':
      return COLORS.warning;
    case 'cancelled':
    case 'expired':
      return COLORS.danger;
    case 'completed':
      return COLORS.primary;
    default:
      return COLORS.secondary;
  }
};

// Get status label
const getStatusLabel = (status?: BookingStatus | string, isHold?: boolean): string => {
  if (isHold || status === 'hold') return 'ON HOLD';
  switch (status) {
    case 'confirmed':
      return 'CONFIRMED';
    case 'pending':
      return 'PENDING';
    case 'cancelled':
      return 'CANCELLED';
    case 'expired':
      return 'EXPIRED';
    case 'completed':
      return 'COMPLETED';
    default:
      return 'PENDING';
  }
};

// Get payment status
const getPaymentStatus = (booking: InvoiceBooking): { label: string; color: [number, number, number] } => {
  if (booking.isHold || booking.status === 'hold') {
    return { label: 'UNPAID (ON HOLD)', color: COLORS.holdOrange };
  }
  if (booking.dueAmount <= 0) {
    return { label: 'FULLY PAID', color: COLORS.success };
  }
  if (booking.advancePaid > 0) {
    return { label: 'ADVANCE PAID', color: COLORS.warning };
  }
  return { label: 'UNPAID', color: COLORS.danger };
};

export const generateInvoicePDF = (
  booking: InvoiceBooking,
  tourPackage: InvoicePackage | null,
  agency: InvoiceAgency
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  let yPos = margin;

  // ==================== HEADER SECTION ====================
  // Gradient-like header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Agency name
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(agency.name.toUpperCase(), margin, 16);

  // Agency Bengali name or tagline
  if (agency.nameBn) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(agency.nameBn, margin, 23);
  } else if (agency.tagline) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(agency.tagline, margin, 23);
  }

  // Contact info on right
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (agency.phone) doc.text(agency.phone, pageWidth - margin, 14, { align: 'right' });
  if (agency.email) doc.text(agency.email, pageWidth - margin, 19, { align: 'right' });
  if (agency.address) {
    const addressLines = doc.splitTextToSize(agency.address, 70);
    doc.text(addressLines, pageWidth - margin, 24, { align: 'right' });
  }

  // Invoice title badge
  const invoiceLabel = booking.isHold ? 'HOLD CONFIRMATION' : 'BOOKING INVOICE';
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(margin, 32, 55, 8, 2, 2, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(invoiceLabel, margin + 27.5, 37.5, { align: 'center' });

  yPos = 52;

  // ==================== BOOKING INFO BAR ====================
  // Status and booking ID row
  const statusColor = getStatusColor(booking.status, booking.isHold);
  const statusLabel = getStatusLabel(booking.status, booking.isHold);

  // Status badge
  doc.setFillColor(...statusColor);
  doc.roundedRect(margin, yPos - 3, 28, 8, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabel, margin + 14, yPos + 2, { align: 'center' });

  // Booking ID
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${booking.bookingId}`, margin + 34, yPos + 2);

  // Date on right
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text(`Booked: ${formatDateTime(booking.createdAt)}`, pageWidth - margin, yPos + 2, { align: 'right' });

  yPos += 12;

  // Hold expiry warning box
  if (booking.isHold && booking.holdExpiresAt) {
    doc.setFillColor(255, 248, 225); // Light yellow
    doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, 14, 2, 2, 'F');
    doc.setDrawColor(...COLORS.holdOrange);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, 14, 2, 2, 'S');

    doc.setTextColor(...COLORS.holdOrange);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DEADLINE:', margin + 3, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(formatDateTime(booking.holdExpiresAt), margin + 40, yPos + 5);

    doc.setFontSize(7);
    doc.text('Booking will be cancelled automatically if payment is not received before this time.', margin + 3, yPos + 10);
    yPos += 18;
  }

  // ==================== PACKAGE INFORMATION ====================
  if (tourPackage && (tourPackage.title || tourPackage.destination)) {
    // Section header with icon
    doc.setFillColor(...COLORS.light);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TOUR PACKAGE DETAILS', margin + 3, yPos + 5);
    yPos += 11;

    // Package info in grid
    doc.setFontSize(8);
    const leftCol = margin;
    const rightCol = margin + 95;

    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.muted);
    doc.text('Package:', leftCol, yPos);
    doc.setTextColor(...COLORS.dark);
    doc.setFont('helvetica', 'normal');
    doc.text(tourPackage.title || tourPackage.destination || '-', leftCol + 20, yPos);

    if (tourPackage.vehicleType) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.muted);
      doc.text('Vehicle:', rightCol, yPos);
      doc.setTextColor(...COLORS.dark);
      doc.setFont('helvetica', 'normal');
      doc.text(tourPackage.vehicleType, rightCol + 18, yPos);
    }
    yPos += 6;

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.muted);
    doc.text('Destination:', leftCol, yPos);
    doc.setTextColor(...COLORS.dark);
    doc.setFont('helvetica', 'normal');
    doc.text(tourPackage.destination || '-', leftCol + 25, yPos);
    yPos += 6;

    // Row 3 - Dates
    if (tourPackage.departureDate) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.muted);
      doc.text('Departure:', leftCol, yPos);
      doc.setTextColor(...COLORS.dark);
      doc.setFont('helvetica', 'normal');
      const departureStr = `${formatDate(tourPackage.departureDate)}${tourPackage.departureTime ? ' at ' + tourPackage.departureTime : ''}`;
      doc.text(departureStr, leftCol + 22, yPos);

      if (tourPackage.returnDate) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.muted);
        doc.text('Return:', rightCol, yPos);
        doc.setTextColor(...COLORS.dark);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDate(tourPackage.returnDate), rightCol + 16, yPos);
      }
      yPos += 6;
    }

    // Tour hosts
    if (tourPackage.hosts && tourPackage.hosts.length > 0) {
      yPos += 2;
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, 6 + (tourPackage.hosts.length * 5), 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.secondary);
      doc.setFontSize(7);
      doc.text('TOUR HOST(S):', margin + 3, yPos + 3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.dark);
      tourPackage.hosts.forEach((host, i) => {
        const hostText = `${host.name}${host.role ? ` (${host.role})` : ''} - ${host.mobile}`;
        doc.text(hostText, margin + 35, yPos + 3 + (i * 5));
      });
      yPos += 8 + (tourPackage.hosts.length * 5);
    }

    yPos += 4;
  }

  // ==================== GUEST INFORMATION ====================
  doc.setFillColor(...COLORS.light);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('GUEST INFORMATION', margin + 3, yPos + 5);
  yPos += 11;

  // Guest details grid
  doc.setFontSize(8);
  const guestLeftCol = margin;
  const guestRightCol = margin + 95;

  // Primary guest name
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.muted);
  doc.text('Primary Guest:', guestLeftCol, yPos);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.guestName, guestLeftCol + 28, yPos);

  // Phone
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.muted);
  doc.text('Phone:', guestRightCol, yPos);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.guestPhone || '-', guestRightCol + 15, yPos);
  yPos += 5;

  // Email and NID
  if (booking.guestEmail || booking.guestNid) {
    if (booking.guestEmail) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.muted);
      doc.text('Email:', guestLeftCol, yPos);
      doc.setTextColor(...COLORS.dark);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.guestEmail, guestLeftCol + 15, yPos);
    }

    if (booking.guestNid) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.muted);
      doc.text('NID:', guestRightCol, yPos);
      doc.setTextColor(...COLORS.dark);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.guestNid, guestRightCol + 12, yPos);
    }
    yPos += 5;
  }

  // Boarding and dropping points
  if (booking.boardingPoint || booking.droppingPoint) {
    yPos += 2;
    if (booking.boardingPoint) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.muted);
      doc.text('Boarding:', guestLeftCol, yPos);
      doc.setTextColor(...COLORS.dark);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.boardingPoint, guestLeftCol + 20, yPos);
    }

    if (booking.droppingPoint) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.muted);
      doc.text('Dropping:', guestRightCol, yPos);
      doc.setTextColor(...COLORS.dark);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.droppingPoint, guestRightCol + 20, yPos);
    }
    yPos += 5;
  }

  yPos += 4;

  // ==================== PASSENGERS TABLE ====================
  if (booking.passengers && booking.passengers.length > 0) {
    doc.setFillColor(...COLORS.light);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`PASSENGERS (${booking.passengers.length})`, margin + 3, yPos + 5);
    yPos += 10;

    // Passengers table
    doc.autoTable({
      startY: yPos,
      head: [['#', 'Name', 'Type', 'Age', 'Seat No.']],
      body: booking.passengers.map((p, i) => [
        (i + 1).toString(),
        p.name,
        p.type.charAt(0).toUpperCase() + p.type.slice(1),
        p.age.toString(),
        p.seatNumber || '-',
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.dark,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { cellWidth: 65 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 18 },
        4: { halign: 'center', cellWidth: 25 },
      },
      margin: { left: margin, right: margin },
    });

    yPos = doc.lastAutoTable.finalY + 8;
  }

  // ==================== PAYMENT SUMMARY ====================
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT SUMMARY', margin + 3, yPos + 5);
  yPos += 12;

  // Payment box on right side
  const boxWidth = 80;
  const boxHeight = 50;
  const boxX = pageWidth - margin - boxWidth;

  doc.setFillColor(250, 251, 252);
  doc.setDrawColor(...COLORS.light);
  doc.roundedRect(boxX - 2, yPos - 3, boxWidth + 4, boxHeight + 4, 3, 3, 'FD');

  // Payment rows
  const paymentStatus = getPaymentStatus(booking);

  // Total Package Value
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  doc.text('Total Package Value', boxX, yPos + 3);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(formatCurrency(booking.totalAmount), boxX + boxWidth - 2, yPos + 3, { align: 'right' });

  // Discount (if any)
  let paymentYOffset = 10;
  if (booking.discountAmount && booking.discountAmount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(8);
    doc.text(`Discount${booking.discountReason ? ` (${booking.discountReason})` : ''}`, boxX, yPos + paymentYOffset + 3);
    doc.setTextColor(...COLORS.success);
    doc.setFont('helvetica', 'bold');
    doc.text(`-${formatCurrency(booking.discountAmount)}`, boxX + boxWidth - 2, yPos + paymentYOffset + 3, { align: 'right' });
    paymentYOffset += 10;
  }

  // Advance Paid
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  doc.text('Advance Paid', boxX, yPos + paymentYOffset + 3);
  doc.setTextColor(...COLORS.success);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(formatCurrency(booking.advancePaid), boxX + boxWidth - 2, yPos + paymentYOffset + 3, { align: 'right' });
  paymentYOffset += 12;

  // Separator line
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.5);
  doc.line(boxX, yPos + paymentYOffset, boxX + boxWidth - 2, yPos + paymentYOffset);
  paymentYOffset += 5;

  // Balance Due
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(9);
  doc.text('BALANCE DUE', boxX, yPos + paymentYOffset + 3);
  doc.setTextColor(booking.dueAmount > 0 ? COLORS.danger[0] : COLORS.success[0], booking.dueAmount > 0 ? COLORS.danger[1] : COLORS.success[1], booking.dueAmount > 0 ? COLORS.danger[2] : COLORS.success[2]);
  doc.setFontSize(12);
  doc.text(formatCurrency(booking.dueAmount), boxX + boxWidth - 2, yPos + paymentYOffset + 3, { align: 'right' });

  // Payment info on left side
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.muted);
  doc.text('Payment Method:', margin, yPos + 3);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'normal');
  doc.text(getPaymentMethodLabel(booking.paymentMethod), margin + 32, yPos + 3);

  // Transaction ID
  let leftYOffset = 8;
  const transactionId = booking.paymentHistory && booking.paymentHistory.length > 0
    ? booking.paymentHistory[booking.paymentHistory.length - 1].transactionId
    : booking.transactionId;

  if (transactionId && !transactionId.startsWith('CASH')) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.muted);
    doc.text('Transaction ID:', margin, yPos + leftYOffset + 3);
    doc.setTextColor(...COLORS.dark);
    doc.setFont('helvetica', 'normal');
    doc.text(transactionId, margin + 32, yPos + leftYOffset + 3);
    leftYOffset += 8;
  }

  // Payment status badge
  doc.setFillColor(...paymentStatus.color);
  doc.roundedRect(margin, yPos + leftYOffset, 35, 7, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(paymentStatus.label, margin + 17.5, yPos + leftYOffset + 5, { align: 'center' });
  leftYOffset += 12;

  // Booked by agent
  if (booking.agentName) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(8);
    doc.text('Booked By:', margin, yPos + leftYOffset);
    doc.setTextColor(...COLORS.dark);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.agentName, margin + 23, yPos + leftYOffset);
  }

  yPos += boxHeight + 10;

  // ==================== PAYMENT HISTORY (if multiple payments) ====================
  if (booking.paymentHistory && booking.paymentHistory.length > 1) {
    doc.setFillColor(...COLORS.light);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
    doc.setTextColor(...COLORS.secondary);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT HISTORY', margin + 3, yPos + 5);
    yPos += 10;

    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Method', 'Transaction ID', 'Amount']],
      body: booking.paymentHistory.map((p) => [
        formatDateTime(p.paidAt),
        getPaymentMethodLabel(p.method),
        p.transactionId || '-',
        formatCurrency(p.amount),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontSize: 7,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: COLORS.dark,
      },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // ==================== FOOTER ====================
  const footerY = pageHeight - 22;

  // Footer background
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, footerY, pageWidth, 22, 'F');

  // Thank you message
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Thank you for choosing ${agency.name}!`, pageWidth / 2, footerY + 7, { align: 'center' });

  // Generated timestamp
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated on ${formatDateTime(new Date().toISOString())} | This is a computer-generated document.`,
    pageWidth / 2,
    footerY + 13,
    { align: 'center' }
  );

  // Terms
  doc.setFontSize(6);
  doc.text(
    'Please carry this invoice during your trip. Terms and conditions apply.',
    pageWidth / 2,
    footerY + 18,
    { align: 'center' }
  );

  // ==================== SAVE PDF ====================
  const filename = booking.isHold
    ? `Hold_${booking.bookingId}_${agency.name.replace(/\s+/g, '_')}.pdf`
    : `Invoice_${booking.bookingId}_${agency.name.replace(/\s+/g, '_')}.pdf`;

  doc.save(filename);
};

// Generate a simple receipt for hold bookings
export const generateHoldReceipt = (
  booking: InvoiceBooking,
  tourPackage: InvoicePackage | null,
  agency: InvoiceAgency
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.width;
  const margin = 10;
  let yPos = margin;

  // Header
  doc.setFillColor(...COLORS.holdOrange);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SEAT HOLD CONFIRMATION', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(agency.name, pageWidth / 2, 17, { align: 'center' });
  if (agency.phone) doc.text(agency.phone, pageWidth / 2, 23, { align: 'center' });

  yPos = 38;

  // Booking ID
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${booking.bookingId}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Warning box
  if (booking.holdExpiresAt) {
    doc.setFillColor(255, 248, 225);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 2, 2, 'F');
    doc.setDrawColor(...COLORS.holdOrange);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 2, 2, 'S');

    doc.setTextColor(...COLORS.holdOrange);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DEADLINE', pageWidth / 2, yPos + 6, { align: 'center' });
    doc.setFontSize(10);
    doc.text(formatDateTime(booking.holdExpiresAt), pageWidth / 2, yPos + 13, { align: 'center' });
    yPos += 25;
  }

  // Basic info
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(8);

  const info = [
    ['Guest', booking.guestName],
    ['Phone', booking.guestPhone || '-'],
    ['Passengers', booking.passengers.length.toString()],
    ['Amount Due', formatCurrency(booking.totalAmount)],
  ];

  info.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0] + ':', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], margin + 28, yPos);
    yPos += 6;
  });

  if (tourPackage?.destination) {
    yPos += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Destination:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(tourPackage.destination, margin + 28, yPos);
    yPos += 6;

    if (tourPackage.departureDate) {
      doc.setFont('helvetica', 'bold');
      doc.text('Departure:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(tourPackage.departureDate), margin + 28, yPos);
    }
  }

  // Footer
  const footerY = doc.internal.pageSize.height - 15;
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  doc.text('This is a hold confirmation. Booking will be cancelled if payment is not received before deadline.', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, pageWidth / 2, footerY + 4, { align: 'center' });

  doc.save(`Hold_Receipt_${booking.bookingId}.pdf`);
};

export default generateInvoicePDF;
