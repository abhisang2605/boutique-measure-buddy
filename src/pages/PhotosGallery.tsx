import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
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
    const { data } = supabase.storage
      .from('customer-images')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const filtered = images.filter(img => {
    const q = search.toLowerCase();
    return (
      img.customers?.name?.toLowerCase().includes(q) ||
      img.file_name.toLowerCase().includes(q)
    );
  });

  const grouped = filtered.reduce((acc: Record<string, ImageRow[]>, img) => {
    const name = img.customers?.name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(img);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  const handlePrev = () =>
    setSelected(s => (s !== null && s > 0 ? s - 1 : s));

  const handleNext = () =>
    setSelected(s =>
      s !== null && s < flatFiltered.length - 1 ? s + 1 : s
    );

  const openLightbox = (img: ImageRow) => {
    const idx = flatFiltered.findIndex(i => i.id === img.id);
    setSelected(idx >= 0 ? idx : null);
  };

  return (
    <div className="min-h-screen bg-[#f6f2ee] px-5 py-10">
      
      {/* Luxury Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif tracking-wide text-[#2d2d2d]">
          Photo Archive
        </h1>
        <p className="text-sm text-neutral-500 mt-2 tracking-wide">
          {images.length} curated pieces
        </p>
      </div>

      {/* Premium Search */}
      <div className="relative mb-10 max-w-md mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search by customer or file name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-11 pr-10 py-6 rounded-full bg-white border border-neutral-200 shadow-sm focus:ring-0"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-neutral-500 py-20">
          Loading gallery...
        </p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-center text-neutral-500 py-20">
          No photos found
        </p>
      ) : (
        <div className="space-y-16 max-w-6xl mx-auto">
          {Object.entries(grouped).map(([customerName, imgs]) => (
            <div key={customerName}>
              
              {/* Customer Section */}
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-xl font-serif tracking-wide text-[#3a3a3a]">
                  {customerName}
                </h2>
                <span className="text-xs uppercase tracking-widest text-neutral-400">
                  {imgs.length} {imgs.length === 1 ? 'Piece' : 'Pieces'}
                </span>
              </div>

              {/* Premium Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {imgs.map(img => (
                  <div
                    key={img.id}
                    onClick={() => openLightbox(img)}
                    className="relative overflow-hidden rounded-2xl bg-white shadow-sm cursor-pointer group"
                  >
                    <img
                      src={getUrl(img.file_path)}
                      alt={img.file_name}
                      className="w-full h-60 object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />

                    {/* Date */}
                    <div className="absolute bottom-3 left-3 text-white text-xs tracking-wide">
                      {new Date(img.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Luxury Lightbox */}
      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-screen-lg p-0 bg-black border-none">
          {selected !== null && flatFiltered[selected] && (
            <div className="relative">
              <img
                src={getUrl(flatFiltered[selected].file_path)}
                alt={flatFiltered[selected].file_name}
                className="w-full max-h-[85vh] object-contain"
              />

              {/* Bottom Info Panel */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white font-serif text-lg tracking-wide">
                  {flatFiltered[selected].customers?.name}
                </p>
                <p className="text-white/60 text-xs tracking-wider mt-1">
                  {flatFiltered[selected].file_name}
                </p>
              </div>

              {/* Navigation */}
              <button
                onClick={handlePrev}
                disabled={selected === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur text-white rounded-full p-3 disabled:opacity-30"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                onClick={handleNext}
                disabled={selected === flatFiltered.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur text-white rounded-full p-3 disabled:opacity-30"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
      }
