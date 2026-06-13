import React from 'react';

const BillPreview = ({ order, settings }) => {
  const {
    billNo = 'NH-00000',
    table = 'Parcel',
    type = 'Parcel',
    customerName = '',
    items = [],
    discount = 0,
    packing = 0,
    subtotal = 0,
    gst = 0,
    total = 0,
    date = new Date()
  } = order || {};

  const restName = settings?.restaurantName || 'Naidu Hotel';
  const restAddr = settings?.address || '123 Main Street, Bangalore';
  const restPhone = settings?.phone || '+91 9876543210';
  const footerMsg = settings?.footerMessage || 'Thank you! Visit again.';
  const gstPct = settings?.gstPercentage || 5;

  const formattedDate = new Date(date).toLocaleDateString();
  const formattedTime = new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.container}>
      <div style={styles.receiptPaper}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.boldText}>{restName.toUpperCase()}</h3>
          <p style={styles.text}>{restAddr}</p>
          <p style={styles.text}>Phone: {restPhone}</p>
        </div>

        {/* Separator */}
        <div style={styles.separator}>--------------------------------</div>

        {/* Metadata */}
        <div style={styles.metadata}>
          <p>BILL NO: {billNo}</p>
          <p>DATE: {formattedDate} {formattedTime}</p>
          <p>TYPE: {type.toUpperCase()} ({table})</p>
          {customerName && <p>CUST: {customerName.toUpperCase()}</p>}
        </div>

        {/* Separator */}
        <div style={styles.separator}>--------------------------------</div>

        {/* Items Header */}
        <div style={styles.itemRowHeader}>
          <span style={styles.itemColName}>ITEM</span>
          <span style={styles.itemColQty}>QTY</span>
          <span style={styles.itemColAmt}>AMT</span>
        </div>

        {/* Separator */}
        <div style={styles.separator}>--------------------------------</div>

        {/* Items List */}
        <div style={styles.itemList}>
          {items.map((item, index) => (
            <div key={index} style={styles.itemRow}>
              <span style={styles.itemColName}>{item.name.substring(0, 16).toUpperCase()}</span>
              <span style={styles.itemColQty}>{item.quantity}</span>
              <span style={styles.itemColAmt}>{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>

        {/* Separator */}
        <div style={styles.separator}>--------------------------------</div>

        {/* Calculation Summary */}
        <div style={styles.summaryBlock}>
          <div style={styles.summaryRow}>
            <span>SUBTOTAL:</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          {packing > 0 && (
            <div style={styles.summaryRow}>
              <span>PACKING:</span>
              <span>{packing.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div style={styles.summaryRow}>
              <span>DISCOUNT:</span>
              <span>-{discount.toFixed(2)}</span>
            </div>
          )}
          {gst > 0 && (
            <div style={styles.summaryRow}>
              <span>GST ({gstPct}%):</span>
              <span>{gst.toFixed(2)}</span>
            </div>
          )}
          <div style={{ ...styles.summaryRow, ...styles.boldText, fontSize: '14px', marginTop: '4px' }}>
            <span>TOTAL:</span>
            <span>Rs. {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Separator */}
        <div style={styles.separator}>--------------------------------</div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.text}>{footerMsg}</p>
          <p style={{ ...styles.text, marginTop: '8px', fontSize: '9px', color: '#9ca3af' }}>* MOCK RECEIPT PREVIEW *</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px',
    backgroundColor: '#f1f3f5',
    borderRadius: '12px',
    border: '1px dashed #ced4da',
  },
  receiptPaper: {
    width: '240px', // Roughly maps to 58mm width in browser
    backgroundColor: '#ffffff',
    border: '1px solid #ced4da',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    padding: '16px 12px',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '11px',
    lineHeight: 1.4,
    color: '#000000',
  },
  header: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  boldText: {
    fontWeight: '700',
    fontSize: '12px',
  },
  text: {
    margin: '2px 0',
  },
  separator: {
    textAlign: 'center',
    letterSpacing: '-1px',
    margin: '4px 0',
  },
  metadata: {
    margin: '6px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemRowHeader: {
    display: 'flex',
    fontWeight: '700',
  },
  itemList: {
    margin: '6px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemRow: {
    display: 'flex',
  },
  itemColName: {
    flex: 2,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  itemColQty: {
    flex: 1,
    textAlign: 'center',
  },
  itemColAmt: {
    flex: 1,
    textAlign: 'right',
  },
  summaryBlock: {
    margin: '6px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  footer: {
    textAlign: 'center',
    marginTop: '12px',
  }
};

export default BillPreview;
