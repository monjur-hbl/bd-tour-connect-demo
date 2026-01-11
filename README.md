# 🌴 BD Tour Connect

## Multi-Tenant Travel Agency Booking Portal for Bangladesh

A comprehensive SaaS platform enabling travel agencies to manage tour packages, bookings, and customer communications.

---

## 🎯 Project Vision

BD Tour Connect empowers Bangladeshi travel agencies with a modern, festive-themed booking system featuring:

- **Visual Seat Selection** - Interactive bus layouts (like bdtickets.com)
- **Multi-Channel Messaging** - WhatsApp (2 accounts) + Facebook Messenger
- **Beautiful Invoices** - PDF generation with Bengali support
- **Multi-Tenant Architecture** - One platform, many agencies

---

## 👥 User Roles

### 1. System Admin (Platform Owner)
- Create and manage agencies
- Platform-wide settings
- Analytics dashboard

### 2. Agency Owner
- Create tour packages
- Manage sales agents
- Configure vehicles & seat layouts
- Access messaging hub
- View reports

### 3. Sales Agent
- Create bookings
- Search customers
- Process payments
- Respond to messages (if permitted)

---

## ✨ Key Features

### Tour Package Management
- 7-step creation wizard
- Multiple vehicle types (Microbus, Mini Bus, AC Bus, Sleeper Coach)
- Flexible pricing (per person, couple, child rates)
- Meal planning by day
- Boarding/dropping point configuration

### Booking System
- 6-digit unique booking IDs
- Visual seat selection
- Real-time availability
- Guest information capture
- Payment tracking (advance + due)

### Communication Hub
- 2 WhatsApp Business connections (QR code based)
- Facebook Messenger integration
- Unified inbox
- "Agent is replying" indicator
- Conversation assignment

### Reports & Exports
- Guest list PDF
- Beautiful invoice PDF
- Dashboard analytics
- Agent performance metrics

---

## 🎨 Design Philosophy

**Festive Travel Theme**
- Sunset Orange primary color
- Ocean Blue accents
- Tropical Teal highlights
- Bengali typography support

---

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Functions, Storage)
- **PDF:** jsPDF + jspdf-autotable
- **Messaging:** Evolution API (WhatsApp) + Graph API (Messenger)

---

## 📁 Documentation

- `CLAUDE_CODE_INSTRUCTIONS.md` - Detailed development guide
- `QUICK_START.md` - Fast-track setup
- `docs/DATABASE_SCHEMA.md` - Firestore structure
- `docs/UI_DESIGN_GUIDE.md` - Design system
- `docs/FEATURES_LIST.md` - Complete feature checklist
- `docs/MESSAGING_INTEGRATION.md` - WhatsApp & Messenger setup
- `docs/API_SPECIFICATIONS.md` - API endpoints
- `docs/SEAT_LAYOUTS.md` - Bus seat configurations

---

## 🚀 Getting Started

Open this folder in Claude Code and say:

```
Read the CLAUDE_CODE_INSTRUCTIONS.md and start building Phase 1: Authentication system with phone + password login
```

---

*Built with ❤️ for Bangladeshi Travel Agencies*
