-- AI Content Generation System - Database Setup
-- Run this in Supabase SQL Editor

-- 1. Create ai_personas table
CREATE TABLE IF NOT EXISTS ai_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  personality_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ai_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on ai_personas"
  ON ai_personas FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Create ai_content_log table
CREATE TABLE IF NOT EXISTS ai_content_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  prompt_used TEXT,
  generated_content TEXT,
  persona_source TEXT,
  persona_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ai_content_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on ai_content_log"
  ON ai_content_log FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Add AI tracking columns to community_posts
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS target_like_count INTEGER DEFAULT 0;

-- 4. Add AI tracking columns to community_comments
ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS target_like_count INTEGER DEFAULT 0;

-- 5. Insert default AI content automation settings
INSERT INTO app_settings (setting_key, setting_value, updated_at)
VALUES (
  'ai_content_automation',
  '{
    "posts_enabled": false,
    "comments_enabled": false,
    "posts_per_day": 2,
    "comments_per_post_min": 3,
    "comments_per_post_max": 5,
    "comment_target": "ai_only",
    "persona_pool_initialized": false
  }'::jsonb,
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;
