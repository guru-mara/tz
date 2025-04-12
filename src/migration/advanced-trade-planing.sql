-- Trade Templates Table
CREATE TABLE IF NOT EXISTS TradeTemplates (
  template_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  market VARCHAR(50) NOT NULL,
  setup_type VARCHAR(100),
  entry_criteria TEXT,
  exit_criteria TEXT,
  risk_reward_ratio DECIMAL(5,2),
  position_size_rule VARCHAR(255),`
  notes TEXT,
  tags VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Trading Scenarios Table
CREATE TABLE IF NOT EXISTS TradingScenarios (
  scenario_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_id INT,
  scenario_name VARCHAR(100) NOT NULL,
  market_condition VARCHAR(50),
  initial_price DECIMAL(15,5),
  stop_loss DECIMAL(15,5),
  take_profit DECIMAL(15,5),
  position_size DECIMAL(15,5),
  entry_price DECIMAL(15,5),
  risk_amount DECIMAL(15,2),
  potential_profit DECIMAL(15,2),
  risk_reward_ratio DECIMAL(5,2),
  win_probability DECIMAL(5,2),
  expected_value DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES TradingAccounts(account_id) ON DELETE SET NULL
);

-- Trade Simulations Table
CREATE TABLE IF NOT EXISTS TradeSimulations (
  simulation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_id INT,
  template_id INT,
  scenario_id INT,
  simulation_name VARCHAR(100) NOT NULL,
  market VARCHAR(50),
  entry_price DECIMAL(15,5),
  position_size DECIMAL(15,5),
  stop_loss DECIMAL(15,5),
  take_profit DECIMAL(15,5),
  risk_amount DECIMAL(15,2),
  potential_profit DECIMAL(15,2),
  risk_reward_ratio DECIMAL(5,2),
  simulation_result ENUM('pending', 'win', 'loss', 'breakeven'),
  exit_price DECIMAL(15,5),
  profit_loss DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES TradingAccounts(account_id) ON DELETE SET NULL,
  FOREIGN KEY (template_id) REFERENCES TradeTemplates(template_id) ON DELETE SET NULL,
  FOREIGN KEY (scenario_id) REFERENCES TradingScenarios(scenario_id) ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX idx_templates_user ON TradeTemplates(user_id);
CREATE INDEX idx_scenarios_user ON TradingScenarios(user_id);
CREATE INDEX idx_simulations_user ON TradeSimulations(user_id);
CREATE INDEX idx_simulations_result ON TradeSimulations(simulation_result);