# 🎯 BD Tour Connect - Travel Agency Booking Portal

## Project Overview

**BD Tour Connect** is a comprehensive multi-tenant SaaS booking portal designed specifically for Bangladeshi travel agencies that offer group tour packages. The system enables travel agencies to manage their tour packages, sales agents, and seat bookings efficiently through a modern, responsive web application.

## 🌟 Key Features

### Multi-Level User System
- **System Admin (Super Admin)**: Platform owner who manages agency accounts
- **Agency Owner**: Travel agency owners who create packages and manage their team
- **Sales Agent**: Agency staff who book seats for guests

### Tour Package Management
- Complete package creation with vehicle selection
- Flexible meal planning per day
- Boarding/dropping point customization
- Pricing tiers (per person, couple, child rates)
- Refund and cancellation policy management

### Visual Seat Booking System
- Interactive bus seat layouts (inspired by bdtickets.com)
- Support for multiple vehicle types:
  - Microbus (7-15 seats)
  - Mini Bus (20-30 seats)
  - Non-AC Bus (40-50 seats)
  - AC Bus (40-50 seats)
  - Sleeper Coach (Upper/Lower deck)
- Real-time seat availability
- Visual indicators for booked/available/selected seats

### Communication Hub
- WhatsApp Business API integration (2 connections)
- Facebook Messenger integration (Page + Profile)
- Shared inbox with "agent is typing" indicator
- Attachment support (send/receive images, documents)
- Agent assignment to prevent duplicate replies

### Guest Management
- 6-digit unique booking ID system
- Complete guest information tracking
- PDF invoice generation (beautifully designed)
- Guest list PDF export (A4 format)
- Booking history with payment tracking

## 🎨 Design Philosophy

The UI follows a **festive, travel-themed design** with:
- Vibrant color palette (sunset oranges, ocean blues, tropical greens)
- Card-based layouts with smooth animations
- Mobile-first responsive design
- Intuitive navigation with Bengali language support

## 🛠️ Technology Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Firebase (Firestore, Cloud Functions, Authentication)
- **Hosting**: GitHub Pages / Firebase Hosting
- **APIs**: 
  - WhatsApp Business API
  - Facebook Messenger Graph API
- **PDF Generation**: jsPDF / react-pdf
- **Real-time**: Firebase Realtime subscriptions

## 📁 Project Structure

```
bd-tour-connect/
├── src/
│   ├── components/
│   │   ├── auth/           # Login, Register, OTP
│   │   ├── admin/          # System admin components
│   │   ├── agency/         # Agency owner components
│   │   ├── agent/          # Sales agent components
│   │   ├── booking/        # Seat selection, booking forms
│   │   ├── messaging/      # WhatsApp & Messenger inbox
│   │   └── shared/         # Common UI components
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   ├── services/
│   └── styles/
├── functions/              # Firebase Cloud Functions
├── docs/                   # Documentation
└── assets/                 # Static assets
```

## 🚀 Getting Started

See `CLAUDE_CODE_INSTRUCTIONS.md` for detailed development instructions.

## 📄 Documentation

- `CLAUDE_CODE_INSTRUCTIONS.md` - Development guide for Claude Code
- `docs/DATABASE_SCHEMA.md` - Firestore data model
- `docs/API_SPECIFICATIONS.md` - API endpoints
- `docs/FEATURES_LIST.md` - Detailed feature breakdown
- `docs/UI_DESIGN_GUIDE.md` - Design system and components
- `docs/MESSAGING_INTEGRATION.md` - WhatsApp & Messenger setup

## 🎯 Target Users

1. **সার্বিক ট্রাভেলস** and similar travel agencies
2. **Bangladesh Tour Group (BTG)**
3. **Travel Mate Bangladesh**
4. Local tour operators using Facebook for promotions

## 📞 Contact & Support

This project is developed as a custom solution for managing group tour packages in Bangladesh.

---

*Built with ❤️ for the Bangladeshi travel industry*
