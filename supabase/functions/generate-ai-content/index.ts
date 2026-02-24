import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Colors: green #A9E5BB 30%, orange #FFB385 30%, purple #CBB3FF 30%, blue #B3E5FC 10%
const AVATAR_COLORS = ['#A9E5BB', '#FFB385', '#CBB3FF', '#B3E5FC']
const COLOR_WEIGHTS = [30, 30, 30, 10]
function weightedRandomColor(): string {
  const total = COLOR_WEIGHTS.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < AVATAR_COLORS.length; i++) {
    r -= COLOR_WEIGHTS[i]
    if (r <= 0) return AVATAR_COLORS[i]
  }
  return AVATAR_COLORS[AVATAR_COLORS.length - 1]
}

const POST_PROMPT = `You are a member of a supportive journaling community app called Momu where people share personal life stories, seek advice, and discuss life challenges and wins.

Generate ONE authentic post. LENGTH IS CRITICAL — follow this distribution strictly:
- 50% of posts: 1-2 sentences only (short, punchy, raw)
- 30% of posts: 3-4 sentences (a brief share or question)
- 20% of posts: 5-6 sentences max (a story or detailed thought)

NEVER write more than 6 sentences. Most posts should be short.

The post should:
- Feel genuine and personal, like someone opening up to a community they trust
- Cover any aspect of life: relationships, work stress, bad bosses, personal growth, friendship, family, loneliness, career wins, heartbreak, moving on, daily struggles, happy moments, seeking advice, gratitude
- Use natural, conversational language with imperfect grammar sometimes (like real people text)
- NOT use hashtags, emojis in every post, or marketing-speak
- NOT start with "Hey everyone" or "Hi guys" — vary the openings
- Sometimes ask for advice, sometimes just vent, sometimes share a win

Short post examples (match this energy for 50% of posts):
- "finally told my boss I need better boundaries and she actually listened?? still processing"
- "had the worst anxiety attack at work today. took a walk and just breathed. small wins."
- "does anyone else feel weird about growing apart from childhood friends?"
- "can't tell if I'm healing or just getting better at avoiding things"

Return ONLY the post text. No quotes, no labels, no metadata.`

const COMMENT_PROMPT = (postContent: string, existingComments: string[] = []) => {
  const existingBlock = existingComments.length > 0
    ? `\nComments already posted (DO NOT repeat these points or phrases):\n${existingComments.map(c => `- "${c}"`).join('\n')}\n`
    : ''
  return `You are a real person in a supportive journaling community called Momu. Someone just shared this:

"${postContent}"
${existingBlock}
Write ONE reply that says something DIFFERENT from any existing comments above. LENGTH IS CRITICAL:
- 60% of the time: a single short sentence only — e.g. "this hit me", "omg same fr", "you've got this", "that takes guts", "ugh felt this", "needed to read this today"
- 30% of the time: exactly 2 sentences max
- 10% of the time: 3 sentences max

NEVER write more than 3 sentences. Short comments are preferred.

Rules:
- Sound like a real person texting, NOT a therapist or life coach
- No advice, no bullet points, no long explanations
- Can be just a reaction or relate briefly to something specific they said
- Never use "Great post!" / "Thanks for sharing!" / "Sending love!" / "I hear you"

Return ONLY the comment text. No quotes, no labels.`
}

const PERSONA_GENERATION_PROMPT = `Generate 20 realistic usernames for real people's social media accounts.

Rules:
- Formats allowed: firstname+numbers (like "sarah92", "james_04"), firstname only (like "sophie", "marcus"), firstname+initial (like "tomk", "rachj"), name+short number (like "elle7", "kai22")
- Use common real first names — mix of male and female
- Numbers should look natural (birth years 94-05, or short numbers 2-99)
- All lowercase, underscores OK, NO dots, NO hyphens
- Keep them short: 5-13 characters max
- BANNED: anything like "name_withword", "namevibes", "namecooks", "namewithcoffee" — no nouns glued to names
- Should look indistinguishable from real user accounts

Return EXACTLY 20 usernames, one per line. Nothing else.`

async function callClaudeHaiku(prompt: string, apiKey: string, maxTokens = 500): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: maxTokens,
      temperature: 0.95,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return data.content[0].text.trim()
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function initializePersonaPool(supabase: any, apiKey: string): Promise<void> {
  const { count } = await supabase
    .from('ai_personas')
    .select('*', { count: 'exact', head: true })

  if (count && count >= 20) return

  console.log('Initializing persona pool...')
  const usernamesText = await callClaudeHaiku(PERSONA_GENERATION_PROMPT, apiKey, 300)
  const usernames = usernamesText.split('\n').filter((u: string) => u.trim().length > 0).slice(0, 20)

  const personas = usernames.map((username: string) => ({
    username: username.trim(),
    avatar_color: weightedRandomColor(),
    personality_note: null
  }))

  const { error } = await supabase.from('ai_personas').insert(personas)
  if (error) {
    console.error('Error inserting personas:', error)
    throw error
  }

  // Mark persona pool as initialized in settings
  const { data: settings } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'ai_content_automation')
    .single()

  if (settings) {
    await supabase
      .from('app_settings')
      .update({
        setting_value: { ...settings.setting_value, persona_pool_initialized: true },
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'ai_content_automation')
  }

  console.log(`Created ${personas.length} personas`)
}

