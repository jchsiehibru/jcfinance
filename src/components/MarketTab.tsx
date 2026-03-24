import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Asset, MarketData } from '../types';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  assets: Asset[];
  marketData: Record<string, MarketData>;
  setMarketData: (data: Record<string, MarketData>) => void;
  exchangeRates: Record<string, number>;
  setExchangeRates: (rates: Record<string, number>) => void;
}

export default function MarketTab({ assets, marketData, setMarketData, exchangeRates, setExchangeRates }: Props) {
  const [loading, setLoading] = useState(false);

  const fetchMarketData = async () => {
    setLoading(true);
    const newData: Record<string, MarketData> = { ...marketData };
    const rates: Record<string, number> = { TWD: 1 };
    let hasErrors = false;
    let missingApiKey = false;

    try {
      // 1. Fetch USD to TWD exchange rate (using Forex API or mock)
      // Finnhub forex symbol for USD/TWD is usually OANDA:USD_TWD
      const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
      
      if (apiKey) {
        const forexRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=OANDA:USD_TWD&token=${apiKey}`).catch(() => null);
        if (forexRes && forexRes.ok) {
          const forexData = await forexRes.json();
          if (forexData.c) {
            rates['USD'] = forexData.c;
          } else {
            rates['USD'] = 32.5; // Fallback mock rate
          }
        } else {
          rates['USD'] = 32.5; // Fallback mock rate
        }
      } else {
        rates['USD'] = 32.5;
        missingApiKey = true;
      }
      setExchangeRates(rates);

      // 2. Fetch TW Stocks
      const twStocks = assets.filter(a => a.type === 'tw_stock');
      if (twStocks.length > 0) {
        const twRes = await fetch('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL').catch(() => null);
        if (twRes && twRes.ok) {
          const twData = await twRes.json();
          twStocks.forEach(stock => {
            if (stock.symbol) {
              const stockData = twData.find((d: any) => d.Code === stock.symbol);
              if (stockData) {
                newData[stock.symbol] = {
                  symbol: stock.symbol,
                  price: parseFloat(stockData.ClosingPrice),
                  currency: 'TWD'
                };
              }
            }
          });
        } else {
          hasErrors = true;
        }
      }

      // 3. Fetch US Stocks
      const usStocks = assets.filter(a => a.type === 'us_stock');
      for (const stock of usStocks) {
        if (stock.symbol) {
          if (apiKey) {
            const usRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${apiKey}`).catch(() => null);
            if (usRes && usRes.ok) {
              const usData = await usRes.json();
              if (usData.c) {
                newData[stock.symbol] = {
                  symbol: stock.symbol,
                  price: usData.c,
                  currency: 'USD'
                };
              }
            } else {
              hasErrors = true;
            }
          } else {
            hasErrors = true;
            missingApiKey = true;
          }
        }
      }

      setMarketData(newData);
      
      if (missingApiKey) {
        toast.error('未設定 FINNHUB_API_KEY', {
          description: '無法取得美股與外匯報價，請在設定中新增金鑰。',
        });
      } else if (hasErrors) {
        toast.warning('部分報價更新失敗', {
          description: '可能是網路連線問題或 API 限制，請稍後再試。',
        });
      } else {
        toast.success('報價更新成功', {
          description: '已取得最新的市場行情。',
        });
      }
    } catch (error) {
      console.error('Failed to fetch market data', error);
      toast.error('更新失敗', {
        description: '發生未知的錯誤。',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assets.length > 0 && Object.keys(marketData).length === 0) {
      fetchMarketData();
    }
  }, [assets]);

  const calculateTotalValue = (asset: Asset) => {
    if (asset.type === 'bank') {
      return asset.amount * (exchangeRates[asset.currency] || 1);
    }
    if (asset.type === 'forex') {
      // Assuming symbol is currency code like USD
      const rate = exchangeRates[asset.symbol || asset.currency] || 1;
      return asset.amount * rate;
    }
    
    const price = marketData[asset.symbol || '']?.price || 0;
    const rate = exchangeRates[asset.currency] || 1;
    return asset.amount * price * rate;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">市場趨勢與資產現值</h2>
        <Button onClick={fetchMarketData} disabled={loading} variant="outline" className="space-x-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>更新報價</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">美元匯率 (USD/TWD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exchangeRates['USD']?.toFixed(2) || '32.50'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>投資組合現值</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>資產名稱</TableHead>
                <TableHead>代碼</TableHead>
                <TableHead className="text-right">持有數量</TableHead>
                <TableHead className="text-right">買入均價</TableHead>
                <TableHead className="text-right">最新報價</TableHead>
                <TableHead className="text-right">未實現損益 (TWD)</TableHead>
                <TableHead className="text-right">總價值 (TWD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.filter(a => a.type !== 'bank').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-neutral-500">尚無投資資產</TableCell>
                </TableRow>
              ) : (
                assets.filter(a => a.type !== 'bank').map(a => {
                  const mData = marketData[a.symbol || ''];
                  const price = mData?.price || 0;
                  const totalValue = calculateTotalValue(a);
                  
                  // Calculate PnL
                  const avgPrice = a.averagePrice || 0;
                  const rate = exchangeRates[a.currency] || 1;
                  const cost = a.amount * avgPrice * rate;
                  const pnl = (totalValue > 0 && cost > 0) ? totalValue - cost : 0;
                  const pnlPercentage = (cost > 0) ? (pnl / cost) * 100 : 0;
                  
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-neutral-500 font-mono">{a.symbol}</TableCell>
                      <TableCell className="text-right font-mono">{Number(a.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">
                        {avgPrice > 0 ? `${avgPrice.toLocaleString()} ${a.currency}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {price > 0 ? `${price.toLocaleString()} ${a.currency}` : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${pnl > 0 ? 'text-green-600' : pnl < 0 ? 'text-red-600' : ''}`}>
                        {cost > 0 ? (
                          <>
                            <div>{pnl > 0 ? '+' : ''}{Math.round(pnl).toLocaleString()}</div>
                            <div className="text-xs opacity-80">{pnl > 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%</div>
                          </>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {totalValue > 0 ? `NT$ ${Math.round(totalValue).toLocaleString()}` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
