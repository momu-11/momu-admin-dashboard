import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
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

async function callClaudeHaiku(prompt: string, apiKey: string, maxTokens = 120): Promise<string> {
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
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return data.content[0].text.trim()
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

let _realUsernameCache: Set<string> | null = null
async function getRealUsernames(supabase: any): Promise<Set<string>> {
  if (_realUsernameCache) return _realUsernameCache
  const { data } = await supabase.from('user_profiles').select('username').limit(500)
  _realUsernameCache = new Set((data || []).map((u: any) => (u.username || '').toLowerCase()))
  return _realUsernameCache
}

async function getPersona(supabase: any, apiKey: string): Promise<{ username: string; avatarColor: string; source: string }> {
  const realUsernames = await getRealUsernames(supabase)
  const usePool = Math.random() < 0.3

  if (usePool) {
    const { data: personas } = await supabase.from('ai_personas').select('username, avatar_color')
    if (personas && personas.length > 0) {
      const safe = personas.filter((p: any) => !realUsernames.has((p.username || '').toLowerCase()))
      const persona = randomChoice(safe.length > 0 ? safe : personas)
      return { username: persona.username, avatarColor: weightedRandomColor(), source: 'pool' }
    }
  }

  const randomNamePrompt = `Generate ONE realistic username for a real person's account. Just the username, nothing else. Lowercase only, 5-13 characters. Allowed formats: firstname+numbers (e.g. "sarah92", "james_04"), firstname only (e.g. "sophie", "marcus"), firstname+initial (e.g. "tomk", "rachj"), name+short number (e.g. "elle7", "kai22"). BANNED: anything like "name_withword", "name_withcoffee", "namevibes", "namecooks" — no nouns glued to names. No dots, no hyphens. Return username only.`
  let username = (await callClaudeHaiku(randomNamePrompt, apiKey, 30))
    .replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20).toLowerCase()

  if (!username || realUsernames.has(username)) {
    const retry = (await callClaudeHaiku(randomNamePrompt, apiKey, 30))
      .replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20).toLowerCase()
    username = retry || `user${randomInt(100, 999)}`
    if (realUsernames.has(username)) username = `${username}${randomInt(10, 99)}`
  }

  return { username: username || `user_${randomInt(1000, 9999)}`, avatarColor: weightedRandomColor(), source: 'random' }
}

