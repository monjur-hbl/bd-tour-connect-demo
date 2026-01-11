-- BD Tour Connect Seed Data

-- Insert Agencies
INSERT INTO agencies (id, name, name_bn, slug, phone, email, address, address_bn, primary_color, tagline, tagline_bn, subscription_plan, max_agents, max_packages_per_month)
VALUES
  ('agency-001', 'Travel Bangla Tours', 'ট্রাভেল বাংলা ট্যুরস', 'travel-bangla', '01700000002', 'info@travelbangla.com', '123 Gulshan Avenue, Dhaka 1212', '১২৩ গুলশান এভিনিউ, ঢাকা ১২১২', '#F97316', 'Explore Bangladesh with Us', 'আমাদের সাথে বাংলাদেশ দেখুন', 'pro', 10, 50),
  ('agency-002', 'Dhaka Explorer', 'ঢাকা এক্সপ্লোরার', 'dhaka-explorer', '01800000001', 'info@dhakaexplorer.com', '45 Banani, Dhaka 1213', '৪৫ বনানী, ঢাকা ১২১৩', '#3B82F6', 'Your Journey Starts Here', 'আপনার যাত্রা এখানেই শুরু', 'basic', 3, 10),
  ('agency-003', 'Cox Bazar Express', 'কক্সবাজার এক্সপ্রেস', 'coxbazar-express', '01900000001', 'info@coxbazarexpress.com', '78 Motijheel, Dhaka 1000', '৭৮ মতিঝিল, ঢাকা ১০০০', '#14B8A6', 'Sea, Sand and Sun', 'সমুদ্র, বালি আর সূর্য', 'enterprise', 25, 100);

-- Insert Users (password is hashed - these are demo passwords)
-- Passwords: admin123, agency123, agent123 (using simple hash for demo)
INSERT INTO users (id, phone, password_hash, name, name_bn, email, role, agency_id, agent_code, permissions)
VALUES
  ('admin-001', '01700000001', 'admin123', 'Mallik Nurmohammed', 'মল্লিক নূরমোহাম্মদ', 'mallik@bdtourconnect.com', 'system_admin', NULL, NULL, NULL),
  ('agency-admin-001', '01700000002', 'agency123', 'Karim Ahmed', 'করিম আহমেদ', 'karim@travelbangla.com', 'agency_admin', 'agency-001', NULL, NULL),
  ('agent-001', '01700000003', 'agent123', 'Rahim Uddin', 'রহিম উদ্দিন', 'rahim@travelbangla.com', 'sales_agent', 'agency-001', 'SA001', '["create_booking","edit_booking","view_all_bookings"]'),
  ('agent-002', '01700000004', 'agent123', 'Selim Khan', 'সেলিম খান', 'selim@travelbangla.com', 'sales_agent', 'agency-001', 'SA002', '["create_booking","edit_booking"]'),
  ('agent-003', '01700000005', 'agent123', 'Fatima Begum', 'ফাতিমা বেগম', 'fatima@travelbangla.com', 'sales_agent', 'agency-001', 'SA003', '["create_booking","view_all_bookings"]');

