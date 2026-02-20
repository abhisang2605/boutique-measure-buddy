import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Loader2 } from 'lucide-react';
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

  // 🔹 Group by customer name
  const grouped = images.reduce((acc: Record<string, CustomerImage[]>, img) => {
    const name = img.customers?.name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(img);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Master Gallery
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
                
                {/* Customer Name */}
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                  {customerName}
                </h3>

                {/* Images List (Vertical) */}
                <div className="space-y-4">
                  {imgs.map(img => (
                    <div
                      key={img.id}
                      className="flex items-center gap-4 bg-muted rounded-lg p-3"
                    >
                      <img
                        src={getImageUrl(img.file_path)}
                        alt={img.file_name}
                        className="w-32 h-32 object-cover rounded-md"
                        loading="lazy"
                      />

                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {new Date(img.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(img)}
                        disabled={deleting === img.id}
                        className="bg-destructive text-destructive-foreground rounded-full p-2"
                      >
                        {deleting === img.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
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
