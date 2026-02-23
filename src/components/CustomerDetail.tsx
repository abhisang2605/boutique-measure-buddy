import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MeasurementForm from './MeasurementForm';
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

export default function CustomerDetail({
  customerId,
  onBack,
  onEdit,
}: CustomerDetailProps) {
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sending, setSending] = useState(false);

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

  const handleCallClick = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      toast({
        title: 'Number copied',
        description: 'Opening dialer...',
      });
      window.location.href = `tel:${phone}`;
    } catch {
      window.location.href = `tel:${phone}`;
    }
  };

  const sendToWhatsApp = async () => {
    if (!customer) return;
    setSending(true);

    try {
      const { data: measurementData } = await supabase
        .from('measurements')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();

      const filledFields = measurementData
        ? Object.entries(measurementData)
            .filter(
              ([key, value]) =>
                value !== null &&
                value !== '' &&
                !['id', 'customer_id', 'created_at', 'updated_at'].includes(key)
            )
            .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
            .join('\n')
        : '(No measurements saved)';

      const message = `Customer: ${customer.name}\n${
        customer.phone ? 'Phone: ' + customer.phone + '\n' : ''
      }\nMeasurements:\n${filledFields}`;

      const { data: imageData } = await supabase
        .from('customer_images')
        .select('file_path')
        .eq('customer_id', customerId);

      const imageUrls = (imageData || []).map((img) => {
        const { data } = supabase.storage
          .from('customer-images')
          .getPublicUrl(img.file_path);
        return data.publicUrl;
      });

      const phoneWithCode = customer.phone
        ? `91${customer.phone.replace(/\D/g, '').replace(/^91/, '')}`
        : '';

      const { error } = await supabase.functions.invoke('send-whatsapp', {
        body: { phone: phoneWithCode, message, imageUrls },
      });

      if (error) {
        toast({
          title: 'Failed to send',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Sent to WhatsApp successfully!' });
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      toast({
        title: 'Error deleting',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Customer deleted' });
      onBack();
    }
  };

  if (!customer)
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading...
      </div>
    );

  return (
    <>
      {sending && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-2xl p-10 flex flex-col items-center gap-4 shadow-xl">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-medium">Sending to WhatsApp...</p>
          </div>
        </div>
      )}

      <div className="p-6 max-w-lg mx-auto space-y-6 pb-20">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="-ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onEdit}
              className="rounded-full h-9 w-9"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              onClick={sendToWhatsApp}
              disabled={sending}
              size="icon"
              className="rounded-full h-9 w-9 bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-md"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-9 w-9 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {customer.name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this customer, their
                    measurements, and all photos.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {customer.name}
          </h1>

          {customer.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">{customer.phone}</span>
              <button
                type="button"
                onClick={() => handleCallClick(customer.phone!)}
                className="p-1 rounded-full hover:bg-primary/10 transition"
              >
                <Phone className="h-4 w-4 text-primary" />
              </button>
            </div>
          )}

          {customer.email && (
            <p className="text-sm text-muted-foreground">
              {customer.email}
            </p>
          )}

          {customer.address && (
            <p className="text-sm text-muted-foreground">
              {customer.address}
            </p>
          )}

          {customer.notes && (
            <p className="text-sm bg-accent/50 rounded-md p-3 mt-3">
              {customer.notes}
            </p>
          )}
        </div>

        <MeasurementForm customerId={customerId} />
      </div>
    </>
  );
}
