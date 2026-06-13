# Rangi Hotel — POS (MERN Stack)

A complete MERN stack Restaurant Point of Sale (POS) system called **"Naidu Hotel — POS"** designed for dine-in and parcel checkout workflows.

## Features
- **Dashboard Overview**: Live clock, 4 summary analytics cards, quick checkout action buttons, and active hold/saved bills.
- **Interactive Tables Grid**: Color-coded physical table slots (Vacant vs Occupied), direct table billing assignment, and inline table configuration.
- **Billing Terminal**: Menu card catalog search, dynamic category pills filter, cart adjustments (item quantities, packaging fees, discounts, and automatic 5% GST), thermal bill simulation, and mock KOT printer logs.
- **Order History**: Searchable invoice registry, status filters (Completed, Hold, Cancelled), and date filters (Today, Week, Month, Custom).
- **Reports & Aggregations**: Detailed revenue logs, item sales rankings, and document downloads (Excel spreadsheets, PDF summary invoices, and database collections backups).
- **Settings & Accordions**: Full CRUD for menu catalog, restaurant info customization, Bluetooth printer connections, and live 58mm bill mockup previews.

## Tech Stack
- **Database**: MongoDB (Mongoose schemas)
- **Backend**: Node.js + Express (REST APIs)
- **Frontend**: React + Vite (Vanilla JS)
- **Styling**: Vanilla CSS (High-contrast monochrome themes)
- **Libraries**: Axios (REST client), jsPDF (PDF export), XLSX (Excel export), Lucide-React (Icons)

## Folder Structure
```
/rangi-hotel
  ├── start.bat        - Windows batch runner for concurrent startup
  ├── /server          - Node Express backend and MongoDB models
  └── /client          - React Vite frontend UI assets
```

## Setup Instructions

### Prerequisites
- **Node.js** (v16.0 or higher)
- **MongoDB** (running locally on port 27017 or a MongoDB Atlas connection string)

### 1. MongoDB Verification
Ensure MongoDB is running locally at `mongodb://127.0.0.1:27017/rangi_hotel_pos`. You can change this connection string in `server/.env` under `MONGO_URI`.

### 2. Auto Startup
Simply double-click the **`start.bat`** script in the project root directory. This will open two separate Windows Command Prompts:
1. Spins up the Express server on `http://localhost:5000` (auto-seeding 11 menu items and 5 tables if the DB is blank).
2. Launches the Vite React dev server on `http://localhost:3000`.

### 3. Manual Startup
If not on Windows:
- **Server**:
  ```bash
  cd server
  npm run dev
  ```
- **Client**:
  ```bash
  cd client
  npm run dev
  ```
- Open `http://localhost:3000` in your browser.
