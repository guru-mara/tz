import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, AreaChart, Area, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

function Analytics() {
  const [timeframe, setTimeframe] = useState('monthly');
  const [performanceData, setPerformanceData] = useState([]);
  const [factorData, setFactorData] = useState([]);
  const [factor, setFactor] = useState('direction');
  
  useEffect(() => {
    fetchPerformanceData();
  }, [timeframe]);
  
  useEffect(() => {
    fetchFactorData();
  }, [factor]);
  
  const fetchPerformanceData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const res = await axios.get(`http://localhost:5000/api/analytics/performance?interval=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPerformanceData(res.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };
  
  const fetchFactorData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const res = await axios.get(`http://localhost:5000/api/analytics/factors?factor=${factor}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFactorData(res.data);
    } catch (error) {
      console.error('Error fetching factor data:', error);
    }
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  return (
    <div className="analytics">
      <h1>Trading Analytics</h1>
      
      <div className="timeframe-selector">
        <button 
          className={timeframe === 'daily' ? 'active' : ''} 
          onClick={() => setTimeframe('daily')}
        >
          Daily
        </button>
        <button 
          className={timeframe === 'weekly' ? 'active' : ''} 
          onClick={() => setTimeframe('weekly')}
        >
          Weekly
        </button>
        <button 
          className={timeframe === 'monthly' ? 'active' : ''} 
          onClick={() => setTimeframe('monthly')}
        >
          Monthly
        </button>
      </div>
      
      <div className="chart-container">
        <h3>Equity Curve</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time_period" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="period_pnl" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-container">
        <h3>Win Rate by Factor</h3>
        <div className="factor-selector">
          <select value={factor} onChange={(e) => setFactor(e.target.value)}>
            <option value="direction">Direction</option>
            <option value="daily_trend">Daily Trend</option>
            <option value="volume_time">Volume Time</option>
            <option value="htf_setup">HTF Setup</option>
            <option value="emotional_state">Emotional State</option>
          </select>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={factorData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="factor" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="win_rate" fill="#8884d8" name="Win Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-container">
        <h3>Profit Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={performanceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="total_pnl"
              nameKey="time_period"
            >
              {performanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Analytics;