// Fetch real usernames once and cache for the duration of this function invocation
let _realUsernameCache: Set<string> | null = null
async function getRealUsernames(supabase: any): Promise<Set<string>> {
  if (_realUsernameCache) return _realUsernameCache
  const { data } = await supabase.from('user_profiles').select('username').limit(500)
  _realUsernameCache = new Set((data || []).map((u: any) => (u.username || '').toLowerCase()))
  return _realUsernameCache
}

// Extract the base name from a username (e.g. "jessica_88" → "jessica", "tomk" → "tom")
function baseName(username: string): string {
  return username.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6)
}

function clashesWithExisting(username: string, existingCommenters: string[]): boolean {
  const base = baseName(username)
  return existingCommenters.some(existing => baseName(existing) === base)
}

async function getPersona(supabase: any, apiKey: string, existingCommenters: string[] = []): Promise<{ username: string; avatarColor: string; source: string }> {
  const realUsernames = await getRealUsernames(supabase)
  const usePool = Math.random() < 0.3

  if (usePool) {
    const { data: personas } = await supabase
      .from('ai_personas')
      .select('username, avatar_color')

    if (personas && personas.length > 0) {
      // Filter out personas that clash with real users or existing commenters on this post
      const safePersonas = personas.filter((p: any) => {
        const u = (p.username || '').toLowerCase()
        return !realUsernames.has(u) && !clashesWithExisting(u, existingCommenters)
      })
      const pool = safePersonas.length > 0 ? safePersonas : personas
      const persona = randomChoice(pool)
      return {
        username: persona.username,
        avatarColor: weightedRandomColor(),
        source: 'pool'
      }
    }
  }

  // Generate a random username via Claude for the 70% case (or fallback)
  const randomNamePrompt = `Generate ONE realistic username for a real person's account. Just the username, nothing else. Lowercase only, 5-13 characters. Allowed formats: firstname+numbers (e.g. "sarah92", "james_04"), firstname only (e.g. "sophie", "marcus"), firstname+initial (e.g. "tomk", "rachj"), name+short number (e.g. "elle7", "kai22"). BANNED: anything like "name_withword", "name_withcoffee", "namevibes", "namecooks" — no nouns glued to names. No dots, no hyphens. Return username only.`
  let username = (await callClaudeHaiku(randomNamePrompt, apiKey, 30))
    .replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20).toLowerCase()

  // Retry once if it clashes with a real user or existing commenter on this post
  if (!username || realUsernames.has(username) || clashesWithExisting(username, existingCommenters)) {
    const retryName = (await callClaudeHaiku(randomNamePrompt, apiKey, 30))
      .replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20).toLowerCase()
    username = retryName || `user${randomInt(100, 999)}`
    // Final fallback: append number if still clashing
    if (realUsernames.has(username) || clashesWithExisting(username, existingCommenters)) {
      username = `${username}${randomInt(10, 99)}`
    }
  }

  return {
    username: username || `user_${randomInt(1000, 9999)}`,
    avatarColor: weightedRandomColor(),
    source: 'random'
  }
}

