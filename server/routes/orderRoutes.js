const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');

// Helper to update table status based on active/hold orders
const updateTableStatus = async (tableNum) => {
  if (!tableNum || tableNum === 'Parcel' || tableNum === 'General') return;
  const activeOrder = await Order.findOne({
    table: tableNum,
    status: { $in: ['Active', 'Hold'] }
  });
  const status = activeOrder ? 'Occupied' : 'Vacant';
  await Table.findOneAndUpdate({ number: tableNum }, { status });
};

// GET next bill number
router.get('/next-bill-no', async (req, res) => {
  try {
    const lastOrder = await Order.findOne().sort({ billNo: -1 });
    if (!lastOrder) {
      return res.json({ nextBillNo: 'NH-00001' });
    }
    const lastNoStr = lastOrder.billNo.replace('NH-', '');
    const lastNo = parseInt(lastNoStr, 10);
    const nextNo = isNaN(lastNo) ? 1 : lastNo + 1;
    const nextBillNo = `NH-${String(nextNo).padStart(5, '0')}`;
    res.json({ nextBillNo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET dashboard stats summary
router.get('/reports/summary', async (req, res) => {
  try {
    // Today & Yesterday ranges
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Queries
    const todayOrders = await Order.find({
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'Cancelled' }
    });

    const yesterdayOrders = await Order.find({
      date: { $gte: yesterdayStart, $lte: yesterdayEnd },
      status: { $ne: 'Cancelled' }
    });

    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);

    const totalTables = await Table.countDocuments();
    const activeTables = await Table.countDocuments({ status: 'Occupied' });

    const menuItemsCount = await MenuItem.countDocuments();
    const categoriesList = await MenuItem.distinct('category');

    res.json({
      activeTables,
      totalTables,
      todaySales,
      yesterdaySales,
      todayOrdersCount: todayOrders.length,
      yesterdayOrdersCount: yesterdayOrders.length,
      menuItemsCount,
      categoriesCount: categoriesList.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET analytics sales and item sales report
router.get('/reports/sales', async (req, res) => {
  const { period, startDate, endDate } = req.query;
  try {
    let start = new Date();
    let end = new Date();

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default to today
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    const orders = await Order.find({
      date: { $gte: start, $lte: end },
      status: { $ne: 'Cancelled' }
    }).sort({ date: -1 });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    // Aggregate item sales
    const itemSalesMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSalesMap[item.name]) {
          itemSalesMap[item.name] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            type: item.type
          };
        }
        itemSalesMap[item.name].quantity += item.quantity;
        itemSalesMap[item.name].revenue += item.price * item.quantity;
      });
    });

    const itemSalesReport = Object.values(itemSalesMap).sort((a, b) => b.quantity - a.quantity);

    res.json({
      orders,
      totalRevenue,
      totalOrders: orders.length,
      itemSalesReport
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all orders with query filters
router.get('/', async (req, res) => {
  const { status, period, startDate, endDate, search } = req.query;
  try {
    const query = {};

    // Filter by status
    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter by date
    if (period && period !== 'All') {
      let start = new Date();
      let end = new Date();

      if (period === 'Today') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
      } else if (period === 'This Week') {
        const today = new Date();
        const first = today.getDate() - today.getDay(); // Sunday
        start = new Date(today.setDate(first));
        start.setHours(0, 0, 0, 0);
        query.date = { $gte: start };
      } else if (period === 'This Month') {
        start = new Date(start.getFullYear(), start.getMonth(), 1);
        query.date = { $gte: start };
      } else if (period === 'Custom' && startDate && endDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
      }
    }

    // Filter by search term (billNo or customerName)
    if (search) {
      query.$or = [
        { billNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { table: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query).sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new order
router.post('/', async (req, res) => {
  try {
    const { billNo, table, type, customerName, items, discount, packing, subtotal, gst, total, status } = req.body;

    // Check if billNo already exists to prevent duplicate entries
    const existing = await Order.findOne({ billNo });
    if (existing) {
      return res.status(400).json({ message: 'Order with this bill number already exists.' });
    }

    const order = new Order({
      billNo,
      table,
      type,
      customerName,
      items,
      discount,
      packing,
      subtotal,
      gst,
      total,
      status
    });

    const saved = await order.save();

    // Update physical table status
    if (type === 'Dine-in') {
      await updateTableStatus(table);
    }

    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT (update entire order)
router.put('/:id', async (req, res) => {
  try {
    const oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    // Update tables
    if (oldOrder.table !== updated.table) {
      await updateTableStatus(oldOrder.table);
      await updateTableStatus(updated.table);
    } else {
      await updateTableStatus(updated.table);
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT status change specifically
router.put('/status/:id', async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    await updateTableStatus(order.table);

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE an order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await Order.findByIdAndDelete(req.params.id);
    await updateTableStatus(order.table);

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
