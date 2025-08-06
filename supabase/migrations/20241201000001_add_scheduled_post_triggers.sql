-- Create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION activate_scheduled_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the post status to 'active' when scheduled_at time arrives
  UPDATE community_posts 
  SET status = 'active' 
  WHERE id = NEW.id 
    AND status = 'scheduled' 
    AND scheduled_at <= NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that fires every minute to check for posts that should be activated
CREATE OR REPLACE FUNCTION check_scheduled_posts()
RETURNS void AS $$
BEGIN
  -- Update all posts that are scheduled and past their scheduled time
  UPDATE community_posts 
  SET status = 'active' 
  WHERE status = 'scheduled' 
    AND scheduled_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a cron-like function using pg_cron extension (if available)
-- This will run every minute automatically
DO $$
BEGIN
  -- Check if pg_cron extension is available
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule the function to run every minute
    PERFORM cron.schedule(
      'activate-scheduled-posts',
      '* * * * *', -- every minute
      'SELECT check_scheduled_posts();'
    );
  END IF;
END $$;

-- Alternative: Create a trigger that fires on INSERT/UPDATE to check timing
CREATE OR REPLACE FUNCTION trigger_scheduled_post_check()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a scheduled post, check if it should be activated immediately
  IF NEW.status = 'scheduled' AND NEW.scheduled_at <= NOW() THEN
    NEW.status := 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS scheduled_post_check_trigger ON community_posts;
CREATE TRIGGER scheduled_post_check_trigger
  BEFORE INSERT OR UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_scheduled_post_check();

-- Create an index to improve performance of scheduled post queries
CREATE INDEX IF NOT EXISTS idx_community_posts_scheduled_status 
ON community_posts(status, scheduled_at) 
WHERE status = 'scheduled'; 