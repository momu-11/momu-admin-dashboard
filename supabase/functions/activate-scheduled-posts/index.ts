import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date().toISOString()

    // Find all posts that are scheduled and past their scheduled time
    const { data: overduePosts, error: fetchError } = await supabase
      .from('community_posts')
      .select('id, display_username, scheduled_at')
      .eq('status', 'scheduled')
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', now)

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scheduled posts', details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!overduePosts || overduePosts.length === 0) {
      console.log('No scheduled posts to activate')
      return new Response(
        JSON.stringify({ message: 'No scheduled posts to activate', activated: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Activate them — set status to active and clear scheduled_at
    const { error: updateError } = await supabase
      .from('community_posts')
      .update({ status: 'active', scheduled_at: null })
      .in('id', overduePosts.map(p => p.id))

    if (updateError) {
      console.error('Error activating posts:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to activate posts', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Activated ${overduePosts.length} scheduled post(s)`)
    overduePosts.forEach(p => console.log(`  - ${p.display_username || 'unknown'} (scheduled: ${p.scheduled_at})`))

    return new Response(
      JSON.stringify({ message: 'Scheduled posts activated', activated: overduePosts.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
