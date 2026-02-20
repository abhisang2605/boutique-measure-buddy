import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { deleteCustomerImage, getImageUrl } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';

interface CustomerImage {
  id: string;
  file_path: string;
  file_name: string;
  created_at: string;
  customer_id: string;
  customers: {
    id: string;
    name: string;
  };
}

export default function ImageGallery() {
  const { toast } = useToast();
  const [images, setImages] = useState<CustomerImage[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('customer_images')
      .select(`
        *,
        customers (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setImages(data as CustomerImage[]);
    }

    setLoading(false);
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

  // 🔹 Group by customer
  const grouped = images.reduce((acc: Record<string, CustomerImage[]>, img) => {
    const name = img.customers?.name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(img);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Master Gallery ({images.length})
        </CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No images uploaded yet.
          </p>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([customerName, imgs]) => (
              <div key={customerName}>
                <h3 className="font-semibold text-base mb-3">
                  {customerName} ({imgs.length})
                </h3>

                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {imgs.map(img => (
                    <div
                      key={img.id}
                      className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
                    >
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
