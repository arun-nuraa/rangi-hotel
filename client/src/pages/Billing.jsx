import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Minus, Trash2, Printer, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { orderAPI } from '../services/api';
import bluetoothPrinter from '../services/bluetoothPrinter';

const Billing = ({ defaultType }) => {
  const {
    menuItems,
    tables,
    settings,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    selectedTable,
    setSelectedTable,
    orderType,
    setOrderType,
    customerName,
    setCustomerName,
    discount,
    setDiscount,
    packing,
    setPacking,
    currentBillNo,
    editingOrderId,
    holdToggle,
    setHoldToggle,
    subtotal,
    gstValue,
    finalTotal,
    printerConnected
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [kotSuccess, setKotSuccess] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Set order type based on route prop
  useEffect(() => {
    if (defaultType) {
      setOrderType(defaultType);
      if (defaultType === 'Parcel') {
        setSelectedTable('Parcel');
      }
    }
  }, [defaultType, setOrderType, setSelectedTable]);

  // Extract categories dynamically
  useEffect(() => {
    if (menuItems.length > 0) {
      const cats = ['All', ...new Set(menuItems.map(item => item.category))];
      setCategories(cats);
    }
  }, [menuItems]);

  // Filters menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.available;
  });

  const handleKOTPrint = async () => {
    if (cart.length === 0) return;
    const currentOrder = {
      billNo: currentBillNo,
      table: selectedTable,
      type: orderType,
      items: cart
    };
    
    try {
      await bluetoothPrinter.printKOT(currentOrder);
      setKotSuccess(true);
      setTimeout(() => setKotSuccess(false), 2000);
    } catch (err) {
      alert('Bluetooth Print failed. Printing is mocked in console.');
      setKotSuccess(true);
      setTimeout(() => setKotSuccess(false), 2000);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const status = holdToggle ? 'Hold' : 'Completed';

    const orderData = {
      billNo: currentBillNo,
      table: selectedTable,
      type: orderType,
      customerName,
      items: cart,
      discount: parseFloat(discount || 0),
      packing: parseFloat(packing || 0),
      subtotal,
      gst: gstValue,
      total: finalTotal,
      status
    };

    try {
      if (editingOrderId) {
        await orderAPI.update(editingOrderId, orderData);
      } else {
        await orderAPI.create(orderData);
      }

      // Print bill receipt
      try {
        await bluetoothPrinter.printReceipt(orderData, settings);
      } catch (printErr) {
        console.log('Bluetooth print failed, receipt logged above.');
      }

      setCheckoutSuccess(true);
      setTimeout(() => {
        setCheckoutSuccess(false);
        clearCart();
      }, 1500);

    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save order.');
    }
  };

  return (
    <div className="page-container" style={styles.container}>
      {/* Left Column: Menu Items Catalog */}
      <div style={styles.catalogColumn}>
        {/* Search and Filters */}
        <div style={styles.searchBlock}>
          <div style={styles.searchWrapper}>
            <Search size={16} color="#6b7280" style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search menu items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={styles.categoriesRow}>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCategory(cat)}
              style={{
                ...styles.categoryPill,
                backgroundColor: selectedCategory === cat ? '#000000' : '#ffffff',
                color: selectedCategory === cat ? '#ffffff' : '#4b5563',
                borderColor: selectedCategory === cat ? '#000000' : '#dee2e6'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Menu Grid */}
        <div style={styles.menuGrid}>
          {filteredItems.map(item => (
            <div 
              key={item._id} 
              className="card" 
              style={styles.menuCard}
              onClick={() => addToCart(item)}
            >
              <div style={styles.menuCardHeader}>
                <span style={{
                  ...styles.vegDot,
                  borderColor: item.type === 'Veg' ? '#2b8a3e' : '#c92a2a',
                  backgroundColor: item.type === 'Veg' ? '#2b8a3e' : '#c92a2a'
                }} />
                <span style={styles.categoryBadge}>{item.category}</span>
              </div>
              <h4 style={styles.itemName}>{item.name}</h4>
              <p style={styles.itemPrice}>₹{item.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Checkout Panel */}
      <div className="card" style={styles.cartColumn}>
        {/* Cart Header */}
        <div style={styles.cartHeader}>
          <div>
            <h3 style={styles.cartTitle}>{currentBillNo}</h3>
            <span style={styles.cartSubtitle}>
              {editingOrderId ? 'Editing Saved Bill' : 'New Order'}
            </span>
          </div>

          <div style={styles.holdRow}>
            <label style={styles.holdLabel}>
              <input 
                type="checkbox" 
                checked={holdToggle} 
                onChange={(e) => setHoldToggle(e.target.checked)}
                style={styles.checkbox}
              />
              Hold Bill
            </label>
          </div>
        </div>

        {/* Order Details Config */}
        <div style={styles.configBlock}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Order Type</label>
              <select 
                value={orderType} 
                onChange={(e) => {
                  setOrderType(e.target.value);
                  if (e.target.value === 'Parcel') setSelectedTable('Parcel');
                }}
                disabled={!!defaultType}
                className="form-select"
                style={styles.selectInput}
              >
                <option value="Dine-in">Dine-in</option>
                <option value="Parcel">Parcel</option>
              </select>
            </div>

            {orderType === 'Dine-in' && (
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Table No</label>
                <select 
                  value={selectedTable} 
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="form-select"
                  style={styles.selectInput}
                >
                  <option value="Parcel">Choose Table</option>
                  {tables.map(t => (
                    <option key={t._id} value={t.number}>{t.number}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Customer Name</label>
            <input 
              type="text" 
              placeholder="Customer Name (optional)" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="form-input"
              style={styles.inputField}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div style={styles.cartItemsContainer}>
          {cart.length === 0 ? (
            <div style={styles.emptyCart}>
              <ShoppingBag size={48} color="#dee2e6" />
              <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '0.85rem' }}>Cart is empty</p>
            </div>
          ) : (
            <div style={styles.itemsList}>
              {cart.map((item, index) => (
                <div key={index} style={styles.cartItemRow}>
                  <div style={styles.itemTitleBlock}>
                    <span style={{
                      ...styles.vegDotMini,
                      backgroundColor: item.type === 'Veg' ? '#2b8a3e' : '#c92a2a'
                    }} />
                    <span style={styles.itemTitle}>{item.name}</span>
                  </div>
                  
                  {/* Quantity Controller */}
                  <div style={styles.qtyController}>
                    <button 
                      style={styles.qtyBtn} 
                      onClick={() => updateCartQuantity(item.name, item.quantity - 1)}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={styles.qtyText}>{item.quantity}</span>
                    <button 
                      style={styles.qtyBtn} 
                      onClick={() => updateCartQuantity(item.name, item.quantity + 1)}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <span style={styles.itemRowPrice}>₹{item.price * item.quantity}</span>

                  <button style={styles.trashBtn} onClick={() => removeFromCart(item.name)}>
                    <Trash2 size={14} color="#adb5bd" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Extra Charges form inputs */}
        <div style={styles.chargesRow}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Discount (₹)</label>
            <input 
              type="number" 
              value={discount || ''} 
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              className="form-input"
              style={{ ...styles.inputField, padding: '6px 10px' }}
            />
          </div>

          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Packing (₹)</label>
            <input 
              type="number" 
              value={packing || ''} 
              onChange={(e) => setPacking(parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              className="form-input"
              style={{ ...styles.inputField, padding: '6px 10px' }}
            />
          </div>
        </div>

        {/* Calculations Block */}
        <div style={styles.calcBlock}>
          <div style={styles.calcRow}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {packing > 0 && (
            <div style={styles.calcRow}>
              <span>Packing Charge</span>
              <span>₹{parseFloat(packing).toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div style={styles.calcRow}>
              <span>Discount</span>
              <span style={{ color: '#c92a2a' }}>-₹{parseFloat(discount).toFixed(2)}</span>
            </div>
          )}
          <div style={styles.calcRow}>
            <span>GST ({settings.gstPercentage || 5}%)</span>
            <span>₹{gstValue.toFixed(2)}</span>
          </div>
          <div style={styles.totalRow}>
            <span>TOTAL</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* POS Panel Buttons */}
        <div style={styles.actionsPanel}>
          <button 
            className="btn btn-outline" 
            style={styles.kotBtn} 
            disabled={cart.length === 0}
            onClick={handleKOTPrint}
          >
            <Printer size={16} />
            {kotSuccess ? 'KOT Sent!' : 'Print KOT'}
          </button>
          
          <button 
            className="btn btn-black" 
            style={styles.checkoutBtn} 
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            {checkoutSuccess ? (
              <>
                <CheckCircle size={16} />
                Saved!
              </>
            ) : holdToggle ? (
              'Hold Bill'
            ) : (
              'Checkout & Print'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '24px',
    height: 'calc(100vh - 100px)',
    paddingBottom: 0,
  },
  catalogColumn: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  },
  searchBlock: {
    marginBottom: '14px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 14px 12px 40px',
    fontSize: '0.875rem',
    border: '1px solid #dee2e6',
    borderRadius: '10px',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    fontFamily: 'inherit',
  },
  categoriesRow: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '8px',
    marginBottom: '16px',
    whiteSpace: 'nowrap',
  },
  categoryPill: {
    padding: '8px 16px',
    fontSize: '0.8rem',
    fontWeight: '600',
    borderRadius: '20px',
    border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '16px',
    overflowY: 'auto',
    flex: 1,
    paddingRight: '4px',
  },
  menuCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    borderRadius: '12px',
    cursor: 'pointer',
    justifyContent: 'space-between',
    minHeight: '120px',
  },
  menuCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  vegDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  categoryBadge: {
    fontSize: '0.65rem',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#0e0f11',
    lineHeight: 1.3,
  },
  itemPrice: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#000000',
    marginTop: '6px',
  },
  cartColumn: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '20px',
    overflow: 'hidden',
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f3f5',
    paddingBottom: '12px',
  },
  cartTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#0e0f11',
  },
  cartSubtitle: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  holdRow: {
    display: 'flex',
    alignItems: 'center',
  },
  holdLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#374151',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  checkbox: {
    width: '14px',
    height: '14px',
    accentColor: '#000000',
  },
  configBlock: {
    marginTop: '12px',
    borderBottom: '1px solid #f1f3f5',
    paddingBottom: '8px',
  },
  selectInput: {
    padding: '8px 10px',
    fontSize: '0.8rem',
    borderRadius: '6px',
  },
  inputField: {
    padding: '8px 10px',
    fontSize: '0.8rem',
    borderRadius: '6px',
  },
  cartItemsContainer: {
    flex: 1,
    overflowY: 'auto',
    margin: '12px 0',
    paddingRight: '2px',
  },
  emptyCart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cartItemRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #fbfbfc',
  },
  itemTitleBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: '40%',
  },
  vegDotMini: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  itemTitle: {
    fontSize: '0.825rem',
    fontWeight: '600',
    color: '#374151',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  qtyController: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    padding: '2px',
    backgroundColor: '#f8f9fa',
  },
  qtyBtn: {
    border: 'none',
    background: 'none',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#4b5563',
  },
  qtyText: {
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '0 6px',
    minWidth: '20px',
    textAlign: 'center',
  },
  itemRowPrice: {
    fontSize: '0.825rem',
    fontWeight: '700',
    color: '#0e0f11',
    width: '20%',
    textAlign: 'right',
  },
  trashBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '4px',
    marginLeft: '6px',
  },
  chargesRow: {
    display: 'flex',
    gap: '12px',
    padding: '8px 0',
    borderTop: '1px solid #f1f3f5',
  },
  calcBlock: {
    padding: '8px 0',
    borderTop: '1px solid #f1f3f5',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#0e0f11',
    marginTop: '6px',
    paddingTop: '6px',
    borderTop: '1px dashed #dee2e6',
  },
  actionsPanel: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  kotBtn: {
    flex: 1,
    padding: '10px',
    fontSize: '0.8rem',
    borderRadius: '8px',
  },
  checkoutBtn: {
    flex: 1.5,
    padding: '10px',
    fontSize: '0.8rem',
    borderRadius: '8px',
  }
};

export default Billing;
