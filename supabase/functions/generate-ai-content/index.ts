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

// 310 realistic usernames — all verified 5+ characters, varied styles.
// Shared with generate-daily-posts so both functions draw from the same identity space.
// getRealUsernames() excludes any name already used by a live real account.
const USERNAME_POOL = [
  // ── natural first names (5+ chars) ──
  'sophie','marcus','ellie','priya','nadia','ethan','chloe','grace','harry','emily',
  'james','molly','henry','freya','amber','kieran','claire','helen','lucas','phoebe',
  'chris','jasmine','paige','quinn','blake','jamie','morgan','taylor','river','sasha',
  'petra','blythe','clove','willa','caleb','dylan','mason','logan','olive','hazel',
  'megan','holly','poppy','layla','imogen','hannah','clara','lydia','naomi','leila',
  'elise','yasmin','steph','tessa','alana','laura','carly','sarah','regan','corey',
  'trish','vince','lance','brent','chase','brett','grant','scott','derek','floyd',
  'marco','dario','elena','irina','katia','sofia','livia','fleur','adele','renee',
  'esmeq','camil','robin','rowan','avery','reese','riley','casey','drew_k','peyton',
  'sienna','rafael','delphi','xavier','miriam','thalia','magnus','sorcha','declan','annika',
  'roisin','kierah','daragh','caoimhe','niamhj',
  // ── firstname + initial (natural social-media style) ──
  'oscar_l','holly_r','jay_r','dan_m','leo_c','sam_w','mia_j','jade_l','ryan_b','dan_r',
  'ben_k','tom_w','helen_r','nina_r','jess_b','alex_m','skye_m','cole_r','tia_b','paige_r',
  'rhys_j','finn_r','rosa_l','maya_k','dan_w','eva_k','zara_k','luca_b','rob_t','evan_c',
  'mike_b','rob_k','sean_j','tom_r','paul_m','dan_k','evan_r','cole_b','dean_m','ryan_k',
  'cal_r','leo_b','finn_m','rhys_k','sam_j','alex_k','zoe_b','isla_m','ava_m','grace_k',
  'harry_m','oliver_r','noah_b','liam_k','jack_r','ethan_m','luke_b','james_r','max_d','george_k',
  'will_b','ben_r','adam_k','jake_m','matt_r','adam_j','cleo_r','sean_r','erin_j','sam_b',
  'abby_j','kat_r','phoebe_m','leah_j','ella_c','emma_r','charlie_r','drew_m','jess_r','beth_r',
  'ross_j','mitch_r','anna_l','kate_j','henry_b','lucy_b','freya_j','amber_j','kieran_m','layla_b',
  'nadia_r','imogen_r','poppy_k','orla_j','fern_j','juno_b','wren_j','sage_j','eden_r','arya_j',
  'noor_j','remi_j','kira_j','lena_j','dani_j','mara_j','yara_j','alix_r','neve_j','beau_j',
  'vida_j','ines_j','arlo_j','jett_b','cash_r','bode_j','reid_j','ford_r','lane_j','gray_b',
  'crew_j','ali_b','bex_j','gio_b','cam_r','ash_b','bri_j','kai_b','rio_b','bay_j',
  'rei_j','nat_j','ivy_b','tara_j','kate_r','drew_b','rosa_m','nell_r','adam_b','jake_b',
  'paul_b','amy_b','luca_r','nina_b','ross_k','evan_b','beth_k','dean_r','skye_b','cole_k',
  'mike_r','ruby_l','zara_r','finn_b','emma_k','lily_b','will_k','ella_b','zoe_k','luna_b',
  'sara_l','luke_r','noah_r','isla_b','jack_b','liam_b','alex_b','sean_b','paul_r','adam_r',
  'nell_b','maya_b','scott_r','chase_m','avery_k','riley_j','reese_b','rowan_m','casey_r','corey_b',
  // ── compact run-together styles ──
  'tomk_r','rachj','lilyb','jakec','elliem','willh','graced','harryp','eddie',
  'sophiem','marcusr','ellieb','emilyj','morganr','taylorc','cooperb','hunterj',
  'brooksm','lincolnr','westonj','kendalb','harperr','austinm','carterj','parkerb',
]

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

