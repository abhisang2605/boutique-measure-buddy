import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MeasurementForm from './MeasurementForm';
import ImageGallery from './ImageGallery';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CustomerDetailProps {
  customerId: string;
  onBack: () => void;
  onEdit: () => void;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export default function CustomerDetail({ customerId, onBack, onEdit }: CustomerDetailProps) {
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    if (data) setCustomer(data);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('customers').delete().eq('id', customerId);
    if (error) {
      toast({ title: 'Error deleting', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Customer deleted' });
      onBack();
    }
  };

  if (!customer) return <div className="p-4 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="-ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {customer.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this customer, their measurements, and all photos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
        {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
        {customer.address && <p className="text-sm text-muted-foreground mt-1">{customer.address}</p>}
        {customer.notes && <p className="text-sm mt-2 bg-accent/50 rounded-md p-2">{customer.notes}</p>}
      </div>

      <MeasurementForm customerId={customerId} />
      <ImageGallery customerId={customerId} />
    </div>
  );
}
