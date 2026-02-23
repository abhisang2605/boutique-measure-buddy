import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogOut, Users, Images, CalendarDays, HardDrive } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

type Tab = 'customers' | 'photos' | 'calendar';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function MainLayout({ children, activeTab, onTabChange }: MainLayoutProps) {
  const { toast } = useToast();
  const [storageOpen, setStorageOpen] = useState(false);
  const [storageData, setStorageData] = useState<{ totalMB: string; limitMB: number } | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);

  const fetchStorageUsage = async () => {
    setStorageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('storage-usage');
      if (error) throw error;
      setStorageData(data);
    } catch (err: any) {
      toast({ title: 'Failed to fetch storage usage', description: err.message, variant: 'destructive' });
    } finally {
      setStorageLoading(false);
    }
  };

  const handleStorageClick = () => {
    setStorageOpen(true);
    fetchStorageUsage();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const tabs: {key: Tab;label: string;Icon: React.ElementType;}[] = [
  { key: 'customers', label: 'Customers', Icon: Users },
  { key: 'photos', label: 'Photos', Icon: Images },
  { key: 'calendar', label: 'Calendar', Icon: CalendarDays }];


  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight">✂️ AD - Customer Measurements</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleStorageClick}>
            <HardDrive className="h-4 w-4 mr-1" /> Storage
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-20 bg-background border-t border-border flex">
        {tabs.map(({ key, label, Icon }) => <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-colors
              ${activeTab === key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>

            <Icon className={`h-5 w-5 ${activeTab === key ? 'text-primary' : ''}`} />
            <span className={activeTab === key ? 'font-semibold' : ''}>{label}</span>
            {activeTab === key && <span className="absolute bottom-0 h-0.5 w-8 bg-primary rounded-full" />}
          </button>
        )}
      </nav>
      {/* Storage Usage Dialog */}
      <Dialog open={storageOpen} onOpenChange={setStorageOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" /> Storage Usage
            </DialogTitle>
          </DialogHeader>
          {storageLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : storageData ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{storageData.totalMB} MB</p>
                <p className="text-sm text-muted-foreground">of {storageData.limitMB} MB used</p>
              </div>
              <Progress value={(parseFloat(storageData.totalMB) / storageData.limitMB) * 100} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {(storageData.limitMB - parseFloat(storageData.totalMB)).toFixed(2)} MB remaining
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>);

}