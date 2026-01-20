import { supabase, UserProfile, SupportRequest, CommunityReport } from './supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  status?: string;
  created_at?: string;
  username?: string;
  user_type?: string;
  referral_code?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  community_banned?: boolean;
  ban_reason?: string;
  banned_until?: string;
  banned_by?: string;
  banned_at?: string;
}

export interface MockAuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ReferralCode {
  id: string;
  code: string;
  created_by: string;
  created_at: string;
  total_redemptions: number;
  last_7_days: number;
  last_30_days: number;
  last_60_days: number;
}

export interface ReferralRedemption {
  id: string;
  referral_code: string;
  redeemed_by: string;
  redeemed_at: string;
  user_email?: string;
  user_username?: string;
}

// Authentication functions
export const signIn = async (email: string, password: string) => {
  try {
    console.log('SignIn attempt with email:', email);
    
    // Check if Supabase is configured
    if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
      console.log('Supabase not configured, using fallback authentication');
      
      // Fallback authentication for development
      if (email === 'momu.app@gmail.com' && password === 'admin') {
        console.log('Fallback authentication successful');
        return { 
          data: { 
            user: {
              id: 'fallback-admin-id',
              email: 'momu.app@gmail.com',
              user_metadata: { name: 'Admin User' }
            }
          }, 
          error: null 
        };
      } else {
        return { 
          data: null, 
          error: { 
            message: 'Invalid credentials. Use momu.app@gmail.com / admin for fallback login.' 
          } 
        };
      }
    }
    
    // Removed pre-flight connection test - let the actual auth attempt handle connection issues
    // This prevents blocking on network tests that might fail due to firewall/VPN/proxy issues
    
    // Add timeout to prevent hanging - increased to 15 seconds for slower connections
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Login timeout after 15 seconds')), 15000);
    });
    
    const authPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;

    console.log('Supabase auth result:', { data, error });

    if (error) {
      console.error('Authentication error:', error);
      
      // Provide specific error messages
      if (error.message?.includes('Invalid login credentials')) {
        return { 
          data: null, 
          error: { 
            message: 'Invalid email or password. Please check your credentials and try again.' 
          } 
        };
      } else if (error.message?.includes('Email not confirmed')) {
        return { 
          data: null, 
          error: { 
            message: 'Email not confirmed. Please check your email and confirm your account.' 
          } 
        };
      } else if (error.message?.includes('Too many requests')) {
        return { 
          data: null, 
          error: { 
            message: 'Too many login attempts. Please wait a few minutes and try again.' 
          } 
        };
      } else if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
        return { 
          data: null, 
          error: { 
            message: 'Network error. Please check your internet connection and try again.' 
          } 
        };
      } else {
        return { 
          data: null, 
          error: { 
            message: `Authentication error: ${error.message}` 
          } 
        };
      }
    }

    // Check if user is admin
    if (data.user) {
      console.log('User authenticated, checking admin status for user ID:', data.user.id);
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single();

      console.log('Profile check result:', { profile, profileError });

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        await supabase.auth.signOut();
        return { 
          data: null, 
          error: { 
            message: 'Error checking user permissions. Please try again.' 
          } 
        };
      }

      if (profile?.user_type !== 'admin') {
        console.log('User is not admin, user_type:', profile?.user_type);
        await supabase.auth.signOut();
        return { 
          data: null, 
          error: { 
            message: 'Access denied. Admin privileges required.' 
          } 
        };
      }

      console.log('User is admin, login successful');
    }

    return { data, error: null };
  } catch (error) {
    console.error('SignIn exception:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return { 
          data: null, 
          error: { 
            message: 'Login timeout. Please check your internet connection and try again.' 
          } 
        };
      }
    }
    
    return { 
      data: null, 
      error: { 
        message: 'An unexpected error occurred. Please try again.' 
      } 
    };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error };
  }
};

export const getCurrentUser = async (): Promise<MockAuthUser | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user as MockAuthUser | null;
  } catch (error) {
    return null;
  }
};

