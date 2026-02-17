
-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Measurements table (one per customer, can be updated)
CREATE TABLE public.measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  neck NUMERIC,
  shoulder_width NUMERIC,
  chest NUMERIC,
  bust NUMERIC,
  waist NUMERIC,
  hip NUMERIC,
  sleeve_length NUMERIC,
  arm_circumference NUMERIC,
  back_length NUMERIC,
  front_length NUMERIC,
  inseam NUMERIC,
  outseam NUMERIC,
  thigh NUMERIC,
  knee NUMERIC,
  calf NUMERIC,
  wrist NUMERIC,
  custom_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer images table
CREATE TABLE public.customer_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_images ENABLE ROW LEVEL SECURITY;

-- Permissive policies (single user app, no auth needed)
CREATE POLICY "Allow all access to customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to measurements" ON public.measurements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to customer_images" ON public.customer_images FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for customer images
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-images', 'customer-images', true);

-- Storage policies
CREATE POLICY "Allow all uploads to customer-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'customer-images');
CREATE POLICY "Allow all reads from customer-images" ON storage.objects FOR SELECT USING (bucket_id = 'customer-images');
CREATE POLICY "Allow all deletes from customer-images" ON storage.objects FOR DELETE USING (bucket_id = 'customer-images');

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON public.measurements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
