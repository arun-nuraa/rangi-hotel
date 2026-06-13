import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, Edit2, Trash2, Calendar, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { orderAPI } from '../services/api';
import bluetoothPrinter from '../services/bluetoothPrinter';

const Orders = () => {
  const navigate = useNavigate();
  const { loadOrderForEditing, settings, refreshOrdersAndTables } = useApp();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [period, setPeriod] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOrdersList = async () => {
    try {
      setLoadingOrders(true);
      const res = await orderAPI.getAll({
        search,
        status: status === 'All' ? '' : status,
        period: period === 'All' ? '' : period,
        startDate,
        endDate
      });
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrdersList();
  }, [search, status, period, startDate, endDate]);

  const handlePrint = async (order) => {
    try {
      await bluetoothPrinter.printReceipt(order, settings);
      alert(`Receipt sent for ${order.billNo}`);
    } catch (err) {
      alert('Bluetooth Print failed. Printing is mocked in console.');
    }
  };

  const handleEdit = (order) => {
    loadOrderForEditing(order);
    navigate('/billing');
  };

  const handleDelete = async (id, billNo) => {
    if (!window.confirm(`Are you sure you want to delete order ${billNo}?`)) return;
    try {
      await orderAPI.delete(id);
      setOrders(prev => prev.filter(o => o._id !== id));
      refreshOrdersAndTables(); // Update context badges
    } catch (error) {
      alert('Failed to delete order.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'badge-completed';
      case 'Hold': return 'badge-hold';
      case 'Active': return 'badge-vacant';
      case 'Cancelled': return 'badge-cancelled';
      default: return 'badge-vacant';
    }
  };

  return (
    <div className="page-container" style={styles.container}>
      {/* Filters Card */}
      <div className="card" style={styles.filtersCard}>
        <div style={styles.searchWrapper}>
          <Search size={16} color="#6b7280" style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search bill no or name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.dropdownsWrapper}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              style={styles.select}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Hold">Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date Filter</label>
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              style={styles.select}
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          {period === 'Custom' && (
            <div style={styles.customDateWrapper}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  style={styles.dateInput}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>End Date</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  style={styles.dateInput}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={styles.tableCard}>
        {loadingOrders ? (
          <div style={styles.loaderWrapper}>
            <div className="animate-spin" style={styles.spinner} />
            <p style={{ marginTop: '12px', color: '#6b7280' }}>Loading orders history...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={styles.emptyState}>
            <FileText size={48} color="#dee2e6" />
            <p style={{ marginTop: '12px', color: '#6b7280', fontWeight: '500' }}>No orders found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Table / Type</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontWeight: '700' }}>{order.billNo}</td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: order.type === 'Parcel' ? '#f1f3f5' : '#fff4e6',
                        color: order.type === 'Parcel' ? '#4b5563' : '#d9480f'
                      }}>
                        {order.table === 'Parcel' ? 'Parcel' : `Table ${order.table}`}
                      </span>
                    </td>
                    <td>{order.customerName || '-'}</td>
                    <td>
                      {new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700' }}>₹{order.total.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={styles.actionBtnGroup}>
                        <button 
                          style={styles.actionBtn} 
                          onClick={() => handlePrint(order)}
                          title="Print Receipt"
                        >
                          <Printer size={16} color="#4b5563" />
                        </button>
                        <button 
                          style={styles.actionBtn} 
                          onClick={() => handleEdit(order)}
                          title="Edit Order"
                          disabled={order.status === 'Cancelled'}
                        >
                          <Edit2 size={16} color={order.status === 'Cancelled' ? '#dee2e6' : '#1c7ed6'} />
                        </button>
                        <button 
                          style={styles.actionBtn} 
                          onClick={() => handleDelete(order._id, order.billNo)}
                          title="Delete Order"
                        >
                          <Trash2 size={16} color="#c92a2a" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  filtersCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '260px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    fontSize: '0.85rem',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  dropdownsWrapper: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  filterLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#6b7280',
    letterSpacing: '0.05em',
  },
  select: {
    padding: '8px 12px',
    fontSize: '0.85rem',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#ffffff',
    fontFamily: 'inherit',
    minWidth: '130px',
  },
  customDateWrapper: {
    display: 'flex',
    gap: '10px',
  },
  dateInput: {
    padding: '7px 10px',
    fontSize: '0.825rem',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  tableCard: {
    minHeight: '350px',
    padding: '16px',
  },
  loaderWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #dee2e6',
    borderTopColor: '#000000',
    borderRadius: '50%',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
  },
  actionBtnGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease',
    ':disabled': {
      cursor: 'not-allowed',
    }
  }
};

export default Orders;
