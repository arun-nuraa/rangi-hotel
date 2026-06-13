import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Calendar, Download, Upload, FileSpreadsheet, FileText, Database } from 'lucide-react';
import { orderAPI, backupAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const Reports = () => {
  const { fetchData } = useApp();

  // Tab navigation
  const [period, setPeriod] = useState('today'); // today, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sub-tabs
  const [subTab, setSubTab] = useState('orders'); // orders, items

  // Report Data
  const [reportData, setReportData] = useState({
    orders: [],
    totalRevenue: 0,
    totalOrders: 0,
    itemSalesReport: []
  });
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getSalesReport({
        period,
        startDate: period === 'custom' ? startDate : '',
        endDate: period === 'custom' ? endDate : ''
      });
      setReportData(res.data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (startDate && endDate)) {
      fetchReport();
    }
  }, [period, startDate, endDate]);

  // Export PDF using jsPDF
  const exportPDF = () => {
    const doc = new jsPDF();
    const lineSpacing = 8;
    let y = 20;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('NAIDU HOTEL — SALES REPORT', 20, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Report Period: ${period.toUpperCase()}`, 20, y);
    if (period === 'custom') {
      doc.text(`Range: ${startDate} to ${endDate}`, 100, y);
    }
    y += 10;
    doc.text(`Generated At: ${new Date().toLocaleString()}`, 20, y);
    y += 15;

    // Summary Cards
    doc.rect(20, y, 80, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL REVENUE', 25, y + 7);
    doc.setFontSize(14);
    doc.text(`Rs. ${reportData.totalRevenue.toFixed(2)}`, 25, y + 15);

    doc.rect(110, y, 80, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL ORDERS', 115, y + 7);
    doc.setFontSize(14);
    doc.text(`${reportData.totalOrders}`, 115, y + 15);

    y += 30;

    // Sub-tables
    if (subTab === 'orders') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('ORDER SUMMARY REPORT', 20, y);
      y += 8;

      // Table Header
      doc.setFontSize(9);
      doc.text('Bill No', 20, y);
      doc.text('Table/Type', 50, y);
      doc.text('Customer', 85, y);
      doc.text('Date', 125, y);
      doc.text('Amount (Rs)', 170, y);
      y += 4;
      doc.line(20, y, 190, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      reportData.orders.forEach((order) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(order.billNo, 20, y);
        doc.text(`${order.type} (${order.table})`, 50, y);
        doc.text(order.customerName || '-', 85, y);
        doc.text(new Date(order.date).toLocaleDateString(), 125, y);
        doc.text(order.total.toFixed(2), 170, y, { align: 'right' });
        y += lineSpacing;
      });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('ITEM-WISE SALES REPORT', 20, y);
      y += 8;

      // Table Header
      doc.setFontSize(9);
      doc.text('Item Name', 20, y);
      doc.text('Type', 80, y);
      doc.text('Qty Sold', 110, y);
      doc.text('Revenue (Rs)', 150, y);
      y += 4;
      doc.line(20, y, 190, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      reportData.itemSalesReport.forEach((item) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(item.name, 20, y);
        doc.text(item.type, 80, y);
        doc.text(String(item.quantity), 110, y);
        doc.text(item.revenue.toFixed(2), 150, y);
        y += lineSpacing;
      });
    }

    doc.save(`Sales_Report_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export Excel using XLSX
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Orders
    const ordersData = reportData.orders.map(o => ({
      'Bill Number': o.billNo,
      'Order Type': o.type,
      'Table Number': o.table,
      'Customer Name': o.customerName || '-',
      'Date': new Date(o.date).toLocaleString(),
      'Subtotal (Rs)': o.subtotal,
      'GST (Rs)': o.gst,
      'Packing (Rs)': o.packing,
      'Discount (Rs)': o.discount,
      'Total (Rs)': o.total,
      'Status': o.status
    }));
    const wsOrders = XLSX.utils.json_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders Report');

    // Sheet 2: Items
    const itemsData = reportData.itemSalesReport.map(i => ({
      'Item Name': i.name,
      'Type': i.type,
      'Quantity Sold': i.quantity,
      'Total Revenue (Rs)': i.revenue
    }));
    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, wsItems, 'Item Sales Report');

    XLSX.writeFile(wb, `Sales_Report_${period}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Backup JSON download
  const handleBackupExport = async () => {
    try {
      const res = await backupAPI.export();
      const fileData = JSON.stringify(res.data, null, 2);
      const blob = new Blob([fileData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `Naidu_Hotel_DB_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;
      link.click();
    } catch (err) {
      alert('Failed to export backup JSON.');
    }
  };

  // Restore JSON upload
  const handleBackupRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('WARNING: Restoring will overwrite all current menu items, tables, orders, and settings. Proceed?')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        const res = await backupAPI.restore(jsonData);
        alert(res.data.message || 'Database restored successfully!');
        fetchData(); // reload global context
        fetchReport(); // reload report
      } catch (err) {
        alert('Failed to restore. Please upload a valid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="page-container" style={styles.container}>
      {/* Top Filter Bar and Export Panel */}
      <div className="card" style={styles.topBar}>
        <div style={styles.tabGroup}>
          <button 
            onClick={() => setPeriod('today')}
            style={{
              ...styles.tabBtn,
              backgroundColor: period === 'today' ? '#000000' : 'transparent',
              color: period === 'today' ? '#ffffff' : '#4b5563',
            }}
          >
            Today
          </button>
          <button 
            onClick={() => setPeriod('month')}
            style={{
              ...styles.tabBtn,
              backgroundColor: period === 'month' ? '#000000' : 'transparent',
              color: period === 'month' ? '#ffffff' : '#4b5563',
            }}
          >
            This Month
          </button>
          <button 
            onClick={() => setPeriod('custom')}
            style={{
              ...styles.tabBtn,
              backgroundColor: period === 'custom' ? '#000000' : 'transparent',
              color: period === 'custom' ? '#ffffff' : '#4b5563',
            }}
          >
            Custom Range
          </button>

          {period === 'custom' && (
            <div style={styles.customDateBlock}>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                style={styles.dateInput}
              />
              <span style={{ color: '#9ca3af' }}>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={styles.dateInput}
              />
            </div>
          )}
        </div>

        {/* Action Panel Buttons */}
        <div style={styles.actionsPanel}>
          <button className="btn btn-outline" style={styles.actionBtn} onClick={exportPDF}>
            <FileText size={16} />
            Export PDF
          </button>
          <button className="btn btn-outline" style={styles.actionBtn} onClick={exportExcel}>
            <FileSpreadsheet size={16} />
            Export Excel
          </button>
          <button className="btn btn-outline" style={styles.actionBtn} onClick={handleBackupExport}>
            <Database size={16} />
            Backup JSON
          </button>
          
          <label className="btn btn-outline" style={{ ...styles.actionBtn, cursor: 'pointer', margin: 0 }}>
            <Upload size={16} />
            Restore JSON
            <input 
              type="file" 
              accept=".json" 
              onChange={handleBackupRestore} 
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={styles.summaryGrid}>
        <div className="card" style={styles.summaryCard}>
          <p style={styles.summaryLabel}>TOTAL REVENUE</p>
          <h3 style={styles.summaryValue}>₹{reportData.totalRevenue.toFixed(2)}</h3>
        </div>
        <div className="card" style={styles.summaryCard}>
          <p style={styles.summaryLabel}>TOTAL BILLS</p>
          <h3 style={styles.summaryValue}>{reportData.totalOrders}</h3>
        </div>
      </div>

      {/* Table Section */}
      <div className="card" style={styles.tableBlock}>
        {/* Table Selector Sub-tabs */}
        <div style={styles.subTabsRow}>
          <button 
            onClick={() => setSubTab('orders')}
            style={{
              ...styles.subTabBtn,
              borderBottomColor: subTab === 'orders' ? '#000000' : 'transparent',
              color: subTab === 'orders' ? '#000000' : '#868e96',
              fontWeight: subTab === 'orders' ? '700' : '500'
            }}
          >
            Order Report
          </button>
          <button 
            onClick={() => setSubTab('items')}
            style={{
              ...styles.subTabBtn,
              borderBottomColor: subTab === 'items' ? '#000000' : 'transparent',
              color: subTab === 'items' ? '#000000' : '#868e96',
              fontWeight: subTab === 'items' ? '700' : '500'
            }}
          >
            Item Sales Report
          </button>
        </div>

        {/* Dynamic Table Loader */}
        <div style={{ marginTop: '20px' }}>
          {loading ? (
            <div style={styles.loaderWrapper}>
              <div className="animate-spin" style={styles.spinner} />
              <p style={{ marginTop: '12px', color: '#6b7280' }}>Loading report data...</p>
            </div>
          ) : subTab === 'orders' ? (
            // Orders List
            reportData.orders.length === 0 ? (
              <div style={styles.emptyState}>No data available for this range</div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Bill No</th>
                      <th>Table / Type</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.map((o) => (
                      <tr key={o._id}>
                        <td style={{ fontWeight: '700' }}>{o.billNo}</td>
                        <td>{o.table === 'Parcel' ? 'Parcel' : `Table ${o.table}`}</td>
                        <td>{o.customerName || '-'}</td>
                        <td>{new Date(o.date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: '700' }}>₹{o.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Item Wise report
            reportData.itemSalesReport.length === 0 ? (
              <div style={styles.emptyState}>No data available for this range</div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Type</th>
                      <th>Qty Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.itemSalesReport.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{item.name}</td>
                        <td>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            backgroundColor: item.type === 'Veg' ? '#ebfbee' : '#fff5f5',
                            color: item.type === 'Veg' ? '#2b8a3e' : '#c92a2a'
                          }}>
                            {item.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700' }}>{item.quantity}</td>
                        <td style={{ fontWeight: '700' }}>₹{item.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
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
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  tabGroup: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  tabBtn: {
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.825rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  customDateBlock: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginLeft: '12px',
  },
  dateInput: {
    padding: '6px 10px',
    fontSize: '0.8rem',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  actionsPanel: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '8px 14px',
    fontSize: '0.8rem',
    gap: '6px',
    borderRadius: '8px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
  },
  summaryCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: '0.725rem',
    fontWeight: '700',
    color: '#868e96',
    letterSpacing: '0.05em',
  },
  summaryValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#0e0f11',
    marginTop: '6px',
  },
  tableBlock: {
    minHeight: '300px',
    padding: '20px',
  },
  subTabsRow: {
    display: 'flex',
    borderBottom: '1px solid #dee2e6',
    gap: '24px',
  },
  subTabBtn: {
    border: 'none',
    background: 'none',
    borderBottom: '2px solid transparent',
    paddingBottom: '10px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  loaderWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid #dee2e6',
    borderTopColor: '#000000',
    borderRadius: '50%',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '160px',
    color: '#868e96',
    fontSize: '0.85rem',
    fontWeight: '500',
  }
};

export default Reports;
