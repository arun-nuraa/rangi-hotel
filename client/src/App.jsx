import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Billing from './pages/Billing';
import NewParcel from './pages/NewParcel';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';

const Layout = () => {
  const { loading } = useApp();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="animate-spin" style={styles.spinner} />
        <p style={styles.loadingText}>Loading Naidu Hotel POS...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/new-parcel" element={<NewParcel />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout />
      </Router>
    </AppProvider>
  );
}

const styles = {
  loadingContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3.5px solid #e9ecef',
    borderTopColor: '#000000',
    borderRadius: '50%',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#343a40',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  }
};

export default App;
