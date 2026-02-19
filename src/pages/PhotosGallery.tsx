import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImageRow {
  id: string;
  file_path: string;
  file_name: string;
  created_at: string;
  customer_id: string;
  customers: { name: string } | null;
}

export default function PhotosGallery() {
  const [images, setImages] = useState<ImageRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('customer_images')
      .select('*, customers(name)')
      .order('created_at', { ascending: false });
    if (data) setImages(data as ImageRow[]);
    setLoading(false);
  };

  const getUrl = (filePath: string) => {
    const { data } = supabase.storage.from('customer-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const filtered = images.filter(img => {
    const q = search.toLowerCase();
    return (
      img.customers?.name?.toLowerCase().includes(q) ||
      img.file_name.toLowerCase().includes(q)
    );
  });

  const handlePrev = () => setSelected(s => (s !== null && s > 0 ? s - 1 : s));
  const handleNext = () => setSelected(s => (s !== null && s < filtered.length - 1 ? s + 1 : s));

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">All Photos</h1>
        <p className="text-sm text-muted-foreground">{images.length} photos stored</p>
      </div>

      {/* Filter */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by customer name or file..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No photos found</p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {filtered.map((img, i) => (
            <div
              key={img.id}
              className="aspect-square rounded-md overflow-hidden bg-muted cursor-pointer relative group"
              onClick={() => setSelected(i)}
            >
              <img
                src={getUrl(img.file_path)}
                alt={img.file_name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-[10px] truncate">{img.customers?.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-screen-sm p-0 bg-black border-none">
          {selected !== null && filtered[selected] && (
            <div className="relative">
              <img
                src={getUrl(filtered[selected].file_path)}
                alt={filtered[selected].file_name}
                className="w-full max-h-[80vh] object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white font-medium">{filtered[selected].customers?.name}</p>
                <p className="text-white/60 text-xs">{filtered[selected].file_name}</p>
              </div>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 disabled:opacity-30"
                disabled={selected === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 disabled:opacity-30"
                disabled={selected === filtered.length - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
