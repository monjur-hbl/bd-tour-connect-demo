# 🎨 UI Design Guide - BD Tour Connect

## Design Philosophy

BD Tour Connect uses a **festive travel theme** that evokes the excitement of Bangladeshi travel while maintaining professionalism for agency operations.

---

## Color Palette

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Sunset Orange** | `#F97316` | Primary buttons, CTAs, highlights |
| **Ocean Blue** | `#3B82F6` | Links, secondary actions, info |
| **Tropical Teal** | `#14B8A6` | Success states, available seats |

### Semantic Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Success | `#22C55E` | Confirmations, positive states |
| Warning | `#F59E0B` | Alerts, due payments |
| Danger | `#EF4444` | Errors, cancellations, delete |

### Neutral Colors (Sand)

| Shade | Hex | Usage |
|-------|-----|-------|
| sand-50 | `#FAFAF9` | Page backgrounds |
| sand-100 | `#F5F5F4` | Card backgrounds |
| sand-200 | `#E7E5E4` | Borders, dividers |
| sand-400 | `#A8A29E` | Disabled, placeholders |
| sand-600 | `#57534E` | Secondary text |
| sand-800 | `#292524` | Primary text |

---

## Typography

### Font Families

```css
font-family: 'Poppins', sans-serif;      /* Headings (English) */
font-family: 'Noto Sans Bengali', sans-serif; /* Bengali text */
font-family: 'Inter', sans-serif;        /* Body text */
```

### Font Sizes

| Class | Size | Usage |
|-------|------|-------|
| text-xs | 12px | Captions, badges |
| text-sm | 14px | Secondary text |
| text-base | 16px | Body text |
| text-lg | 18px | Emphasized text |
| text-xl | 20px | Section headings |
| text-2xl | 24px | Page headings |
| text-3xl | 30px | Hero text |

### Bengali Typography Notes

- Use minimum font-weight: 500 for Bengali
- Increase line-height to 1.8 for Bengali paragraphs
- Slightly larger font sizes for Bengali labels

---

## Component Library

### Buttons

```tsx
// Primary Button - Main CTAs
<button className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 
  text-white font-semibold rounded-xl shadow-md shadow-primary-500/25 
  hover:shadow-lg hover:from-primary-600 hover:to-primary-700 
  active:scale-[0.98] transition-all duration-200">
  Book Now
</button>

// Secondary Button - Alternative actions
<button className="px-6 py-3 bg-white border-2 border-primary-500 
  text-primary-600 font-semibold rounded-xl 
  hover:bg-primary-50 active:scale-[0.98] transition-all duration-200">
  Learn More
</button>

// Ghost Button - Subtle actions
<button className="px-6 py-3 text-primary-600 font-medium rounded-xl 
  hover:bg-primary-50 transition-all duration-200">
  Cancel
</button>

// Danger Button - Destructive actions
<button className="px-6 py-3 bg-gradient-to-r from-danger-500 to-danger-600 
  text-white font-semibold rounded-xl shadow-md shadow-danger-500/25">
  Delete
</button>
```

### Cards

```tsx
// Basic Card
<div className="bg-white rounded-2xl shadow-card overflow-hidden">
  {/* Content */}
</div>

// Hover Card
<div className="bg-white rounded-2xl shadow-card overflow-hidden 
  hover:shadow-card-hover transition-shadow duration-300">
  {/* Content */}
</div>

// Stat Card with Gradient
<div className="bg-gradient-to-br from-primary-500 to-primary-600 
  rounded-2xl p-6 text-white shadow-festive">
  <p className="text-sm opacity-80">Total Bookings</p>
  <p className="text-3xl font-bold">১,২৩৪</p>
</div>
```

### Form Inputs