async function generatePost(
  supabase: any,
  apiKey: string,
  adminUserId: string,
  isManualTest: boolean = false
): Promise<{ id: string; content: string } | null> {
  const rawContent = await callClaudeHaiku(POST_PROMPT, apiKey, 120)

  // Trim to fit DB constraint — always cut at a sentence boundary so posts never end mid-sentence
  const MAX_CONTENT_LEN = 480
  let content = rawContent.trim()
  if (content.length > MAX_CONTENT_LEN) {
    const chunk = content.substring(0, MAX_CONTENT_LEN)
    // Find last sentence ending (., !, ?) within the chunk
    const lastSentence = Math.max(
      chunk.lastIndexOf('. '),
      chunk.lastIndexOf('? '),
      chunk.lastIndexOf('! '),
      chunk.lastIndexOf('.\n'),
      chunk.lastIndexOf('?\n'),
      chunk.lastIndexOf('!\n'),
    )
    if (lastSentence > 200) {
      content = chunk.substring(0, lastSentence + 1).trimEnd()
    } else {
      // Fallback: cut at last word
      const lastSpace = chunk.lastIndexOf(' ')
      content = (lastSpace > 200 ? chunk.substring(0, lastSpace) : chunk).trimEnd()
    }
  }

  const persona = await getPersona(supabase, apiKey)

  const initialLikes = randomInt(0, 5)
  const targetLikes = randomInt(8, 25)

  // For manual test: post immediately as active
  // For automated cron: schedule randomly within the next 1-23 hours
  const scheduledAt = isManualTest ? null : new Date(Date.now() + randomInt(1, 23) * 60 * 60 * 1000)
  const status = isManualTest ? 'active' : 'scheduled'

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      author_id: adminUserId,
      content: content,
      display_username: persona.username,
      avatar_color: persona.avatarColor,
      display_avatar_color: persona.avatarColor,
      like_count: initialLikes,
      comment_count: 0,
      tags: null,
      scheduled_at: scheduledAt?.toISOString() ?? null,
      status: status,
      is_ai_generated: true,
      target_like_count: targetLikes
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating AI post:', error)
    return null
  }

  // Log the generation
  await supabase.from('ai_content_log').insert({
    content_type: 'post',
    content_id: data.id,
    generated_content: content,
    persona_source: persona.source,
    persona_username: persona.username
  })

  console.log(`Generated post "${content.substring(0, 50)}..." as ${persona.username} (${persona.source}), ${scheduledAt ? `scheduled for ${scheduledAt.toISOString()}` : 'posted immediately'}`)
  return { id: data.id, content }
}

