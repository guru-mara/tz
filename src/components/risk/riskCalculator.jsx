import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RiskCalculator() {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    accountId: '',
    riskPercent: 1,
    entryPrice: '',
    stopLossPrice: '',
    direction: 'long'
  });
  const [result, setResult] = useState(null);
  
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    
    try {
      const res = await axios.post('http://localhost:5000/api/risk/position-size', {
        accountId: formData.accountId,
        riskPercent: parseFloat(formData.riskPercent),
        entryPrice: parseFloat(formData.entryPrice),
        stopLossPrice: parseFloat(formData.stopLossPrice),
        direction: formData.direction
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResult(res.data);
    } catch (error) {
      console.error('Error calculating position size:', error);
      alert('Error calculating position size');
    }
  };
  
  return (
    <div className="risk-calculator">
      <h2>Position Size Calculator</h2>
      
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
          <label>Risk Percentage</label>
          <input 
            type="number" 
            name="riskPercent" 
            value={formData.riskPercent} 
            onChange={handleChange} 
            step="0.1" 
            min="0.1" 
            max="10" 
            required 
          />
          <span className="input-info">% of account balance</span>
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
            name="entryPrice" 
            value={formData.entryPrice} 
            onChange={handleChange} 
            step="0.01" 
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Stop Loss Price</label>
          <input 
            type="number" 
            name="stopLossPrice" 
            value={formData.stopLossPrice} 
            onChange={handleChange} 
            step="0.01" 
            required 
          />
        </div>
        
        <button type="submit" className="btn-primary">Calculate</button>
      </form>
      
      {result && (
        <div className="calculation-result">
          <h3>Position Size Calculation</h3>
          
          <div className="result-item">
            <span>Account Value:</span>
            <span>${result.account_value.toFixed(2)}</span>
          </div>
          
          <div className="result-item">
            <span>Risk Amount:</span>
            <span>${result.dollar_risk.toFixed(2)}</span>
          </div>
          
          <div className="result-item">
            <span>Position Size:</span>
            <span>{result.position_size.toFixed(2)} units</span>
          </div>
          
          <div className="result-item">
            <span>Position Value:</span>
            <span>${result.position_value.toFixed(2)}</span>
          </div>
          
          <h4>Potential Profit Targets</h4>
          
          <div className="profit-targets">
            <div className="target">
              <span>1:1 (1R)</span>
              <span>${result.risk_reward_1r}</span>
            </div>
            
            <div className="target">
              <span>1:2 (2R)</span>
              <span>${result.risk_reward_2r}</span>
            </div>
            
            <div className="target">
              <span>1:3 (3R)</span>
              <span>${result.risk_reward_3r}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskCalculator;