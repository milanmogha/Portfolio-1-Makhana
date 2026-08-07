// src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllOrders } from '../api/orderApi';
import AdminNavbar from './Navbar';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import '../css/Dashboard.css';

// --- Helper Components ---
const SalesCard = ({ value, title, change }) => (
  <div className="bw-sales-card">
    <span className="bw-sales-value">{value}</span>
    <span className="bw-sales-title">{title}</span>
    <span className="bw-sales-change">{change}</span>
  </div>
);

const ProductRow = ({ number, name, popularity }) => (
  <div className="bw-product-row">
    <span className="bw-product-number">{number}</span>
    <span className="bw-product-name">{name || '[Unnamed Product]'}</span>
    <div className="bw-popularity-bar">
      <div style={{ width: `${popularity}%` }}></div>
    </div>
    <span className="bw-sales-percent-box">{`${Math.round(popularity)}%`}</span>
  </div>
);


export default function Dashboard() {
  const navigate = useNavigate();
  // Main data from your API
  const [orders, setOrders] = useState([]);
  
  // State for different UI components, derived from orders
  const [salesData, setSalesData] = useState({ today: 0, totalOrders: 0, productsSold: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [earningsData, setEarningsData] = useState({ total: 0, profitMargin: 0.2 }); // Assuming 20% profit
  const [monthlyOrderData, setMonthlyOrderData] = useState([]);
  const [revenueChartData, setRevenueChartData] = useState([]);

  // Control states
  const [view, setView] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Logout Handler
  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Fetch and Process Data
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) navigate('/login');

    const loadAndProcessData = async () => {
      try {
        setLoading(true);
        const fetchedOrders = await fetchAllOrders(adminToken);
        setOrders(fetchedOrders);

        if (fetchedOrders && fetchedOrders.length > 0) {
          const now = new Date();
          const todayStr = now.toDateString();
          let todayRevenue = 0;
          let totalProductsSold = 0;
          const productCount = new Map();

          fetchedOrders.forEach(order => {
            const orderDate = new Date(order.createdAt).toDateString();
            const revenue = order.paymentBreakdown?.total || 0;

            if (orderDate === todayStr) {
              todayRevenue += revenue;
            }
            
            if (order.products && Array.isArray(order.products)) {
                order.products.forEach(p => {
                    const qty = Number(p.quantity) || 0;
                    totalProductsSold += qty;
                    const productName = (p.product && p.product.name) || p.name || '[Unnamed Product]';
                    productCount.set(productName, (productCount.get(productName) || 0) + qty);
                });
            }
          });

          setSalesData({
            today: todayRevenue,
            totalOrders: fetchedOrders.filter(o => new Date(o.createdAt).toDateString() === todayStr).length,
            productsSold: totalProductsSold,
          });
          
          const sortedProducts = [...productCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
          const totalTopProductItems = sortedProducts.reduce((sum, [, count]) => sum + count, 0);
          
          setTopProducts(sortedProducts.map(([name, count]) => ({
              name,
              count,
              popularity: totalTopProductItems > 0 ? (count / totalTopProductItems) * 100 : 0,
          })));
          
          const totalRevenue = fetchedOrders.reduce((sum, o) => sum + (o.paymentBreakdown?.total || 0), 0);
          setEarningsData(prev => ({ ...prev, total: totalRevenue }));

          const monthlyOrders = new Array(12).fill(0);
          fetchedOrders.forEach(order => {
              const month = new Date(order.createdAt).getMonth();
              monthlyOrders[month]++;
          });
          setMonthlyOrderData(monthlyOrders.map((count, i) => ({
              name: new Date(0, i).toLocaleString('default', { month: 'short' }),
              'Orders': count
          })));
        }

      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    loadAndProcessData();
  }, [navigate]);

  // Process data for the main revenue chart
  useEffect(() => {
    if (!orders || orders.length === 0) return;
    
    const formatDay = (date) => date.toLocaleString('default', { month: 'short', day: 'numeric' });
    const now = new Date();
    let dataAggregator;

    if (view === 'today') {
      dataAggregator = Array.from({ length: 24 }, (_, i) => ({ label: `${i.toString().padStart(2, '0')}:00`, revenue: 0 }));
      orders.forEach(o => {
        const d = new Date(o.createdAt);
        if (d.toDateString() === now.toDateString()) {
          dataAggregator[d.getHours()].revenue += o.paymentBreakdown?.total || 0;
        }
      });
    } else {
      const days = view === 'week' ? 7 : 30;
      const dateMap = new Map();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        dateMap.set(d.toDateString(), { label: formatDay(d), revenue: 0 });
      }
      orders.forEach(o => {
        const key = new Date(o.createdAt).toDateString();
        if (dateMap.has(key)) {
          dateMap.get(key).revenue += o.paymentBreakdown?.total || 0;
        }
      });
      dataAggregator = Array.from(dateMap.values());
    }
    setRevenueChartData(dataAggregator);
  }, [orders, view]);


  if (loading) return <div className="bw-dashboard-loading">Loading...</div>;
  if (error) return <div className="bw-dashboard-error">{error}</div>;

  return (
    <>
      <AdminNavbar onLogout={logout} />
      <div className="bw-dashboard-container">
        {/* Using a div with a specific class for the grid */}
        <div className="bw-dashboard-grid">
          
          <div className="bw-grid-card today-sales">
            <h2 className="bw-card-title">Today's Sales</h2>
            <div className="bw-sales-cards-container">
              <SalesCard value={`₹${salesData.today.toLocaleString('en-IN')}`} title="Total Sales" change="+10%" />
              <SalesCard value={salesData.totalOrders} title="Total Orders" change="+8%" />
              <SalesCard value={salesData.productsSold} title="Products Sold" change="+2%" />
            </div>
          </div>

          <div className="bw-grid-card top-products">
            <h2 className="bw-card-title">Top Products</h2>
            <div className="bw-product-table-header">
                <span>#</span>
                <span>Name</span>
                <span>Popularity</span>
                <span>Sales</span>
            </div>
            <div className="bw-product-list">
                {topProducts.length > 0 ? (
                    topProducts.map((p, i) => (
                        <ProductRow key={p.name + i} number={`${i+1}`.padStart(2, '0')} name={p.name} popularity={p.popularity} />
                    ))
                ) : (
                    <p className="no-data">No products sold yet.</p>
                )}
            </div>
          </div>

          <div className="bw-grid-card customer-fulfilment">
            <div className="bw-chart-header">
              <h2 className="bw-card-title">Customer Fulfilment</h2>
              <div className="bw-view-toggle">
                <button className={`bw-toggle-btn ${view === 'today' ? 'active' : ''}`} onClick={() => setView('today')}>Today</button>
                <button className={`bw-toggle-btn ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>Week</button>
                <button className={`bw-toggle-btn ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>Month</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <Tooltip contentStyle={{ backgroundColor: '#fffaf3', border: '1px solid #e2d6c5' }} formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                <XAxis dataKey="label" tick={{ fill: '#6b5744', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="revenue" stroke="#b46b2c" strokeWidth={2.4} fill="#b46b2c" fillOpacity={0.18} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bw-grid-card earnings">
            <h2 className="bw-card-title">Earnings</h2>
            <p className="bw-earnings-total">₹{(earningsData.total * earningsData.profitMargin).toLocaleString('en-IN')}</p>
            <p className="bw-earnings-subtitle">Estimated profit from total sales</p>
          </div>

          <div className="bw-grid-card visitor-insights">
            <h2 className="bw-card-title">Visitor Insights</h2>
             <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyOrderData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <Tooltip contentStyle={{ backgroundColor: '#fffaf3', border: '1px solid #e2d6c5' }} />
                    <XAxis dataKey="name" tick={{ fill: '#6b5744', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Bar dataKey="Orders" fill="#5d7c4f" fillOpacity={0.9} radius={[10, 10, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </>
  );
}
