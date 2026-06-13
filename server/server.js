require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Models for seed data
const MenuItem = require('./models/MenuItem');
const Table = require('./models/Table');
const Settings = require('./models/Settings');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/backup', require('./routes/backupRoutes'));

// Connect Database and Seed Initial Data
const startServer = async () => {
  await connectDB();

  // Seed Menu Items if empty
  const menuCount = await MenuItem.countDocuments();
  if (menuCount === 0) {
    const seedMenu = [
      { name: 'Chicken Biryani', price: 220, category: 'Biryani', type: 'Non-Veg', available: true },
      { name: 'Mutton Biryani', price: 350, category: 'Biryani', type: 'Non-Veg', available: true },
      { name: 'Veg Biryani', price: 180, category: 'Biryani', type: 'Veg', available: true },
      { name: 'South Indian Meal', price: 120, category: 'Meals', type: 'Veg', available: true },
      { name: 'Special Chicken Meal', price: 250, category: 'Meals', type: 'Non-Veg', available: true },
      { name: 'Gobi Manchurian', price: 140, category: 'Starters', type: 'Veg', available: true },
      { name: 'Chicken Kabab', price: 180, category: 'Starters', type: 'Non-Veg', available: true },
      { name: 'Butter Naan', price: 45, category: 'Breads', type: 'Veg', available: true },
      { name: 'Tandoori Roti', price: 30, category: 'Breads', type: 'Veg', available: true },
      { name: 'Lime Juice', price: 40, category: 'Drinks', type: 'Veg', available: true },
      { name: 'Masala Butter Milk', price: 30, category: 'Drinks', type: 'Veg', available: true }
    ];
    await MenuItem.insertMany(seedMenu);
    console.log('Seeded menu items catalog.');
  }

  // Seed Tables if empty
  const tableCount = await Table.countDocuments();
  if (tableCount === 0) {
    const seedTables = [
      { number: 'T-1', status: 'Vacant' },
      { number: 'T-2', status: 'Vacant' },
      { number: 'T-3', status: 'Vacant' },
      { number: 'T-4', status: 'Vacant' },
      { number: 'T-22', status: 'Vacant' }
    ];
    await Table.insertMany(seedTables);
    console.log('Seeded tables grid.');
  }

  // Seed Settings if empty
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) {
    settings = new Settings({ key: 'global' });
    await settings.save();
    console.log('Initialized global settings.');
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
