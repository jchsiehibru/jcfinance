export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  assetId?: string; // Linked to an asset
}

export type AssetType = 'bank' | 'tw_stock' | 'us_stock' | 'forex';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  symbol?: string; // e.g., 2330, AAPL, USD
  amount: number; // For stocks: shares, for bank/forex: balance
  currency: string; // TWD, USD, etc.
  averagePrice?: number; // 買入均價
}

export interface MarketData {
  symbol: string;
  price: number;
  currency: string;
}