async function generateComment(
  supabase: any,
  apiKey: string,
  adminUserId: string,
  post: { id: string; content: string }
): Promise<string | null> {
  // Fetch existing comments — content for deduplication, usernames to avoid similar names
  const { data: existingRows } = await supabase
    .from('community_comments')
    .select('content, display_username')
    .eq('post_id', post.id)
    .order('created_at', { ascending: false })
    .limit(10)
  const existingComments: string[] = (existingRows || []).map((r: any) => r.content)
  const existingCommenters: string[] = (existingRows || [])
    .map((r: any) => (r.display_username || '').toLowerCase())
    .filter(Boolean)

  const rawComment = await callClaudeHaiku(COMMENT_PROMPT(post.content, existingComments), apiKey, 150)

  // Cap at sentence boundary (DB constraint is 500)
  const MAX_COMMENT_LEN = 480
  let commentContent = rawComment.trim()
  if (commentContent.length > MAX_COMMENT_LEN) {
    const chunk = commentContent.substring(0, MAX_COMMENT_LEN)
    const lastSentence = Math.max(
      chunk.lastIndexOf('. '),
      chunk.lastIndexOf('? '),
      chunk.lastIndexOf('! '),
      chunk.lastIndexOf('.\n'),
      chunk.lastIndexOf('?\n'),
      chunk.lastIndexOf('!\n'),
    )
    if (lastSentence > 150) {
      commentContent = chunk.substring(0, lastSentence + 1).trimEnd()
    } else {
      const lastSpace = chunk.lastIndexOf(' ')
      commentContent = (lastSpace > 150 ? chunk.substring(0, lastSpace) : chunk).trimEnd()
    }
  }

  const persona = await getPersona(supabase, apiKey, existingCommenters)

  const initialLikes = randomInt(0, 3)
  const targetLikes = randomInt(3, 15)

  const { data, error } = await supabase
    .from('community_comments')
    .insert({
      post_id: post.id,
      author_id: adminUserId,
      content: commentContent,
      display_username: persona.username,
      avatar_color: persona.avatarColor,
      display_avatar_color: persona.avatarColor,
      like_count: initialLikes,
      is_ai_generated: true,
      target_like_count: targetLikes
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating AI comment:', error)
    return null
  }

  // Update comment count on the post
  try {
    const { error: rpcError } = await supabase.rpc('increment_comment_count', { post_id_param: post.id })
    if (rpcError) {
      // Fallback: manually increment
      const { data: postData } = await supabase
        .from('community_posts')
        .select('comment_count')
        .eq('id', post.id)
        .single()
      if (postData) {
        await supabase
          .from('community_posts')
          .update({ comment_count: (postData.comment_count || 0) + 1 })
          .eq('id', post.id)
      }
    }
  } catch {
    // Non-critical — comment was still saved
  }

  // Each new AI comment adds 3-5 likes to the post organically
  try {
    const { data: postData } = await supabase
      .from('community_posts')
      .select('like_count')
      .eq('id', post.id)
      .single()
    if (postData) {
      await supabase
        .from('community_posts')
        .update({ like_count: (postData.like_count || 0) + randomInt(3, 5) })
        .eq('id', post.id)
    }
  } catch {
    // Non-critical
  }

  // Log the generation
  await supabase.from('ai_content_log').insert({
    content_type: 'comment',
    content_id: data.id,
    prompt_used: `Comment on: "${post.content.substring(0, 100)}..."`,
    generated_content: commentContent,
    persona_source: persona.source,
    persona_username: persona.username
  })

  console.log(`Generated comment on post ${post.id} as ${persona.username}`)
  return data.id
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if this is a manual test request
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // No body — cron trigger
    }

    const isManualTest = body?.test === true
    const generateType = body?.type || 'both' // 'post', 'comment', or 'both'

    // Fetch settings
    const { data: settingsRow, error: settingsError } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'ai_content_automation')
      .single()

    if (settingsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch AI settings', details: settingsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const settings = settingsRow.setting_value

    // If not a manual test, check if automation is enabled
    if (!isManualTest) {
      if (!settings.posts_enabled && !settings.comments_enabled) {
        return new Response(
          JSON.stringify({ message: 'AI automation is disabled', skipped: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get admin user for author_id
    const { data: adminUsers } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_type', 'admin')
      .limit(1)

    const adminUserId = adminUsers?.[0]?.id
    if (!adminUserId) {
      return new Response(
        JSON.stringify({ error: 'No admin user found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize persona pool if needed
    if (!settings.persona_pool_initialized) {
      await initializePersonaPool(supabase, anthropicApiKey)
    }

    const results: any = { posts: [], comments: [] }

    // --- POST GENERATION ---
    const shouldGeneratePosts = isManualTest
      ? (generateType === 'post' || generateType === 'both')
      : settings.posts_enabled

    if (shouldGeneratePosts) {
      if (isManualTest) {
        // Generate one post immediately for testing
        const post = await generatePost(supabase, anthropicApiKey, adminUserId, true)
        if (post) results.posts.push(post)
      } else {
        // Probabilistic: postsPerDay / 24 chance each hour
        const postsPerDay = settings.posts_per_day || 2
        const probability = postsPerDay / 24

        // Check how many posts were already generated today
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { count: todayPostCount } = await supabase
          .from('ai_content_log')
          .select('*', { count: 'exact', head: true })
          .eq('content_type', 'post')
          .gte('created_at', todayStart.toISOString())

        if ((todayPostCount || 0) < postsPerDay) {
          if (Math.random() < probability) {
            const post = await generatePost(supabase, anthropicApiKey, adminUserId)
            if (post) results.posts.push(post)
          }
        }
      }
    }

    // --- COMMENT GENERATION ---
    const shouldGenerateComments = isManualTest
      ? (generateType === 'comment' || generateType === 'both')
      : settings.comments_enabled

    if (shouldGenerateComments) {
      const commentTarget = settings.comment_target || 'ai_only'
      const minComments = settings.comments_per_post_min || 3
      const maxComments = settings.comments_per_post_max || 5

      // Find posts that need comments
      let postsQuery = supabase
        .from('community_posts')
        .select('id, content, is_ai_generated, comment_count')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10)

      if (commentTarget === 'ai_only') {
        postsQuery = postsQuery.eq('is_ai_generated', true)
      }

      const { data: eligiblePosts } = await postsQuery

      if (eligiblePosts && eligiblePosts.length > 0) {
        // Filter posts that don't have enough comments yet
        const postsNeedingComments = eligiblePosts.filter((p: any) => {
          const targetComments = randomInt(minComments, maxComments)
          return (p.comment_count || 0) < targetComments
        })

        if (isManualTest) {
          // For testing, add one comment to the first eligible post
          const targetPost = postsNeedingComments[0] || eligiblePosts[0]
          if (targetPost) {
            const commentId = await generateComment(supabase, anthropicApiKey, adminUserId, targetPost)
            if (commentId) results.comments.push({ postId: targetPost.id, commentId })
          }
        } else {
          // For automated: pick 1-2 posts per hour and add a comment
          const postsToComment = postsNeedingComments.slice(0, randomInt(1, 2))
          for (const post of postsToComment) {
            const commentId = await generateComment(supabase, anthropicApiKey, adminUserId, post)
            if (commentId) results.comments.push({ postId: post.id, commentId })
          }
        }
      }
    }

    // For manual tests, return 500 if nothing was generated so the UI can show an error
    if (isManualTest && results.posts.length === 0 && (generateType === 'post' || generateType === 'both')) {
      return new Response(
        JSON.stringify({ error: 'Post generation failed — check Edge Function logs for details.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (isManualTest && results.comments.length === 0 && generateType === 'comment') {
      return new Response(
        JSON.stringify({ error: 'Comment generation failed — no eligible post found or insert error. Check logs.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'AI content generation complete',
        isManualTest,
        results,
        postsGenerated: results.posts.length,
        commentsGenerated: results.comments.length
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
