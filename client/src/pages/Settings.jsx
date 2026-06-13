import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Search, CheckCircle, Wifi } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { menuAPI, settingsAPI } from '../services/api';
import BillPreview from '../components/BillPreview';
import bluetoothPrinter from '../services/bluetoothPrinter';

const SettingsPage = () => {
  const {
    menuItems,
    setMenuItems,
    settings,
    setSettings,
    connectPrinter,
    disconnectPrinter,
    printerConnected,
    printerName
  } = useApp();

  // Accordion Sections
  const [activeSection, setActiveSection] = useState('menu'); // menu, printer, preview

  // Menu Catalog State
  const [menuSearch, setMenuSearch] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemType, setItemType] = useState('Veg');
  const [editingItemId, setEditingItemId] = useState(null);

  // Printer Settings State
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [footerMsg, setFooterMsg] = useState('');
  const [packingCharge, setPackingCharge] = useState('');
  const [gstPct, setGstPct] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setStoreName(settings.restaurantName || '');
      setStoreAddress(settings.address || '');
      setStorePhone(settings.phone || '');
      setFooterMsg(settings.footerMessage || '');
      setPackingCharge(String(settings.defaultPackingCharge || 0));
      setGstPct(String(settings.gstPercentage || 5));
    }
  }, [settings]);

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  // Add or Edit Menu Item
  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !itemCategory) return;

    const itemData = {
      name: itemName,
      price: parseFloat(itemPrice),
      category: itemCategory,
      type: itemType,
      available: true
    };

    try {
      if (editingItemId) {
        const res = await menuAPI.update(editingItemId, itemData);
        setMenuItems(prev => prev.map(item => item._id === editingItemId ? res.data : item));
        setEditingItemId(null);
      } else {
        const res = await menuAPI.create(itemData);
        setMenuItems(prev => [...prev, res.data]);
      }
      setItemName('');
      setItemPrice('');
      setItemCategory('');
      setItemType('Veg');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleEditClick = (item) => {
    setEditingItemId(item._id);
    setItemName(item.name);
    setItemPrice(String(item.price));
    setItemCategory(item.category);
    setItemType(item.type);
  };

  const handleDeleteMenuItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await menuAPI.delete(id);
      setMenuItems(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  // Save Store Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const payload = {
      restaurantName: storeName,
      address: storeAddress,
      phone: storePhone,
      footerMessage: footerMsg,
      defaultPackingCharge: parseFloat(packingCharge || 0),
      gstPercentage: parseFloat(gstPct || 5)
    };

    try {
      const res = await settingsAPI.update(payload);
      setSettings(res.data);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (err) {
      alert('Failed to save settings');
    }
  };

  const handleBluetoothToggle = async () => {
    if (printerConnected) {
      disconnectPrinter();
    } else {
      try {
        await connectPrinter();
      } catch (err) {
        alert(err.message || 'Bluetooth connection cancelled.');
      }
    }
  };

  const handleTestPrint = async () => {
    try {
      await bluetoothPrinter.printTest();
    } catch (err) {
      alert('Bluetooth Print failed. Printed mock to console.');
    }
  };

  // Mock data for Bill Preview
  const mockOrder = {
    billNo: 'NH-00008',
    table: 'T-2',
    type: 'Dine-in',
    customerName: 'Aman Sharma',
    items: [
      { name: 'Chicken Biryani', price: 220, quantity: 2, type: 'Non-Veg' },
      { name: 'Lime Juice', price: 40, quantity: 1, type: 'Veg' }
    ],
    discount: 20,
    packing: 0,
    subtotal: 480,
    gst: parseFloat(((480 * parseFloat(gstPct || 5)) / 100).toFixed(2)),
    total: parseFloat((480 + ((480 * parseFloat(gstPct || 5)) / 100) - 20).toFixed(2)),
    date: new Date()
  };

  const filteredCatalog = menuItems.filter(item => 
    item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(menuSearch.toLowerCase())
  );

  return (
    <div className="page-container" style={styles.container}>
      {/* Accordion Container */}
      <div style={styles.accordionContainer}>
        
        {/* Section 1: Menu Catalog Management */}
        <div style={styles.accordionItem}>
          <div style={styles.accordionHeader} onClick={() => toggleSection('menu')}>
            <h3 style={styles.sectionTitle}>🍽 Menu Catalog Management</h3>
            {activeSection === 'menu' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          
          {activeSection === 'menu' && (
            <div style={styles.accordionBody}>
              {/* Form to Add Item */}
              <form onSubmit={handleSaveMenuItem} style={styles.menuForm}>
                <h4 style={styles.formTitle}>
                  {editingItemId ? '✏ Edit Menu Item' : '➕ Add Menu Item'}
                </h4>
                
                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1.5 }}>
                    <label className="form-label">Item Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Chicken Tikka" 
                      value={itemName} 
                      onChange={(e) => setItemName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ flex: 0.8 }}>
                    <label className="form-label">Price (₹)</label>
                    <input 
                      type="number" 
                      placeholder="Price" 
                      value={itemPrice} 
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Category</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Biryani, Starters" 
                      value={itemCategory} 
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="form-input"
                      list="categories-list"
                    />
                    <datalist id="categories-list">
                      {[...new Set(menuItems.map(i => i.category))].map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>

                  <div className="form-group" style={{ flex: 0.8 }}>
                    <label className="form-label">Type</label>
                    <select 
                      value={itemType} 
                      onChange={(e) => setItemType(e.target.value)}
                      className="form-select"
                    >
                      <option value="Veg">Veg</option>
                      <option value="Non-Veg">Non-Veg</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formActions}>
                  <button type="submit" className="btn btn-black" style={styles.saveItemBtn}>
                    {editingItemId ? 'Update Item' : 'Add Item'}
                  </button>
                  {editingItemId && (
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      onClick={() => {
                        setEditingItemId(null);
                        setItemName('');
                        setItemPrice('');
                        setItemCategory('');
                        setItemType('Veg');
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Items Catalog List */}
              <div style={{ marginTop: '24px' }}>
                <div style={styles.catalogHeaderRow}>
                  <h4 style={styles.formTitle}>Current Catalog</h4>
                  
                  <div style={styles.catalogSearchWrapper}>
                    <Search size={14} color="#adb5bd" style={styles.catalogSearchIcon} />
                    <input 
                      type="text" 
                      placeholder="Search catalog..." 
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      style={styles.catalogSearchInput}
                    />
                  </div>
                </div>

                <div className="table-container" style={{ marginTop: '12px' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCatalog.map(item => (
                        <tr key={item._id}>
                          <td style={{ fontWeight: '600' }}>{item.name}</td>
                          <td>{item.category}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                ...styles.dotMini,
                                backgroundColor: item.type === 'Veg' ? '#2b8a3e' : '#c92a2a'
                              }} />
                              <span>{item.type}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: '700' }}>₹{item.price}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={styles.actionBtnGroup}>
                              <button 
                                style={styles.actionBtn} 
                                onClick={() => handleEditClick(item)}
                                title="Edit Item"
                              >
                                <Edit2 size={14} color="#1c7ed6" />
                              </button>
                              <button 
                                style={styles.actionBtn} 
                                onClick={() => handleDeleteMenuItem(item._id, item.name)}
                                title="Delete Item"
                              >
                                <Trash2 size={14} color="#c92a2a" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Printer & Bill Settings */}
        <div style={styles.accordionItem}>
          <div style={styles.accordionHeader} onClick={() => toggleSection('printer')}>
            <h3 style={styles.sectionTitle}>🖨 Printer & Bill Settings</h3>
            {activeSection === 'printer' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          
          {activeSection === 'printer' && (
            <div style={styles.accordionBody}>
              <form onSubmit={handleSaveSettings} style={styles.settingsForm}>
                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Restaurant Name</label>
                    <input 
                      type="text" 
                      value={storeName} 
                      onChange={(e) => setStoreName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Phone</label>
                    <input 
                      type="text" 
                      value={storePhone} 
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input 
                    type="text" 
                    value={storeAddress} 
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Default Packing Charge (₹)</label>
                    <input 
                      type="number" 
                      value={packingCharge} 
                      onChange={(e) => setPackingCharge(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">GST Percentage (%)</label>
                    <input 
                      type="number" 
                      value={gstPct} 
                      onChange={(e) => setGstPct(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Footer Message</label>
                  <textarea 
                    rows="2" 
                    value={footerMsg} 
                    onChange={(e) => setFooterMsg(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <div style={styles.settingsFooterActions}>
                  <button type="submit" className="btn btn-black" style={{ gap: '6px' }}>
                    {settingsSaved ? (
                      <>
                        <CheckCircle size={16} />
                        Saved!
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </button>

                  <div style={styles.btBlock}>
                    <button 
                      type="button" 
                      className={`btn ${printerConnected ? 'btn-danger' : 'btn-outline'}`}
                      onClick={handleBluetoothToggle}
                      style={{ gap: '6px' }}
                    >
                      <Wifi size={16} />
                      {printerConnected ? `Disconnect ${printerName}` : 'Connect 58mm BT Printer'}
                    </button>
                    
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={handleTestPrint}
                    >
                      Test Print
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Section 3: Bill Preview */}
        <div style={styles.accordionItem}>
          <div style={styles.accordionHeader} onClick={() => toggleSection('preview')}>
            <h3 style={styles.sectionTitle}>📄 Live Receipt Preview</h3>
            {activeSection === 'preview' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          
          {activeSection === 'preview' && (
            <div style={styles.accordionBody}>
              <p style={styles.previewInstruction}>
                This shows a live layout simulation of how your receipts print on a 58mm thermal rolls.
              </p>
              
              <BillPreview 
                order={mockOrder} 
                settings={{
                  restaurantName: storeName,
                  address: storeAddress,
                  phone: storePhone,
                  footerMessage: footerMsg,
                  defaultPackingCharge: parseFloat(packingCharge || 0),
                  gstPercentage: parseFloat(gstPct || 5)
                }}
              />
            </div>
          )}
        </div>

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
  accordionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  accordionItem: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #f1f3f5',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    overflow: 'hidden',
  },
  accordionHeader: {
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid #fcfcfc',
    userSelect: 'none',
    backgroundColor: '#fafbfc',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  sectionTitle: {
    fontSize: '0.925rem',
    fontWeight: '700',
    color: '#0e0f11',
  },
  accordionBody: {
    padding: '24px',
    borderTop: '1px solid #f1f3f5',
  },
  menuForm: {
    borderBottom: '1px solid #f1f3f5',
    paddingBottom: '24px',
  },
  formTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#374151',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  saveItemBtn: {
    padding: '10px 24px',
  },
  catalogHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  catalogSearchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  catalogSearchIcon: {
    position: 'absolute',
    left: '10px',
  },
  catalogSearchInput: {
    padding: '6px 8px 6px 30px',
    fontSize: '0.8rem',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    outline: 'none',
    fontFamily: 'inherit',
    width: '200px',
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
  },
  dotMini: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
  },
  settingsForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  settingsFooterActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  btBlock: {
    display: 'flex',
    gap: '12px',
  },
  previewInstruction: {
    fontSize: '0.825rem',
    color: '#6b7280',
    marginBottom: '16px',
  }
};

export default SettingsPage;
