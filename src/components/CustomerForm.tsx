import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerFormProps {
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
  };
  onSaved: (id: string) => void;
  onBack: () => void;
}

export default function CustomerForm({ customer, onSaved, onBack }: CustomerFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    address: customer?.address ?? '',
    notes: customer?.notes ?? '',
  });

  // ✅ Contact Picker Support Detection
  const isContactSupported =
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    // @ts-ignore
    typeof navigator.contacts?.select === 'function';

  // ✅ Contact Picker Logic
  const handlePickContact = async () => {
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: false };

      // @ts-ignore
      const contacts = await navigator.contacts.select(props, opts);

      if (contacts.length > 0) {
        const contact = contacts[0];

        const name = contact.name?.[0] || '';
        let phone = contact.tel?.[0] || '';

        // Remove all non-digits
        phone = phone.replace(/\D/g, '');

        // Keep last 10 digits (remove country code)
        if (phone.length > 10) {
          phone = phone.slice(-10);
        }

        setForm(prev => ({
          ...prev,
          name,
          phone
        }));
      }
    } catch (err) {
      console.log('Contact picker cancelled or not supported');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    // ✅ Phone optional
    // If entered → must be exactly 10 digits
    if (form.phone.trim() !== '' && !/^\d{10}$/.test(form.phone)) {
      toast({ title: 'Phone number must be exactly 10 digits', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        phone: form.phone.trim() === '' ? null : form.phone
      };

      if (customer) {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', customer.id);

        if (error) throw error;
        onSaved(customer.id);

      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert(payload)
          .select('id')
          .single();

        if (error) throw error;
        onSaved(data.id);
      }

      toast({ title: customer ? 'Customer updated' : 'Customer added' });

    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {customer ? 'Edit Customer' : 'New Customer'}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Customer name"
              />

              {/* Contact Picker Button */}
              {isContactSupported && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handlePickContact}
                >
                  Pick from Contacts
                </Button>
              )}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={form.phone}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, '');
                  setForm(f => ({ ...f, phone: onlyDigits }));
                }}
                placeholder="Enter 10 digit number (optional)"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Full address"
                rows={2}
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any special notes"
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Save className="mr-1 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Customer'}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
