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

// Large pool of realistic usernames — varied styles, no formula patterns
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

// Topic buckets — Claude picks from a random one each call to avoid repetition
const TOPIC_BUCKETS = [
  'work stress, bad boss, toxic workplace, job hunting, career change, salary negotiation',
  'friendship drift, growing apart, making new friends as an adult, loneliness',
  'relationship anxiety, dating, breakups, moving on, situationships',
  'family tension, difficult parents, sibling issues, setting boundaries with family',
  'personal growth, therapy, self-awareness, bad habits, building confidence',
  'money stress, debt, financial anxiety, saving, living paycheck to paycheck',
  'mental health, anxiety, burnout, rest, needing a break',
  'small wins, gratitude, unexpected good moments, things finally clicking',
  'big life decisions, moving cities, changing careers, going back to school',
  'health, fitness, body image, sleep, energy levels',
]

// Returns both the prompt string and the chosen topic so the caller can track used topics
const buildPostPrompt = (recentSnippets: string[], usedTopics: Set<string>): { prompt: string; topic: string } => {
  // Prefer topic buckets not used yet today — prevents two posts in the same run
  // landing on the same emotional area (e.g. two therapy/self-sabotage posts)
  const availableTopics = TOPIC_BUCKETS.filter(t => !usedTopics.has(t))
  const topic = randomChoice(availableTopics.length > 0 ? availableTopics : TOPIC_BUCKETS)

  const avoidBlock = recentSnippets.length > 0
    ? `\nThese posts already exist — DO NOT write anything with similar themes, wording, or emotional situations. If they mention therapy, self-sabotage, a specific relationship situation, etc., write about something completely different:\n${recentSnippets.map(s => `- "${s}"`).join('\n')}\n`
    : ''

  const prompt = `You are a real person posting in Momu, a supportive journaling community where people share raw life moments.

Topic area for this post: ${topic}
${avoidBlock}
Write ONE authentic post about something in that topic area that is CLEARLY DIFFERENT from any posts listed above. CRITICAL LENGTH RULES — pick randomly:
- 50% chance: exactly 1 sentence. Raw, punchy, real. Like a thought you'd text a friend.
- 30% chance: 2-3 sentences. A brief situation or question.
- 20% chance: 4-5 sentences max. A short story or venting moment.

NEVER write more than 5 sentences under any circumstances.

One-sentence examples (use this style 50% of the time):
- "can't tell if I'm healing or just getting better at avoiding things"
- "my manager took credit for my idea in the meeting today and I said nothing"
- "finally booked therapy after putting it off for two years. terrified."
- "does anyone else feel guilty for not wanting to go home for christmas"
- "three rejection emails in one day, I'm going to bed"
- "told my friend the truth for once and she actually thanked me for it"

Style rules:
- Lowercase is fine, imperfect punctuation is fine
- No hashtags, no emojis (or max one)
- Don't start with "Hey everyone", "Hi", or "So I"
- Sometimes a question, sometimes a statement, sometimes just venting

Return ONLY the post text. Nothing else.`

  return { prompt, topic }
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

// Extract the alphabetic base of a username — e.g. "emma22r" → "emma", "holly_r" → "holly"
function baseName(u: string): string {
  return u.replace(/[^a-z]/g, '').replace(/\d+.*$/, '')
}

// Pick a username that hasn't been used in this batch and isn't a real user.
// Also prevents similar base names (e.g. "sophie" and "sophiem") appearing on the same day.
function pickUsername(realUsernames: Set<string>, usedInBatch: Set<string>): string {
  const usedBases = new Set([...usedInBatch].map(baseName))
  const shuffled = [...USERNAME_POOL].sort(() => Math.random() - 0.5)
  for (const name of shuffled) {
    if (!realUsernames.has(name) && !usedInBatch.has(name) && !usedBases.has(baseName(name))) {
      return name
    }
  }
  // Fallback: exact name not already used (relax base-name check if pool is exhausted)
  for (const name of shuffled) {
    if (!realUsernames.has(name) && !usedInBatch.has(name)) {
      return name
    }
  }
  const base = randomChoice(USERNAME_POOL)
  return `${base}${randomInt(2, 9)}`
}

async function getPersona(
  supabase: any,
  apiKey: string,
  realUsernames: Set<string>,
  usedInBatch: Set<string>
): Promise<{ username: string; avatarColor: string; source: string }> {
  const usePool = Math.random() < 0.3

  if (usePool) {
    const { data: personas } = await supabase.from('ai_personas').select('username, avatar_color')
    if (personas && personas.length > 0) {
      const safe = personas.filter((p: any) => {
        const u = (p.username || '').toLowerCase()
        return !realUsernames.has(u) && !usedInBatch.has(u)
      })
      if (safe.length > 0) {
        const persona = randomChoice(safe)
        return { username: persona.username, avatarColor: weightedRandomColor(), source: 'pool' }
      }
    }
  }

  const username = pickUsername(realUsernames, usedInBatch)
  return { username, avatarColor: weightedRandomColor(), source: 'random' }
}

// Fetch recent post snippets so Claude avoids repeating themes.
// Uses 200 chars so Claude gets enough context to recognise the theme, not just the opening words.
async function getRecentPostSnippets(supabase: any): Promise<string[]> {
  const { data } = await supabase
    .from('community_posts')
    .select('content')
    .eq('is_ai_generated', true)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data || []).map((p: any) => (p.content || '').substring(0, 200))
}

