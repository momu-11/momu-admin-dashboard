import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current time
    const now = new Date()

    // Find all overdue scheduled posts
    const { data: overduePosts, error: fetchError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now.toISOString())

    if (fetchError) {
      console.error('Error fetching overdue posts:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch overdue posts' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!overduePosts || overduePosts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No overdue posts found', count: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Activate all overdue posts
    const { error: updateError } = await supabase
      .from('community_posts')
      .update({ status: 'active' })
      .in('id', overduePosts.map(post => post.id))

    if (updateError) {
      console.error('Error activating posts:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to activate posts' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Activated ${overduePosts.length} scheduled posts`)

    return new Response(
      JSON.stringify({ 
        message: 'Posts activated successfully', 
        count: overduePosts.length,
        posts: overduePosts 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 