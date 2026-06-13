import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Grid, Receipt, Box, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar = () => {
  const { tables, activeOrders } = useApp();

  // Active counts
  const occupiedCount = tables.filter(t => t.status === 'Occupied').length;
  const holdCount = activeOrders.length; // Hold orders list is fetched in context

  return (
    <aside style={styles.sidebar}>
      {/* Sidebar Header */}
      <div style={styles.header}>
        <div style={styles.logoSquare}>
          <span style={styles.logoText}>N</span>
        </div>
        <div style={styles.headerTitleContainer}>
          <h1 style={styles.brandName}>Naidu Hotel</h1>
          <p style={styles.subtitle}>Restaurant POS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={styles.nav}>
        <div style={styles.section}>
          <p style={styles.sectionTitle}>MAIN</p>
          
          <NavLink 
            to="/" 
            style={({ isActive }) => isActive ? { ...styles.link, ...styles.linkActive } : styles.link}
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard size={18} color={isActive ? '#0e0f11' : '#9ca3af'} />
                <span>Dashboard</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/tables" 
            style={({ isActive }) => isActive ? { ...styles.link, ...styles.linkActive } : styles.link}
          >
            {({ isActive }) => (
              <>
                <Grid size={18} color={isActive ? '#0e0f11' : '#9ca3af'} />
                <span style={{ flex: 1 }}>Tables</span>
                <span style={{
                  ...styles.badge, 
                  backgroundColor: isActive ? '#0e0f11' : '#1f2937',
                  color: isActive ? '#ffffff' : '#9ca3af'
                }}>{occupiedCount}</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/billing" 
            style={({ isActive }) => isActive ? { ...styles.link, ...styles.linkActive } : styles.link}
          >
            {({ isActive }) => (
              <>
                <Receipt size={18} color={isActive ? '#0e0f11' : '#9ca3af'} />
                <span>Billing</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/new-parcel" 
            style={({ isActive }) => isActive ? { ...styles.link, ...styles.linkActive } : styles.link}
          >
            {({ isActive }) => (
              <>
                <Box size={18} color={isActive ? '#0e0f11' : '#9ca3af'} />
                <span>New Parcel</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/orders" 
            style={({ isActive }) => isActive ? { ...styles.link, ...styles.linkActive } : styles.link}
          >
            {({ isActive }) => (
              <>
                <ClipboardList size={18} color={isActive ? '#0e0f11' : '#9ca3af'} />
                <span style={{ flex: 1 }}>Orders</span>
                {holdCount > 0 && (
                  <span style={{
                    ...styles.badge,
                    backgroundColor: isActive ? '#e02424' : '#b91c1c',
                    color: '#ffffff'
                  }}>{holdCount}</span>
                )}
              </>
            )}
          </NavLink>
        </div>

        <div style={styles.section}>
          <p style={styles.sectionTitle}>ANALYTICS</p>
          
          <NavLink 
            to="/reports" 
            style={({ isActive }) => isActive ? { ...styles.link, ...styles.linkActive } : styles.link}
          >
            {({ isActive }) => (
              <>
                <BarChart3 size={18} color={isActive ? '#0e0f11' : '#9ca3af'} />
                <span>Reports</span>
              </>
            )}
          </NavLink>
        </div>

        <div style={styles.section}>
          <p style={styles.sectionTitle}>SYSTEM</p>
          
          <NavLink 
            to="/settings" 
            style={({ isActive }) => isActive ? { ...styles.link, ...styles.linkActive } : styles.link}
          >
            {({ isActive }) => (
              <>
                <Settings size={18} color={isActive ? '#0e0f11' : '#9ca3af'} />
                <span>Settings</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: '#0e0f11',
    color: '#ffffff',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    borderRight: '1px solid #1f2937',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    padding: '0 8px',
  },
  logoSquare: {
    width: '40px',
    height: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logoText: {
    color: '#0e0f11',
    fontWeight: '800',
    fontSize: '1.25rem',
  },
  headerTitleContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandName: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sectionTitle: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#4b5563',
    letterSpacing: '0.1em',
    paddingLeft: '12px',
    marginBottom: '6px',
    textTransform: 'uppercase',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#9ca3af',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  linkActive: {
    backgroundColor: '#ffffff',
    color: '#0e0f11',
    fontWeight: '600',
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '12px',
    minWidth: '24px',
    textAlign: 'center',
  }
};

export default Sidebar;