async function generatePost(
  supabase: any,
  apiKey: string,
  adminUserId: string,
  scheduledAt: Date,
  targetCommentCount: number,
  recentSnippets: string[],
  realUsernames: Set<string>,
  usedInBatch: Set<string>,
  usedTopics: Set<string>
): Promise<{ id: string; content: string } | null> {
  const { prompt, topic } = buildPostPrompt(recentSnippets, usedTopics)
  usedTopics.add(topic)
  const rawContent = await callClaudeHaiku(prompt, apiKey, 150)

  const MAX_CONTENT_LEN = 480
  let content = rawContent.trim()
  if (content.length > MAX_CONTENT_LEN) {
    const chunk = content.substring(0, MAX_CONTENT_LEN)
    const lastSentence = Math.max(
      chunk.lastIndexOf('. '), chunk.lastIndexOf('? '), chunk.lastIndexOf('! '),
      chunk.lastIndexOf('.\n'), chunk.lastIndexOf('?\n'), chunk.lastIndexOf('!\n'),
    )
    if (lastSentence > 100) {
      content = chunk.substring(0, lastSentence + 1).trimEnd()
    } else {
      const lastSpace = chunk.lastIndexOf(' ')
      content = (lastSpace > 100 ? chunk.substring(0, lastSpace) : chunk).trimEnd()
    }
  }

  const persona = await getPersona(supabase, apiKey, realUsernames, usedInBatch)
  usedInBatch.add(persona.username)

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

    if (!settings.persona_pool_initialized) {
      await initializePersonaPool(supabase, anthropicApiKey)
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

    const postsPerDay = settings.posts_per_day || 2
    const minComments = settings.comments_per_post_min || 3
    const maxComments = settings.comments_per_post_max || 5

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

    // Fetch real usernames and recent post themes once for the whole batch
    const realUsernames = await getRealUsernames(supabase)
    const recentSnippets = await getRecentPostSnippets(supabase)

    // Pre-seed usedInBatch with usernames already posted TODAY so subsequent
    // cron runs (6am, noon, 6pm) can't reuse a name from an earlier run.
    // Also extract which topic buckets were already used today from the snippets
    // so we don't repeat the same emotional area twice in one day.
    const { data: todayLogs } = await supabase
      .from('ai_content_log')
      .select('persona_username')
      .eq('content_type', 'post')
      .gte('created_at', todayStart.toISOString())
    const usedInBatch = new Set<string>(
      (todayLogs || []).map((r: any) => (r.persona_username || '').toLowerCase()).filter(Boolean)
    )
    // Infer which topic buckets were already covered today by checking if any
    // topic keywords appear in recent snippets — rough but effective
    const usedTopics = new Set<string>(
      TOPIC_BUCKETS.filter(bucket =>
        bucket.split(', ').some(keyword =>
          recentSnippets.slice(0, alreadyGenerated).some(snippet =>
            snippet.toLowerCase().includes(keyword.split(' ')[0].toLowerCase())
          )
        )
      )
    )

    const generatedPosts: any[] = []
    const dayStart = 8 * 60
    const dayEnd = 22 * 60
    const slotSize = Math.floor((dayEnd - dayStart) / postsPerDay)
    const nowMinutes = new Date().getUTCHours() * 60 + new Date().getUTCMinutes()

    for (let i = 0; i < remaining; i++) {
      let scheduledAt: Date
      if (isManualTest) {
        scheduledAt = new Date()
      } else {
        const slotIndex = alreadyGenerated + i
        const slotStart = dayStart + slotIndex * slotSize
        const slotEnd = slotStart + slotSize
        const effectiveStart = Math.max(slotStart, nowMinutes + 5)
        const effectiveEnd = Math.max(slotEnd, effectiveStart + 10)
        const minuteOffset = randomInt(effectiveStart, effectiveEnd - 1)
        scheduledAt = new Date()
        scheduledAt.setUTCHours(0, 0, 0, 0)
        scheduledAt.setUTCMinutes(minuteOffset)
      }

      const targetCommentCount = randomInt(minComments, maxComments)
      const post = await generatePost(
        supabase, anthropicApiKey, adminUserId,
        scheduledAt, targetCommentCount,
        recentSnippets, realUsernames, usedInBatch, usedTopics
      )

      if (post) {
        // Add this post's content to recentSnippets so subsequent posts in the same
        // batch also avoid repeating its theme
        recentSnippets.unshift(post.content.substring(0, 80))
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
