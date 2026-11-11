<div align="center">
  <h1>✨ Manju's Atelier ✨</h1>
  <p><i>Handcrafted with Love, Made to Last.</i></p>
  
  <p>
    <b>Live at:</b> <a href="https://www.manjusatelier.in">www.manjusatelier.in</a>
  </p>
  
  [![React](https://img.shields.io/badge/React-18-blue?logo=react&logoColor=white)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
  [![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?logo=socketdotio&logoColor=white)](https://socket.io)
  [![Cashfree](https://img.shields.io/badge/Cashfree-Payment_Gateway-7B2CBF)](https://cashfree.com)
</div>

<br />

Welcome to **Manju's Atelier**, a production-grade, full-stack e-commerce platform dedicated to handcrafted resin decor, custom gifts, clay arts, and artisan treasures. Designed with a warm luxury aesthetic, it provides an ultra-responsive, mobile-first shopping experience with seamless online payments, real-time order tracking, and a comprehensive admin management suite.

---

## 🚀 Live Production Status

The platform is actively live and serving customers at **[www.manjusatelier.in](https://www.manjusatelier.in)**.

### ✨ Implemented Features

#### 🛍️ Shopping & Customer Experience
- **Mobile-First Luxury UI:** Responsive, accessible design built with React 18, TypeScript, and Tailwind CSS with smooth Framer Motion micro-interactions.
- **Product Catalog & Discovery:** Multi-facet filtering (categories, colors, materials, price ranges, in-stock), full-text search, sort controls, and color variant switching.
- **Bespoke Product Customization:** Product-level customization indicators and special dispatch notifications for personalized items.
- **Cart & Wishlist Engine:** Persistent, synchronized cart with real-time stock limits and guest-to-user account migration without quantity doubling.
- **Progressive Web App (PWA):** Offline shell caching, installable home screen experience, and native Web Push notifications.

#### 💳 Payments & Checkout
- **Instant Online Payments (Cashfree PG):** Integrated modal checkout supporting Dynamic UPI QR, UPI Intent apps (GPay, PhonePe, Paytm), Credit/Debit cards, Net Banking, and Wallets.
- **Direct UPI & UTR Verification:** Alternative manual UPI transfer option with 12-digit bank reference (UTR) verification.
- **Dual-Layer Payment Verification:** Frontend verification on return redirect + background HMAC-SHA256 signed webhooks (`POST /api/webhooks/cashfree`) to safeguard against closed tabs or dropped connections.
- **Order Confirmation Guarantee:** Customer confirmation emails and push notifications trigger **only** after payments are confirmed as `PAID`.
- **Automated Discounts & Coupons:** Real-time coupon validation engine with minimum spend rules and percentage/flat discounts.

#### 📦 Order Lifecycle & Invoicing
- **Full Order Lifecycle:** Status transitions from `processing` → `confirmed` → `shipped` → `delivered` → `cancelled`.
- **Dynamic PDF Invoices:** Instant PDF invoice generation with branding and order summaries.
- **Returns & Exchanges:** Customer self-service return/exchange requests with admin approval workflows.

#### 🛠️ Comprehensive Admin Suite (`/admin`)
- **Dashboard & Analytics:** Real-time revenue, order volume, customer counts, average order value (AOV), and conversion funnels.
- **Product Management:** Full CRUD operations with multi-image Cloudinary uploads, variant configuration, stock monitoring, and low-stock alerts.
- **Order Management:** Live order feeds with Socket.io push alerts, manual UTR verification/rejection, status updates, customer contact shortcuts, and Excel exports.
- **Marketing & Social Hub:** Instant promotional announcement composer, review management, and offline stall QR standee generator.
- **Store Settings:** Configurable shipping thresholds, free delivery rules, and platform metadata.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite 5 + TypeScript
- **Styling:** Tailwind CSS (warm artisanal color palette)
- **Animations:** Framer Motion
- **Payment SDK:** `@cashfreepayments/cashfree-js`
- **Icons:** Lucide React
- **PWA & Offline:** `vite-plugin-pwa` + Workbox

### Backend
- **Runtime:** Node.js (ESM) + Express
- **Database:** MongoDB Atlas + Mongoose
- **Payment Gateway:** `cashfree-pg` (API version `2023-08-01` / `2026-01-01`)
- **Real-Time:** Socket.io (bidirectional admin and customer alerts)
- **Security:** Helmet, CORS, express-rate-limit, mongo-sanitize, HPP, signed httpOnly JWT cookies
- **Email & Push:** Resend API + Web Push (VAPID)
- **Media:** Cloudinary

---

## 📂 Project Structure

```text
manjus-atelier/
├── client/                     # React + Vite frontend
│   ├── public/                 # Favicons, PWA manifests, static assets
│   └── src/
│       ├── components/         # Reusable UI, Layout, Product cards & modals
│       │   ├── layout/         # Navbar, Footer, MobileNav
│       │   ├── product/        # ProductCard, ProductModal, QuickView
│       │   └── ui/             # Buttons, Badges, Modals, ReleaseNotes
│       ├── context/            # AuthContext, CartContext, WishlistContext, ThemeContext
│       ├── hooks/              # Custom hooks (useProducts, useCategories, usePageMeta)
│       ├── lib/                # API client, analytics, utilities, placeholder images
│       ├── pages/              # Customer pages (Home, Shop, ProductDetails, Cart, Checkout...)
│       │   └── admin/          # Admin portal (Overview, Orders, Products, Analytics...)
│       ├── types/              # TypeScript interfaces and declarations
│       └── utils/              # Helper utilities & test product configuration
├── server/                     # Node.js + Express backend API
│   └── src/
│       ├── config/             # Database connection & third-party configs
│       ├── controllers/        # Controllers (auth, orders, products, webhooks, analytics...)
│       ├── middleware/         # Auth (protect, optionalAuth, adminOnly), validation, error
│       ├── models/             # Mongoose schemas (User, Product, Order, Coupon, Setting...)
│       ├── routes/             # API routes (authRoutes, orderRoutes, webhookRoutes...)
│       ├── services/           # Business services (notificationService)
│       ├── socket.js           # Socket.io connection & room manager
│       └── utils/              # Cashfree helper, Resend email templates, PDF invoice generator
└── package.json                # Root concurrently dev scripts
```

---

## 💻 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **MongoDB**: MongoDB Atlas connection string or local MongoDB instance

### 2. Installation
Clone the repository and install root and workspace dependencies:

```bash
# Clone the repository
git clone https://github.com/manjusatelier/manjusatelier.git
cd manjus-atelier

# Install client and server dependencies
cd client && npm install
cd ../server && npm install
cd ..
```

### 3. Environment Configuration

#### Server Configuration (`server/.env`)
Create `server/.env` based on `server/.env.example`:

```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
COOKIE_SECRET=your_cookie_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=help@manjusatelier.in
FROM_NAME=Manju's Atelier

# Cashfree Payments Gateway
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENV=SANDBOX           # 'SANDBOX' for test mode, 'PRODUCTION' for live
CASHFREE_API_VERSION=2023-08-01
```

#### Client Configuration (`client/.env`)
Create `client/.env` based on `client/.env.example`:

```ini
VITE_API_URL=
VITE_UPI_ID=your_upi_id@bank
VITE_CASHFREE_MODE=sandbox     # 'sandbox' for test, 'production' for live
```

### 4. Database Seeding (Optional)
Populate the database with sample categories, products, and admin accounts:

```bash
cd server
npm run seed
```

### 5. Running the Application
Run both frontend and backend concurrently from the root directory:

```bash
npm run dev
```

- **Frontend Client:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000`
- **Admin Dashboard:** `http://localhost:5173/admin` (Requires admin login)

---

## 🔒 Security & Best Practices

- **Timing-Safe HMAC Verification:** Cashfree webhook signatures are calculated over `timestamp + rawBody` using `crypto.timingSafeEqual` to prevent replay attacks and forgery.
- **Database-Authoritative Pricing:** Client-provided prices are never trusted; order subtotals and discounts are recomputed strictly against MongoDB database records.
- **Sensitive Isolation:** Test/dummy products and sensitive admin operations are guarded with role-based JWT middleware (`adminOnly`, `optionalAuth`).
- **Data Protection:** Standardized protection via `helmet`, `hpp`, `mongo-sanitize`, and CORS whitelisting.

---

## ⚖️ License & Copyright

**© 2026 Manju's Atelier. All Rights Reserved.**

This repository and its contents are **proprietary and confidential**.  
This code is provided for portfolio and demonstration purposes only. You are **not** permitted to copy, modify, distribute, or use this source code, in whole or in part, for any personal or commercial projects.

<div align="center">
  <p>Crafted with ❤️ for Manju's Atelier.</p>
</div>
