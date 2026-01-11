# 🎨 UI Design Guide - BD Tour Connect

## Design Philosophy

BD Tour Connect embraces a **festive, travel-inspired aesthetic** that evokes the excitement of group tours while maintaining professional usability. The design combines:

- 🌅 **Warm sunset tones** - Representing adventure and travel
- 🌊 **Ocean blues** - Reflecting Bangladesh's coastal destinations
- 🌴 **Tropical accents** - Adding freshness and energy
- ✨ **Celebratory touches** - Creating a festive booking experience

---

## 🎨 Color System

### Primary Palette - Sunset Orange

The primary color represents energy, excitement, and the warmth of travel.

```css
--primary-50: #FFF7ED;
--primary-100: #FFEDD5;
--primary-200: #FED7AA;
--primary-300: #FDBA74;
--primary-400: #FB923C;
--primary-500: #F97316;   /* Main Primary */
--primary-600: #EA580C;
--primary-700: #C2410C;
--primary-800: #9A3412;
--primary-900: #7C2D12;
```

**Usage:**
- Primary buttons
- Active states
- Important CTAs
- Brand elements
- Progress indicators

### Secondary Palette - Ocean Blue

Represents trust, reliability, and Bangladesh's beautiful coastline.

```css
--secondary-50: #EFF6FF;
--secondary-100: #DBEAFE;
--secondary-200: #BFDBFE;
--secondary-300: #93C5FD;
--secondary-400: #60A5FA;
--secondary-500: #3B82F6;  /* Main Secondary */
--secondary-600: #2563EB;
--secondary-700: #1D4ED8;
--secondary-800: #1E40AF;
--secondary-900: #1E3A8A;
```

**Usage:**
- Links
- Information elements
- Secondary actions
- Data visualizations
- Icons

### Accent Palette - Tropical Teal

Adds freshness and represents nature and eco-tourism.

```css
--accent-50: #F0FDFA;
--accent-100: #CCFBF1;
--accent-200: #99F6E4;
--accent-300: #5EEAD4;
--accent-400: #2DD4BF;
--accent-500: #14B8A6;   /* Main Accent */
--accent-600: #0D9488;
--accent-700: #0F766E;
--accent-800: #115E59;
--accent-900: #134E4A;
```

**Usage:**
- Success states
- Available seats
- Confirmed bookings
- Positive indicators

### Semantic Colors

```css
/* Success - Palm Green */
--success-500: #22C55E;
--success-600: #16A34A;

/* Warning - Golden Sun */
--warning-500: #F59E0B;
--warning-600: #D97706;

/* Danger - Coral Red */
--danger-500: #EF4444;
--danger-600: #DC2626;

/* Info - Sky Blue */
--info-500: #0EA5E9;
--info-600: #0284C7;
```

### Neutral Palette - Sand

Warm neutrals that complement the travel theme.

```css
--sand-50: #FAFAF9;
--sand-100: #F5F5F4;
--sand-200: #E7E5E4;
--sand-300: #D6D3D1;
--sand-400: #A8A29E;
--sand-500: #78716C;
--sand-600: #57534E;
--sand-700: #44403C;
--sand-800: #292524;
--sand-900: #1C1917;
```

---

## 📝 Typography

### Font Families

