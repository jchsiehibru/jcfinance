import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, PieChart, Landmark, Settings } from 'lucide-react';
import TransactionsTab from './components/TransactionsTab';
import AssetsTab from './components/AssetsTab';
import MarketTab from './components/MarketTab';
import ReportsTab from './components/ReportsTab';
import SettingsTab from './components/SettingsTab';
import { Transaction, Asset, MarketData } from './types';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ TWD: 1, USD: 32.5 });
  const [gasUrl, setGasUrl] = useState<string>(localStorage.getItem('gasUrl') || '');

  useEffect(() => {
    fetchTransactions();
    fetchAssets();
  }, [gasUrl]);

  const getHeaders = () => {
    return { 'Content-Type': 'text/plain' }; // GAS usually prefers text/plain to avoid CORS preflight
  };

  const fetchTransactions = async () => {
    try {
      if (gasUrl) {
        const res = await fetch(`${gasUrl}?action=getTransactions`);
        const data = await res.json();
        setTransactions(data || []);
      } else {
        const data = JSON.parse(localStorage.getItem('transactions') || '[]');
        setTransactions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssets = async () => {
    try {
      if (gasUrl) {
        const res = await fetch(`${gasUrl}?action=getAssets`);
        const data = await res.json();
        setAssets(data || []);
      } else {
        const data = JSON.parse(localStorage.getItem('assets') || '[]');
        setAssets(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUrlChange = () => {
    setGasUrl(localStorage.getItem('gasUrl') || '');
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <Landmark className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">個人資產管理系統</h1>
        </div>

        <Tabs defaultValue="transactions" className="w-full flex flex-col md:flex-row gap-6" orientation="vertical">
          <TabsList className="flex w-full md:w-48 shrink-0 justify-start items-stretch h-auto">
            <TabsTrigger value="transactions" className="justify-start space-x-2 py-2 text-[22px]">
              <Wallet className="w-6 h-6" />
              <span className="inline">收支管理</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="justify-start space-x-2 py-2 text-[22px]">
              <Landmark className="w-6 h-6" />
              <span className="inline">資產管理</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="justify-start space-x-2 py-2 text-[22px]">
              <TrendingUp className="w-6 h-6" />
              <span className="inline">市場趨勢</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="justify-start space-x-2 py-2 text-[22px]">
              <PieChart className="w-6 h-6" />
              <span className="inline">財務報表</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="justify-start space-x-2 py-2 text-[22px]">
              <Settings className="w-6 h-6" />
              <span className="inline">系統設定</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-w-0">
            <TabsContent value="transactions">
              <TransactionsTab 
                transactions={transactions} 
                assets={assets}
                onUpdate={fetchTransactions} 
              />
            </TabsContent>

            <TabsContent value="assets">
              <AssetsTab 
                assets={assets} 
                onUpdate={fetchAssets} 
              />
            </TabsContent>

            <TabsContent value="market">
              <MarketTab 
                assets={assets} 
                marketData={marketData}
                setMarketData={setMarketData}
                exchangeRates={exchangeRates}
                setExchangeRates={setExchangeRates}
              />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsTab 
                transactions={transactions} 
                assets={assets} 
                marketData={marketData}
                exchangeRates={exchangeRates}
              />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsTab onUrlChange={handleUrlChange} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
}
