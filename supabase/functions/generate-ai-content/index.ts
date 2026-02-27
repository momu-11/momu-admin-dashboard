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

// 310 names — 70% female, 30% male. All verified 5+ chars, no duplicates.
// Mix of formats: plain name, NAME_#, NAME##, NAME##letter, NameLetter, NAME#, initials_##
// getRealUsernames() excludes any name a live real account has already claimed.
const USERNAME_POOL = [
  // ── plain name — female (60) ──
  'sophie','claire','emily','grace','molly','freya','amber','helen','phoebe','jasmine',
  'paige','holly','poppy','layla','imogen','hannah','clara','lydia','naomi','leila',
  'elise','yasmin','tessa','alana','laura','carly','sarah','megan','hazel','willa',
  'sasha','nadia','priya','ellie','chloe','elena','sofia','miriam','thalia','sorcha',
  'sienna','avery','reese','riley','peyton','taylor','morgan','rowan','olive','blythe',
  'caoimhe','annika','roisin','kierah','renee','fleur','livia','adele','katia','niamhj',
  // ── plain name — male (30) ──
  'marcus','ethan','harry','james','henry','kieran','lucas','caleb','dylan','mason',
  'logan','marco','dario','rafael','xavier','magnus','declan','chase','brett','grant',
  'scott','derek','corey','lance','vince','floyd','brent','daragh','ronan','oscar',
  // ── NAME_# — female (35) ──
  'emma_9','rosa_4','isla_7','lily_3','ella_6','ruby_2','luna_5','anna_8','kate_3','jess_7',
  'nina_4','abby_9','tara_2','skye_5','nell_6','leah_3','beth_8','erin_7','cleo_4','zara_1',
  'maya_9','fern_2','neve_5','vida_8','kira_6','lena_3','dani_7','mara_4','yara_2','ines_9',
  'orla_6','remi_3','ivy_4','zoe_8','tia_9',
  // ── NAME_# — male (15) ──
  'finn_9','luca_3','noah_7','liam_2','jack_5','luke_8','adam_4','jake_6','sean_1','paul_9',
  'cole_3','dean_7','ross_2','mike_6','alex_4',
  // ── NAME## — female (20) ──
  'holly22','grace14','amber77','claire33','sarah99','emily44','megan55','hazel66','layla11','poppy88',
  'elise22','tessa14','alana33','laura88','carly77','freya44','phoebe11','sorcha22','sienna33','ellie99',
  // ── NAME## — male (10) ──
  'ethan22','james44','harry11','finn77','luca33','noah99','liam55','jake11','cole22','oscar66',
  // ── NAME##letter — female (30) ──
  'emma22r','lily88k','isla14j','ella33b','ruby77m','luna44r','anna99k','kate11j','jess66b','nina22m',
  'abby88r','tara33k','skye77j','leah44b','beth11m','erin66r','cleo99k','zara22j','maya88b','fern33m',
  'neve77r','vida11k','kira44j','lena99b','dani22m','mara66r','yara88k','ines14j','orla77b','remi44m',
  // ── NAME##letter — male (15) ──
  'marcus22r','ethan88k','harry14j','caleb77m','dylan33b','mason22r','logan88k','marco14j','rafael33b','xavier22r',
  'magnus88k','declan33m','kieran77b','chase14r','brett22k',
  // ── NameLetter — female (40) ──
  'sophiem','claireb','emmaj','hollyr','gracek','mollyj','freyam','amberr','helenk','phoebem',
  'paiged','poppyr','laylab','hannahm','clarar','lydiak','naomib','leilam','elisem','yasminr',
  'tessaj','alanam','laurak','carlyr','sarahm','meganr','hazelk','willaj','sasham','nadiab',
  'priyak','ellier','chloem','elenaj','sofiab','miriamr','siennam','averyk','reeser','rileyb',
  // ── NameLetter — male (10) ──
  'marcusb','ethanr','harrym','jamesk','henrym','kieranr','lucasb','calebm','dylanr','masonk',
  // ── NAME# — female (20) ──
  'claire3','sarah7','emily4','grace5','molly8','amber2','helen9','freya1','poppy6','layla3',
  'hannah7','clara4','lydia8','naomi2','laura5','elise9','tessa1','megan6','hazel3','chloe7',
  // ── NAME# — male (8) ──
  'marcus3','ethan7','harry4','james5','henry8','logan2','oscar9','caleb1',
  // ── initials_## — female (12) ──
  'em_88','sr_44','hg_77','ak_22','lm_99','cp_33','nj_66','yb_11','fp_44','mk_88','ek_77','pr_22',
  // ── initials_## — male (5) ──
  'mb_44','ej_77','hs_22','dk_99','lr_55',
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