```tsx
// Text Input
<input 
  className="w-full px-4 py-3 border-2 border-sand-200 rounded-xl 
    text-sand-800 placeholder:text-sand-400 
    focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 
    transition-all duration-200"
  placeholder="Enter name..."
/>

// Phone Input with BD Flag
<div className="flex">
  <span className="flex items-center px-4 bg-sand-100 border-2 border-r-0 
    border-sand-200 rounded-l-xl text-sand-600">
    🇧🇩 +880
  </span>
  <input 
    className="flex-1 px-4 py-3 border-2 border-sand-200 rounded-r-xl 
      focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
    placeholder="1XXXXXXXXX"
  />
</div>

// Select Dropdown
<select className="w-full px-4 py-3 border-2 border-sand-200 rounded-xl 
  text-sand-800 bg-white 
  focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10">
  <option>Select option</option>
</select>
```

### Seat Selection

```tsx
// Available Seat
<button className="w-12 h-12 bg-accent-500 hover:bg-accent-600 
  text-white font-semibold rounded-lg transition-all">
  A1
</button>

// Selected Seat
<button className="w-12 h-12 bg-primary-500 text-white font-semibold 
  rounded-lg ring-2 ring-primary-300">
  A1
</button>

// Booked Seat
<button className="w-12 h-12 bg-sand-400 text-sand-600 
  rounded-lg cursor-not-allowed" disabled>
  A1
</button>

// Women Only Seat
<button className="w-12 h-12 bg-pink-400 hover:bg-pink-500 
  text-white font-semibold rounded-lg">
  A1
</button>

// Seat Legend
<div className="flex gap-4">
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-accent-500 rounded"></div>
    <span className="text-sm">Available <span className="font-bengali">খালি</span></span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-primary-500 rounded"></div>
    <span className="text-sm">Selected <span className="font-bengali">নির্বাচিত</span></span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-sand-400 rounded"></div>
    <span className="text-sm">Booked <span className="font-bengali">বুকড</span></span>
  </div>
</div>
```

### Messaging Components

```tsx
// Incoming Message (Customer)
<div className="flex gap-3">
  <div className="w-8 h-8 bg-sand-200 rounded-full flex-shrink-0"></div>
  <div className="bg-sand-100 rounded-2xl rounded-tl-none px-4 py-2 max-w-[70%]">
    <p className="text-sand-800">Hi, I want to book for Cox's Bazar tour</p>
    <span className="text-xs text-sand-400">10:30 AM</span>
  </div>
</div>

// Outgoing Message (Agent)
<div className="flex gap-3 justify-end">
  <div className="bg-primary-500 text-white rounded-2xl rounded-tr-none px-4 py-2 max-w-[70%]">
    <p>Sure! We have an upcoming tour on February 15th.</p>
    <span className="text-xs text-primary-200">10:32 AM ✓✓</span>
  </div>
</div>

// Typing Indicator
<div className="flex gap-1 px-4 py-2 bg-sand-100 rounded-full w-16">
  <div className="w-2 h-2 bg-sand-400 rounded-full animate-bounce"></div>
  <div className="w-2 h-2 bg-sand-400 rounded-full animate-bounce delay-100"></div>
  <div className="w-2 h-2 bg-sand-400 rounded-full animate-bounce delay-200"></div>
</div>
```

---

## Animations

```css
/* Float Animation */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-float { animation: float 3s ease-in-out infinite; }

/* Slide Up */
@keyframes slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.animate-slide-up { animation: slide-up 0.3s ease-out; }

/* Fade In */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in { animation: fade-in 0.2s ease-out; }

/* Pulse Soft */
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
```

---

## Layout Patterns

### Dashboard Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

### Package Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <PackageCard />
  <PackageCard />
  <PackageCard />
</div>
```

### Two Column Layout
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main Content */}
  </div>
  <div>
    {/* Sidebar */}
  </div>
</div>
```

---

## Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

---

## Mobile Considerations

- Minimum touch target: 44x44px
- Bottom navigation for mobile
- Collapsible sidebar
- Safe area insets for notch devices
- Pull-to-refresh on lists

---

*UI Design Guide v1.0 - BD Tour Connect*
