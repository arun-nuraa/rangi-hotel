import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const [time, setTime] = useState('');

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const formattedHours = String(hours).padStart(2, '0');
      
      setTime(`${formattedHours}:${minutes} ${ampm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Title based on path
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/tables':
        return 'Tables';
      case '/billing':
        return 'Billing';
      case '/new-parcel':
        return 'New Parcel';
      case '/orders':
        return 'Orders';
      case '/reports':
        return 'Reports';
      case '/settings':
        return 'Settings';
      default:
        return 'POS';
    }
  };

  return (
    <header style={styles.header}>
      <div>
        <h2 style={styles.title}>{getPageTitle()}</h2>
        <p style={styles.subtitle}>
          {location.pathname === '/' ? 'Overview' : 
           location.pathname === '/tables' ? 'Manage, assign, and monitor tables' : 
           location.pathname === '/billing' ? 'Terminal' : 
           location.pathname === '/new-parcel' ? 'Takeout order billing' :
           location.pathname === '/orders' ? 'Order records and logs' :
           location.pathname === '/reports' ? 'Sales metrics and analytics' :
           'System configuration and catalogs'}
        </p>
      </div>

      <div style={styles.clockContainer}>
        <span style={styles.clock}>{time || '--:-- --'}</span>
      </div>
    </header>
  );
};

const styles = {
  header: {
    height: '70px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f3f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0e0f11',
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '2px',
    fontWeight: '500',
  },
  clockContainer: {
    backgroundColor: '#f1f3f5',
    padding: '6px 16px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
  },
  clock: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '0.825rem',
    fontWeight: '600',
    color: '#374151',
    letterSpacing: '0.05em',
  }
};

export default Header;
