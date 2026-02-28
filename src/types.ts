export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'banned';
}

export interface Community {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  members_count: number;
  status: 'active' | 'inactive';
}

export interface SupportRequest {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  user?: User;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  reported_content_id?: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  created_at: string;
  updated_at: string;
  reporter?: User;
  reported_user?: User;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  created_at: string;
}

export interface OnboardingAnalytics {
  step_name: string;
  views: number;
  completions: number;
  completion_rate: number;
  funnel_pct: number;       // % of sessions that reached this step vs step 1
  step_dropoff: number | null; // % dropped between previous step and this one
  sessions_lost: number | null; // absolute sessions lost from previous step
} 