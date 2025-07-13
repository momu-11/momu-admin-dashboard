import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Momu Supabase credentials
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for authentication
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user;
};

// Helper functions for admin dashboard data
export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const getCommunities = async () => {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const getSupportRequests = async () => {
  const { data, error } = await supabase
    .from('support_requests')
    .select(`
      *,
      user:users(id, email, name)
    `)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const getReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:users!reports_reporter_id_fkey(id, email, name),
      reported_user:users!reports_reported_user_id_fkey(id, email, name)
    `)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const updateSupportRequestStatus = async (id: string, status: string) => {
  const { error } = await supabase
    .from('support_requests')
    .update({ status })
    .eq('id', id);
  
  return { error };
};

export const updateReportStatus = async (id: string, status: string) => {
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', id);
  
  return { error };
};

export const updateUserStatus = async (id: string, status: string) => {
  const { error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', id);
  
  return { error };
}; 