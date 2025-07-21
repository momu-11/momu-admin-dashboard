import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { signIn, signOut, checkAdminUsers } from '../lib/mockData';

type AuthContextType = {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type Props = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const convertToUser = (supabaseUser: any) => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    user_metadata: supabaseUser.user_metadata || {}
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('AuthContext: Checking initial session...');
        
        // First, let's check if there are any admin users
        await checkAdminUsers();
        
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('AuthContext: Initial session result:', { session });
        
        if (session?.user) {
          console.log('AuthContext: User found in session, checking admin status...');
          // Check if user is admin
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();

          console.log('AuthContext: Profile check result:', { profile, profileError });

          if (profileError) {
            console.error('AuthContext: Error fetching profile:', profileError);
            await supabase.auth.signOut();
            setUser(null);
          } else           if (profile?.user_type === 'admin') {
            console.log('AuthContext: User is admin, setting user');
            setUser(convertToUser(session.user));
          } else {
            console.log('AuthContext: User is not admin, signing out');
            // If not admin, sign out
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
          console.log('AuthContext: No session found');
        }
      } catch (error) {
        console.error('AuthContext: Error checking initial session:', error);
        setUser(null);
      } finally {
        console.log('AuthContext: Setting loading to false');
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if user is admin
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();

          if (profile?.user_type === 'admin') {
            setUser(convertToUser(session.user));
          } else {
            // If not admin, sign out
            await supabase.auth.signOut();
            setUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login with:', email);
      setLoading(true);
      const { data, error } = await signIn(email, password);
      
      console.log('AuthContext: Sign in result:', { data, error });
      
      if (!error && data?.user) {
        console.log('AuthContext: Authentication successful, setting user');
        setUser(convertToUser(data.user));
        setLoading(false);
        return { error: null };
      }
      
      console.log('AuthContext: Login failed:', error);
      setLoading(false);
      return { error };
    } catch (error) {
      console.error('AuthContext: Login exception:', error);
      setLoading(false);
      return { error };
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 