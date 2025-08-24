export interface Holding {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  qty: number;
  avg_price: number;
  current_price: number;
  value: number;
  rsi?: number;
  allocation_pct: number;
  notes?: string;
  updated_at: string;
}

export interface IdealAllocation {
  sector: string;
  target_pct: number;
}

export interface MonthlyGrowth {
  month: string; // YYYY-MM format
  account: string;
  pnl: number;
}

export interface Snapshot {
  date: string;
  sector: string;
  actual_pct: number;
  target_pct: number;
  variance: number;
  total_value: number;
}

export interface Summary {
  total_invested: number;
  current_net_worth: number;
  unrealized_gain_loss: number;
  unrealized_pct: number;
  allocation_variance: Record<string, number>;
  monthly_trend: MonthlyGrowth[];
  ytd_growth: number;
}

export interface ApiError {
  error: string;
  message: string;
  timestamp: string;
}

// Form types
export interface CreateHoldingForm {
  symbol: string;
  name: string;
  sector: string;
  qty: number;
  avg_price: number;
  current_price: number;
  rsi?: number;
  allocation_pct: number;
  notes?: string;
}

export interface UpdateHoldingForm extends Partial<CreateHoldingForm> {}

export interface MonthlyGrowthForm {
  month: string;
  account: string;
  pnl: number;
}

// Chart data types
export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface LineChartData {
  month: string;
  pnl: number;
  cumulative: number;
}

export interface BarChartData {
  sector: string;
  actual: number;
  target: number;
  variance: number;
}