async function generatePost(
  supabase: any,
  apiKey: string,
  adminUserId: string,
  scheduledAt: Date,
  targetCommentCount: number
): Promise<{ id: string; content: string } | null> {
  const rawContent = await callClaudeHaiku(POST_PROMPT, apiKey, 120)

  const MAX_CONTENT_LEN = 480
  let content = rawContent.trim()
  if (content.length > MAX_CONTENT_LEN) {
    const chunk = content.substring(0, MAX_CONTENT_LEN)
    const lastSentence = Math.max(
      chunk.lastIndexOf('. '), chunk.lastIndexOf('? '), chunk.lastIndexOf('! '),
      chunk.lastIndexOf('.\n'), chunk.lastIndexOf('?\n'), chunk.lastIndexOf('!\n'),
    )
    if (lastSentence > 200) {
      content = chunk.substring(0, lastSentence + 1).trimEnd()
    } else {
      const lastSpace = chunk.lastIndexOf(' ')
      content = (lastSpace > 200 ? chunk.substring(0, lastSpace) : chunk).trimEnd()
    }
  }

  const persona = await getPersona(supabase, apiKey)
  const initialLikes = randomInt(0, 5)
  const targetLikes = randomInt(8, 25)

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      author_id: adminUserId,
      content,
      display_username: persona.username,
      avatar_color: persona.avatarColor,
      display_avatar_color: persona.avatarColor,
      like_count: initialLikes,
      comment_count: 0,
      tags: null,
      scheduled_at: scheduledAt.toISOString(),
      status: 'scheduled',
      is_ai_generated: true,
      target_like_count: targetLikes,
      target_comment_count: targetCommentCount,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating post:', error)
    return null
  }

  await supabase.from('ai_content_log').insert({
    content_type: 'post',
    content_id: data.id,
    generated_content: content,
    persona_source: persona.source,
    persona_username: persona.username,
  })

  console.log(`Scheduled post as @${persona.username} (${persona.source}) for ${scheduledAt.toISOString()}`)
  return { id: data.id, content }
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

    // Reset per-invocation cache so warm isolates don't serve stale data
    _realUsernameCache = null

    let body: any = {}
    try { body = await req.json() } catch { /* cron trigger — no body */ }

    const isManualTest = body?.test === true

    // Fetch settings
    const { data: settingsRow, error: settingsError } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'ai_content_automation')
      .single()

    if (settingsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch settings', details: settingsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const settings = settingsRow.setting_value

    if (!isManualTest && !settings.posts_enabled) {
      return new Response(
        JSON.stringify({ message: 'Post automation is disabled', skipped: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize persona pool if needed
    if (!settings.persona_pool_initialized) {
      await initializePersonaPool(supabase, anthropicApiKey)
    }

    // Get admin user
    const { data: adminUsers } = await supabase
      .from('user_profiles').select('id').eq('user_type', 'admin').limit(1)
    const adminUserId = adminUsers?.[0]?.id
    if (!adminUserId) {
      return new Response(
        JSON.stringify({ error: 'No admin user found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const postsPerDay = settings.posts_per_day || 2
    const minComments = settings.comments_per_post_min || 3
    const maxComments = settings.comments_per_post_max || 5

    // How many posts have already been created today?
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const { count: todayCount } = await supabase
      .from('ai_content_log')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', 'post')
      .gte('created_at', todayStart.toISOString())

    const alreadyGenerated = isManualTest ? 0 : (todayCount || 0)
    const remaining = isManualTest ? 1 : postsPerDay - alreadyGenerated

    if (remaining <= 0) {
      return new Response(
        JSON.stringify({ message: `Already generated ${alreadyGenerated} of ${postsPerDay} posts today`, skipped: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const generatedPosts: any[] = []

    // Divide the day (8am–10pm UTC) into equal slots, one per post.
    // Schedule recovery posts only into future slots so we never create a
    // post scheduled in the past (which would activate immediately and look spammy).
    const dayStart = 8 * 60   // minutes since midnight
    const dayEnd = 22 * 60
    const slotSize = Math.floor((dayEnd - dayStart) / postsPerDay)
    const nowMinutes = new Date().getUTCHours() * 60 + new Date().getUTCMinutes()

    for (let i = 0; i < remaining; i++) {
      let scheduledAt: Date
      if (isManualTest) {
        scheduledAt = new Date()
      } else {
        // Slot index accounts for already-generated posts so we don't overlap
        const slotIndex = alreadyGenerated + i
        const slotStart = dayStart + slotIndex * slotSize
        const slotEnd = slotStart + slotSize
        // Push the slot forward if it has already passed — pick a random time
        // between now+5min and end of the next available slot
        const effectiveStart = Math.max(slotStart, nowMinutes + 5)
        const effectiveEnd = Math.max(slotEnd, effectiveStart + 10)
        const minuteOffset = randomInt(effectiveStart, effectiveEnd - 1)

        scheduledAt = new Date()
        scheduledAt.setUTCHours(0, 0, 0, 0)
        scheduledAt.setUTCMinutes(minuteOffset)
      }

      const targetCommentCount = randomInt(minComments, maxComments)
      const post = await generatePost(supabase, anthropicApiKey, adminUserId, scheduledAt, targetCommentCount)

      if (post) {
        if (isManualTest) {
          await supabase
            .from('community_posts')
            .update({ status: 'active', scheduled_at: null })
            .eq('id', post.id)
        }
        generatedPosts.push(post)
      }
    }

    if (isManualTest && generatedPosts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Post generation failed — check Edge Function logs.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        message: isManualTest ? 'Test post generated' : `Scheduled ${generatedPosts.length} posts for today`,
        postsGenerated: generatedPosts.length,
        posts: generatedPosts,
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