// Test network connectivity - simplified to avoid external dependencies
export const testNetworkConnection = async () => {
  try {
    // Instead of testing external services, just test if we can reach Supabase
    // This is more reliable and doesn't depend on external services that might be blocked
    if (!process.env.REACT_APP_SUPABASE_URL) {
      return true; // Allow fallback auth if no Supabase configured
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Just test if we can reach the Supabase URL
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/rest/v1/`, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return true; // If we get any response, network is working
  } catch (error) {
    console.warn('Network test failed (non-blocking):', error);
    return true; // Don't block login if network test fails - let Supabase connection handle it
  }
};

// Debug function to check admin users
export const checkAdminUsers = async () => {
  try {
    console.log('Checking for admin users...');
    console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
    console.log('Supabase Anon Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
    
    // Check if environment variables are set
    if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
      console.log('Supabase not configured, using fallback data');
      return { 
        data: [
          {
            id: 'fallback-admin-id',
            username: 'admin',
            name: 'Admin User',
            user_type: 'admin'
          }
        ], 
        error: null 
      };
    }
    
    // Add timeout to prevent hanging - increased to 15 seconds for slower connections
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout after 15 seconds')), 15000);
    });
    
    const queryPromise = supabase
      .from('user_profiles')
      .select('id, username, name, user_type')
      .eq('user_type', 'admin');
    
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error('Error checking admin users:', error);
      
      // Provide specific error messages
      if (error.code === 'PGRST301') {
        return { 
          data: null, 
          error: { 
            message: 'Cannot reach Supabase server. Please check your internet connection.' 
          } 
        };
      } else if (error.code === 'PGRST116') {
        return { 
          data: null, 
          error: { 
            message: 'Invalid Supabase credentials. Please check your environment variables.' 
          } 
        };
      } else if (error.code === 'PGRST301') {
        return { 
          data: null, 
          error: { 
            message: 'Database table not found. Please check your Supabase schema.' 
          } 
        };
      } else {
        return { 
          data: null, 
          error: { 
            message: `Database error: ${error.message}` 
          } 
        };
      }
    }

    console.log('Admin users found:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Exception checking admin users:', error);
    return { 
      data: null, 
      error: { 
        message: error instanceof Error ? error.message : 'Network error. Please check your internet connection.' 
      } 
    };
  }
};

// Data fetching functions
export const getUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_type', 'normal')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    const users = data?.map((profile: UserProfile) => ({
      id: profile.id,
      email: profile.username || profile.id, // Use username as email, fallback to ID
      name: profile.name || profile.username || 'Unknown',
      role: 'user',
      status: 'active',
      created_at: profile.created_at,
      username: profile.username,
      user_type: profile.user_type,
      referral_code: profile.referral_code,
      subscription_status: profile.subscription_status,
      subscription_expires_at: profile.subscription_expires_at,
      community_banned: profile.community_banned || false,
      ban_reason: profile.ban_reason,
      banned_until: profile.banned_until,
      banned_by: profile.banned_by,
      banned_at: profile.banned_at,
    })) || [];

    return { data: users, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getPlayers = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .in('user_type', ['admin', 'invited'])
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    const players = data?.map((profile: UserProfile) => ({
      id: profile.id,
      email: profile.username || profile.id, // Use username as email, fallback to ID
      name: profile.name || profile.username || 'Unknown',
      role: profile.user_type || 'invited',
      status: 'active',
      created_at: profile.created_at,
      username: profile.username,
      user_type: profile.user_type,
      referral_code: profile.referral_code,
      subscription_status: profile.subscription_status,
      subscription_expires_at: profile.subscription_expires_at,
      community_banned: profile.community_banned || false,
      ban_reason: profile.ban_reason,
      banned_until: profile.banned_until,
      banned_by: profile.banned_by,
      banned_at: profile.banned_at,
    })) || [];

    return { data: players, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getInvitedUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_type', 'invited')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    const invitedUsers = data?.map((profile: UserProfile) => ({
      id: profile.id,
      email: profile.username || profile.id, // Use username as email, fallback to ID
      name: profile.name || profile.username || 'Unknown',
      role: 'invited',
      status: 'active',
      created_at: profile.created_at,
      reference: profile.invitation_reference,
      username: profile.username,
      user_type: profile.user_type,
      referral_code: profile.referral_code,
      subscription_status: profile.subscription_status,
      subscription_expires_at: profile.subscription_expires_at,
    })) || [];

    return { data: invitedUsers, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getCommunities = async () => {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:user_profiles!author_id(name, username)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getSupportRequests = async () => {
  try {
    console.log('Fetching support requests from support_requests table...');
    const { data, error } = await supabase
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching support requests:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      return { data: null, error };
    }

    console.log('Support requests fetched successfully:', data?.length, 'records');
    console.log('Sample support request:', data?.[0]);
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getSupportRequests:', error);
    return { data: null, error };
  }
};

export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { data: null, error };
    }

    const user = {
      id: data.id,
      email: data.username || data.id,
      name: data.name || data.username || 'Unknown',
      role: data.user_type || 'user',
      status: 'active',
      created_at: data.created_at,
      username: data.username,
      user_type: data.user_type,
      referral_code: data.referral_code,
      subscription_status: data.subscription_status,
      subscription_expires_at: data.subscription_expires_at,
      community_banned: data.community_banned || false,
      ban_reason: data.ban_reason,
      banned_until: data.banned_until,
      banned_by: data.banned_by,
      banned_at: data.banned_at,
    };

    return { data: user, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getReports = async () => {
  try {
    const { data, error } = await supabase
      .from('community_reports')
      .select(`
        *,
        reporter:user_profiles!reporter_id(name, username),
        post:community_posts(content),
        comment:community_comments(content)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserPosts = async (userId: string) => {
  try {
    console.log('Fetching posts for user ID:', userId);
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user posts:', error);
      return { data: null, error };
    }

    console.log('User posts fetched:', data);
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getUserPosts:', error);
    return { data: null, error };
  }
};

export const getUserComments = async (userId: string) => {
  try {
    console.log('Fetching comments for user ID:', userId);
    const { data, error } = await supabase
      .from('community_comments')
      .select(`
        *,
        post:community_posts(content)
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user comments:', error);
      return { data: null, error };
    }

    console.log('User comments fetched:', data);
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getUserComments:', error);
    return { data: null, error };
  }
};

export const getUserEntries = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Notification functions using community_notifications table
export const getUserNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('community_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user notifications:', error);
      
      // Check if it's a table not found error
      if (error.message && error.message.includes('relation "community_notifications" does not exist')) {
        console.warn('community_notifications table does not exist, returning empty array');
        return { data: [], error: null };
      }
      
      // Check if it's an RLS policy error
      if (error.message && error.message.includes('row-level security')) {
        console.error('RLS policy blocked access to notifications');
        return { data: [], error: new Error('Access denied: Row-level security policy blocked access') };
      }
      
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return { data: [], error };
  }
};

export const sendNotification = async (userId: string, title: string, message: string) => {
  try {
    // First, get the current user to use as actor_id
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (!currentUser.user) {
      return { data: null, error: new Error('No authenticated user found') };
    }

    // Use the stored procedure instead of direct table access
    const { data, error } = await supabase.rpc('create_community_notification', {
      user_id_param: userId,
      actor_id_param: currentUser.user.id,
      type_param: 'admin_message',
      title_param: title,
      message_param: message,
      post_id_param: null,
      comment_id_param: null
    });

    if (error) {
      console.error('Error sending notification via stored procedure:', error);
      
      // Fallback to direct table access if stored procedure fails
      console.log('Attempting fallback to direct table access...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('community_notifications')
        .insert({
          user_id: userId,
          title: title,
          message: message,
          type: 'admin_message',
          read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return { data: null, error: fallbackError };
      }

      return { data: fallbackData, error: null };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in sendNotification:', error);
    return { data: null, error };
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { data, error } = await supabase
      .from('community_notifications')
      .update({ 
        read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select();

    if (error) {
      console.error('Error marking notification as read:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return { data: null, error };
  }
};

// Action functions
export const updateSupportRequestStatus = async (id: string, status: string) => {
  try {
    const { error } = await supabase
      .from('support_requests')
      .update({ 
        status: status as SupportRequest['status'],
        updated_at: new Date().toISOString(),
        resolved_at: status === 'resolved' ? new Date().toISOString() : null
      })
      .eq('id', id);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const deleteSupportRequest = async (id: string) => {
  try {
    const { error } = await supabase
      .from('support_requests')
      .delete()
      .eq('id', id);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const updateReportStatus = async (reportId: string, newStatus: string) => {
  try {
    const { error } = await supabase
      .from('community_reports')
      .update({ status: newStatus })
      .eq('id', reportId);

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const deleteReport = async (reportId: string) => {
  try {
    const { error } = await supabase
      .from('community_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const updateUserStatus = async (id: string, status: string) => {
  try {
    // Note: User status isn't directly tracked in user_profiles, 
    // but we could use subscription_status or add a custom field
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const createUser = async (email: string, password: string, reference: string) => {
  try {
    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { data: null, error: authError };
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        user_type: 'invited',
        invitation_reference: reference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      return { data: null, error: profileError };
    }

    return { 
      data: {
        id: authData.user.id,
        email,
        reference,
        role: 'invited',
        status: 'active',
        created_at: profileData.created_at,
      }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error };
  }
};

export const deletePost = async (postId: string) => {
  try {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);

    return { data: null, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const deleteComment = async (commentId: string) => {
  try {
    const { error } = await supabase
      .from('community_comments')
      .delete()
      .eq('id', commentId);

    return { data: null, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Referral functions
export const getReferralCodes = async () => {
  try {
    // Get all unique referral codes from user_profiles
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('referral_code, created_at')
      .not('referral_code', 'is', null)
      .not('referral_code', 'eq', '');

    if (usersError) {
      return { data: null, error: usersError };
    }

    // Group by referral code and calculate statistics
    const referralStats = new Map<string, ReferralCode>();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    users?.forEach((user) => {
      if (user.referral_code) {
        const createdDate = new Date(user.created_at);
        const code = user.referral_code;

        if (!referralStats.has(code)) {
          referralStats.set(code, {
            id: code,
            code: code,
            created_by: 'system',
            created_at: user.created_at,
            total_redemptions: 0,
            last_7_days: 0,
            last_30_days: 0,
            last_60_days: 0,
          });
        }

        const stats = referralStats.get(code)!;
        stats.total_redemptions++;

        if (createdDate >= sevenDaysAgo) {
          stats.last_7_days++;
        }
        if (createdDate >= thirtyDaysAgo) {
          stats.last_30_days++;
        }
        if (createdDate >= sixtyDaysAgo) {
          stats.last_60_days++;
        }
      }
    });

    const referralCodes = Array.from(referralStats.values());
    return { data: referralCodes, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getReferralRedemptions = async (referralCode: string) => {
  try {
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, username, email, created_at')
      .eq('referral_code', referralCode)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    const redemptions: ReferralRedemption[] = users?.map((user) => ({
      id: user.id,
      referral_code: referralCode,
      redeemed_by: user.id,
      redeemed_at: user.created_at,
      user_email: user.email,
      user_username: user.username,
    })) || [];

    return { data: redemptions, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getBannedUsers = async () => {
  try {
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('community_banned', true)
      .order('banned_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    const bannedUsers: User[] = users?.map((user) => ({
      id: user.id,
      email: user.email || '',
      name: user.name,
      username: user.username,
      user_type: user.user_type,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      referral_code: user.referral_code,
      subscription_status: user.subscription_status,
      subscription_expires_at: user.subscription_expires_at,
      community_banned: user.community_banned,
      ban_reason: user.ban_reason,
      banned_until: user.banned_until,
      banned_by: user.banned_by,
      banned_at: user.banned_at,
    })) || [];

    return { data: bannedUsers, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const banUser = async (userId: string, reason?: string, bannedUntil?: string, adminId?: string) => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        community_banned: true,
        ban_reason: reason || null,
        banned_until: bannedUntil || null,
        banned_by: adminId || null,
        banned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { error };
    }

    // Create a notification for the user
    const notificationMessage = bannedUntil 
      ? `You have been banned from community features until ${new Date(bannedUntil).toLocaleDateString()}. Reason: ${reason || 'No reason provided'}`
      : `You have been permanently banned from community features. Reason: ${reason || 'No reason provided'}`;
    
    await sendNotification(userId, 'Community Ban', notificationMessage);

    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const unbanUser = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        community_banned: false,
        ban_reason: null,
        banned_until: null,
        banned_by: null,
        banned_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { error };
    }

    // Notify the user that their community ban has been lifted
    await sendNotification(userId, 'Community Ban Lifted', 'Your community ban has been lifted. You can now post and comment again.');

    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Home Dashboard Stats functions
export interface UserStats {
  total: number;
  active: {
    week: number;
    month: number;
    sixMonths: number;
    year: number;
    all: number;
  };
  inactive: {
    week: number;
    month: number;
    sixMonths: number;
    year: number;
    all: number;
  };
  newActive: {
    week: number;
    month: number;
    sixMonths: number;
    year: number;
    all: number;
  };
  newInactive: {
    week: number;
    month: number;
    sixMonths: number;
    year: number;
    all: number;
  };
  churnRate: number; // percentage
}

export interface SubscriptionStats {
  monthly: {
    week: number;
    month: number;
    sixMonths: number;
    year: number;
    all: number;
  };
  yearly: {
    week: number;
    month: number;
    sixMonths: number;
    year: number;
    all: number;
  };
  specialOffer: {
    week: number;
    month: number;
    sixMonths: number;
    year: number;
    all: number;
  };
  restoredPromo: {
    week: number;
    month: number;
    sixMonths: number;
    year: number;
    all: number;
  };
  free: {
    week: number;
    month: number;
    sixMonths: number;
    year: number;
    all: number;
  };
}

export interface SupportStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface ReportStats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
}

export interface ReferralCodeStats {
  code: string;
  count: number;
}

export interface CommunityStats {
  date: string;
  posts: number;
  comments: number;
}

export const getUserStats = async (): Promise<{ data: UserStats | null; error: any }> => {
  try {
    const { data: allUsers, error } = await supabase
      .from('user_profiles')
      .select('created_at, subscription_status, subscription_expires_at, updated_at')
      .eq('user_type', 'normal');

    if (error) {
      return { data: null, error };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    // Helper to check if user is currently active
    const isUserActive = (u: any) => {
      const status = (u.subscription_status || '').toLowerCase();
      const expiresAt = u.subscription_expires_at ? new Date(u.subscription_expires_at) : null;
      return status === 'active' || 
             status === 'subscribed' || 
             status === 'trialing' ||
             (expiresAt && expiresAt > now);
    };
    
    // Get NEW active subscriptions in period (users who signed up in period AND are currently active)
    const getNewActiveInPeriod = (startDate: Date) => {
      return allUsers?.filter(u => 
        new Date(u.created_at) >= startDate && isUserActive(u)
      ).length || 0;
    };
    
    // Get users who became inactive (churned) in period
    const getChurnedInPeriod = (startDate: Date) => {
      return allUsers?.filter(u => {
        const expiresAt = u.subscription_expires_at ? new Date(u.subscription_expires_at) : null;
        // User churned if their subscription expired within this period
        if (expiresAt && expiresAt >= startDate && expiresAt <= now && !isUserActive(u)) {
          return true;
        }
        return false;
      }).length || 0;
    };
    
    // Calculate churn rate (current inactive / total * 100)
    const totalUsers = allUsers?.length || 0;
    const currentActive = allUsers?.filter(isUserActive).length || 0;
    const currentInactive = allUsers?.filter(u => !isUserActive(u)).length || 0;
    const churnRate = totalUsers > 0 ? Math.round((currentInactive / totalUsers) * 1000) / 10 : 0;

    const stats: UserStats = {
      total: totalUsers,
      active: {
        week: getNewActiveInPeriod(oneWeekAgo),
        month: getNewActiveInPeriod(oneMonthAgo),
        sixMonths: getNewActiveInPeriod(sixMonthsAgo),
        year: getNewActiveInPeriod(oneYearAgo),
        all: currentActive,
      },
      inactive: {
        week: getChurnedInPeriod(oneWeekAgo),
        month: getChurnedInPeriod(oneMonthAgo),
        sixMonths: getChurnedInPeriod(sixMonthsAgo),
        year: getChurnedInPeriod(oneYearAgo),
        all: currentInactive,
      },
      newActive: {
        week: getNewActiveInPeriod(oneWeekAgo),
        month: getNewActiveInPeriod(oneMonthAgo),
        sixMonths: getNewActiveInPeriod(sixMonthsAgo),
        year: getNewActiveInPeriod(oneYearAgo),
        all: currentActive,
      },
      newInactive: {
        week: getChurnedInPeriod(oneWeekAgo),
        month: getChurnedInPeriod(oneMonthAgo),
        sixMonths: getChurnedInPeriod(sixMonthsAgo),
        year: getChurnedInPeriod(oneYearAgo),
        all: currentInactive,
      },
      churnRate
    };

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getSubscriptionStats = async (): Promise<{ data: SubscriptionStats | null; error: any }> => {
  try {
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('subscription_status, subscription_product_id, created_at, subscription_expires_at')
      .eq('user_type', 'normal');

    if (error) {
      return { data: null, error };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    // Helper to check if subscription was active during period
    const isActiveInPeriod = (user: any, startDate: Date) => {
      const createdAt = new Date(user.created_at);
      const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
      const status = (user.subscription_status || '').toLowerCase();
      
      // Check if subscription was active during the period
      const wasActive = status === 'active' || 
                       status === 'subscribed' || 
                       status === 'trialing' ||
                       (expiresAt && expiresAt > startDate);
      
      return wasActive && createdAt <= now && (!expiresAt || expiresAt >= startDate);
    };
    
    // Count subscriptions by type for a given period
    const countByTypeInPeriod = (startDate: Date | null) => {
      const counts = {
        monthly: 0,
        yearly: 0,
        specialOffer: 0,
        restoredPromo: 0,
        free: 0,
      };
      
      users?.forEach(user => {
        // For "all" period (startDate is null), count all active subscriptions
        // For specific periods, check if subscription was active during that period
        if (startDate === null) {
          // Count all currently active subscriptions
          const status = (user.subscription_status || '').toLowerCase();
          const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
          const isActive = status === 'active' || 
                         status === 'subscribed' || 
                         status === 'trialing' ||
                         (expiresAt && expiresAt > now);
          if (!isActive) return;
        } else {
          if (!isActiveInPeriod(user, startDate)) return;
        }
        
        const productId = (user.subscription_product_id || '').toLowerCase();
        const status = (user.subscription_status || '').toLowerCase();
        
        if (productId.includes('monthly') || productId.includes('month')) {
          counts.monthly++;
        } else if (productId.includes('yearly') || productId.includes('annual') || productId.includes('year')) {
          counts.yearly++;
        } else if (productId.includes('special') || productId.includes('offer') || productId.includes('promo')) {
          counts.specialOffer++;
        } else if (status === 'restored' || productId.includes('restored')) {
          counts.restoredPromo++;
        } else {
          counts.free++;
        }
      });
      
      return counts;
    };

    const stats: SubscriptionStats = {
      monthly: {
        week: countByTypeInPeriod(oneWeekAgo).monthly,
        month: countByTypeInPeriod(oneMonthAgo).monthly,
        sixMonths: countByTypeInPeriod(sixMonthsAgo).monthly,
        year: countByTypeInPeriod(oneYearAgo).monthly,
        all: countByTypeInPeriod(null).monthly,
      },
      yearly: {
        week: countByTypeInPeriod(oneWeekAgo).yearly,
        month: countByTypeInPeriod(oneMonthAgo).yearly,
        sixMonths: countByTypeInPeriod(sixMonthsAgo).yearly,
        year: countByTypeInPeriod(oneYearAgo).yearly,
        all: countByTypeInPeriod(null).yearly,
      },
      specialOffer: {
        week: countByTypeInPeriod(oneWeekAgo).specialOffer,
        month: countByTypeInPeriod(oneMonthAgo).specialOffer,
        sixMonths: countByTypeInPeriod(sixMonthsAgo).specialOffer,
        year: countByTypeInPeriod(oneYearAgo).specialOffer,
        all: countByTypeInPeriod(null).specialOffer,
      },
      restoredPromo: {
        week: countByTypeInPeriod(oneWeekAgo).restoredPromo,
        month: countByTypeInPeriod(oneMonthAgo).restoredPromo,
        sixMonths: countByTypeInPeriod(sixMonthsAgo).restoredPromo,
        year: countByTypeInPeriod(oneYearAgo).restoredPromo,
        all: countByTypeInPeriod(null).restoredPromo,
      },
      free: {
        week: countByTypeInPeriod(oneWeekAgo).free,
        month: countByTypeInPeriod(oneMonthAgo).free,
        sixMonths: countByTypeInPeriod(sixMonthsAgo).free,
        year: countByTypeInPeriod(oneYearAgo).free,
        all: countByTypeInPeriod(null).free,
      },
    };

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getSupportStats = async (): Promise<{ data: SupportStats | null; error: any }> => {
  try {
    const { data: requests, error } = await supabase
      .from('support_requests')
      .select('status');

    if (error) {
      console.error('Error fetching support stats from support_requests table:', error);
      return { data: null, error };
    }

    console.log('Support requests fetched from support_requests table:', requests?.length, 'records');

    const stats: SupportStats = {
      total: requests?.length || 0,
      open: requests?.filter(r => r.status === 'open').length || 0,
      inProgress: requests?.filter(r => r.status === 'in_progress').length || 0,
      resolved: requests?.filter(r => r.status === 'resolved').length || 0,
      closed: requests?.filter(r => r.status === 'closed').length || 0,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Exception in getSupportStats:', error);
    return { data: null, error };
  }
};

export const getReportStats = async (): Promise<{ data: ReportStats | null; error: any }> => {
  try {
    const { data: reports, error } = await supabase
      .from('community_reports')
      .select('status');

    if (error) {
      console.error('Error fetching report stats from community_reports table:', error);
      return { data: null, error };
    }

    console.log('Reports fetched from community_reports table:', reports?.length, 'records');

    const stats: ReportStats = {
      total: reports?.length || 0,
      pending: reports?.filter(r => r.status === 'pending').length || 0,
      reviewed: reports?.filter(r => r.status === 'reviewed').length || 0,
      resolved: reports?.filter(r => r.status === 'resolved').length || 0,
      dismissed: reports?.filter(r => r.status === 'dismissed').length || 0,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Exception in getReportStats:', error);
    return { data: null, error };
  }
};

export const getPopularReferralCodes = async (period: 'week' | 'month' | 'sixMonths' | 'year' | 'all'): Promise<{ data: ReferralCodeStats[] | null; error: any }> => {
  try {
    let dateFilter: Date | null = null;
    const now = new Date();

    switch (period) {
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'sixMonths':
        dateFilter = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = null;
    }

    let query = supabase
      .from('user_profiles')
      .select('referral_code, created_at')
      .not('referral_code', 'is', null)
      .not('referral_code', 'eq', '');

    const { data: users, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Filter by date if needed
    const filteredUsers = dateFilter 
      ? users?.filter(u => new Date(u.created_at) >= dateFilter!) 
      : users;

    // Count occurrences of each referral code
    const codeCounts = new Map<string, number>();
    filteredUsers?.forEach(user => {
      if (user.referral_code) {
        codeCounts.set(user.referral_code, (codeCounts.get(user.referral_code) || 0) + 1);
      }
    });

    // Convert to array and sort by count descending
    const stats: ReferralCodeStats[] = Array.from(codeCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getCommunityStats = async (period: 'day' | 'threeDay' | 'week' | 'month'): Promise<{ data: CommunityStats[] | null; error: any }> => {
  try {
    const now = new Date();
    let startDate: Date;
    let intervalDays: number;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        intervalDays = 1;
        break;
      case 'threeDay':
        startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        intervalDays = 3;
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        intervalDays = 7;
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        intervalDays = 30;
        break;
    }

    const [postsResult, commentsResult] = await Promise.all([
      supabase
        .from('community_posts')
        .select('created_at')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('community_comments')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
    ]);

    if (postsResult.error || commentsResult.error) {
      return { data: null, error: postsResult.error || commentsResult.error };
    }

    // Group by day
    const statsMap = new Map<string, CommunityStats>();
    
    // Initialize all days in range
    for (let i = 0; i < intervalDays; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      statsMap.set(dateKey, { date: dateKey, posts: 0, comments: 0 });
    }

    // Count posts per day
    postsResult.data?.forEach(post => {
      const dateKey = new Date(post.created_at).toISOString().split('T')[0];
      if (statsMap.has(dateKey)) {
        statsMap.get(dateKey)!.posts++;
      }
    });

    // Count comments per day
    commentsResult.data?.forEach(comment => {
      const dateKey = new Date(comment.created_at).toISOString().split('T')[0];
      if (statsMap.has(dateKey)) {
        statsMap.get(dateKey)!.comments++;
      }
    });

    const stats = Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Onboarding Analytics functions
export const getOnboardingAnalytics = async () => {
  try {
    const { data, error } = await supabase
      .from('onboarding_events')
      .select('step_name, event_type');

    if (error) {
      console.error('Error fetching onboarding analytics:', error);
      return { data: null, error };
    }

    // Process the data to calculate views, completions, and completion rates
    const stepStats = new Map<string, { views: number; completions: number }>();
    
    data?.forEach((event: any) => {
      if (!event.step_name) return;
      
      if (!stepStats.has(event.step_name)) {
        stepStats.set(event.step_name, { views: 0, completions: 0 });
      }
      
      const stats = stepStats.get(event.step_name)!;
      
      if (event.event_type === 'step_viewed') {
        stats.views++;
      } else if (event.event_type === 'step_completed') {
        stats.completions++;
      }
    });

    // Define the order of steps
    const stepOrder = [
      'welcome',
      'reason',
      'mood-check',
      'journaling-experience',
      'user-details',
      'solution',
      'chart',
      'goals',
      'time-preference',
      'testimonials',
      'referral',
      'outcome-preview',
      'paywall',
      'special-offer'
    ];

    // Convert to array and calculate completion rates
    const analytics = stepOrder
      .filter(stepName => stepStats.has(stepName))
      .map(stepName => {
        const stats = stepStats.get(stepName)!;
        const completion_rate = stats.views > 0 
          ? Math.round((stats.completions / stats.views) * 1000) / 10 
          : 0;
        
        return {
          step_name: stepName,
          views: stats.views,
          completions: stats.completions,
          completion_rate
        };
      });

    return { data: analytics, error: null };
  } catch (error) {
    console.error('Exception in getOnboardingAnalytics:', error);
    return { data: null, error };
  }
};

// Export supabase client for direct use
export { supabase }; 