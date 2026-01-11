import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  passengers: { name: string; age: number; seatNumber?: string; type: string }[];
  boardingPoint?: string;
  droppingPoint?: string;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  paymentMethod?: string;
  createdAt: string;
}

interface InvoicePackage {
  title: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  inclusions?: string[];
}

interface InvoiceAgency {
  name: string;
  nameBn?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export const generateInvoicePDF = (
  booking: InvoiceBooking,
  tourPackage: InvoicePackage | null,
  agency: InvoiceAgency
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor: [number, number, number] = [217, 119, 6]; // amber-600
  const darkColor: [number, number, number] = [28, 25, 23]; // stone-900
  const grayColor: [number, number, number] = [120, 113, 108]; // stone-500

  let yPos = 20;

  // Header with Agency Info
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(agency.name, 15, 18);

  if (agency.nameBn) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(agency.nameBn, 15, 26);
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (agency.phone) doc.text(`Phone: ${agency.phone}`, 15, 34);
  if (agency.email) doc.text(`Email: ${agency.email}`, pageWidth / 2, 34);

  yPos = 50;

  // Invoice Title
  doc.setTextColor(...darkColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BOOKING INVOICE', pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;

  // Booking Info Box
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3);

  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text('Booking ID', 20, yPos + 10);
  doc.text('Booking Date', 80, yPos + 10);
  doc.text('Payment Status', 140, yPos + 10);

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`#${booking.bookingId}`, 20, yPos + 20);
  doc.setFontSize(10);
  doc.text(new Date(booking.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }), 80, yPos + 20);

  const paymentStatus = booking.dueAmount <= 0 ? 'FULLY PAID' : booking.advancePaid > 0 ? 'PARTIALLY PAID' : 'UNPAID';
  const statusColor: [number, number, number] = booking.dueAmount <= 0 ? [22, 163, 74] : booking.advancePaid > 0 ? [217, 119, 6] : [220, 38, 38];
  doc.setTextColor(...statusColor);
  doc.text(paymentStatus, 140, yPos + 20);

  yPos += 45;

  // Guest Information
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Guest Information', 15, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);

  const guestInfo = [
    ['Name:', booking.guestName],
    ['Phone:', booking.guestPhone],
  ];
  if (booking.guestEmail) guestInfo.push(['Email:', booking.guestEmail]);
  if (booking.guestNid) guestInfo.push(['NID:', booking.guestNid]);

  guestInfo.forEach((info, index) => {
    doc.text(info[0], 15, yPos + (index * 6));
    doc.setTextColor(...darkColor);
    doc.text(info[1], 45, yPos + (index * 6));
    doc.setTextColor(...grayColor);
  });

  yPos += guestInfo.length * 6 + 10;

  // Tour Package Information
  if (tourPackage) {
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Tour Package', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);

    const packageInfo = [
      ['Package:', tourPackage.title],
      ['Destination:', tourPackage.destination],
      ['Departure:', new Date(tourPackage.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
    ];
    if (tourPackage.returnDate) {
      packageInfo.push(['Return:', new Date(tourPackage.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })]);
    }
    if (booking.boardingPoint) packageInfo.push(['Boarding Point:', booking.boardingPoint]);
    if (booking.droppingPoint) packageInfo.push(['Dropping Point:', booking.droppingPoint]);

    packageInfo.forEach((info, index) => {
      doc.text(info[0], 15, yPos + (index * 6));
      doc.setTextColor(...darkColor);
      doc.text(info[1], 50, yPos + (index * 6));
      doc.setTextColor(...grayColor);
    });

    yPos += packageInfo.length * 6 + 10;
  }

  // Passengers Table
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Passengers', 15, yPos);
  yPos += 5;

  const passengerTableData = booking.passengers.map((p, index) => [
    (index + 1).toString(),
    p.name,
    p.age.toString(),
    p.type,
    p.seatNumber || '-'
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Name', 'Age', 'Type', 'Seat']],
    body: passengerTableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 60 },
      2: { cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
    },
    margin: { left: 15, right: 15 },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Payment Summary
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Summary', 15, yPos);
  yPos += 8;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Payment box
  doc.setFillColor(250, 250, 249); // stone-50
  doc.roundedRect(pageWidth - 100, yPos - 5, 85, 45, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Total Amount:', pageWidth - 95, yPos + 5);
  doc.text('Amount Paid:', pageWidth - 95, yPos + 15);
  doc.text('Due Amount:', pageWidth - 95, yPos + 25);

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(booking.totalAmount), pageWidth - 20, yPos + 5, { align: 'right' });
  doc.setTextColor(22, 163, 74); // green
  doc.text(formatCurrency(booking.advancePaid), pageWidth - 20, yPos + 15, { align: 'right' });
  doc.setTextColor(booking.dueAmount > 0 ? 220 : 22, booking.dueAmount > 0 ? 38 : 163, booking.dueAmount > 0 ? 38 : 74);
  doc.text(formatCurrency(booking.dueAmount), pageWidth - 20, yPos + 25, { align: 'right' });

  if (booking.paymentMethod) {
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Method:', pageWidth - 95, yPos + 35);
    doc.setTextColor(...darkColor);
    doc.text(booking.paymentMethod.toUpperCase(), pageWidth - 20, yPos + 35, { align: 'right' });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 25;
  doc.setDrawColor(...grayColor);
  doc.setLineWidth(0.2);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString('en-GB')}`, pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text('Thank you for choosing ' + agency.name + '!', pageWidth / 2, footerY + 10, { align: 'center' });

  // Save the PDF
  doc.save(`Invoice_${booking.bookingId}.pdf`);
};