-- Insert Tour Packages
INSERT INTO packages (id, agency_id, title, title_bn, destination, destination_bn, description, description_bn, departure_date, return_date, departure_time, vehicle_type, total_seats, available_seats, price_per_person, couple_price, child_price, advance_amount, boarding_points, dropping_points, inclusions, exclusions, meal_plan, status)
VALUES
  ('pkg-001', 'agency-001', 'Cox''s Bazar Beach Paradise - 3 Days', 'কক্সবাজার বিচ প্যারাডাইস - ৩ দিন', 'Cox''s Bazar', 'কক্সবাজার', 'Experience the longest sea beach in the world with comfortable AC bus travel, premium hotel stay, and guided tours.', 'বিশ্বের দীর্ঘতম সমুদ্র সৈকত উপভোগ করুন আরামদায়ক এসি বাস ভ্রমণ, প্রিমিয়াম হোটেল স্টে এবং গাইডেড ট্যুরের সাথে।', '2024-02-15', '2024-02-17', '22:00', 'AC Bus (Hino AK)', 40, 25, 5500, 10000, 3500, 2000, '[{"id":"bp-1","name":"Gabtoli","nameBn":"গাবতলী","time":"21:30","address":"Gabtoli Bus Terminal"},{"id":"bp-2","name":"Sayedabad","nameBn":"সায়েদাবাদ","time":"22:00","address":"Sayedabad Bus Terminal"},{"id":"bp-3","name":"Mohakhali","nameBn":"মহাখালী","time":"22:30","address":"Mohakhali Bus Terminal"}]', '[{"id":"dp-1","name":"Hotel Sea Crown","nameBn":"হোটেল সি ক্রাউন","time":"08:00","address":"Kolatoli Road"},{"id":"dp-2","name":"Laboni Point","nameBn":"লাবনী পয়েন্ট","time":"08:15","address":"Beach Road"}]', '["AC Bus Transport","Hotel (2 Nights)","Breakfast","Tour Guide","Beach Activities"]', '["Lunch & Dinner","Personal Expenses","Tips"]', '[{"day":1,"breakfast":"On arrival - Hotel Buffet"},{"day":2,"breakfast":"Hotel Buffet"},{"day":3,"breakfast":"Hotel Buffet"}]', 'current'),

  ('pkg-002', 'agency-001', 'Sundarbans Adventure - 2 Days', 'সুন্দরবন এডভেঞ্চার - ২ দিন', 'Sundarbans', 'সুন্দরবন', 'Explore the largest mangrove forest and home of the Royal Bengal Tiger with boat cruise and jungle safari.', 'বিশ্বের বৃহত্তম ম্যানগ্রোভ বন এবং রয়েল বেঙ্গল টাইগারের আবাসস্থল ঘুরে দেখুন বোট ক্রুজ এবং জঙ্গল সাফারির সাথে।', '2024-02-20', '2024-02-21', '06:00', 'AC Microbus', 12, 8, 8500, 16000, 5500, 3000, '[{"id":"bp-1","name":"Gabtoli","nameBn":"গাবতলী","time":"05:30","address":"Gabtoli Bus Terminal"},{"id":"bp-2","name":"Mohammadpur","nameBn":"মোহাম্মদপুর","time":"06:00","address":"Town Hall"}]', '[{"id":"dp-1","name":"Khulna Launch Ghat","nameBn":"খুলনা লঞ্চ ঘাট","time":"10:00","address":"Khulna River Port"}]', '["AC Microbus","Boat Cruise","All Meals","Forest Entry","Guide","Life Jacket"]', '["Personal Expenses","Camera Fee","Tips"]', '[{"day":1,"breakfast":"On boat","lunch":"On boat - Fish fry","snack":"Tea & Snacks","dinner":"Boat BBQ"},{"day":2,"breakfast":"On boat","lunch":"On boat"}]', 'current'),

  ('pkg-003', 'agency-001', 'Sylhet Tea Garden Tour - 3 Days', 'সিলেট চা বাগান ট্যুর - ৩ দিন', 'Sylhet', 'সিলেট', 'Visit beautiful tea gardens, waterfalls, and experience the natural beauty of Sylhet division.', 'সুন্দর চা বাগান, ঝর্ণা দেখুন এবং সিলেট বিভাগের প্রাকৃতিক সৌন্দর্য উপভোগ করুন।', '2024-03-01', '2024-03-03', '21:00', 'AC Bus (Scania)', 36, 36, 7500, 14000, 4500, 2500, '[{"id":"bp-1","name":"Kamalapur","nameBn":"কমলাপুর","time":"20:30","address":"Kamalapur Railway Station"},{"id":"bp-2","name":"Uttara","nameBn":"উত্তরা","time":"21:30","address":"Jasimuddin Road"}]', '[{"id":"dp-1","name":"Sylhet Zindabazar","nameBn":"সিলেট জিন্দাবাজার","time":"06:00","address":"City Center"}]', '["AC Bus","Hotel (2 Nights)","Breakfast","Sightseeing","Guide"]', '["Lunch & Dinner","Boating","Personal Expenses"]', '[{"day":1},{"day":2,"breakfast":"Hotel Buffet"},{"day":3,"breakfast":"Hotel Buffet"}]', 'future'),

  ('pkg-004', 'agency-001', 'Rangamati Lake View - 2 Days', 'রাঙামাটি লেক ভিউ - ২ দিন', 'Rangamati', 'রাঙামাটি', 'Experience the mesmerizing Kaptai Lake and tribal culture of the hill tracts.', 'মনোমুগ্ধকর কাপ্তাই লেক এবং পাহাড়ি জনপদের উপজাতীয় সংস্কৃতি উপভোগ করুন।', '2024-03-10', '2024-03-11', '22:00', 'Non-AC Bus', 45, 40, 4500, 8500, 2800, 1500, '[{"id":"bp-1","name":"Fakirapul","nameBn":"ফকিরাপুল","time":"21:30","address":"Fakirapul Bus Stand"}]', '[{"id":"dp-1","name":"Rangamati Town","nameBn":"রাঙামাটি শহর","time":"08:00","address":"Rangamati Bus Terminal"}]', '["Bus Transport","Hotel (1 Night)","Breakfast","Boat Ride"]', '["Lunch & Dinner","Entry Fees","Personal Expenses"]', '[{"day":1},{"day":2,"breakfast":"Hotel"}]', 'future');

