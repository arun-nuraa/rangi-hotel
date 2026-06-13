import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Grid,
  IndianRupee,
  FileText,
  Utensils,
  Play,
  Plus,
  Receipt,
  Box,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { orderAPI } from "../services/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    clearCart,
    setOrderType,
    setSelectedTable,
    loadOrderForEditing,
    refreshOrdersAndTables,
    activeOrders,
  } = useApp();

  const [stats, setStats] = useState({
    activeTables: 0,
    totalTables: 0,
    todaySales: 0,
    yesterdaySales: 0,
    todayOrdersCount: 0,
    yesterdayOrdersCount: 0,
    menuItemsCount: 0,
    categoriesCount: 0,
  });

  const loadStats = async () => {
    try {
      const res = await orderAPI.getSummary();
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
    }
  };

  useEffect(() => {
    loadStats();
    refreshOrdersAndTables();
  }, []);

  const handleStartNewBill = () => {
    clearCart();
    setOrderType("Dine-in");
    setSelectedTable("Parcel");
    navigate("/billing");
  };

  const handleStartParcelBill = () => {
    clearCart();
    setOrderType("Parcel");
    setSelectedTable("Parcel");
    navigate("/billing");
  };

  const handleOpenHoldBill = (order) => {
    loadOrderForEditing(order);
    navigate("/billing");
  };

  return (
    <div className="page-container" style={styles.container}>
      {/* 4 Stat Cards */}
      <div style={styles.statsGrid}>
        {/* Active Tables */}
        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconContainer, backgroundColor: "#111827" }}>
            <Grid color="#ffffff" size={20} />
          </div>
          <div style={styles.statInfo}>
            <p style={styles.statLabel}>TABLES ACTIVE</p>
            <h3 style={styles.statValue}>{stats.activeTables}</h3>
            <p style={styles.statSub}>of {stats.totalTables} tables</p>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconContainer, backgroundColor: "#ebfbee" }}>
            <IndianRupee color="#2b8a3e" size={20} />
          </div>
          <div style={styles.statInfo}>
            <p style={styles.statLabel}>TODAY'S SALES</p>
            <h3 style={styles.statValue}>₹{stats.todaySales}</h3>
            <p style={styles.statSub}>₹{stats.yesterdaySales} (Yesterday's)</p>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconContainer, backgroundColor: "#fff9db" }}>
            <FileText color="#f08c00" size={20} />
          </div>
          <div style={styles.statInfo}>
            <p style={styles.statLabel}>TODAY'S ORDERS</p>
            <h3 style={styles.statValue}>{stats.todayOrdersCount}</h3>
            <p style={styles.statSub}>
              {stats.yesterdayOrdersCount} (Yesterday's)
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconContainer, backgroundColor: "#fff5f5" }}>
            <Utensils color="#c92a2a" size={20} />
          </div>
          <div style={styles.statInfo}>
            <p style={styles.statLabel}>MENU ITEMS</p>
            <h3 style={styles.statValue}>{stats.menuItemsCount}</h3>
            <p style={styles.statSub}>{stats.categoriesCount} categories</p>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div style={styles.mainGrid}>
        {/* Hold/Saved Bills Table */}
        <div className="card" style={styles.holdCard}>
          <div style={styles.cardHeader}>
            <div style={styles.headerTitleGroup}>
              <span style={{ fontSize: "1rem", fontWeight: "bold" }}>
                ⏸ Hold / Saved Bills
              </span>
            </div>
            <Link to="/orders?status=Hold" style={styles.viewAllLink}>
              View All
            </Link>
          </div>

          <div className="table-container" style={{ marginTop: "16px" }}>
            {activeOrders.length === 0 ? (
              <div style={styles.emptyState}>
                <Receipt size={32} color="#9ca3af" />
                <p
                  style={{
                    marginTop: "8px",
                    color: "#6b7280",
                    fontSize: "0.875rem",
                  }}
                >
                  No bills on hold currently
                </p>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>BILL</th>
                    <th>TABLE / TYPE</th>
                    <th>CUSTOMER</th>
                    <th>AMOUNT</th>
                    <th style={{ textAlign: "right" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.slice(0, 5).map((order) => (
                    <tr key={order._id}>
                      <td style={{ fontWeight: "600" }}>{order.billNo}</td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            backgroundColor: "#e8f7ff",
                            color: "#1c7ed6",
                          }}
                        >
                          {order.table === "Parcel" ? "Parcel" : order.table}
                        </span>
                      </td>
                      <td>{order.customerName || "-"}</td>
                      <td style={{ fontWeight: "600" }}>₹{order.total}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-black"
                          style={styles.openBtn}
                          onClick={() => handleOpenHoldBill(order)}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="card" style={styles.actionsCard}>
          <h4 style={styles.actionsTitle}>⚡ Quick Actions</h4>
          <div style={styles.actionsGroup}>
            <button
              className="btn btn-black"
              style={styles.actionBtn}
              onClick={handleStartNewBill}
            >
              <Plus size={16} />
              Start New Bill
            </button>
            <button
              className="btn btn-outline"
              style={styles.actionBtn}
              onClick={handleStartParcelBill}
            >
              <Box size={16} />
              Start Parcel Bill
            </button>
            <button
              className="btn btn-outline"
              style={styles.actionBtn}
              onClick={() => navigate("/reports")}
            >
              <Play size={16} style={{ transform: "rotate(-90deg)" }} />
              View Today Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
  },
  iconContainer: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
  },
  statLabel: {
    fontSize: "0.7rem",
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: "0.05em",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#111827",
    margin: "2px 0",
  },
  statSub: {
    fontSize: "0.725rem",
    color: "#6b7280",
    fontWeight: "500",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "7fr 3fr",
    gap: "20px",
    alignItems: "start",
  },
  holdCard: {
    minHeight: "260px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f1f3f5",
    paddingBottom: "12px",
  },
  headerTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  viewAllLink: {
    fontSize: "0.825rem",
    fontWeight: "600",
    color: "#000000",
    textDecoration: "none",
    borderBottom: "1.5px solid #000000",
    paddingBottom: "2px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "160px",
  },
  openBtn: {
    padding: "6px 14px",
    fontSize: "0.75rem",
    borderRadius: "6px",
  },
  actionsCard: {
    padding: "24px",
  },
  actionsTitle: {
    fontSize: "0.875rem",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "16px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  actionsGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  actionBtn: {
    width: "100%",
    padding: "12px",
    justifyContent: "flex-start",
    gap: "10px",
    fontSize: "0.85rem",
  },
  // Responsive rules inside CSS
};

export default Dashboard;
