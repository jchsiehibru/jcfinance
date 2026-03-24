import { GoogleGenAI } from '@google/genai';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Asset, Transaction, MarketData } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  assets: Asset[];
  transactions: Transaction[];
  marketData: Record<string, MarketData>;
  exchangeRates: Record<string, number>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function ReportsTab({ assets, transactions, marketData, exchangeRates }: Props) {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Calculate asset values in TWD
  const assetData = useMemo(() => {
    const data: Record<string, number> = {};
    assets.forEach(a => {
      let value = a.amount;
      if (a.type !== 'bank' && a.symbol && marketData[a.symbol]) {
        value *= marketData[a.symbol].price;
      }
      // Mock exchange rate for USD
      if (a.currency === 'USD') {
        value *= exchangeRates['USD'] || 32.5; 
      }
      data[a.type] = (data[a.type] || 0) + value;
    });

    return Object.entries(data).map(([name, value]) => ({
      name: name === 'bank' ? '銀行存款' : name === 'tw_stock' ? '台股' : name === 'us_stock' ? '美股' : '外幣',
      value: Math.round(value)
    })).filter(d => d.value > 0);
  }, [assets, marketData, exchangeRates]);

  // Calculate expenses by category
  const expenseData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [transactions]);

  const generateAdvice = async () => {
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('未設定 VITE_GEMINI_API_KEY，無法使用 AI 功能');
      }

      const portfolio = {
        totalAssets: assetData.reduce((sum, d) => sum + d.value, 0),
        assetAllocation: assetData,
        totalExpenses: expenseData.reduce((sum, d) => sum + d.value, 0),
        expenseAllocation: expenseData,
      };

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `身為一位專業的財務顧問，請根據以下使用者的資產配置與收支狀況，給予繁體中文的投資與理財建議（大約300字）：\n\n${JSON.stringify(portfolio, null, 2)}`,
      });
      
      setAdvice(response.text || '無法產生建議');
    } catch (error: any) {
      console.error(error);
      toast.error('產生理財建議失敗', {
        description: error.message || '請稍後再試，或檢查系統設定。'
      });
      setAdvice('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">財務報表與分析</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>資產配置</CardTitle>
            <CardDescription>各類資產佔比 (新台幣)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {assetData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-500">尚無資產資料</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `NT$ ${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>支出分析</CardTitle>
            <CardDescription>各類支出佔比</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {expenseData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-500">尚無支出資料</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `NT$ ${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-900">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>AI 理財顧問</span>
          </CardTitle>
          <CardDescription>根據您的資產與收支狀況，提供客製化的理財建議</CardDescription>
        </CardHeader>
        <CardContent>
          {advice ? (
            <div className="prose prose-sm max-w-none text-neutral-700 whitespace-pre-wrap">
              {advice}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <p className="text-sm text-neutral-500 text-center max-w-md">
                點擊下方按鈕，AI 將分析您的資產配置與收支習慣，為您量身打造專屬的投資與理財建議。
              </p>
              <Button onClick={generateAdvice} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  '產生理財建議'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
