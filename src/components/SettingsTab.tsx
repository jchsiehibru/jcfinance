import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Link2, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  onUrlChange: () => void;
}

export default function SettingsTab({ onUrlChange }: Props) {
  const [gasUrl, setGasUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const savedUrl = localStorage.getItem('gasUrl');
    if (savedUrl) {
      setGasUrl(savedUrl);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('gasUrl', gasUrl);
    toast.success('設定已儲存');
    onUrlChange(); // Trigger data reload
  };

  const handleTest = async () => {
    if (!gasUrl) {
      toast.error('請先輸入 Web App 網址');
      return;
    }

    setIsTesting(true);
    setTestStatus('idle');

    try {
      const res = await fetch(`${gasUrl}?action=getAssets`);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) || data.result || data) {
          setTestStatus('success');
          toast.success('連線測試成功！');
        } else {
          setTestStatus('error');
          toast.error('連線測試失敗，請檢查網址是否正確');
        }
      } else {
        setTestStatus('error');
        toast.error('連線測試失敗，請檢查網址是否正確');
      }
    } catch (error) {
      setTestStatus('error');
      toast.error('連線測試失敗');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>系統設定</CardTitle>
          <CardDescription>
            設定您的 Google Apps Script Web App 網址，將資料儲存至您專屬的 Google Sheets。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gasUrl">Google Apps Script Web App 網址</Label>
            <div className="flex space-x-2">
              <Input
                id="gasUrl"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={gasUrl}
                onChange={(e) => {
                  setGasUrl(e.target.value);
                  setTestStatus('idle');
                }}
              />
              <Button onClick={handleSave} className="shrink-0">
                <Save className="w-4 h-4 mr-2" />
                儲存
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              留空將使用系統預設的測試資料庫（僅供測試，資料可能會遺失）。
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">測試連線</h4>
                <p className="text-sm text-muted-foreground">
                  檢查 Web App 網址是否能正確讀取 Google Sheets 資料。
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleTest} 
                disabled={isTesting || !gasUrl}
              >
                {isTesting ? (
                  <span className="animate-pulse">測試中...</span>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    測試連線
                  </>
                )}
              </Button>
            </div>
            
            {testStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center text-sm">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                連線成功！系統已可正常讀寫您的 Google Sheets。
              </div>
            )}
            
            {testStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center text-sm">
                <XCircle className="w-4 h-4 mr-2" />
                連線失敗。請確認網址正確，且 Web App 權限已設為「所有人」。
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
