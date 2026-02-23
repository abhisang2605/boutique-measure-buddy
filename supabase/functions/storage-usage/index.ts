import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // List all files in the customer-images bucket
    const { data: bucketFiles, error } = await supabase
      .from('objects')
      .select('metadata')
      .eq('bucket_id', 'customer-images')
      .is('owner', null)
      .not('name', 'is', null)

    // Use storage API to list all files recursively
    const { data: files, error: listError } = await supabase.storage
      .from('customer-images')
      .list('', { limit: 10000 })

    let totalBytes = 0

    if (files && !listError) {
      // Top-level files
      for (const f of files) {
        if (f.metadata?.size) totalBytes += f.metadata.size
      }

      // List subdirectories (customer folders)
      const folders = files.filter(f => f.id === null || (!f.metadata))
      for (const folder of folders) {
        const { data: subFiles } = await supabase.storage
          .from('customer-images')
          .list(folder.name, { limit: 10000 })
        if (subFiles) {
          for (const sf of subFiles) {
            if (sf.metadata?.size) totalBytes += sf.metadata.size
          }
        }
      }
    }

    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2)

    return new Response(
      JSON.stringify({ totalBytes, totalMB, limitMB: 1024 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
