import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { playlist_id, song_id } = await req.json()

    const { data: songData, error: getError } = await supabase
      .from('playlist_songs')
      .select('position')
      .eq('playlist_id', playlist_id)
      .eq('song_id', song_id)
      .single()

    if (getError) throw getError
    const deletedPosition = songData.position

    const { error: deleteError } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlist_id)
      .eq('song_id', song_id)

    if (deleteError) throw deleteError

    const { data: songsToUpdate, error: rpcError } = await supabase.rpc('decrement_playlist_song_positions', {
        p_playlist_id: playlist_id,
        p_deleted_position: deletedPosition
    })

    if (rpcError) throw rpcError

    return new Response(JSON.stringify({ message: "Song removed and playlist reordered" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})