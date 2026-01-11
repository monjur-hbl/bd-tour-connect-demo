// BD Tour Connect API - Cloudflare Worker
export interface Env {
  DB: D1Database;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper to create JSON response
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Helper to generate session token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Helper to generate booking ID
function generateBookingId(counter: number): string {
  return String(counter).padStart(6, '0');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Auth Routes
      if (path === '/api/auth/login' && method === 'POST') {
        return handleLogin(request, env);
      }

      if (path === '/api/auth/logout' && method === 'POST') {
        return handleLogout(request, env);
      }

      if (path === '/api/auth/me' && method === 'GET') {
        return handleGetMe(request, env);
      }

      // Agency Routes
      if (path === '/api/agencies' && method === 'GET') {
        return handleGetAgencies(request, env);
      }

      if (path.match(/^\/api\/agencies\/[\w-]+$/) && method === 'GET') {
        const agencyId = path.split('/').pop()!;
        return handleGetAgency(agencyId, env);
      }

      // Package Routes
      if (path === '/api/packages' && method === 'GET') {
        return handleGetPackages(request, env);
      }

      if (path.match(/^\/api\/packages\/[\w-]+$/) && method === 'GET') {
        const packageId = path.split('/').pop()!;
        return handleGetPackage(packageId, env);
      }

      if (path === '/api/packages' && method === 'POST') {
        return handleCreatePackage(request, env);
      }

      if (path.match(/^\/api\/packages\/[\w-]+$/) && method === 'PUT') {
        const packageId = path.split('/').pop()!;
        return handleUpdatePackage(packageId, request, env);
      }

      // Booking Routes
      if (path === '/api/bookings' && method === 'GET') {
        return handleGetBookings(request, env);
      }

      if (path.match(/^\/api\/bookings\/[\w-]+$/) && method === 'GET') {
        const bookingId = path.split('/').pop()!;
        return handleGetBooking(bookingId, env);
      }

      if (path === '/api/bookings' && method === 'POST') {
        return handleCreateBooking(request, env);
      }

      if (path.match(/^\/api\/bookings\/[\w-]+$/) && method === 'PUT') {
        const bookingId = path.split('/').pop()!;
        return handleUpdateBooking(bookingId, request, env);
      }

      if (path === '/api/bookings/search' && method === 'GET') {
        return handleSearchBookings(request, env);
      }

      // User/Agent Routes
      if (path === '/api/users' && method === 'GET') {
        return handleGetUsers(request, env);
      }

      if (path === '/api/users' && method === 'POST') {
        return handleCreateUser(request, env);
      }

      // Stats Routes
      if (path === '/api/stats' && method === 'GET') {
        return handleGetStats(request, env);
      }

      // 404 for unknown routes
      return jsonResponse({ error: 'Not Found' }, 404);

    } catch (error: any) {
      console.error('API Error:', error);
      return jsonResponse({ error: error.message || 'Internal Server Error' }, 500);
    }
  },
};

// ============================================
// AUTH HANDLERS
// ============================================

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { phone: string; password: string };
  const { phone, password } = body;

  if (!phone || !password) {
    return jsonResponse({ error: 'Phone and password are required' }, 400);
  }

  // Find user by phone
  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE phone = ? AND is_active = 1'
  ).bind(phone).first();

  if (!user) {
    return jsonResponse({ error: 'Invalid credentials' }, 401);
  }

  // Simple password check (in production, use proper hashing)
  if (user.password_hash !== password) {
    return jsonResponse({ error: 'Invalid credentials' }, 401);
  }

  // Generate session token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // Create session
  await env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(`session-${Date.now()}`, user.id, token, expiresAt).run();

  // Get agency info if applicable
  let agency = null;
  if (user.agency_id) {
    agency = await env.DB.prepare(
      'SELECT * FROM agencies WHERE id = ?'
    ).bind(user.agency_id).first();
  }

  return jsonResponse({
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      nameBn: user.name_bn,
      email: user.email,
      role: user.role,
      agencyId: user.agency_id,
      agentCode: user.agent_code,
      permissions: user.permissions ? JSON.parse(user.permissions as string) : null,
      isActive: Boolean(user.is_active),
    },
    agency: agency ? {
      id: agency.id,
      name: agency.name,
      nameBn: agency.name_bn,
      slug: agency.slug,
    } : null,
    token,
    expiresAt,
  });
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }

  return jsonResponse({ success: true });
}

