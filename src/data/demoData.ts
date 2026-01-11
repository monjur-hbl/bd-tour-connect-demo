// Demo Data for BD Tour Connect
import { User, Agency, TourPackage, Booking, DashboardStats } from '../types';

// ============================================
// DEMO USERS - Login Credentials
// ============================================

export const DEMO_USERS: Record<string, { user: User; password: string }> = {
  // System Admin (You - Mallik)
  '01700000001': {
    password: 'admin123',
    user: {
      id: 'admin-001',
      phone: '01700000001',
      name: 'Mallik Nurmohammed',
      nameBn: 'মল্লিক নূরমোহাম্মদ',
      email: 'mallik@bdtourconnect.com',
      role: 'system_admin',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  },

  // Agency Admin
  '01700000002': {
    password: 'agency123',
    user: {
      id: 'agency-admin-001',
      phone: '01700000002',
      name: 'Karim Ahmed',
      nameBn: 'করিম আহমেদ',
      email: 'karim@travelbangla.com',
      role: 'agency_admin',
      agencyId: 'agency-001',
      isActive: true,
      createdAt: '2024-01-15T00:00:00Z'
    }
  },

  // Sales Agent
  '01700000003': {
    password: 'agent123',
    user: {
      id: 'agent-001',
      phone: '01700000003',
      name: 'Rahim Uddin',
      nameBn: 'রহিম উদ্দিন',
      email: 'rahim@travelbangla.com',
      role: 'sales_agent',
      agencyId: 'agency-001',
      agentCode: 'SA001',
      permissions: ['create_booking', 'edit_booking', 'view_all_bookings'],
      isActive: true,
      createdAt: '2024-02-01T00:00:00Z'
    }
  }
};

// ============================================
// DEMO AGENCIES
// ============================================

export const DEMO_AGENCIES: Agency[] = [
  {
    id: 'agency-001',
    name: 'Travel Bangla Tours',
    nameBn: 'ট্রাভেল বাংলা ট্যুরস',
    slug: 'travel-bangla',
    phone: '01700000002',
    email: 'info@travelbangla.com',
    address: '123 Gulshan Avenue, Dhaka 1212',
    addressBn: '১২৩ গুলশান এভিনিউ, ঢাকা ১২১২',
    logo: '',
    primaryColor: '#F97316',
    tagline: 'Explore Bangladesh with Us',
    taglineBn: 'আমাদের সাথে বাংলাদেশ দেখুন',
    subscription: {
      plan: 'pro',
      maxAgents: 10,
      maxPackagesPerMonth: 50
    },
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'agency-002',
    name: 'Dhaka Explorer',
    nameBn: 'ঢাকা এক্সপ্লোরার',
    slug: 'dhaka-explorer',
    phone: '01800000001',
    email: 'info@dhakaexplorer.com',
    address: '45 Banani, Dhaka 1213',
    addressBn: '৪৫ বনানী, ঢাকা ১২১৩',
    primaryColor: '#3B82F6',
    tagline: 'Your Journey Starts Here',
    taglineBn: 'আপনার যাত্রা এখানেই শুরু',
    subscription: {
      plan: 'basic',
      maxAgents: 3,
      maxPackagesPerMonth: 10
    },
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 'agency-003',
    name: 'Cox Bazar Express',
    nameBn: 'কক্সবাজার এক্সপ্রেস',
    slug: 'coxbazar-express',
    phone: '01900000001',
    email: 'info@coxbazarexpress.com',
    address: '78 Motijheel, Dhaka 1000',
    addressBn: '৭৮ মতিঝিল, ঢাকা ১০০০',
    primaryColor: '#14B8A6',
    tagline: 'Sea, Sand and Sun',
    taglineBn: 'সমুদ্র, বালি আর সূর্য',
    subscription: {
      plan: 'enterprise',
      maxAgents: 25,
      maxPackagesPerMonth: 100
    },
    isActive: true,
    createdAt: '2024-01-20T00:00:00Z'
  }
];

// ============================================
// DEMO TOUR PACKAGES
// ============================================

export const DEMO_PACKAGES: TourPackage[] = [
  {
    id: 'pkg-001',
    agencyId: 'agency-001',
    title: "Cox's Bazar Beach Paradise - 3 Days",
    titleBn: 'কক্সবাজার বিচ প্যারাডাইস - ৩ দিন',
    destination: "Cox's Bazar",
    destinationBn: 'কক্সবাজার',
    description: 'Experience the longest sea beach in the world with comfortable AC bus travel, premium hotel stay, and guided tours.',
    descriptionBn: 'বিশ্বের দীর্ঘতম সমুদ্র সৈকত উপভোগ করুন আরামদায়ক এসি বাস ভ্রমণ, প্রিমিয়াম হোটেল স্টে এবং গাইডেড ট্যুরের সাথে।',
    departureDate: '2024-02-15',
    returnDate: '2024-02-17',
    departureTime: '22:00',
    vehicleType: 'AC Bus (Hino AK)',
    totalSeats: 40,
    availableSeats: 25,
    pricePerPerson: 5500,
    couplePrice: 10000,
    childPrice: 3500,
    advanceAmount: 2000,
    boardingPoints: [
      { id: 'bp-1', name: 'Gabtoli', nameBn: 'গাবতলী', time: '21:30', address: 'Gabtoli Bus Terminal' },
      { id: 'bp-2', name: 'Sayedabad', nameBn: 'সায়েদাবাদ', time: '22:00', address: 'Sayedabad Bus Terminal' },
      { id: 'bp-3', name: 'Mohakhali', nameBn: 'মহাখালী', time: '22:30', address: 'Mohakhali Bus Terminal' }
    ],
    droppingPoints: [
      { id: 'dp-1', name: 'Hotel Sea Crown', nameBn: 'হোটেল সি ক্রাউন', time: '08:00', address: 'Kolatoli Road' },
      { id: 'dp-2', name: 'Laboni Point', nameBn: 'লাবনী পয়েন্ট', time: '08:15', address: 'Beach Road' }
    ],
    inclusions: ['AC Bus Transport', 'Hotel (2 Nights)', 'Breakfast', 'Tour Guide', 'Beach Activities'],
    exclusions: ['Lunch & Dinner', 'Personal Expenses', 'Tips'],
    mealPlan: [
      { day: 1, breakfast: 'On arrival - Hotel Buffet', lunch: 'Not included', dinner: 'Not included' },
      { day: 2, breakfast: 'Hotel Buffet', lunch: 'Not included', dinner: 'Not included' },
      { day: 3, breakfast: 'Hotel Buffet', lunch: 'Not included', dinner: 'Not included' }
    ],
    status: 'current',
    createdAt: '2024-01-20T00:00:00Z'
  },
  {
    id: 'pkg-002',
    agencyId: 'agency-001',
    title: 'Sundarbans Adventure - 2 Days',
    titleBn: 'সুন্দরবন এডভেঞ্চার - ২ দিন',
    destination: 'Sundarbans',
    destinationBn: 'সুন্দরবন',
    description: 'Explore the largest mangrove forest and home of the Royal Bengal Tiger with boat cruise and jungle safari.',
    descriptionBn: 'বিশ্বের বৃহত্তম ম্যানগ্রোভ বন এবং রয়েল বেঙ্গল টাইগারের আবাসস্থল ঘুরে দেখুন বোট ক্রুজ এবং জঙ্গল সাফারির সাথে।',
    departureDate: '2024-02-20',
    returnDate: '2024-02-21',
    departureTime: '06:00',
    vehicleType: 'AC Microbus',
    totalSeats: 12,
    availableSeats: 8,
    pricePerPerson: 8500,
    couplePrice: 16000,
    childPrice: 5500,
    advanceAmount: 3000,
    boardingPoints: [
      { id: 'bp-1', name: 'Gabtoli', nameBn: 'গাবতলী', time: '05:30', address: 'Gabtoli Bus Terminal' },
      { id: 'bp-2', name: 'Mohammadpur', nameBn: 'মোহাম্মদপুর', time: '06:00', address: 'Town Hall' }
    ],
    droppingPoints: [
      { id: 'dp-1', name: 'Khulna Launch Ghat', nameBn: 'খুলনা লঞ্চ ঘাট', time: '10:00', address: 'Khulna River Port' }
    ],
    inclusions: ['AC Microbus', 'Boat Cruise', 'All Meals', 'Forest Entry', 'Guide', 'Life Jacket'],
    exclusions: ['Personal Expenses', 'Camera Fee', 'Tips'],
    mealPlan: [
      { day: 1, breakfast: 'On boat', lunch: 'On boat - Fish fry', snack: 'Tea & Snacks', dinner: 'Boat BBQ' },
      { day: 2, breakfast: 'On boat', lunch: 'On boat', dinner: 'Not included' }
    ],
    status: 'current',
    createdAt: '2024-01-22T00:00:00Z'
  },
  {
    id: 'pkg-003',
    agencyId: 'agency-001',
    title: 'Sylhet Tea Garden Tour - 3 Days',
    titleBn: 'সিলেট চা বাগান ট্যুর - ৩ দিন',
    destination: 'Sylhet',
    destinationBn: 'সিলেট',
    description: 'Visit beautiful tea gardens, waterfalls, and experience the natural beauty of Sylhet division.',
    descriptionBn: 'সুন্দর চা বাগান, ঝর্ণা দেখুন এবং সিলেট বিভাগের প্রাকৃতিক সৌন্দর্য উপভোগ করুন।',
    departureDate: '2024-03-01',
    returnDate: '2024-03-03',
    departureTime: '21:00',
    vehicleType: 'AC Bus (Scania)',
    totalSeats: 36,
    availableSeats: 36,
    pricePerPerson: 7500,
    couplePrice: 14000,
    childPrice: 4500,
    advanceAmount: 2500,
    boardingPoints: [
      { id: 'bp-1', name: 'Kamalapur', nameBn: 'কমলাপুর', time: '20:30', address: 'Kamalapur Railway Station' },
      { id: 'bp-2', name: 'Uttara', nameBn: 'উত্তরা', time: '21:30', address: 'Jasimuddin Road' }
    ],
    droppingPoints: [
      { id: 'dp-1', name: 'Sylhet Zindabazar', nameBn: 'সিলেট জিন্দাবাজার', time: '06:00', address: 'City Center' }
    ],
    inclusions: ['AC Bus', 'Hotel (2 Nights)', 'Breakfast', 'Sightseeing', 'Guide'],
    exclusions: ['Lunch & Dinner', 'Boating', 'Personal Expenses'],
    mealPlan: [
      { day: 1, breakfast: 'Not included', lunch: 'Not included', dinner: 'Not included' },
      { day: 2, breakfast: 'Hotel Buffet', lunch: 'Not included', dinner: 'Not included' },
      { day: 3, breakfast: 'Hotel Buffet', lunch: 'Not included', dinner: 'Not included' }
    ],
    status: 'future',
    createdAt: '2024-01-25T00:00:00Z'
  },
  {
    id: 'pkg-004',
    agencyId: 'agency-001',
    title: 'Rangamati Lake View - 2 Days',
    titleBn: 'রাঙামাটি লেক ভিউ - ২ দিন',
    destination: 'Rangamati',
    destinationBn: 'রাঙামাটি',
    description: 'Experience the mesmerizing Kaptai Lake and tribal culture of the hill tracts.',
    descriptionBn: 'মনোমুগ্ধকর কাপ্তাই লেক এবং পাহাড়ি জনপদের উপজাতীয় সংস্কৃতি উপভোগ করুন।',
    departureDate: '2024-03-10',
    returnDate: '2024-03-11',
    departureTime: '22:00',
    vehicleType: 'Non-AC Bus',
    totalSeats: 45,
    availableSeats: 40,
    pricePerPerson: 4500,
    couplePrice: 8500,
    childPrice: 2800,
    advanceAmount: 1500,
    boardingPoints: [
      { id: 'bp-1', name: 'Fakirapul', nameBn: 'ফকিরাপুল', time: '21:30', address: 'Fakirapul Bus Stand' }
    ],
    droppingPoints: [
      { id: 'dp-1', name: 'Rangamati Town', nameBn: 'রাঙামাটি শহর', time: '08:00', address: 'Rangamati Bus Terminal' }
    ],
    inclusions: ['Bus Transport', 'Hotel (1 Night)', 'Breakfast', 'Boat Ride'],
    exclusions: ['Lunch & Dinner', 'Entry Fees', 'Personal Expenses'],
    mealPlan: [
      { day: 1, breakfast: 'Not included', lunch: 'Not included', dinner: 'Not included' },
      { day: 2, breakfast: 'Hotel', lunch: 'Not included', dinner: 'Not included' }
    ],
    status: 'future',
    createdAt: '2024-01-28T00:00:00Z'
  }
];

// ============================================
// DEMO BOOKINGS
// ============================================

export const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'book-001',
    bookingId: '000001',
    packageId: 'pkg-001',
    agencyId: 'agency-001',
    agentId: 'agent-001',
    guestName: 'Mohammad Ali',
    guestPhone: '01711111111',
    guestEmail: 'ali@email.com',
    guestNid: '1234567890123',
    emergencyContact: '01722222222',
    passengers: [
      { name: 'Mohammad Ali', age: 35, seatNumber: 'A1', type: 'adult' },
      { name: 'Fatima Ali', age: 32, seatNumber: 'A2', type: 'adult' },
      { name: 'Rahim Ali', age: 8, seatNumber: 'A3', type: 'child' }
    ],
    boardingPoint: 'Sayedabad',
    droppingPoint: 'Hotel Sea Crown',
    subtotal: 14500,
    discountAmount: 0,
    totalAmount: 14500,
    advancePaid: 6000,
    dueAmount: 8500,
    paymentMethod: 'bkash',
    paymentStatus: 'advance_paid',
    status: 'confirmed',
    source: 'walk-in',
    notes: 'Family trip - needs connected seats',
    createdAt: '2024-02-01T10:30:00Z'
  },
  {
    id: 'book-002',
    bookingId: '000002',
    packageId: 'pkg-001',
    agencyId: 'agency-001',
    agentId: 'agent-001',
    guestName: 'Kamal Hossain',
    guestPhone: '01733333333',
    guestEmail: 'kamal@email.com',
    guestNid: '9876543210123',
    passengers: [
      { name: 'Kamal Hossain', age: 28, seatNumber: 'B1', type: 'adult' },
      { name: 'Jasmine Hossain', age: 25, seatNumber: 'B2', type: 'adult' }
    ],
    boardingPoint: 'Gabtoli',
    droppingPoint: 'Laboni Point',
    subtotal: 10000,
    discountAmount: 0,
    totalAmount: 10000,
    advancePaid: 10000,
    dueAmount: 0,
    paymentMethod: 'nagad',
    paymentStatus: 'fully_paid',
    status: 'confirmed',
    source: 'whatsapp',
    createdAt: '2024-02-02T14:00:00Z'
  },
  {
    id: 'book-003',
    bookingId: '000003',
    packageId: 'pkg-002',
    agencyId: 'agency-001',
    agentId: 'agent-001',
    guestName: 'Salma Begum',
    guestPhone: '01744444444',
    passengers: [
      { name: 'Salma Begum', age: 45, seatNumber: 'S1', type: 'adult' }
    ],
    boardingPoint: 'Gabtoli',
    droppingPoint: 'Khulna Launch Ghat',
    subtotal: 8500,
    discountAmount: 0,
    totalAmount: 8500,
    advancePaid: 3000,
    dueAmount: 5500,
    paymentMethod: 'cash',
    paymentStatus: 'advance_paid',
    status: 'pending',
    source: 'phone',
    createdAt: '2024-02-03T09:15:00Z'
  },
  {
    id: 'book-004',
    bookingId: '000004',
    packageId: 'pkg-001',
    agencyId: 'agency-001',
    guestName: 'Rafiq Islam',
    guestPhone: '01755555555',
    passengers: [
      { name: 'Rafiq Islam', age: 30, seatNumber: 'C1', type: 'adult' }
    ],
    boardingPoint: 'Mohakhali',
    droppingPoint: 'Hotel Sea Crown',
    subtotal: 5500,
    discountAmount: 0,
    totalAmount: 5500,
    advancePaid: 2000,
    dueAmount: 3500,
    paymentMethod: 'bkash',
    paymentStatus: 'advance_paid',
    status: 'confirmed',
    source: 'web',
    createdAt: '2024-02-04T16:45:00Z'
  },
  {
    id: 'book-005',
    bookingId: '000005',
    packageId: 'pkg-001',
    agencyId: 'agency-001',
    agentId: 'agent-001',
    guestName: 'Nasreen Akter',
    guestPhone: '01766666666',
    passengers: [
      { name: 'Nasreen Akter', age: 38, seatNumber: 'D1', type: 'adult' },
      { name: 'Shafiq Ahmed', age: 40, seatNumber: 'D2', type: 'adult' },
      { name: 'Nadia Ahmed', age: 12, seatNumber: 'D3', type: 'child' },
      { name: 'Tanvir Ahmed', age: 10, seatNumber: 'D4', type: 'child' }
    ],
    boardingPoint: 'Sayedabad',
    droppingPoint: 'Laboni Point',
    subtotal: 18000,
    discountAmount: 0,
    totalAmount: 18000,
    advancePaid: 8000,
    dueAmount: 10000,
    paymentMethod: 'bank',
    paymentStatus: 'advance_paid',
    status: 'confirmed',
    source: 'messenger',
    notes: 'Large family - needs 4 connected seats',
    createdAt: '2024-02-05T11:20:00Z'
  }
];

