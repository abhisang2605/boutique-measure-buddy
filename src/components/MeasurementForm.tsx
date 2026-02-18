import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, CloudUpload, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { uploadCustomerImage, deleteCustomerImage, getImageUrl } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

type Fields = {
  // single-value fields
  upper_chest: string;
  chest: string;
  bust: string;
  waist: string;
  armhole: string;
  cross_armhole: string;
  shoulder_width: string;
  front_neck_depth: string;
  back_neck_depth: string;
  hip: string;
  top_length: string;
  full_length: string;
  dart_point: string;
  apex_to_apex: string;
  neck: string;
  yoke_length: string;
  others: string;
  lower_waist: string;
  lower_length: string;
  thigh: string;
  knee: string;
  inseam: string;
  outseam: string;
  bottom_round: string;
  calf: string;
  wrist: string;
  back_length: string;
  front_length: string;
  // sleeve table (4 cols × 2 rows)
  sleeve_length: string;
  sleeve_length_2: string;
  sleeve_length_3: string;
  sleeve_length_4: string;
  armround_1: string;
  armround_2: string;
  armround_3: string;
  armround_4: string;
  arm_circumference: string; // kept for compat
  // blouse table (3 cols × 2 rows)
  blouse_front_1: string;
  blouse_front_2: string;
  blouse_front_3: string;
  blouse_back_1: string;
  blouse_back_2: string;
  blouse_back_3: string;
  design_instructions: string;
};

const emptyFields = (): Fields => ({
  upper_chest: '', chest: '', bust: '', waist: '',
  armhole: '', cross_armhole: '', shoulder_width: '',
  front_neck_depth: '', back_neck_depth: '', hip: '',
  top_length: '', full_length: '', dart_point: '', apex_to_apex: '',
  neck: '', yoke_length: '', others: '', lower_waist: '', lower_length: '',
  thigh: '', knee: '', inseam: '', outseam: '', bottom_round: '',
  calf: '', wrist: '', back_length: '', front_length: '',
  sleeve_length: '', sleeve_length_2: '', sleeve_length_3: '', sleeve_length_4: '',
  armround_1: '', armround_2: '', armround_3: '', armround_4: '',
  arm_circumference: '',
  blouse_front_1: '', blouse_front_2: '', blouse_front_3: '',
  blouse_back_1: '', blouse_back_2: '', blouse_back_3: '',
  design_instructions: '',
});

// ─── Numbered simple fields list ─────────────────────────────────────────────

const SIMPLE_FIELDS: { num: number; key: keyof Fields; label: string }[] = [
  { num: 1,  key: 'upper_chest',     label: 'Upper Chest' },
  { num: 2,  key: 'chest',           label: 'Chest' },
  { num: 3,  key: 'bust',            label: 'Bust' },
  { num: 4,  key: 'waist',           label: 'Waist' },
  { num: 5,  key: 'armhole',         label: 'Armhole' },
  { num: 6,  key: 'cross_armhole',   label: 'Cross Armhole' },
  { num: 7,  key: 'shoulder_width',  label: 'Shoulder Width' },
  // 8 = Sleeves (special table — rendered separately)
  { num: 9,  key: 'front_neck_depth', label: 'Front Neck Depth' },
  { num: 10, key: 'back_neck_depth',  label: 'Back Neck Depth' },
  { num: 11, key: 'hip',             label: 'Hip' },
  { num: 12, key: 'top_length',      label: 'Top Length' },
  { num: 13, key: 'full_length',     label: 'Full Length' },
  { num: 14, key: 'dart_point',      label: 'Dart Point' },
  { num: 15, key: 'apex_to_apex',    label: 'Apex to Apex' },
  { num: 16, key: 'neck',            label: 'Neck Round' },
  { num: 17, key: 'yoke_length',     label: 'Yoke Length' },
  { num: 18, key: 'others',          label: 'Others' },
  { num: 19, key: 'lower_waist',     label: 'Lower Waist' },
  { num: 20, key: 'lower_length',    label: 'Lower Length' },
  // 21 = Blouse Length table — rendered separately
  { num: 22, key: 'thigh',           label: 'Thigh Round' },
  { num: 23, key: 'knee',            label: 'Knee Round' },
  { num: 24, key: 'inseam',          label: 'Inseam' },
  { num: 25, key: 'outseam',         label: 'Outseam' },
  { num: 26, key: 'bottom_round',    label: 'Bottom Round' },
  { num: 27, key: 'calf',            label: 'Calf' },
  { num: 28, key: 'wrist',           label: 'Wrist' },
  { num: 29, key: 'back_length',     label: 'Back Length' },
  { num: 30, key: 'front_length',    label: 'Front Length' },
];

// ─── Helper: small compact table input ───────────────────────────────────────

function TableInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step="0.25"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="—"
      className="w-full text-center text-sm border border-border rounded bg-background px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MeasurementFormProps {
  customerId: string;
}

interface CustomerImage {
  id: string;
  file_path: string;
  file_name: string;
  created_at: string;
}

export default function MeasurementForm({ customerId }: MeasurementFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [fields, setFields] = useState<Fields>(emptyFields());

  // images state
  const [images, setImages] = useState<CustomerImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    loadMeasurements();
    loadImages();
  }, [customerId]);

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadMeasurements = async () => {
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (data) {
      setExistingId(data.id);
      setLastSaved(data.updated_at ?? data.created_at);
      const f = emptyFields();
      for (const key of Object.keys(f) as (keyof Fields)[]) {
        if (key === 'design_instructions') {
          f[key] = (data as any)['design_instructions'] ?? (data as any)['custom_notes'] ?? '';
        } else {
          f[key] = (data as any)[key]?.toString() ?? '';
        }
      }
      setFields(f);
    }
  };

  const loadImages = async () => {
    const { data } = await supabase
      .from('customer_images')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (data) setImages(data);
  };

  // ── Setters ─────────────────────────────────────────────────────────────────

  const set = (key: keyof Fields) => (v: string) =>
    setFields(f => ({ ...f, [key]: v }));

  const setInput = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(key)(e.target.value);

  // ── Save measurements ────────────────────────────────────────────────────────

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: Record<string, number | string | null> = {};
      for (const key of Object.keys(fields) as (keyof Fields)[]) {
        if (key === 'design_instructions') {
          payload[key] = fields[key] || null;
        } else {
          payload[key] = fields[key] ? parseFloat(fields[key]) : null;
        }
      }

      if (existingId) {
        const { error } = await supabase
          .from('measurements')
          .update(payload as any)
          .eq('id', existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('measurements')
          .insert({ customer_id: customerId, ...payload } as any)
          .select('id, created_at')
          .single();
        if (error) throw error;
        setExistingId(data.id);
      }
      const now = new Date().toISOString();
      setLastSaved(now);
      toast({ title: 'Measurements saved ✓' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Image upload / delete ────────────────────────────────────────────────────

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadCustomerImage(customerId, file);
      }
      await loadImages();
      toast({ title: `${files.length} image(s) uploaded` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (img: CustomerImage) => {
    setDeleting(img.id);
    try {
      await deleteCustomerImage(img.id, img.file_path);
      setImages(prev => prev.filter(i => i.id !== img.id));
      toast({ title: 'Image deleted' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const fieldsBefore8 = SIMPLE_FIELDS.filter(f => f.num < 8);
  const fieldsBetween8and21 = SIMPLE_FIELDS.filter(f => f.num > 8 && f.num < 21);
  const fieldsAfter21 = SIMPLE_FIELDS.filter(f => f.num > 21);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-4 mb-2">
        <h2 className="font-semibold text-base text-foreground">Client Measurement Details</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {lastSaved ? `Last saved: ${formatDate(lastSaved)}` : 'No measurements saved yet'}
        </p>
      </div>

      {/* ── Simple fields before #8 (Sleeves) ─── */}
      <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
        {fieldsBefore8.map(f => (
          <div key={f.key} className="flex items-center px-4 py-3 gap-3">
            <span className="text-xs text-muted-foreground w-5 shrink-0 font-mono">{f.num}.</span>
            <label className="text-sm flex-1 text-foreground">{f.label}</label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.25"
              value={fields[f.key]}
              onChange={setInput(f.key)}
              placeholder="—"
              className="h-8 w-24 text-right text-sm"
            />
          </div>
        ))}
      </div>

      {/* ── #8 Sleeves table ─── */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground font-mono w-5">8.</span>
          <span className="text-sm font-medium text-foreground">Sleeves</span>
        </div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[260px] border-collapse text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="border border-border px-2 py-1.5 text-left font-normal bg-muted/40 w-20"></th>
                <th className="border border-border px-1 py-1.5 text-center font-normal bg-muted/40 w-14">1</th>
                <th className="border border-border px-1 py-1.5 text-center font-normal bg-muted/40 w-14">2</th>
                <th className="border border-border px-1 py-1.5 text-center font-normal bg-muted/40 w-14">3</th>
                <th className="border border-border px-1 py-1.5 text-center font-normal bg-muted/40 w-14">4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-2 py-1.5 bg-muted/20 text-muted-foreground">Length</td>
                <td className="border border-border p-1"><TableInput value={fields.sleeve_length} onChange={set('sleeve_length')} /></td>
                <td className="border border-border p-1"><TableInput value={fields.sleeve_length_2} onChange={set('sleeve_length_2')} /></td>
                <td className="border border-border p-1"><TableInput value={fields.sleeve_length_3} onChange={set('sleeve_length_3')} /></td>
                <td className="border border-border p-1"><TableInput value={fields.sleeve_length_4} onChange={set('sleeve_length_4')} /></td>
              </tr>
              <tr>
                <td className="border border-border px-2 py-1.5 bg-muted/20 text-muted-foreground">Armround</td>
                <td className="border border-border p-1"><TableInput value={fields.armround_1} onChange={set('armround_1')} /></td>
                <td className="border border-border p-1"><TableInput value={fields.armround_2} onChange={set('armround_2')} /></td>
                <td className="border border-border p-1"><TableInput value={fields.armround_3} onChange={set('armround_3')} /></td>
                <td className="border border-border p-1"><TableInput value={fields.armround_4} onChange={set('armround_4')} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Simple fields #9–#20 ─── */}
      <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
        {fieldsBetween8and21.map(f => (
          <div key={f.key} className="flex items-center px-4 py-3 gap-3">
            <span className="text-xs text-muted-foreground w-5 shrink-0 font-mono">{f.num}.</span>
            <label className="text-sm flex-1 text-foreground">{f.label}</label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.25"
              value={fields[f.key]}
              onChange={setInput(f.key)}
              placeholder="—"
              className="h-8 w-24 text-right text-sm"
            />
          </div>
        ))}
      </div>

      {/* ── #21 Blouse Length table ─── */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground font-mono w-5">21.</span>
          <span className="text-sm font-medium text-foreground">Blouse Length</span>
        </div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[220px] border-collapse text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="border border-border px-2 py-1.5 text-left font-normal bg-muted/40 w-20"></th>
                <th className="border border-border px-1 py-1.5 text-center font-normal bg-muted/40">1</th>
                <th className="border border-border px-1 py-1.5 text-center font-normal bg-muted/40">2</th>
                <th className="border border-border px-1 py-1.5 text-center font-normal bg-muted/40">3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-2 py-1.5 bg-muted/20 text-muted-foreground">Front</td>
                <td className="border border-border p-1"><TableInput value={fields.blouse_front_1} onChange={set('blouse_front_1')} /></td>
                <td className="border border-border p-1"><TableInput value={fields.blouse_front_2} onChange={set('blouse_front_2')} /></td>
                <td className="border border-border p-1"><TableInput value={fields.blouse_front_3} onChange={set('blouse_front_3')} /></td>
              </tr>
              <tr>
                <td className="border border-border px-2 py-1.5 bg-muted/20 text-muted-foreground">Back</td>
                <td className="border border-border p-1"><TableInput value={fields.blouse_back_1} onChange={set('blouse_back_1')} /></td>
                <td className="border border-border p-1"><TableInput value={fields.blouse_back_2} onChange={set('blouse_back_2')} /></td>
                <td className="border border-border p-1"><TableInput value={fields.blouse_back_3} onChange={set('blouse_back_3')} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Simple fields #22+ ─── */}
      <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
        {fieldsAfter21.map(f => (
          <div key={f.key} className="flex items-center px-4 py-3 gap-3">
            <span className="text-xs text-muted-foreground w-5 shrink-0 font-mono">{f.num}.</span>
            <label className="text-sm flex-1 text-foreground">{f.label}</label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.25"
              value={fields[f.key]}
              onChange={setInput(f.key)}
              placeholder="—"
              className="h-8 w-24 text-right text-sm"
            />
          </div>
        ))}
      </div>

      {/* ── NEXT divider ─── */}
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Next</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* ── File Upload ─── */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 className="text-sm font-medium text-foreground">File Upload</h3>

        {/* Drop zone */}
        <div
          ref={dropRef}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-7 w-7 mx-auto animate-spin text-primary mb-2" />
          ) : (
            <CloudUpload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
          )}
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Compressing & uploading…' : 'Browse files or drag & drop here'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Camera, gallery or files — multiple allowed</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />

        {/* Thumbnails */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map(img => (
              <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={getImageUrl(img.file_path)}
                  alt={img.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* always-visible delete on mobile */}
                <button
                  onClick={() => handleDeleteImage(img)}
                  disabled={deleting === img.id}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow"
                >
                  {deleting === img.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Design Instructions ─── */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        <label className="text-sm font-medium text-foreground">Design Instructions</label>
        <Textarea
          value={fields.design_instructions}
          onChange={e => set('design_instructions')(e.target.value)}
          placeholder="Fabric preference, design notes, special requirements…"
          rows={4}
          className="resize-none"
        />
      </div>

      {/* ── Save button ─── */}
      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {loading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
        ) : (
          <><Save className="mr-2 h-4 w-4" />Save Measurements</>
        )}
      </Button>
    </div>
  );
}
