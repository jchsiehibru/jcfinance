import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Transaction, Asset } from '../types';
import { format } from 'date-fns';

interface Props {
  transactions: Transaction[];
  assets: Asset[];
  onUpdate: () => void;
}

export default function TransactionsTab({ transactions, assets, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [assetId, setAssetId] = useState('none');

  const categories = type === 'income' 
    ? ['薪資', '投資收益', '獎金', '其他收入'] 
    : ['飲食', '交通', '居住', '娛樂', '投資', '其他支出'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    try {
      const gasUrl = localStorage.getItem('gasUrl');
      const newTx = {
        id: Date.now().toString(),
        type,
        amount: Number(amount),
        category,
        note,
        date,
        assetId: assetId === 'none' ? undefined : assetId
      };

      if (gasUrl) {
        await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'addTransaction', payload: newTx })
        });
      } else {
        const txs = JSON.parse(localStorage.getItem('transactions') || '[]');
        txs.push(newTx);
        localStorage.setItem('transactions', JSON.stringify(txs));
      }

      setOpen(false);
      onUpdate();
      setAmount('');
      setNote('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這筆紀錄嗎？')) return;
    try {
      const gasUrl = localStorage.getItem('gasUrl');
      
      if (gasUrl) {
        await fetch(gasUrl, { 
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'deleteTransaction', payload: { id } })
        });
      } else {
        let txs = JSON.parse(localStorage.getItem('transactions') || '[]');
        txs = txs.filter((t: any) => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(txs));
      }
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">收支明細</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            新增紀錄
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增收支紀錄</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>類型</Label>
                  <Select value={type} onValueChange={(v: any) => { setType(v); setCategory(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">支出</SelectItem>
                      <SelectItem value="income">收入</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>日期</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>類別</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇類別" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>金額 (TWD)</Label>
                <Input type="number" min="0" step="1" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>連動資產帳戶 (選填)</Label>
                <Select value={assetId} onValueChange={setAssetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="無" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">無</SelectItem>
                    {assets.filter(a => a.type === 'bank').map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>備註</Label>
                <Input value={note} onChange={e => setNote(e.target.value)} placeholder="選填" />
              </div>

              <Button type="submit" className="w-full">儲存</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>類別</TableHead>
                <TableHead>備註</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-neutral-500">尚無紀錄</TableCell>
                </TableRow>
              ) : (
                transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{t.date}</TableCell>
                    <TableCell>
                      <span className={t.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {t.type === 'income' ? '收入' : '支出'}
                      </span>
                    </TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell className="text-neutral-500">{t.note}</TableCell>
                    <TableCell className="text-right font-mono">
                      {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700">
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
