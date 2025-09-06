import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on the schema
export interface UserProfile {
  id: string
  name: string | null
  username: string | null
  age: number | null
  selected_goals: string[] | null
  time_preference: string | null
  daily_reminders: boolean | null
  user_reason: string | null
  referral_code: string | null
  journaling_experience: string | null
  subscription_status: string | null
  subscription_product_id: string | null
  subscription_expires_at: string | null
  invitation_reference: string | null
  user_type: 'normal' | 'admin' | 'invited' | null
  community_banned: boolean | null
  ban_reason: string | null
  banned_until: string | null
  banned_by: string | null
  banned_at: string | null
  created_at: string
  updated_at: string
}

export interface SupportRequest {
  id: string
  user_id: string | null
  name: string
  email: string
  subject: string
  message: string
  has_screenshot: boolean | null
  screenshot_path: string | null
  username: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface CommunityReport {
  id: string
  reporter_id: string
  post_id: string | null
  comment_id: string | null
  reason: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  admin_notes: string | null
  resolved_by: string | null
  created_at: string
  resolved_at: string | null
}

export interface Entry {
  id: string
  user_id: string
  content: string | null
  summary: string | null
  audio_url: string | null
  audio_duration: number | null
  mood_score: number | null
  sleep_score: number | null
  is_processed: boolean | null
  processing_status: string | null
  entry_type: string | null
  created_at: string
  updated_at: string
}

export interface CommunityPost {
  id: string
  author_id: string
  content: string
  tags: string[] | null
  like_count: number | null
  comment_count: number | null
  display_username: string | null
  display_avatar_color: string | null
  status: 'active' | 'scheduled' | null
  scheduled_at: string | null
  created_at: string
  updated_at: string
  avatar_color: string | null
}

export interface CommunityComment {
  id: string
  post_id: string
  author_id: string
  content: string
  like_count: number | null
  display_username: string | null
  display_avatar_color: string | null
  created_at: string
  updated_at: string
  avatar_color: string | null
} 

// Utility function to get signed URL for support screenshots
export const getSupportScreenshotUrl = async (screenshotPath: string | null): Promise<string | null> => {
  console.log('getSupportScreenshotUrl called with:', screenshotPath);
  
  if (!screenshotPath) {
    console.log('No screenshot path provided');
    return null;
  }
  
  try {
    console.log('Generating signed URL for support-imgs bucket');
    console.log('Screenshot path:', screenshotPath);
    console.log('Supabase client:', supabase);
    
    const { data, error } = await supabase.storage
      .from('support-imgs')
      .createSignedUrl(screenshotPath, 31536000); // 1 year expiry (effectively never expires for practical purposes)
    
    console.log('Supabase response:', { data, error });
    
    if (error) {
      console.error('Error creating signed URL:', error);
      console.error('Error details:', {
        message: error.message
      });
      return null;
    }
    
    console.log('Generated signed URL:', data.signedUrl);
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting screenshot URL:', error);
    console.error('Error type:', typeof error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return null;
  }
}; 