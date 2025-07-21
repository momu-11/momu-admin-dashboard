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
    
    // Test basic connection first
    try {
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Connection test failed:', testError);
        if (testError.code === 'PGRST301') {
          return { 
            data: null, 
            error: { 
              message: 'Cannot reach Supabase server. Please check your internet connection and try again.' 
            } 
          };
        } else if (testError.code === 'PGRST116') {
          return { 
            data: null, 
            error: { 
              message: 'Invalid Supabase credentials. Please check your environment variables.' 
            } 
          };
        } else {
          return { 
            data: null, 
            error: { 
              message: `Database connection error: ${testError.message}` 
            } 
          };
        }
      }
    } catch (connectionError) {
      console.error('Connection test exception:', connectionError);
      return { 
        data: null, 
        error: { 
          message: 'Cannot reach Supabase server. Please check your internet connection and try again.' 
        } 
      };
    }
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Login timeout after 10 seconds')), 10000);
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

// Test network connectivity
export const testNetworkConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://httpbin.org/get', { 
      method: 'GET',
      mode: 'cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Network test failed:', error);
    return false;
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
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000);
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
    const { data, error } = await supabase
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
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

// Export supabase client for direct use
export { supabase }; 