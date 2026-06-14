import React, { createContext, useState, useEffect, useContext } from "react";
import { menuAPI, tableAPI, settingsAPI, orderAPI } from "../services/api";
import bluetoothPrinter from "../services/bluetoothPrinter";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [settings, setSettings] = useState({
    restaurantName: "Naidu Hotel",
    address: "123 Main Street, Bangalore",
    phone: "+91 9876543210",
    footerMessage: "Thank you! Visit again.",
    defaultPackingCharge: 10,
  });
  const [activeOrders, setActiveOrders] = useState([]);

  // Billing States
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState("Parcel");
  const [orderType, setOrderType] = useState("Parcel");
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [packing, setPacking] = useState(0);
  const [currentBillNo, setCurrentBillNo] = useState("NH-00001");
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [holdToggle, setHoldToggle] = useState(false);

  // Bluetooth States
  const [printerConnected, setPrinterConnected] = useState(false);
  const [printerName, setPrinterName] = useState("");

  // Fetch all initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, tableRes, settingsRes, nextBillRes, ordersRes] =
        await Promise.all([
          menuAPI.getAll(),
          tableAPI.getAll(),
          settingsAPI.get(),
          orderAPI.getNextBillNo(),
          orderAPI.getAll({ status: "Hold" }),
        ]);

      setMenuItems(menuRes.data);
      setTables(tableRes.data);
      if (settingsRes.data) {
        setSettings(settingsRes.data);
        if (!editingOrderId && orderType === "Parcel") {
          setPacking(settingsRes.data.defaultPackingCharge || 0);
        }
      }
      if (!editingOrderId) {
        setCurrentBillNo(nextBillRes.data.nextBillNo);
      }
      setActiveOrders(ordersRes.data);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync packing charge when order type changes
  useEffect(() => {
    if (!editingOrderId) {
      if (orderType === "Parcel") {
        setPacking(settings.defaultPackingCharge || 0);
      } else {
        setPacking(0);
      }
    }
  }, [orderType, settings, editingOrderId]);

  // Bluetooth actions
  const connectPrinter = async () => {
    try {
      const name = await bluetoothPrinter.connect();
      setPrinterConnected(true);
      setPrinterName(name);
      return name;
    } catch (error) {
      setPrinterConnected(false);
      setPrinterName("");
      throw error;
    }
  };

  const disconnectPrinter = () => {
    bluetoothPrinter.disconnect();
    setPrinterConnected(false);
    setPrinterName("");
  };

  // Cart actions
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.name === item.name);
      if (existing) {
        return prevCart.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prevCart,
        { name: item.name, price: item.price, quantity: 1, type: item.type },
      ];
    });
  };

  const removeFromCart = (name) => {
    setCart((prevCart) => prevCart.filter((item) => item.name !== name));
  };

  const updateCartQuantity = (name, qty) => {
    if (qty <= 0) {
      removeFromCart(name);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.name === name ? { ...item, quantity: qty } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setDiscount(0);
    setPacking(orderType === "Parcel" ? settings.defaultPackingCharge || 0 : 0);
    setHoldToggle(false);
    setEditingOrderId(null);
    setSelectedTable("Parcel");
    setOrderType("Parcel");
    orderAPI
      .getNextBillNo()
      .then((res) => setCurrentBillNo(res.data.nextBillNo));
  };

  // Calculations — NO GST
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const finalTotal = parseFloat(
    (subtotal + parseFloat(packing || 0) - parseFloat(discount || 0)).toFixed(
      2,
    ),
  );

  // Edit an existing order
  const loadOrderForEditing = (order) => {
    setEditingOrderId(order._id);
    setCurrentBillNo(order.billNo);
    setSelectedTable(order.table);
    setOrderType(order.type);
    setCustomerName(order.customerName || "");
    setDiscount(order.discount || 0);
    setPacking(order.packing || 0);
    setHoldToggle(order.status === "Hold");
    setCart(
      order.items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        type: item.type,
      })),
    );
  };

  const refreshOrdersAndTables = async () => {
    const [ordersRes, tablesRes] = await Promise.all([
      orderAPI.getAll({ status: "Hold" }),
      tableAPI.getAll(),
    ]);
    setActiveOrders(ordersRes.data);
    setTables(tablesRes.data);
  };

  return (
    <AppContext.Provider
      value={{
        loading,
        setLoading,
        menuItems,
        tables,
        settings,
        activeOrders,
        cart,
        selectedTable,
        orderType,
        customerName,
        discount,
        packing,
        currentBillNo,
        editingOrderId,
        holdToggle,
        printerConnected,
        printerName,
        subtotal,
        finalTotal,
        setMenuItems,
        setTables,
        setSettings,
        setCart,
        setSelectedTable,
        setOrderType,
        setCustomerName,
        setDiscount,
        setPacking,
        setHoldToggle,
        setEditingOrderId,
        fetchData,
        connectPrinter,
        disconnectPrinter,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        loadOrderForEditing,
        refreshOrdersAndTables,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