// Extract base letters only for similarity detection (e.g. "jessica_88" → "jessic")
function baseName(username: string): string {
  return username.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6)
}

// Returns true if username shares a base with any existing commenter on the post
function clashesWithExisting(username: string, excluded: string[]): boolean {
  const base = baseName(username)
  return excluded.some(existing => baseName(existing) === base)
}

// Pick a username from the 250-name pool that doesn't clash with real users or excluded names
function pickFromPool(realUsernames: Set<string>, excluded: string[]): string {
  const shuffled = [...USERNAME_POOL].sort(() => Math.random() - 0.5)
  for (const name of shuffled) {
    if (!realUsernames.has(name) && !clashesWithExisting(name, excluded)) {
      return name
    }
  }
  // Fallback: take any pool name and append a digit
  const base = randomChoice(USERNAME_POOL)
  return `${base}${randomInt(2, 9)}`
}

async function getPersona(
  supabase: any,
  excluded: string[] = []
): Promise<{ username: string; avatarColor: string; source: string }> {
  const realUsernames = await getRealUsernames(supabase)
  const usePool = Math.random() < 0.3

  if (usePool) {
    const { data: personas } = await supabase
      .from('ai_personas')
      .select('username, avatar_color')

    if (personas && personas.length > 0) {
      const safe = personas.filter((p: any) => {
        const u = (p.username || '').toLowerCase()
        return !realUsernames.has(u) && !clashesWithExisting(u, excluded)
      })
      if (safe.length > 0) {
        const persona = randomChoice(safe)
        return { username: persona.username, avatarColor: weightedRandomColor(), source: 'pool' }
      }
    }
  }

  const username = pickFromPool(realUsernames, excluded)
  return { username, avatarColor: weightedRandomColor(), source: 'random' }
}

