import { useState, useEffect } from 'react';
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
      toast({ title: 'Image deleted successfully' });
    } catch (err: any) {
      toast({
        title: 'Delete failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setDeleting(null);
    }
  };

  const grouped = images.reduce((acc: Record<string, CustomerImage[]>, img) => {
    const name = img.customers?.name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(img);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f6f2ee] px-5 py-8">
      
      {/* Luxury Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-serif tracking-wide text-[#2c2c2c]">
          Photo Archive
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          {images.length} curated pieces
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
        </div>
      ) : images.length === 0 ? (
        <p className="text-center text-neutral-500 py-20">
          No photos added yet.
        </p>
      ) : (
        <div className="space-y-14">
          {Object.entries(grouped).map(([customerName, imgs]) => (
            <div key={customerName}>
              
              {/* Customer Section Header */}
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-xl font-serif tracking-wide text-[#3a3a3a]">
                  {customerName}
                </h2>
                <span className="text-xs uppercase tracking-widest text-neutral-400">
                  {imgs.length} {imgs.length === 1 ? 'Piece' : 'Pieces'}
                </span>
              </div>

              {/* Premium Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {imgs.map(img => (
                  <div
                    key={img.id}
                    className="relative group overflow-hidden rounded-2xl bg-white shadow-sm"
                  >
                    <img
                      src={getImageUrl(img.file_path)}
                      alt={img.file_name}
                      className="w-full h-52 object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Soft Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />

                    {/* Date */}
                    <div className="absolute bottom-3 left-3 text-white text-xs tracking-wide">
                      {new Date(img.created_at).toLocaleDateString()}
                    </div>

                    {/* Delete Icon */}
                    <button
                      onClick={() => handleDelete(img)}
                      disabled={deleting === img.id}
                      className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 shadow-md transition hover:bg-white active:scale-95"
                    >
                      {deleting === img.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
