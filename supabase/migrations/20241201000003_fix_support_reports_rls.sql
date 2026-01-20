-- Enable RLS on support_requests and community_reports tables if not already enabled
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all support requests" ON support_requests;
DROP POLICY IF EXISTS "Admins can update support requests" ON support_requests;
DROP POLICY IF EXISTS "Admins can delete support requests" ON support_requests;
DROP POLICY IF EXISTS "Users can create support requests" ON support_requests;
DROP POLICY IF EXISTS "Users can view their own support requests" ON support_requests;

DROP POLICY IF EXISTS "Admins can view all community reports" ON community_reports;
DROP POLICY IF EXISTS "Admins can update community reports" ON community_reports;
DROP POLICY IF EXISTS "Admins can delete community reports" ON community_reports;
DROP POLICY IF EXISTS "Users can create community reports" ON community_reports;
DROP POLICY IF EXISTS "Users can view their own community reports" ON community_reports;

-- Create policies for support_requests
-- Allow admins to view all support requests
CREATE POLICY "Admins can view all support requests" ON support_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Allow admins to update support requests
CREATE POLICY "Admins can update support requests" ON support_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Allow admins to delete support requests
CREATE POLICY "Admins can delete support requests" ON support_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Allow users to create support requests
CREATE POLICY "Users can create support requests" ON support_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own support requests
CREATE POLICY "Users can view their own support requests" ON support_requests
  FOR SELECT
  USING (user_id = auth.uid());

-- Create policies for community_reports
-- Allow admins to view all community reports
CREATE POLICY "Admins can view all community reports" ON community_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Allow admins to update community reports
CREATE POLICY "Admins can update community reports" ON community_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Allow admins to delete community reports
CREATE POLICY "Admins can delete community reports" ON community_reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Allow users to create community reports
CREATE POLICY "Users can create community reports" ON community_reports
  FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Allow users to view their own community reports
CREATE POLICY "Users can view their own community reports" ON community_reports
  FOR SELECT
  USING (reporter_id = auth.uid());

