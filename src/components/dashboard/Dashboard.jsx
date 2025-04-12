import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

function Dashboard() {
  const [performanceData, setPerformanceData] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState({});
  const [latestPrice, setLatestPrice] = useState({});
  
  useEffect(() => {
    // Fetch dashboard data
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      
      try {
        const performanceRes = await axios.get('http://localhost:5000/api/analytics/performance?interval=monthly', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const riskRes = await axios.get('http://localhost:5000/api/analytics/risk-metrics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const priceRes = await axios.get('http://localhost:5000/api/market/price', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPerformanceData(performanceRes.data);
        setRiskMetrics(riskRes.data);
        setLatestPrice(priceRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <div className="dashboard">
      <h1>Trading Dashboard</h1>
      
      <div className="overview-cards">
        <div className="card">
          <h3>Win Rate</h3>
          <p className="metric">{riskMetrics.win_rate?.toFixed(1)}%</p>
        </div>
        
        <div className="card">
          <h3>Profit Factor</h3>
          <p className="metric">{riskMetrics.profit_factor?.toFixed(2)}</p>
        </div>
        
        <div className="card">
          <h3>Gold Price</h3>
          <p className="metric">${latestPrice.price?.toFixed(2)}</p>
          <p className={latestPrice.change > 0 ? "positive" : "negative"}>
            {latestPrice.change > 0 ? "+" : ""}{latestPrice.change?.toFixed(2)} ({latestPrice.percent_change?.toFixed(2)}%)
          </p>
        </div>
      </div>
      
      <div className="charts">
        <div className="chart-container">
          <h3>Performance Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time_period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="period_pnl" stroke="#8884d8" name="Profit/Loss" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <h3>Win vs Loss Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time_period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="winning_trades" fill="#4CAF50" name="Wins" />
              <Bar dataKey="losing_trades" fill="#F44336" name="Losses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;