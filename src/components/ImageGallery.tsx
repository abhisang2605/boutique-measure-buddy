import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Trash2, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { uploadCustomerImage, deleteCustomerImage, getImageUrl } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';

interface ImageGalleryProps {
  customerId: string;
}

interface CustomerImage {
  id: string;
  file_path: string;
  file_name: string;
  created_at: string;
}

export default function ImageGallery({ customerId }: ImageGalleryProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<CustomerImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, [customerId]);

  const loadImages = async () => {
    const { data } = await supabase
      .from('customer_images')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (data) setImages(data);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadCustomerImage(customerId, file);
      }
      await loadImages();
      toast({ title: `${files.length} image(s) uploaded & compressed` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (img: CustomerImage) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" /> Photos ({images.length})
          </span>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
            {uploading ? 'Compressing...' : 'Add'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={handleUpload}
        />

        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No photos yet. Tap "Add" to capture or upload.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map(img => (
              <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={getImageUrl(img.file_path)}
                  alt={img.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <button
                  onClick={() => handleDelete(img)}
                  disabled={deleting === img.id}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
      </CardContent>
    </Card>
  );
}
