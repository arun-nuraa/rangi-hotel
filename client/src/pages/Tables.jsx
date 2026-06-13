import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tableAPI, orderAPI } from '../services/api';

const Tables = () => {
  const navigate = useNavigate();
  const { 
    tables, 
    setTables, 
    setSelectedTable, 
    setOrderType, 
    clearCart, 
    loadOrderForEditing,
    refreshOrdersAndTables
  } = useApp();

  const [newTableNo, setNewTableNo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    refreshOrdersAndTables();
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableNo.trim()) return;
    setError('');

    try {
      const res = await tableAPI.create({ number: newTableNo.trim() });
      setTables((prev) => [...prev, res.data].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })));
      setNewTableNo('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add table');
    }
  };

  const handleDeleteTable = async (id, e) => {
    e.stopPropagation(); // Prevent trigger billing click
    if (!window.confirm('Are you sure you want to delete this table?')) return;

    try {
      await tableAPI.delete(id);
      setTables((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      alert('Failed to delete table');
    }
  };

  const handleTableClick = async (table) => {
    try {
      // 1. Check if there is a hold bill for this table
      const res = await orderAPI.getAll({ status: 'Hold', search: table.number });
      const holdBills = res.data.filter(o => o.table === table.number);

      if (holdBills.length > 0) {
        // Load existing hold bill
        loadOrderForEditing(holdBills[0]);
      } else {
        // Start a fresh bill for this table
        clearCart();
        setSelectedTable(table.number);
        setOrderType('Dine-in');
      }
      navigate('/billing');
    } catch (err) {
      console.error('Error handling table click:', err);
      // Fallback
      clearCart();
      setSelectedTable(table.number);
      setOrderType('Dine-in');
      navigate('/billing');
    }
  };

  return (
    <div className="page-container" style={styles.container}>
      {/* Manage Tables Box */}
      <div className="card" style={styles.manageCard}>
        <div style={styles.manageLeft}>
          <h3 style={styles.manageTitle}>Manage Tables</h3>
          <p style={styles.manageSubtitle}>Add, remove, and monitor tables</p>
        </div>
        
        <form onSubmit={handleAddTable} style={styles.manageForm}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <input 
              type="text" 
              placeholder="Table Number (e.g. 5)"
              value={newTableNo}
              onChange={(e) => setNewTableNo(e.target.value)}
              style={styles.input}
            />
            {error && <span style={styles.errorText}>{error}</span>}
          </div>
          <button type="submit" className="btn btn-black" style={styles.addBtn}>
            <Plus size={16} />
            Add Table
          </button>
        </form>
      </div>

      {/* Grid of Tables */}
      <div style={styles.grid}>
        {tables.map((table) => (
          <div 
            key={table._id} 
            className="card" 
            style={{
              ...styles.tableCard,
              borderColor: table.status === 'Occupied' ? '#ffe8cc' : '#f1f3f5',
              backgroundColor: table.status === 'Occupied' ? '#fffbf4' : '#ffffff'
            }}
            onClick={() => handleTableClick(table)}
          >
            {/* Delete Icon on Table Card */}
            <button 
              style={styles.deleteBtn}
              onClick={(e) => handleDeleteTable(table._id, e)}
              title="Delete Table"
            >
              <Trash2 size={14} color="#a1a1aa" />
            </button>

            <h2 style={styles.tableNo}>{table.number.startsWith('T-') ? table.number : `T-${table.number}`}</h2>
            <span style={{
              ...styles.statusText,
              color: table.status === 'Occupied' ? '#d9480f' : '#868e96'
            }}>
              {table.status}
            </span>
          </div>
        ))}
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
  manageCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
  },
  manageLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  manageTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#0e0f11',
  },
  manageSubtitle: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '2px',
  },
  manageForm: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  input: {
    width: '240px',
    padding: '10px 14px',
    fontSize: '0.85rem',
    border: '1px solid #ced4da',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  addBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
  },
  errorText: {
    fontSize: '0.7rem',
    color: '#c92a2a',
    marginTop: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '20px',
  },
  tableCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px 20px',
    cursor: 'pointer',
    borderRadius: '12px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
  },
  tableNo: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#0e0f11',
  },
  statusText: {
    fontSize: '0.75rem',
    fontWeight: '600',
    marginTop: '6px',
    textTransform: 'uppercase',
  },
  deleteBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
    transition: 'opacity 0.2s ease',
  }
};

export default Tables;
