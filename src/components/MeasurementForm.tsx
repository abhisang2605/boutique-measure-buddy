import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Ruler } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MEASUREMENT_FIELDS = [
  { key: 'neck', label: 'Neck' },
  { key: 'shoulder_width', label: 'Shoulder Width' },
  { key: 'chest', label: 'Chest' },
  { key: 'bust', label: 'Bust' },
  { key: 'waist', label: 'Waist' },
  { key: 'hip', label: 'Hip' },
  { key: 'sleeve_length', label: 'Sleeve Length' },
  { key: 'arm_circumference', label: 'Arm Circumference' },
  { key: 'back_length', label: 'Back Length' },
  { key: 'front_length', label: 'Front Length' },
  { key: 'inseam', label: 'Inseam' },
  { key: 'outseam', label: 'Outseam' },
  { key: 'thigh', label: 'Thigh' },
  { key: 'knee', label: 'Knee' },
  { key: 'calf', label: 'Calf' },
  { key: 'wrist', label: 'Wrist' },
] as const;

type MeasurementKey = typeof MEASUREMENT_FIELDS[number]['key'];

interface MeasurementFormProps {
  customerId: string;
}

export default function MeasurementForm({ customerId }: MeasurementFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Record<MeasurementKey, string>>(
    Object.fromEntries(MEASUREMENT_FIELDS.map(f => [f.key, ''])) as Record<MeasurementKey, string>
  );
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    loadMeasurements();
  }, [customerId]);

  const loadMeasurements = async () => {
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (data) {
      setExistingId(data.id);
      const loaded: Record<string, string> = {};
      for (const field of MEASUREMENT_FIELDS) {
        loaded[field.key] = data[field.key]?.toString() ?? '';
      }
      setMeasurements(loaded as Record<MeasurementKey, string>);
      setCustomNotes(data.custom_notes ?? '');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const numericFields = Object.fromEntries(
        MEASUREMENT_FIELDS.map(f => [f.key, measurements[f.key] ? parseFloat(measurements[f.key]) : null])
      );

      if (existingId) {
        const { error } = await supabase.from('measurements').update({
          ...numericFields,
          custom_notes: customNotes,
        } as any).eq('id', existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('measurements').insert({
          customer_id: customerId,
          ...numericFields,
          custom_notes: customNotes,
        } as any).select('id').single();
        if (error) throw error;
        setExistingId(data.id);
      }
      toast({ title: 'Measurements saved' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" /> Measurements (inches)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {MEASUREMENT_FIELDS.map(field => (
            <div key={field.key}>
              <Label htmlFor={field.key} className="text-xs">{field.label}</Label>
              <Input
                id={field.key}
                type="number"
                step="0.25"
                inputMode="decimal"
                value={measurements[field.key]}
                onChange={e => setMeasurements(m => ({ ...m, [field.key]: e.target.value }))}
                placeholder="0"
                className="h-9"
              />
            </div>
          ))}
        </div>
        <div>
          <Label htmlFor="custom_notes">Custom Notes</Label>
          <Textarea
            id="custom_notes"
            value={customNotes}
            onChange={e => setCustomNotes(e.target.value)}
            placeholder="Additional measurement notes, preferences, etc."
            rows={3}
          />
        </div>
        <Button onClick={handleSave} className="w-full" disabled={loading}>
          <Save className="mr-1 h-4 w-4" /> {loading ? 'Saving...' : 'Save Measurements'}
        </Button>
      </CardContent>
    </Card>
  );
}
