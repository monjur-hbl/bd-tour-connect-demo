# 🚀 Quick Start Guide for Claude Code

## BD Tour Connect - Development Kickoff

This guide helps you get started building BD Tour Connect using Claude Code.

---

## 📁 Project Files Overview

```
bd-tour-connect/
├── README.md                          # Project overview
├── CLAUDE_CODE_INSTRUCTIONS.md        # Main development guide (START HERE!)
├── package.json                       # NPM dependencies
├── tailwind.config.js                 # Tailwind CSS configuration
│
└── docs/
    ├── DATABASE_SCHEMA.md             # Firestore data structure
    ├── UI_DESIGN_GUIDE.md             # Color palette & components
    ├── FEATURES_LIST.md               # Complete feature checklist
    ├── MESSAGING_INTEGRATION.md       # WhatsApp & Messenger setup
    ├── API_SPECIFICATIONS.md          # API endpoints & requests
    └── SEAT_LAYOUTS.md                # Bus seat configurations
```

---

## 🎯 Development Phases

### Phase 1: Foundation (Week 1-2)
1. **Setup Firebase Project**
   - Create project: `bd-tour-connect`
   - Enable Authentication, Firestore, Functions, Storage
   
2. **Initialize React App**
   - Create React TypeScript project
   - Configure Tailwind CSS with festive theme
   - Set up routing structure

3. **Build Authentication**
   - Login with phone + password
   - Role-based access (System Admin, Agency Owner, Sales Agent)
   - Custom claims for permissions

### Phase 2: Core Features (Week 3-4)
4. **System Admin Portal**
   - Create/manage agencies
   - Create agency owner accounts
   
5. **Agency Owner Dashboard**
   - Package creation wizard (7 steps)
   - Package listing with tabs (Current/Future/Past)
   - Vehicle/seat layout configuration

### Phase 3: Booking System (Week 5-6)
6. **Seat Booking Interface**
   - Visual seat layout (like bdtickets.com)
   - Boarding/dropping point selection
   - Guest information form
   - 6-digit booking ID generation

7. **Payment & Invoice**
   - Payment recording
   - Beautiful PDF invoice generation
   - Guest list PDF export

### Phase 4: Communication (Week 7-8)
8. **WhatsApp Integration**
   - QR code connection (2 accounts)
   - Message send/receive
   - Typing indicators

9. **Facebook Messenger**
   - Page OAuth connection
   - Unified inbox
   - Agent assignment

### Phase 5: Polish (Week 9-10)
10. **Reports & Analytics**
    - Dashboard statistics
    - Agent performance
    - Export functionality

11. **Mobile Optimization**
    - Responsive design
    - Touch-friendly interactions
    - Bottom navigation

---

## 🎨 Design Quick Reference

### Primary Colors
- **Primary (Orange):** `#F97316` - Main buttons, CTAs
- **Secondary (Blue):** `#3B82F6` - Links, info
- **Accent (Teal):** `#14B8A6` - Success, available

### Key CSS Classes
```css
.btn-primary     /* Orange gradient button */
.btn-secondary   /* White with orange border */
.card            /* White rounded card */
.input-field     /* Styled input field */
```

---

## 🔑 Important Patterns

### 6-Digit Booking ID
```typescript
const bookingId = await generateBookingId(db, agencyId);
// Returns: "000001", "000002", etc.
```

### Multi-Tenant Data Access
```typescript
// Always filter by agencyId
const packages = await getDocs(
  query(
    collection(db, 'agencies', agencyId, 'packages'),
    where('status', '==', 'current')
  )
);
```

---

## 📞 Key Features Reminder

1. **Multi-level Users:** System Admin → Agency Owner → Sales Agent
2. **Package Tabs:** Current (bookable) / Future / Past
3. **Seat Booking:** Visual layout like bdtickets.com
4. **6-Digit Booking ID:** Searchable, unique per agency
5. **Messaging:** 2 WhatsApp + 1 Facebook Messenger
6. **"Agent is Replying":** Prevents duplicate responses
7. **PDF Exports:** Guest list + Beautiful invoices
8. **Bengali Support:** All UI labels in বাংলা

---

*Happy Building! 🎉*
