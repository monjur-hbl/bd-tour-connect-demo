-- BD Tour Connect Database Schema

-- Users table (all user types)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  name_bn TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('system_admin', 'agency_admin', 'sales_agent')),
  agency_id TEXT,
  agent_code TEXT,
  permissions TEXT, -- JSON array
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  address_bn TEXT,
  logo TEXT,
  primary_color TEXT DEFAULT '#F97316',
  tagline TEXT,
  tagline_bn TEXT,
  -- Login page customization
  login_bg_image TEXT,
  login_logo TEXT,
  login_welcome_text TEXT,
  login_welcome_text_bn TEXT,
  -- Subscription
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'pro', 'enterprise')),
  max_agents INTEGER DEFAULT 3,
  max_packages_per_month INTEGER DEFAULT 10,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Tour Packages table
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  title TEXT NOT NULL,
  title_bn TEXT,
  destination TEXT NOT NULL,
  destination_bn TEXT,
  description TEXT,
  description_bn TEXT,
  departure_date TEXT NOT NULL,
  return_date TEXT NOT NULL,
  departure_time TEXT,
  vehicle_type TEXT,
  total_seats INTEGER NOT NULL,
  available_seats INTEGER NOT NULL,
  price_per_person REAL NOT NULL,
  couple_price REAL,
  child_price REAL,
  advance_amount REAL DEFAULT 0,
  boarding_points TEXT, -- JSON array
  dropping_points TEXT, -- JSON array
  inclusions TEXT, -- JSON array
  exclusions TEXT, -- JSON array
  meal_plan TEXT, -- JSON array
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'current', 'future', 'past', 'cancelled')),
  cover_image TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  booking_id TEXT UNIQUE NOT NULL, -- 6-digit unique ID
  package_id TEXT NOT NULL,
  agency_id TEXT NOT NULL,
  agent_id TEXT,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  guest_nid TEXT,
  emergency_contact TEXT,
  passengers TEXT NOT NULL, -- JSON array
  boarding_point TEXT,
  dropping_point TEXT,
  total_amount REAL NOT NULL,
  advance_paid REAL DEFAULT 0,
  due_amount REAL NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bkash', 'nagad', 'bank', 'card')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'advance_paid', 'fully_paid')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'whatsapp', 'messenger', 'phone', 'walk-in')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (package_id) REFERENCES packages(id),
  FOREIGN KEY (agency_id) REFERENCES agencies(id),
  FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Sessions table for auth
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Booking counter for generating sequential IDs
CREATE TABLE IF NOT EXISTS counters (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  counter_type TEXT NOT NULL,
  current_value INTEGER DEFAULT 0,
  UNIQUE(agency_id, counter_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_agency ON users(agency_id);
CREATE INDEX IF NOT EXISTS idx_packages_agency ON packages(agency_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_bookings_agency ON bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_package ON bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent ON bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_phone ON bookings(guest_phone);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