-- Insert Bookings
INSERT INTO bookings (id, booking_id, package_id, agency_id, agent_id, guest_name, guest_phone, guest_email, guest_nid, emergency_contact, passengers, boarding_point, dropping_point, total_amount, advance_paid, due_amount, payment_method, payment_status, status, source, notes)
VALUES
  ('book-001', '000001', 'pkg-001', 'agency-001', 'agent-001', 'Mohammad Ali', '01711111111', 'ali@email.com', '1234567890123', '01722222222', '[{"name":"Mohammad Ali","age":35,"seatNumber":"A1","type":"adult"},{"name":"Fatima Ali","age":32,"seatNumber":"A2","type":"adult"},{"name":"Rahim Ali","age":8,"seatNumber":"A3","type":"child"}]', 'Sayedabad', 'Hotel Sea Crown', 14500, 6000, 8500, 'bkash', 'advance_paid', 'confirmed', 'walk-in', 'Family trip - needs connected seats'),

  ('book-002', '000002', 'pkg-001', 'agency-001', 'agent-001', 'Kamal Hossain', '01733333333', 'kamal@email.com', '9876543210123', NULL, '[{"name":"Kamal Hossain","age":28,"seatNumber":"B1","type":"adult"},{"name":"Jasmine Hossain","age":25,"seatNumber":"B2","type":"adult"}]', 'Gabtoli', 'Laboni Point', 10000, 10000, 0, 'nagad', 'fully_paid', 'confirmed', 'whatsapp', NULL),

  ('book-003', '000003', 'pkg-002', 'agency-001', 'agent-001', 'Salma Begum', '01744444444', NULL, NULL, NULL, '[{"name":"Salma Begum","age":45,"seatNumber":"S1","type":"adult"}]', 'Gabtoli', 'Khulna Launch Ghat', 8500, 3000, 5500, 'cash', 'advance_paid', 'pending', 'phone', NULL),

  ('book-004', '000004', 'pkg-001', 'agency-001', NULL, 'Rafiq Islam', '01755555555', NULL, NULL, NULL, '[{"name":"Rafiq Islam","age":30,"seatNumber":"C1","type":"adult"}]', 'Mohakhali', 'Hotel Sea Crown', 5500, 2000, 3500, 'bkash', 'advance_paid', 'confirmed', 'web', NULL),

  ('book-005', '000005', 'pkg-001', 'agency-001', 'agent-001', 'Nasreen Akter', '01766666666', NULL, NULL, NULL, '[{"name":"Nasreen Akter","age":38,"seatNumber":"D1","type":"adult"},{"name":"Shafiq Ahmed","age":40,"seatNumber":"D2","type":"adult"},{"name":"Nadia Ahmed","age":12,"seatNumber":"D3","type":"child"},{"name":"Tanvir Ahmed","age":10,"seatNumber":"D4","type":"child"}]', 'Sayedabad', 'Laboni Point', 18000, 8000, 10000, 'bank', 'advance_paid', 'confirmed', 'messenger', 'Large family - needs 4 connected seats');

-- Initialize booking counters
INSERT INTO counters (id, agency_id, counter_type, current_value)
VALUES
  ('counter-001', 'agency-001', 'booking', 5),
  ('counter-002', 'agency-002', 'booking', 0),
  ('counter-003', 'agency-003', 'booking', 0);