// ============================================
// DEMO STATISTICS
// ============================================

export const DEMO_STATS: Record<string, DashboardStats> = {
  // System Admin Stats (Platform-wide)
  'system_admin': {
    totalBookings: 156,
    todayBookings: 12,
    totalRevenue: 1250000,
    pendingAmount: 320000,
    activePackages: 24,
    totalAgencies: 3,
    totalAgents: 15
  },

  // Agency Admin Stats (Single Agency)
  'agency_admin': {
    totalBookings: 82,
    todayBookings: 5,
    totalRevenue: 650000,
    pendingAmount: 180000,
    activePackages: 8,
    totalAgents: 5
  },

  // Sales Agent Stats (Personal)
  'sales_agent': {
    totalBookings: 28,
    todayBookings: 3,
    totalRevenue: 215000,
    pendingAmount: 45000,
    activePackages: 4
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getAgencyById = (id: string): Agency | undefined => {
  return DEMO_AGENCIES.find(a => a.id === id);
};

export const getPackagesByAgency = (agencyId: string): TourPackage[] => {
  return DEMO_PACKAGES.filter(p => p.agencyId === agencyId);
};

export const getBookingsByAgency = (agencyId: string): Booking[] => {
  return DEMO_BOOKINGS.filter(b => b.agencyId === agencyId);
};

export const getBookingsByAgent = (agentId: string): Booking[] => {
  return DEMO_BOOKINGS.filter(b => b.agentId === agentId);
};

export const getPackageById = (id: string): TourPackage | undefined => {
  return DEMO_PACKAGES.find(p => p.id === id);
};

export const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString('en-BD')}`;
};

export const formatCurrencyEn = (amount: number): string => {
  return `BDT ${amount.toLocaleString('en-IN')}`;
};
