-- Momu Admin Dashboard Database Setup
-- Run this script in your Supabase SQL editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  members_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create support_requests table
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_content_id UUID,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_communities_created_by ON communities(created_by);
CREATE INDEX IF NOT EXISTS idx_communities_status ON communities(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_requests_updated_at BEFORE UPDATE ON support_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO users (email, name, status) VALUES 
('admin@momu.com', 'Admin User', 'active'),
('test@momu.com', 'Test User', 'active'),
('user1@momu.com', 'User One', 'active'),
('user2@momu.com', 'User Two', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample communities
INSERT INTO communities (name, description, created_by) VALUES 
('General Discussion', 'A place for general conversations', (SELECT id FROM users WHERE email = 'admin@momu.com')),
('Tech Talk', 'Discussion about technology and programming', (SELECT id FROM users WHERE email = 'test@momu.com')),
('Creative Corner', 'Share your creative work and ideas', (SELECT id FROM users WHERE email = 'user1@momu.com'))
ON CONFLICT DO NOTHING;

-- Insert sample support requests
INSERT INTO support_requests (user_id, subject, message, status, priority) VALUES 
((SELECT id FROM users WHERE email = 'test@momu.com'), 'Login Issues', 'I cannot log into my account', 'open', 'high'),
((SELECT id FROM users WHERE email = 'user1@momu.com'), 'Feature Request', 'Can we add dark mode to the app?', 'open', 'medium'),
((SELECT id FROM users WHERE email = 'user2@momu.com'), 'Bug Report', 'The app crashes when I try to upload images', 'in_progress', 'high')
ON CONFLICT DO NOTHING;

-- Insert sample reports
INSERT INTO reports (reporter_id, reported_user_id, reason, description, status) VALUES 
((SELECT id FROM users WHERE email = 'test@momu.com'), (SELECT id FROM users WHERE email = 'user1@momu.com'), 'Spam', 'This user is posting spam content', 'pending'),
((SELECT id FROM users WHERE email = 'user2@momu.com'), (SELECT id FROM users WHERE email = 'user1@momu.com'), 'Inappropriate Content', 'Posted inappropriate images', 'pending')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
-- Note: You may need to adjust these policies based on your authentication setup
CREATE POLICY "Admin can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Admin can update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Admin can delete users" ON users FOR DELETE USING (true);

CREATE POLICY "Admin can view all communities" ON communities FOR SELECT USING (true);
CREATE POLICY "Admin can update communities" ON communities FOR UPDATE USING (true);
CREATE POLICY "Admin can delete communities" ON communities FOR DELETE USING (true);

CREATE POLICY "Admin can view all support requests" ON support_requests FOR SELECT USING (true);
CREATE POLICY "Admin can update support requests" ON support_requests FOR UPDATE USING (true);
CREATE POLICY "Admin can delete support requests" ON support_requests FOR DELETE USING (true);

CREATE POLICY "Admin can view all reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Admin can update reports" ON reports FOR UPDATE USING (true);
CREATE POLICY "Admin can delete reports" ON reports FOR DELETE USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated; 