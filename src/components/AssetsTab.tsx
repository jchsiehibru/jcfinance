import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Asset, AssetType } from '../types';
import { toast } from 'sonner';

interface Props {
  assets: Asset[];
  onUpdate: () => void;
}

export default function AssetsTab({ assets, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [type, setType] = useState<AssetType>('bank');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TWD');
  const [averagePrice, setAveragePrice] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Autocomplete logic
  useEffect(() => {
    if (type === 'tw_stock' && symbol.length >= 2) {
      // Mock TWSE search or use a real API if available
      // For now, just a placeholder suggestion
      setSuggestions([{ symbol: symbol, description: '台股標的' }]);
    } else if ((type === 'us_stock' || type === 'forex') && symbol.length >= 2) {
      const fetchSuggestions = async () => {
        try {
          const res = await fetch(`/api/market/search?q=${symbol}`);
          const data = await res.json();
          if (data.result) {
            setSuggestions(data.result.slice(0, 5));
          }
        } catch (e) {
          console.error(e);
        }
      };
      const timeoutId = setTimeout(fetchSuggestions, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [symbol, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    try {
      const gasUrl = localStorage.getItem('gasUrl');
      const newAsset = {
        id: Date.now().toString(),
        type,
        name,
        symbol: type === 'bank' ? undefined : symbol.toUpperCase(),
        amount: Number(amount),
        currency: type === 'us_stock' ? 'USD' : type === 'tw_stock' ? 'TWD' : currency,
        averagePrice: type !== 'bank' && averagePrice ? Number(averagePrice) : undefined
      };

      if (gasUrl) {
        const res = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'addAsset', payload: newAsset })
        });
        if (!res.ok) throw new Error('Failed to save asset');
      } else {
        const assets = JSON.parse(localStorage.getItem('assets') || '[]');
        assets.push(newAsset);
        localStorage.setItem('assets', JSON.stringify(assets));
      }
      
      setOpen(false);
      onUpdate();
      setName('');
      setSymbol('');
      setAmount('');
      setAveragePrice('');
      toast.success('資產已新增');
    } catch (error) {
      console.error(error);
      toast.error('新增資產失敗', {
        description: '請稍後再試，或檢查系統設定。'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此資產嗎？')) return;
    try {
      const gasUrl = localStorage.getItem('gasUrl');
      
      if (gasUrl) {
        const res = await fetch(gasUrl, { 
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'deleteAsset', payload: { id } })
        });
        if (!res.ok) throw new Error('Failed to delete');
      } else {
        let assets = JSON.parse(localStorage.getItem('assets') || '[]');
        assets = assets.filter((a: any) => a.id !== id);
        localStorage.setItem('assets', JSON.stringify(assets));
      }
      
      onUpdate();
      toast.success('資產已刪除');
    } catch (error) {
      console.error(error);
      toast.error('刪除失敗');
    }
  };

  const getTypeLabel = (t: AssetType) => {
    switch (t) {
      case 'bank': return '銀行帳戶';
      case 'tw_stock': return '台灣股市';
      case 'us_stock': return '美國股市';
      case 'forex': return '外幣';
      default: return '未知';
    }
  };

  const filteredAssets = filterType === 'all' ? assets : assets.filter(a => a.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">資產總覽</h2>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="所有資產" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有資產</SelectItem>
              <SelectItem value="bank">銀行帳戶</SelectItem>
              <SelectItem value="tw_stock">台灣股市</SelectItem>
              <SelectItem value="us_stock">美國股市</SelectItem>
              <SelectItem value="forex">外幣</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              新增資產
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增資產</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>資產類型</Label>
                <Select value={type} onValueChange={(v: any) => { setType(v); setSymbol(''); setCurrency('TWD'); setAveragePrice(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">銀行帳戶</SelectItem>
                    <SelectItem value="tw_stock">台灣股市</SelectItem>
                    <SelectItem value="us_stock">美國股市</SelectItem>
                    <SelectItem value="forex">外幣</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>資產名稱</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="例如：中國信託、台積電、蘋果" required />
              </div>

              {type !== 'bank' && (
                <div className="space-y-2 relative">
                  <Label>代碼 (Symbol)</Label>
                  <Input 
                    value={symbol} 
                    onChange={e => setSymbol(e.target.value)} 
                    placeholder={type === 'tw_stock' ? '例如：2330' : type === 'us_stock' ? '例如：AAPL' : '例如：USD'} 
                    required 
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-auto">
                      {suggestions.map((s, i) => (
                        <div 
                          key={i} 
                          className="px-3 py-2 hover:bg-neutral-100 cursor-pointer text-sm"
                          onClick={() => { setSymbol(s.symbol || s.displaySymbol); setName(s.description || name); setSuggestions([]); }}
                        >
                          <span className="font-semibold">{s.symbol || s.displaySymbol}</span> - {s.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{type === 'bank' || type === 'forex' ? '餘額' : '股數'}</Label>
                  <Input type="number" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>幣別</Label>
                  <Select 
                    value={type === 'us_stock' ? 'USD' : type === 'tw_stock' ? 'TWD' : currency} 
                    onValueChange={setCurrency} 
                    disabled={type === 'us_stock' || type === 'tw_stock'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇幣別" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TWD">TWD (新台幣)</SelectItem>
                      <SelectItem value="USD">USD (美元)</SelectItem>
                      <SelectItem value="JPY">JPY (日圓)</SelectItem>
                      <SelectItem value="EUR">EUR (歐元)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {type !== 'bank' && (
                  <div className="space-y-2">
                    <Label>買入均價</Label>
                    <Input type="number" min="0" step="any" value={averagePrice} onChange={e => setAveragePrice(e.target.value)} placeholder="選填" />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">儲存</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>類型</TableHead>
                <TableHead>名稱</TableHead>
                <TableHead>代碼</TableHead>
                <TableHead className="text-right">數量/餘額</TableHead>
                <TableHead className="text-right">買入均價</TableHead>
                <TableHead>幣別</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-neutral-500">尚無資產紀錄</TableCell>
                </TableRow>
              ) : (
                filteredAssets.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTypeLabel(a.type)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-neutral-500 font-mono">{a.symbol || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{Number(a.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">{a.averagePrice ? Number(a.averagePrice).toLocaleString() : '-'}</TableCell>
                    <TableCell>{a.currency}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700">
                        刪除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
