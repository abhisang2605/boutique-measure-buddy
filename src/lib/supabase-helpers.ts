import { supabase } from '@/integrations/supabase/client';
import { compressImage } from './image-compression';

export async function uploadCustomerImage(customerId: string, file: File) {
  const compressed = await compressImage(file);
  const ext = 'jpg';
  const filePath = `${customerId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('customer-images')
    .upload(filePath, compressed, { contentType: 'image/jpeg' });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('customer-images')
    .getPublicUrl(filePath);

  const { error: dbError } = await supabase.from('customer_images').insert({
    customer_id: customerId,
    file_path: filePath,
    file_name: file.name,
  });

  if (dbError) throw dbError;

  return urlData.publicUrl;
}

export async function deleteCustomerImage(imageId: string, filePath: string) {
  await supabase.storage.from('customer-images').remove([filePath]);
  await supabase.from('customer_images').delete().eq('id', imageId);
}

export function getImageUrl(filePath: string) {
  const { data } = supabase.storage.from('customer-images').getPublicUrl(filePath);
  return data.publicUrl;
}
