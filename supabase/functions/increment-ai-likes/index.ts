import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Only process content created in the last 12 hours
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()

    let totalPostsUpdated = 0
    let totalCommentsUpdated = 0

    // --- INCREMENT POST LIKES ---
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('id, like_count, target_like_count')
      .eq('is_ai_generated', true)
      .gte('created_at', cutoff)
      .gt('target_like_count', 0)

    if (postsError) {
      console.error('Error fetching posts:', postsError)
    } else if (posts) {
      for (const post of posts) {
        const currentLikes = post.like_count || 0
        const target = post.target_like_count || 0

        if (currentLikes >= target) continue

        // Random increment 0-3, with variance
        const increment = randomInt(0, 3)
        if (increment === 0) continue

        const newLikes = Math.min(currentLikes + increment, target)

        const { error } = await supabase
          .from('community_posts')
          .update({ like_count: newLikes })
          .eq('id', post.id)

        if (!error) {
          totalPostsUpdated++
          console.log(`Post ${post.id}: ${currentLikes} -> ${newLikes} (target: ${target})`)
        }
      }
    }

    // --- INCREMENT COMMENT LIKES ---
    const { data: comments, error: commentsError } = await supabase
      .from('community_comments')
      .select('id, like_count, target_like_count')
      .eq('is_ai_generated', true)
      .gte('created_at', cutoff)
      .gt('target_like_count', 0)

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
    } else if (comments) {
      for (const comment of comments) {
        const currentLikes = comment.like_count || 0
        const target = comment.target_like_count || 0

        if (currentLikes >= target) continue

        const increment = randomInt(0, 2)
        if (increment === 0) continue

        const newLikes = Math.min(currentLikes + increment, target)

        const { error } = await supabase
          .from('community_comments')
          .update({ like_count: newLikes })
          .eq('id', comment.id)

        if (!error) {
          totalCommentsUpdated++
          console.log(`Comment ${comment.id}: ${currentLikes} -> ${newLikes} (target: ${target})`)
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Like increment complete',
        postsUpdated: totalPostsUpdated,
        commentsUpdated: totalCommentsUpdated,
        postsChecked: posts?.length || 0,
        commentsChecked: comments?.length || 0
      }),
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