async function handleGetMe(request: Request, env: Env): Promise<Response> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();

  if (!session) {
    return jsonResponse({ error: 'Session expired' }, 401);
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first();

  if (!user) {
    return jsonResponse({ error: 'User not found' }, 404);
  }

  let agency = null;
  if (user.agency_id) {
    agency = await env.DB.prepare('SELECT * FROM agencies WHERE id = ?').bind(user.agency_id).first();
  }

  return jsonResponse({
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      nameBn: user.name_bn,
      email: user.email,
      role: user.role,
      agencyId: user.agency_id,
      agentCode: user.agent_code,
      permissions: user.permissions ? JSON.parse(user.permissions as string) : null,
      isActive: Boolean(user.is_active),
    },
    agency: agency ? {
      id: agency.id,
      name: agency.name,
      nameBn: agency.name_bn,
      slug: agency.slug,
    } : null,
  });
}

// ============================================
// AGENCY HANDLERS
// ============================================

async function handleGetAgencies(request: Request, env: Env): Promise<Response> {
  const results = await env.DB.prepare('SELECT * FROM agencies WHERE is_active = 1').all();

  const agencies = results.results.map((a: any) => ({
    id: a.id,
    name: a.name,
    nameBn: a.name_bn,
    slug: a.slug,
    phone: a.phone,
    email: a.email,
    address: a.address,
    addressBn: a.address_bn,
    primaryColor: a.primary_color,
    tagline: a.tagline,
    taglineBn: a.tagline_bn,
    subscription: {
      plan: a.subscription_plan,
      maxAgents: a.max_agents,
      maxPackagesPerMonth: a.max_packages_per_month,
    },
    isActive: Boolean(a.is_active),
    createdAt: a.created_at,
  }));

  return jsonResponse({ agencies });
}

async function handleGetAgency(agencyId: string, env: Env): Promise<Response> {
  const agency = await env.DB.prepare('SELECT * FROM agencies WHERE id = ?').bind(agencyId).first();

  if (!agency) {
    return jsonResponse({ error: 'Agency not found' }, 404);
  }

  return jsonResponse({
    agency: {
      id: agency.id,
      name: agency.name,
      nameBn: agency.name_bn,
      slug: agency.slug,
      phone: agency.phone,
      email: agency.email,
      address: agency.address,
      addressBn: agency.address_bn,
      primaryColor: agency.primary_color,
      tagline: agency.tagline,
      taglineBn: agency.tagline_bn,
      subscription: {
        plan: agency.subscription_plan,
        maxAgents: agency.max_agents,
        maxPackagesPerMonth: agency.max_packages_per_month,
      },
      isActive: Boolean(agency.is_active),
      createdAt: agency.created_at,
    },
  });
}

// ============================================
// PACKAGE HANDLERS
// ============================================