```css
/* English Display Text */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

/* Bengali Text */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

/* Body Text */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

:root {
  --font-display: 'Poppins', sans-serif;
  --font-bengali: 'Noto Sans Bengali', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

### Type Scale

```css
/* Headings */
.heading-hero {
  font-family: var(--font-display);
  font-size: 3rem;      /* 48px */
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.heading-xl {
  font-family: var(--font-display);
  font-size: 2.25rem;   /* 36px */
  font-weight: 700;
  line-height: 1.2;
}

.heading-lg {
  font-family: var(--font-display);
  font-size: 1.875rem;  /* 30px */
  font-weight: 700;
  line-height: 1.3;
}

.heading-md {
  font-family: var(--font-display);
  font-size: 1.5rem;    /* 24px */
  font-weight: 600;
  line-height: 1.4;
}

.heading-sm {
  font-family: var(--font-display);
  font-size: 1.25rem;   /* 20px */
  font-weight: 600;
  line-height: 1.4;
}

/* Bengali Headings */
.heading-bn {
  font-family: var(--font-bengali);
  font-weight: 600;
}

/* Body Text */
.body-lg {
  font-family: var(--font-body);
  font-size: 1.125rem;  /* 18px */
  line-height: 1.7;
}

.body-md {
  font-family: var(--font-body);
  font-size: 1rem;      /* 16px */
  line-height: 1.6;
}

.body-sm {
  font-family: var(--font-body);
  font-size: 0.875rem;  /* 14px */
  line-height: 1.5;
}

.body-xs {
  font-family: var(--font-body);
  font-size: 0.75rem;   /* 12px */
  line-height: 1.4;
}

/* Bengali Body */
.body-bn {
  font-family: var(--font-bengali);
  line-height: 1.8;
}
```

---

## 🧩 Component Library

### Buttons

```jsx
/* Primary Button */
<button className="
  px-6 py-3 
  bg-gradient-to-r from-primary-500 to-primary-600
  text-white font-semibold
  rounded-xl
  shadow-md shadow-primary-500/25
  hover:shadow-lg hover:shadow-primary-500/30
  hover:from-primary-600 hover:to-primary-700
  active:scale-[0.98]
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  বুকিং করুন
</button>

/* Secondary Button */
<button className="
  px-6 py-3
  bg-white
  border-2 border-primary-500
  text-primary-600 font-semibold
  rounded-xl
  hover:bg-primary-50
  active:scale-[0.98]
  transition-all duration-200
">
  বিস্তারিত দেখুন
</button>

/* Ghost Button */
<button className="
  px-6 py-3
  text-primary-600 font-medium
  rounded-xl
  hover:bg-primary-50
  transition-all duration-200
">
  আরও দেখুন →
</button>

/* Danger Button */
<button className="
  px-6 py-3
  bg-gradient-to-r from-danger-500 to-danger-600
  text-white font-semibold
  rounded-xl
  shadow-md shadow-danger-500/25
  hover:shadow-lg
  transition-all duration-200
">
  বাতিল করুন
</button>

/* Icon Button */
<button className="
  w-10 h-10
  flex items-center justify-center
  bg-sand-100
  rounded-xl
  text-sand-600
  hover:bg-sand-200 hover:text-sand-800
  transition-all duration-200
">
  <IconSearch className="w-5 h-5" />
</button>
```

### Cards

```jsx
/* Package Card */
<div className="
  bg-white
  rounded-2xl
  shadow-card
  overflow-hidden
  hover:shadow-card-hover
  transition-shadow duration-300
  group
">
  {/* Image */}
  <div className="relative h-48 overflow-hidden">
    <img 
      src={coverImage} 
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
    {/* Status Badge */}
    <span className="absolute top-3 left-3 px-3 py-1 bg-success-500 text-white text-xs font-semibold rounded-full">
      বুকিং চলছে
    </span>
    {/* Price Badge */}
    <div className="absolute bottom-3 right-3 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl">
      <span className="text-2xl font-bold text-primary-600">৳{price}</span>
      <span className="text-sand-500 text-sm">/জন</span>
    </div>
  </div>
  
  {/* Content */}
  <div className="p-5">
    <h3 className="heading-sm text-sand-800 mb-2">{packageName}</h3>
    <p className="body-sm text-sand-500 mb-4">{destination}</p>
    
    {/* Quick Info */}
    <div className="flex items-center gap-4 text-sand-600 text-sm mb-4">
      <span>📅 {duration}</span>
      <span>🚌 {vehicleType}</span>
      <span>🪑 {availableSeats} সিট বাকি</span>
    </div>
    
    {/* Action */}
    <button className="w-full py-3 bg-gradient-festive text-white font-semibold rounded-xl">
      বুকিং করুন
    </button>
  </div>
</div>

/* Stat Card */
<div className="
  bg-gradient-to-br from-primary-500 to-primary-600
  rounded-2xl
  p-6
  text-white
">
  <div className="flex items-center justify-between mb-4">
    <span className="text-primary-100">মোট বুকিং</span>
    <span className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
      📋
    </span>
  </div>
  <div className="text-3xl font-bold mb-1">১,২৩৪</div>
  <div className="text-primary-200 text-sm">
    <span className="text-white">↑ ১২%</span> গত মাসের তুলনায়
  </div>
</div>
```

### Form Elements

```jsx
/* Text Input */
<div className="space-y-2">
  <label className="block text-sm font-medium text-sand-700">
    যাত্রীর নাম <span className="text-danger-500">*</span>
  </label>
  <input
    type="text"
    placeholder="সম্পূর্ণ নাম লিখুন"
    className="
      w-full px-4 py-3
      border-2 border-sand-200
      rounded-xl
      text-sand-800
      placeholder:text-sand-400
      focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10
      transition-all duration-200
    "
  />
</div>

/* Select */
<div className="space-y-2">
  <label className="block text-sm font-medium text-sand-700">
    বোর্ডিং পয়েন্ট
  </label>
  <select className="
    w-full px-4 py-3
    border-2 border-sand-200
    rounded-xl
    text-sand-800
    bg-white
    focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10
    transition-all duration-200
    appearance-none
    bg-[url('data:image/svg+xml,...')] bg-no-repeat bg-right-4
  ">
    <option>নির্বাচন করুন</option>
    <option>গাবতলী - রাত ৯:০০</option>
    <option>মহাখালী - রাত ৯:৩০</option>
  </select>
</div>

/* Phone Input with Country Code */
<div className="space-y-2">
  <label className="block text-sm font-medium text-sand-700">
    মোবাইল নম্বর
  </label>
  <div className="flex">
    <span className="
      flex items-center px-4
      bg-sand-100
      border-2 border-r-0 border-sand-200
      rounded-l-xl
      text-sand-600 font-medium
    ">
      🇧🇩 +880
    </span>
    <input
      type="tel"
      placeholder="1XXXXXXXXX"
      className="
        flex-1 px-4 py-3
        border-2 border-sand-200
        rounded-r-xl
        focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10
        transition-all duration-200
      "
    />
  </div>
</div>

/* Checkbox */
<label className="flex items-center gap-3 cursor-pointer group">
  <input
    type="checkbox"
    className="
      w-5 h-5
      rounded-md
      border-2 border-sand-300
      text-primary-500
      focus:ring-primary-500/25 focus:ring-offset-0
      transition-all duration-200
    "
  />
  <span className="text-sand-700 group-hover:text-sand-900">
    আমি শর্তাবলী পড়েছি এবং সম্মত
  </span>
</label>

/* Radio Group */
<div className="space-y-3">
  <label className="block text-sm font-medium text-sand-700">
    যানবাহনের ধরণ
  </label>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {vehicleTypes.map(type => (
      <label
        key={type.id}
        className={`
          relative flex items-center justify-center gap-2
          p-4 rounded-xl border-2 cursor-pointer
          transition-all duration-200
          ${selected === type.id 
            ? 'border-primary-500 bg-primary-50 text-primary-700' 
            : 'border-sand-200 hover:border-sand-300'}
        `}
      >
        <input type="radio" name="vehicle" className="sr-only" />
        <span className="text-2xl">{type.icon}</span>
        <span className="font-medium">{type.name}</span>
        {selected === type.id && (
          <span className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
            </svg>
          </span>
        )}
      </label>
    ))}
  </div>
</div>
```

### Seat Selection UI

```jsx
/* Seat Legend */
<div className="flex items-center gap-6 mb-6">
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg border-2 border-sand-300 bg-white" />
    <span className="text-sm text-sand-600">খালি</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-success-500" />
    <span className="text-sm text-sand-600">নির্বাচিত</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-danger-500/20 border-2 border-danger-300" />
    <span className="text-sm text-sand-600">বুকড</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-pink-100 border-2 border-pink-300" />
    <span className="text-sm text-sand-600">মহিলা</span>
  </div>
</div>

/* Seat Button */
<button
  className={`
    w-12 h-12 rounded-lg
    flex flex-col items-center justify-center
    border-2 font-medium text-xs
    transition-all duration-200
    ${status === 'available' && 'bg-white border-sand-300 hover:border-primary-500 hover:shadow-card cursor-pointer'}
    ${status === 'selected' && 'bg-success-500 border-success-600 text-white shadow-card'}
    ${status === 'booked' && 'bg-danger-500/20 border-danger-300 cursor-not-allowed'}
    ${status === 'women' && 'bg-pink-100 border-pink-300 hover:border-pink-500 cursor-pointer'}
  `}
>
  <SeatIcon className="w-5 h-5" />
  <span>{seatNumber}</span>
</button>

/* Deck Separator */
<div className="my-8">
  <div className="
    bg-gradient-to-r from-transparent via-danger-500 to-transparent
    h-px
  " />
  <div className="
    mx-auto -mt-3 w-32
    bg-danger-500 text-white
    text-center text-sm font-semibold
    py-1.5 rounded-lg
  ">
    Upper Deck
  </div>
</div>
```

### Messaging UI

```jsx
/* Message Bubble - Incoming */
<div className="flex gap-3 max-w-[80%]">
  <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center shrink-0">
    👤
  </div>
  <div>
    <div className="bg-white rounded-2xl rounded-tl-md shadow-card px-4 py-3">
      <p className="text-sand-800">{message}</p>
      {attachments && (
        <img src={attachments[0].url} className="mt-2 rounded-lg max-w-xs" />
      )}
    </div>
    <span className="text-xs text-sand-400 mt-1 block">10:30 AM</span>
  </div>
</div>

/* Message Bubble - Outgoing */
<div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
    🧑‍💼
  </div>
  <div className="text-right">
    <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl rounded-tr-md shadow-card px-4 py-3">
      <p>{message}</p>
    </div>
    <div className="flex items-center justify-end gap-1 mt-1">
      <span className="text-xs text-sand-400">10:32 AM</span>
      <span className="text-secondary-500">✓✓</span>
    </div>
  </div>
</div>

/* Typing Indicator */
<div className="flex items-center gap-2 text-sand-500 text-sm py-2">
  <div className="flex gap-1">
    <span className="w-2 h-2 bg-sand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-2 h-2 bg-sand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-2 h-2 bg-sand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
  <span>রাসেল টাইপ করছে...</span>
</div>
```

---

## 🖼️ Layout Patterns

### Dashboard Layout

```jsx
<div className="min-h-screen bg-sand-50">
  {/* Sidebar - Desktop */}
  <aside className="
    hidden lg:flex
    fixed left-0 top-0 bottom-0
    w-72 flex-col
    bg-white
    border-r border-sand-200
  ">
    {/* Logo */}
    <div className="p-6 border-b border-sand-100">
      <h1 className="text-2xl font-bold bg-gradient-festive bg-clip-text text-transparent">
        BD Tour Connect
      </h1>
    </div>
    
    {/* Navigation */}
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      <NavItem icon="🏠" label="ড্যাশবোর্ড" active />
      <NavItem icon="📦" label="প্যাকেজ" />
      <NavItem icon="📋" label="বুকিং" badge="12" />
      <NavItem icon="💬" label="মেসেজ" badge="5" />
      <NavItem icon="👥" label="এজেন্ট" />
      <NavItem icon="📊" label="রিপোর্ট" />
      <NavItem icon="⚙️" label="সেটিংস" />
    </nav>
    
    {/* User Profile */}
    <div className="p-4 border-t border-sand-100">
      <div className="flex items-center gap-3">
        <img src={avatar} className="w-10 h-10 rounded-full" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sand-800 truncate">{userName}</p>
          <p className="text-sm text-sand-500 truncate">{agencyName}</p>
        </div>
      </div>
    </div>
  </aside>
  
  {/* Main Content */}
  <main className="lg:pl-72">
    {/* Top Bar */}
    <header className="
      sticky top-0 z-40
      bg-white/80 backdrop-blur-lg
      border-b border-sand-200
      px-6 py-4
    ">
      <div className="flex items-center justify-between">
        <h2 className="heading-md text-sand-800">ড্যাশবোর্ড</h2>
        <div className="flex items-center gap-4">
          <QuickSearch />
          <NotificationBell count={3} />
        </div>
      </div>
    </header>
    
    {/* Page Content */}
    <div className="p-6">
      {children}
    </div>
  </main>
  
  {/* Mobile Bottom Nav */}
  <nav className="
    lg:hidden
    fixed bottom-0 left-0 right-0
    bg-white
    border-t border-sand-200
    px-2 py-3
    safe-area-inset-bottom
  ">
    <div className="flex items-center justify-around">
      <MobileNavItem icon="🏠" label="হোম" active />
      <MobileNavItem icon="📦" label="প্যাকেজ" />
      <MobileNavItem icon="📋" label="বুকিং" badge="12" />
      <MobileNavItem icon="💬" label="মেসেজ" badge="5" />
      <MobileNavItem icon="👤" label="আমি" />
    </div>
  </nav>
</div>
```

### Responsive Grid

```jsx
/* Stats Grid */
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>

/* Package Grid */
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {packages.map(pkg => (
    <PackageCard key={pkg.id} package={pkg} />
  ))}
</div>

/* Two Column Layout */
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

## 🎭 Animations

### Tailwind Config Animations

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'bounce-soft': 'bounce-soft 0.5s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
};
```

### Common Animation Classes

```css
/* Page transitions */
.page-enter { @apply animate-slide-up; }
.page-exit { @apply animate-fade-out; }

