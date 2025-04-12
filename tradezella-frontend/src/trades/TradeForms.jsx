import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TradeForm() {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    accountId: '',
    entry_price: '',
    position_size: '',
    direction: 'long',
    stop_loss: '',
    daily_trend: '',
    clean_range: false,
    volume_time: '',
    previous_session_volume: false,
    htf_setup: '',
    ltf_confirmation: ''
  });
  
  useEffect(() => {
    // Fetch user's trading accounts
    const fetchAccounts = async () => {
      const token = localStorage.getItem('token');
      
      try {
        const res = await axios.get('http://localhost:5000/api/accounts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setAccounts(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, accountId: res.data[0].account_id }));
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };
    
    fetchAccounts();
  }, []);
  
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    
    try {
      const res = await axios.post('http://localhost:5000/api/trades', {
        accountId: formData.accountId,
        tradeData: {
          entry_price: parseFloat(formData.entry_price),
          position_size: parseFloat(formData.position_size),
          direction: formData.direction,
          stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
          daily_trend: formData.daily_trend,
          clean_range: formData.clean_range,
          volume_time: formData.volume_time,
          previous_session_volume: formData.previous_session_volume,
          htf_setup: formData.htf_setup,
          ltf_confirmation: formData.ltf_confirmation
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Trade created successfully!');
      // Reset form or redirect
    } catch (error) {
      console.error('Error creating trade:', error);
      alert('Error creating trade');
    }
  };
  
  return (
    <div className="trade-form">
      <h2>New Trade Entry</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Trading Account</label>
          <select name="accountId" value={formData.accountId} onChange={handleChange} required>
            <option value="">Select Account</option>
            {accounts.map(account => (
              <option key={account.account_id} value={account.account_id}>
                {account.account_name} (${account.current_balance})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Direction</label>
          <select name="direction" value={formData.direction} onChange={handleChange} required>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Entry Price</label>
          <input 
            type="number" 
            name="entry_price" 
            value={formData.entry_price} 
            onChange={handleChange} 
            step="0.01" 
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Position Size</label>
          <input 
            type="number" 
            name="position_size" 
            value={formData.position_size} 
            onChange={handleChange} 
            step="0.01" 
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Stop Loss</label>
          <input 
            type="number" 
            name="stop_loss" 
            value={formData.stop_loss} 
            onChange={handleChange} 
            step="0.01" 
          />
        </div>
        
        <h3>Pre-Entry Analysis</h3>
        
        <div className="form-group">
          <label>Daily Trend</label>
          <select name="daily_trend" value={formData.daily_trend} onChange={handleChange}>
            <option value="">Select</option>
            <option value="uptrend">Uptrend</option>
            <option value="downtrend">Downtrend</option>
            <option value="sideways">Sideways</option>
          </select>
        </div>
        
        <div className="form-check">
          <label>
            <input 
              type="checkbox" 
              name="clean_range" 
              checked={formData.clean_range} 
              onChange={handleChange} 
            />
            Clean Range
          </label>
        </div>
        
        <div className="form-group">
          <label>Volume Time</label>
          <select name="volume_time" value={formData.volume_time} onChange={handleChange}>
            <option value="">Select</option>
            <option value="London session">London Session</option>
            <option value="NY session">NY Session</option>
            <option value="Asian session">Asian Session</option>
            <option value="London/NY overlap">London/NY Overlap</option>
          </select>
        </div>
        
        {/* Additional form fields for pre-analysis */}
        
        <button type="submit" className="btn-primary">Enter Trade</button>
      </form>
    </div>
  );
}

export default TradeForm;