async function handleGetPackages(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const agencyId = url.searchParams.get('agencyId');
  const status = url.searchParams.get('status');

  let query = 'SELECT * FROM packages WHERE 1=1';
  const params: any[] = [];

  if (agencyId) {
    query += ' AND agency_id = ?';
    params.push(agencyId);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY departure_date DESC';

  const stmt = env.DB.prepare(query);
  const results = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  const packages = results.results.map((p: any) => ({
    id: p.id,
    agencyId: p.agency_id,
    title: p.title,
    titleBn: p.title_bn,
    destination: p.destination,
    destinationBn: p.destination_bn,
    description: p.description,
    descriptionBn: p.description_bn,
    departureDate: p.departure_date,
    returnDate: p.return_date,
    departureTime: p.departure_time,
    vehicleType: p.vehicle_type,
    totalSeats: p.total_seats,
    availableSeats: p.available_seats,
    pricePerPerson: p.price_per_person,
    couplePrice: p.couple_price,
    childPrice: p.child_price,
    advanceAmount: p.advance_amount,
    boardingPoints: p.boarding_points ? JSON.parse(p.boarding_points) : [],
    droppingPoints: p.dropping_points ? JSON.parse(p.dropping_points) : [],
    inclusions: p.inclusions ? JSON.parse(p.inclusions) : [],
    exclusions: p.exclusions ? JSON.parse(p.exclusions) : [],
    mealPlan: p.meal_plan ? JSON.parse(p.meal_plan) : [],
    busConfiguration: p.bus_configuration ? JSON.parse(p.bus_configuration) : null,
    seatLayout: p.seat_layout ? JSON.parse(p.seat_layout) : null,
    status: p.status,
    createdAt: p.created_at,
  }));

  return jsonResponse({ packages });
}

async function handleGetPackage(packageId: string, env: Env): Promise<Response> {
  const pkg = await env.DB.prepare('SELECT * FROM packages WHERE id = ?').bind(packageId).first();

  if (!pkg) {
    return jsonResponse({ error: 'Package not found' }, 404);
  }

  return jsonResponse({
    package: {
      id: pkg.id,
      agencyId: pkg.agency_id,
      title: pkg.title,
      titleBn: pkg.title_bn,
      destination: pkg.destination,
      destinationBn: pkg.destination_bn,
      description: pkg.description,
      descriptionBn: pkg.description_bn,
      departureDate: pkg.departure_date,
      returnDate: pkg.return_date,
      departureTime: pkg.departure_time,
      vehicleType: pkg.vehicle_type,
      totalSeats: pkg.total_seats,
      availableSeats: pkg.available_seats,
      pricePerPerson: pkg.price_per_person,
      couplePrice: pkg.couple_price,
      childPrice: pkg.child_price,
      advanceAmount: pkg.advance_amount,
      boardingPoints: pkg.boarding_points ? JSON.parse(pkg.boarding_points as string) : [],
      droppingPoints: pkg.dropping_points ? JSON.parse(pkg.dropping_points as string) : [],
      inclusions: pkg.inclusions ? JSON.parse(pkg.inclusions as string) : [],
      exclusions: pkg.exclusions ? JSON.parse(pkg.exclusions as string) : [],
      mealPlan: pkg.meal_plan ? JSON.parse(pkg.meal_plan as string) : [],
      busConfiguration: pkg.bus_configuration ? JSON.parse(pkg.bus_configuration as string) : null,
      seatLayout: pkg.seat_layout ? JSON.parse(pkg.seat_layout as string) : null,
      status: pkg.status,
      createdAt: pkg.created_at,
    },
  });
}

async function handleCreatePackage(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as any;
  const id = `pkg-${Date.now()}`;

  await env.DB.prepare(`
    INSERT INTO packages (id, agency_id, title, title_bn, destination, destination_bn, description, description_bn, departure_date, return_date, departure_time, vehicle_type, total_seats, available_seats, price_per_person, couple_price, child_price, advance_amount, boarding_points, dropping_points, inclusions, exclusions, meal_plan, bus_configuration, seat_layout, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.agencyId,
    body.title,
    body.titleBn || null,
    body.destination,
    body.destinationBn || null,
    body.description || null,
    body.descriptionBn || null,
    body.departureDate,
    body.returnDate,
    body.departureTime || null,
    body.vehicleType || null,
    body.totalSeats,
    body.totalSeats, // available = total initially
    body.pricePerPerson,
    body.couplePrice || null,
    body.childPrice || null,
    body.advanceAmount || 0,
    JSON.stringify(body.boardingPoints || []),
    JSON.stringify(body.droppingPoints || []),
    JSON.stringify(body.inclusions || []),
    JSON.stringify(body.exclusions || []),
    JSON.stringify(body.mealPlan || []),
    body.busConfiguration ? JSON.stringify(body.busConfiguration) : null,
    body.seatLayout ? JSON.stringify(body.seatLayout) : null,
    body.status || 'draft'
  ).run();

  return jsonResponse({ id, message: 'Package created' }, 201);
}

async function handleUpdatePackage(packageId: string, request: Request, env: Env): Promise<Response> {
  const body = await request.json() as any;

  // Build dynamic update query for all fields
  const updates: string[] = [];
  const params: any[] = [];

  if (body.title !== undefined) { updates.push('title = ?'); params.push(body.title); }
  if (body.titleBn !== undefined) { updates.push('title_bn = ?'); params.push(body.titleBn); }
  if (body.destination !== undefined) { updates.push('destination = ?'); params.push(body.destination); }
  if (body.destinationBn !== undefined) { updates.push('destination_bn = ?'); params.push(body.destinationBn); }
  if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description); }
  if (body.descriptionBn !== undefined) { updates.push('description_bn = ?'); params.push(body.descriptionBn); }
  if (body.departureDate !== undefined) { updates.push('departure_date = ?'); params.push(body.departureDate); }
  if (body.returnDate !== undefined) { updates.push('return_date = ?'); params.push(body.returnDate); }
  if (body.departureTime !== undefined) { updates.push('departure_time = ?'); params.push(body.departureTime); }
  if (body.vehicleType !== undefined) { updates.push('vehicle_type = ?'); params.push(body.vehicleType); }
  if (body.totalSeats !== undefined) { updates.push('total_seats = ?'); params.push(body.totalSeats); }
  if (body.availableSeats !== undefined) { updates.push('available_seats = ?'); params.push(body.availableSeats); }
  if (body.pricePerPerson !== undefined) { updates.push('price_per_person = ?'); params.push(body.pricePerPerson); }
  if (body.couplePrice !== undefined) { updates.push('couple_price = ?'); params.push(body.couplePrice); }
  if (body.childPrice !== undefined) { updates.push('child_price = ?'); params.push(body.childPrice); }
  if (body.advanceAmount !== undefined) { updates.push('advance_amount = ?'); params.push(body.advanceAmount); }
  if (body.boardingPoints !== undefined) { updates.push('boarding_points = ?'); params.push(JSON.stringify(body.boardingPoints)); }
  if (body.droppingPoints !== undefined) { updates.push('dropping_points = ?'); params.push(JSON.stringify(body.droppingPoints)); }
  if (body.inclusions !== undefined) { updates.push('inclusions = ?'); params.push(JSON.stringify(body.inclusions)); }
  if (body.exclusions !== undefined) { updates.push('exclusions = ?'); params.push(JSON.stringify(body.exclusions)); }
  if (body.mealPlan !== undefined) { updates.push('meal_plan = ?'); params.push(JSON.stringify(body.mealPlan)); }
  if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }

  // Handle busConfiguration - can be set to null explicitly
  if (body.busConfiguration !== undefined) {
    updates.push('bus_configuration = ?');
    params.push(body.busConfiguration ? JSON.stringify(body.busConfiguration) : null);
  }

  // Handle seatLayout - can be set to null explicitly
  if (body.seatLayout !== undefined) {
    updates.push('seat_layout = ?');
    params.push(body.seatLayout ? JSON.stringify(body.seatLayout) : null);
  }

  if (updates.length === 0) {
    return jsonResponse({ error: 'No fields to update' }, 400);
  }

  updates.push('updated_at = datetime("now")');
  params.push(packageId);

  await env.DB.prepare(`UPDATE packages SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

  return jsonResponse({ message: 'Package updated' });
}

// ============================================
// BOOKING HANDLERS
// ============================================

async function handleGetBookings(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const agencyId = url.searchParams.get('agencyId');
  const agentId = url.searchParams.get('agentId');
  const packageId = url.searchParams.get('packageId');
  const status = url.searchParams.get('status');

  let query = 'SELECT * FROM bookings WHERE 1=1';
  const params: any[] = [];

  if (agencyId) {
    query += ' AND agency_id = ?';
    params.push(agencyId);
  }

  if (agentId) {
    query += ' AND agent_id = ?';
    params.push(agentId);
  }

  if (packageId) {
    query += ' AND package_id = ?';
    params.push(packageId);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const stmt = env.DB.prepare(query);
  const results = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  const bookings = results.results.map((b: any) => ({
    id: b.id,
    bookingId: b.booking_id,
    packageId: b.package_id,
    agencyId: b.agency_id,
    agentId: b.agent_id,
    guestName: b.guest_name,
    guestPhone: b.guest_phone,
    guestEmail: b.guest_email,
    guestNid: b.guest_nid,
    emergencyContact: b.emergency_contact,
    passengers: JSON.parse(b.passengers),
    boardingPoint: b.boarding_point,
    droppingPoint: b.dropping_point,
    totalAmount: b.total_amount,
    advancePaid: b.advance_paid,
    dueAmount: b.due_amount,
    paymentMethod: b.payment_method,
    paymentStatus: b.payment_status,
    status: b.status,
    source: b.source,
    notes: b.notes,
    createdAt: b.created_at,
  }));

  return jsonResponse({ bookings });
}

async function handleGetBooking(bookingId: string, env: Env): Promise<Response> {
  // Try to find by ID or booking_id
  let booking = await env.DB.prepare('SELECT * FROM bookings WHERE id = ? OR booking_id = ?').bind(bookingId, bookingId).first();

  if (!booking) {
    return jsonResponse({ error: 'Booking not found' }, 404);
  }

  return jsonResponse({
    booking: {
      id: booking.id,
      bookingId: booking.booking_id,
      packageId: booking.package_id,
      agencyId: booking.agency_id,
      agentId: booking.agent_id,
      guestName: booking.guest_name,
      guestPhone: booking.guest_phone,
      guestEmail: booking.guest_email,
      guestNid: booking.guest_nid,
      emergencyContact: booking.emergency_contact,
      passengers: JSON.parse(booking.passengers as string),
      boardingPoint: booking.boarding_point,
      droppingPoint: booking.dropping_point,
      totalAmount: booking.total_amount,
      advancePaid: booking.advance_paid,
      dueAmount: booking.due_amount,
      paymentMethod: booking.payment_method,
      paymentStatus: booking.payment_status,
      status: booking.status,
      source: booking.source,
      notes: booking.notes,
      createdAt: booking.created_at,
    },
  });
}

async function handleCreateBooking(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as any;
  const id = `book-${Date.now()}`;

  // Get and increment counter
  const counter = await env.DB.prepare(
    'SELECT current_value FROM counters WHERE agency_id = ? AND counter_type = ?'
  ).bind(body.agencyId, 'booking').first();

  const newCounter = (counter?.current_value as number || 0) + 1;
  const bookingId = generateBookingId(newCounter);

  // Update counter
  await env.DB.prepare(
    'UPDATE counters SET current_value = ? WHERE agency_id = ? AND counter_type = ?'
  ).bind(newCounter, body.agencyId, 'booking').run();

  // Calculate due amount
  const dueAmount = body.totalAmount - (body.advancePaid || 0);
  const paymentStatus = body.advancePaid >= body.totalAmount ? 'fully_paid' :
                        body.advancePaid > 0 ? 'advance_paid' : 'unpaid';

  await env.DB.prepare(`
    INSERT INTO bookings (id, booking_id, package_id, agency_id, agent_id, guest_name, guest_phone, guest_email, guest_nid, emergency_contact, passengers, boarding_point, dropping_point, total_amount, advance_paid, due_amount, payment_method, payment_status, status, source, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    bookingId,
    body.packageId,
    body.agencyId,
    body.agentId || null,
    body.guestName,
    body.guestPhone,
    body.guestEmail || null,
    body.guestNid || null,
    body.emergencyContact || null,
    JSON.stringify(body.passengers),
    body.boardingPoint || null,
    body.droppingPoint || null,
    body.totalAmount,
    body.advancePaid || 0,
    dueAmount,
    body.paymentMethod || null,
    paymentStatus,
    body.status || 'pending',
    body.source || 'web',
    body.notes || null
  ).run();

  // Update package available seats
  const passengerCount = body.passengers.length;
  await env.DB.prepare(
    'UPDATE packages SET available_seats = available_seats - ? WHERE id = ?'
  ).bind(passengerCount, body.packageId).run();

  return jsonResponse({ id, bookingId, message: 'Booking created' }, 201);
}

async function handleUpdateBooking(bookingId: string, request: Request, env: Env): Promise<Response> {
  const body = await request.json() as any;

  // Recalculate payment status if payment info changed
  let paymentStatus = body.paymentStatus;
  if (body.advancePaid !== undefined && body.totalAmount !== undefined) {
    paymentStatus = body.advancePaid >= body.totalAmount ? 'fully_paid' :
                    body.advancePaid > 0 ? 'advance_paid' : 'unpaid';
  }

  await env.DB.prepare(`
    UPDATE bookings SET
      guest_name = COALESCE(?, guest_name),
      guest_phone = COALESCE(?, guest_phone),
      guest_email = COALESCE(?, guest_email),
      guest_nid = COALESCE(?, guest_nid),
      emergency_contact = COALESCE(?, emergency_contact),
      boarding_point = COALESCE(?, boarding_point),
      dropping_point = COALESCE(?, dropping_point),
      advance_paid = COALESCE(?, advance_paid),
      due_amount = COALESCE(?, due_amount),
      payment_method = COALESCE(?, payment_method),
      payment_status = COALESCE(?, payment_status),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ? OR booking_id = ?
  `).bind(
    body.guestName || null,
    body.guestPhone || null,
    body.guestEmail || null,
    body.guestNid || null,
    body.emergencyContact || null,
    body.boardingPoint || null,
    body.droppingPoint || null,
    body.advancePaid || null,
    body.dueAmount || null,
    body.paymentMethod || null,
    paymentStatus || null,
    body.status || null,
    body.notes || null,
    bookingId,
    bookingId
  ).run();

  return jsonResponse({ message: 'Booking updated' });
}

async function handleSearchBookings(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const agencyId = url.searchParams.get('agencyId');

  if (!query) {
    return jsonResponse({ bookings: [] });
  }

  let sql = `
    SELECT * FROM bookings
    WHERE (booking_id LIKE ? OR guest_phone LIKE ? OR guest_name LIKE ?)
  `;
  const searchPattern = `%${query}%`;
  const params: any[] = [searchPattern, searchPattern, searchPattern];

  if (agencyId) {
    sql += ' AND agency_id = ?';
    params.push(agencyId);
  }

  sql += ' ORDER BY created_at DESC LIMIT 20';

  const results = await env.DB.prepare(sql).bind(...params).all();

  const bookings = results.results.map((b: any) => ({
    id: b.id,
    bookingId: b.booking_id,
    packageId: b.package_id,
    guestName: b.guest_name,
    guestPhone: b.guest_phone,
    totalAmount: b.total_amount,
    dueAmount: b.due_amount,
    paymentStatus: b.payment_status,
    status: b.status,
    createdAt: b.created_at,
  }));

  return jsonResponse({ bookings });
}

// ============================================
// USER HANDLERS
// ============================================

async function handleGetUsers(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const agencyId = url.searchParams.get('agencyId');
  const role = url.searchParams.get('role');

  let query = 'SELECT * FROM users WHERE is_active = 1';
  const params: any[] = [];

  if (agencyId) {
    query += ' AND agency_id = ?';
    params.push(agencyId);
  }

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  query += ' ORDER BY created_at DESC';

  const stmt = env.DB.prepare(query);
  const results = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  const users = results.results.map((u: any) => ({
    id: u.id,
    phone: u.phone,
    name: u.name,
    nameBn: u.name_bn,
    email: u.email,
    role: u.role,
    agencyId: u.agency_id,
    agentCode: u.agent_code,
    permissions: u.permissions ? JSON.parse(u.permissions) : null,
    isActive: Boolean(u.is_active),
    createdAt: u.created_at,
  }));

  return jsonResponse({ users });
}

async function handleCreateUser(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as any;
  const id = `user-${Date.now()}`;

  // Generate agent code if sales agent
  let agentCode = body.agentCode;
  if (body.role === 'sales_agent' && !agentCode && body.agencyId) {
    const count = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE agency_id = ? AND role = ?'
    ).bind(body.agencyId, 'sales_agent').first();
    agentCode = `SA${String((count?.count as number || 0) + 1).padStart(3, '0')}`;
  }

  await env.DB.prepare(`
    INSERT INTO users (id, phone, password_hash, name, name_bn, email, role, agency_id, agent_code, permissions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.phone,
    body.password || 'agent123', // Default password
    body.name,
    body.nameBn || null,
    body.email || null,
    body.role,
    body.agencyId || null,
    agentCode || null,
    body.permissions ? JSON.stringify(body.permissions) : null
  ).run();

  return jsonResponse({ id, agentCode, message: 'User created' }, 201);
}

// ============================================
// STATS HANDLERS
// ============================================

async function handleGetStats(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const agencyId = url.searchParams.get('agencyId');
  const agentId = url.searchParams.get('agentId');
  const role = url.searchParams.get('role');

  let stats: any = {};

  if (role === 'system_admin') {
    // Platform-wide stats
    const agencyCount = await env.DB.prepare('SELECT COUNT(*) as count FROM agencies WHERE is_active = 1').first();
    const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').first();
    const bookingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM bookings').first();
    const revenue = await env.DB.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE status != "cancelled"').first();
    const pending = await env.DB.prepare('SELECT COALESCE(SUM(due_amount), 0) as total FROM bookings WHERE status != "cancelled"').first();
    const packageCount = await env.DB.prepare('SELECT COUNT(*) as count FROM packages WHERE status IN ("current", "future")').first();
    const todayBookings = await env.DB.prepare('SELECT COUNT(*) as count FROM bookings WHERE date(created_at) = date("now")').first();

    stats = {
      totalAgencies: agencyCount?.count || 0,
      totalAgents: userCount?.count || 0,
      totalBookings: bookingCount?.count || 0,
      todayBookings: todayBookings?.count || 0,
      totalRevenue: revenue?.total || 0,
      pendingAmount: pending?.total || 0,
      activePackages: packageCount?.count || 0,
    };
  } else if (agencyId) {
    // Agency stats
    const bookingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM bookings WHERE agency_id = ?').bind(agencyId).first();
    const revenue = await env.DB.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE agency_id = ? AND status != "cancelled"').bind(agencyId).first();
    const pending = await env.DB.prepare('SELECT COALESCE(SUM(due_amount), 0) as total FROM bookings WHERE agency_id = ? AND status != "cancelled"').bind(agencyId).first();
    const packageCount = await env.DB.prepare('SELECT COUNT(*) as count FROM packages WHERE agency_id = ? AND status IN ("current", "future")').bind(agencyId).first();
    const agentCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE agency_id = ? AND role = "sales_agent" AND is_active = 1').bind(agencyId).first();
    const todayBookings = await env.DB.prepare('SELECT COUNT(*) as count FROM bookings WHERE agency_id = ? AND date(created_at) = date("now")').bind(agencyId).first();

    stats = {
      totalBookings: bookingCount?.count || 0,
      todayBookings: todayBookings?.count || 0,
      totalRevenue: revenue?.total || 0,
      pendingAmount: pending?.total || 0,
      activePackages: packageCount?.count || 0,
      totalAgents: agentCount?.count || 0,
    };
  }

  if (agentId) {
    // Agent-specific stats
    const bookingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM bookings WHERE agent_id = ?').bind(agentId).first();
    const revenue = await env.DB.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE agent_id = ? AND status != "cancelled"').bind(agentId).first();
    const pending = await env.DB.prepare('SELECT COALESCE(SUM(due_amount), 0) as total FROM bookings WHERE agent_id = ? AND status != "cancelled"').bind(agentId).first();
    const todayBookings = await env.DB.prepare('SELECT COUNT(*) as count FROM bookings WHERE agent_id = ? AND date(created_at) = date("now")').bind(agentId).first();

    stats = {
      ...stats,
      myBookings: bookingCount?.count || 0,
      myTodayBookings: todayBookings?.count || 0,
      myRevenue: revenue?.total || 0,
      myPending: pending?.total || 0,
    };
  }

  return jsonResponse({ stats });
}