/* Modal animations */
.modal-backdrop { @apply animate-fade-in; }
.modal-content { @apply animate-scale-in; }

/* Card hover */
.card-hover {
  @apply transition-all duration-300;
}
.card-hover:hover {
  @apply -translate-y-1 shadow-card-hover;
}

/* Button press */
.btn-press {
  @apply transition-transform duration-100 active:scale-[0.98];
}

/* Loading skeleton */
.skeleton {
  @apply bg-sand-200 animate-pulse rounded;
}
```

---

## 📱 Mobile Considerations

### Touch Targets

- Minimum touch target: **44x44px**
- Spacing between touch targets: **8px minimum**
- Use generous padding on buttons and interactive elements

### Safe Areas

```css
/* For iPhone notch and home indicator */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Responsive Breakpoints

```javascript
// Tailwind breakpoints (default)
sm: '640px',   // Mobile landscape
md: '768px',   // Tablet
lg: '1024px',  // Desktop
xl: '1280px',  // Large desktop
2xl: '1536px', // Extra large
```

---

## 🌐 Bengali Typography Tips

1. **Line height**: Use `1.8` for Bengali text (more than English)
2. **Font weight**: Bengali looks better at `500` weight minimum
3. **Character spacing**: Avoid tight letter-spacing for Bengali
4. **Font size**: Bengali needs slightly larger font sizes for readability

```css
.bengali-text {
  font-family: 'Noto Sans Bengali', sans-serif;
  line-height: 1.8;
  font-weight: 500;
}
```

---

*Design system version 1.0 - BD Tour Connect*