async function generateComment(
  supabase: any,
  apiKey: string,
  adminUserId: string,
  post: { id: string; content: string; display_username?: string }
): Promise<string | null> {
  // Fetch existing comments — content for dedup, usernames to avoid clashes
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

  // Also exclude the post author so they can't comment on their own post
  const postAuthor = (post.display_username || '').toLowerCase()
  if (postAuthor) existingCommenters.push(postAuthor)

  const rawComment = await callClaudeHaiku(COMMENT_PROMPT(post.content, existingComments), apiKey, 150)

  const MAX_COMMENT_LEN = 480
  let commentContent = rawComment.trim()
  if (commentContent.length > MAX_COMMENT_LEN) {
    const chunk = commentContent.substring(0, MAX_COMMENT_LEN)
    const lastSentence = Math.max(
      chunk.lastIndexOf('. '), chunk.lastIndexOf('? '), chunk.lastIndexOf('! '),
      chunk.lastIndexOf('.\n'), chunk.lastIndexOf('?\n'), chunk.lastIndexOf('!\n'),
    )
    if (lastSentence > 150) {
      commentContent = chunk.substring(0, lastSentence + 1).trimEnd()
    } else {
      const lastSpace = chunk.lastIndexOf(' ')
      commentContent = (lastSpace > 150 ? chunk.substring(0, lastSpace) : chunk).trimEnd()
    }
  }

  const persona = await getPersona(supabase, existingCommenters)

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

  try {
    const { error: rpcError } = await supabase.rpc('increment_comment_count', { post_id_param: post.id })
    if (rpcError) {
      const { data: postData } = await supabase
        .from('community_posts').select('comment_count').eq('id', post.id).single()
      if (postData) {
        await supabase
          .from('community_posts')
          .update({ comment_count: (postData.comment_count || 0) + 1 })
          .eq('id', post.id)
      }
    }
  } catch { /* non-critical */ }

  try {
    const { data: postData } = await supabase
      .from('community_posts').select('like_count').eq('id', post.id).single()
    if (postData) {
      await supabase
        .from('community_posts')
        .update({ like_count: (postData.like_count || 0) + randomInt(3, 5) })
        .eq('id', post.id)
    }
  } catch { /* non-critical */ }

  await supabase.from('ai_content_log').insert({
    content_type: 'comment',
    content_id: data.id,
    prompt_used: `Comment on: "${post.content.substring(0, 100)}..."`,
    generated_content: commentContent,
    persona_source: persona.source,
    persona_username: persona.username
  })

  console.log(`Generated comment on post ${post.id} as @${persona.username}`)
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
    _realUsernameCache = null

    let body: any = {}
    try { body = await req.json() } catch { /* cron trigger — no body */ }

    const isManualTest = body?.test === true

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

    if (!isManualTest && !settings.comments_enabled) {
      return new Response(
        JSON.stringify({ message: 'Comment automation is disabled', skipped: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: adminUsers } = await supabase
      .from('user_profiles').select('id').eq('user_type', 'admin').limit(1)
    const adminUserId = adminUsers?.[0]?.id
    if (!adminUserId) {
      return new Response(
        JSON.stringify({ error: 'No admin user found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!settings.persona_pool_initialized) {
      await initializePersonaPool(supabase, anthropicApiKey)
    }

    const results: any = { comments: [] }

    const shouldGenerateComments = isManualTest || settings.comments_enabled

    if (shouldGenerateComments) {
      const commentTarget = settings.comment_target || 'ai_only'
      const minComments = settings.comments_per_post_min || 3
      const maxComments = settings.comments_per_post_max || 5

      // Step 1: assign target_comment_count to any active posts that don't have one
      let unassignedQuery = supabase
        .from('community_posts')
        .select('id')
        .eq('status', 'active')
        .is('target_comment_count', null)
        .limit(20)
      if (commentTarget === 'ai_only') {
        unassignedQuery = unassignedQuery.eq('is_ai_generated', true)
      }
      const { data: unassignedPosts } = await unassignedQuery
      if (unassignedPosts && unassignedPosts.length > 0) {
        for (const p of unassignedPosts) {
          await supabase
            .from('community_posts')
            .update({ target_comment_count: randomInt(minComments, maxComments) })
            .eq('id', p.id)
        }
        console.log(`Assigned comment targets to ${unassignedPosts.length} posts`)
      }

      // Step 2: find posts below their target — include display_username so we can exclude the author
      let postsQuery = supabase
        .from('community_posts')
        .select('id, content, is_ai_generated, comment_count, target_comment_count, display_username')
        .eq('status', 'active')
        .not('target_comment_count', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)
      if (commentTarget === 'ai_only') {
        postsQuery = postsQuery.eq('is_ai_generated', true)
      }

      const { data: eligiblePosts } = await postsQuery
      let postsNeedingComments = (eligiblePosts || []).filter(
        (p: any) => (p.comment_count || 0) < (p.target_comment_count || 0)
      )

      // 'mixed' mode: bias 70% toward AI posts, 30% toward real posts
      if (commentTarget === 'mixed' && postsNeedingComments.length > 1) {
        const aiPosts = postsNeedingComments.filter((p: any) => p.is_ai_generated)
        const realPosts = postsNeedingComments.filter((p: any) => !p.is_ai_generated)
        if (aiPosts.length > 0 && realPosts.length > 0) {
          postsNeedingComments = Math.random() < 0.7 ? aiPosts : realPosts
        }
      }

      if (isManualTest) {
        const targetPost = postsNeedingComments[0] || eligiblePosts?.[0]
        if (targetPost) {
          const commentId = await generateComment(supabase, anthropicApiKey, adminUserId, targetPost)
          if (commentId) results.comments.push({ postId: targetPost.id, commentId })
        }
      } else {
        const postsToComment = postsNeedingComments.slice(0, randomInt(1, 2))
        for (const post of postsToComment) {
          const commentId = await generateComment(supabase, anthropicApiKey, adminUserId, post)
          if (commentId) results.comments.push({ postId: post.id, commentId })
        }
      }
    }

    if (isManualTest && results.comments.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Comment generation failed — no eligible post found or insert error. Check logs.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'AI comment generation complete',
        isManualTest,
        commentsGenerated: results.comments.length,
        comments: results.comments,
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
