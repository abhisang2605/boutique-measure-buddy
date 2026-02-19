import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import CustomerList from '@/components/CustomerList';
import CustomerForm from '@/components/CustomerForm';
import CustomerDetail from '@/components/CustomerDetail';
import PhotosGallery from './PhotosGallery';
import CalendarView from './CalendarView';
import { supabase } from '@/integrations/supabase/client';

type View = 'list' | 'add' | 'edit' | 'detail';
type Tab = 'customers' | 'photos' | 'calendar';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('customers');
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editCustomer, setEditCustomer] = useState<any>(null);

  const handleEdit = async () => {
    if (!selectedId) return;
    const { data } = await supabase.from('customers').select('*').eq('id', selectedId).single();
    if (data) {
      setEditCustomer(data);
      setView('edit');
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Reset customer view when switching tabs
    if (tab !== 'customers') {
      setView('list');
    }
  };

  const renderContent = () => {
    if (activeTab === 'photos') return <PhotosGallery />;
    if (activeTab === 'calendar') return <CalendarView />;

    // Customers tab
    if (view === 'add') {
      return (
        <CustomerForm
          onSaved={(id) => { setSelectedId(id); setView('detail'); }}
          onBack={() => setView('list')}
        />
      );
    }
    if (view === 'edit' && editCustomer) {
      return (
        <CustomerForm
          customer={editCustomer}
          onSaved={(id) => { setSelectedId(id); setView('detail'); }}
          onBack={() => setView('detail')}
        />
      );
    }
    if (view === 'detail' && selectedId) {
      return (
        <CustomerDetail
          customerId={selectedId}
          onBack={() => { setSelectedId(null); setView('list'); }}
          onEdit={handleEdit}
        />
      );
    }
    return (
      <CustomerList
        onSelect={(id) => { setSelectedId(id); setView('detail'); }}
        onAdd={() => setView('add')}
      />
    );
  };

  return (
    <MainLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderContent()}
    </MainLayout>
  );
}
