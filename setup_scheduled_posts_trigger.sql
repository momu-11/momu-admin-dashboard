-- =====================================================
-- AUTOMATIC SCHEDULED POST ACTIVATION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Add missing columns to community_posts table
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Step 2: Create a function that checks and activates scheduled posts
CREATE OR REPLACE FUNCTION check_and_activate_scheduled_posts()
RETURNS void AS $$
BEGIN
  -- Update all posts that are scheduled and past their scheduled time
  UPDATE community_posts 
  SET status = 'active' 
  WHERE status = 'scheduled' 
    AND scheduled_at <= NOW();
  
  -- Log how many posts were activated (optional)
  RAISE NOTICE 'Checked for scheduled posts at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a trigger that fires on INSERT/UPDATE to check timing immediately
CREATE OR REPLACE FUNCTION trigger_scheduled_post_check()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a scheduled post, check if it should be activated immediately
  IF NEW.status = 'scheduled' AND NEW.scheduled_at <= NOW() THEN
    NEW.status := 'active';
    RAISE NOTICE 'Post % activated immediately (scheduled time was in the past)', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger on the community_posts table
DROP TRIGGER IF EXISTS scheduled_post_check_trigger ON community_posts;
CREATE TRIGGER scheduled_post_check_trigger
  BEFORE INSERT OR UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_scheduled_post_check();

-- Step 5: Create an index to improve performance
CREATE INDEX IF NOT EXISTS idx_community_posts_scheduled_status 
ON community_posts(status, scheduled_at) 
WHERE status = 'scheduled';

-- Step 6: Test the function manually
SELECT check_and_activate_scheduled_posts();

-- =====================================================
-- HOW TO USE:
-- =====================================================
-- 1. This trigger will automatically activate posts when:
--    - You create a post with scheduled_at in the past
--    - You update a post's scheduled_at to a past time
--
-- 2. To manually check for overdue posts, run:
--    SELECT check_and_activate_scheduled_posts();
--
-- 3. To see all scheduled posts:
--    SELECT * FROM community_posts WHERE status = 'scheduled' ORDER BY scheduled_at;
--
-- 4. To see all active posts:
--    SELECT * FROM community_posts WHERE status = 'active' ORDER BY created_at DESC;
--
-- 5. To see the table structure:
--    \d community_posts
-- ===================================================== 