import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentUser, signIn, signOut } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
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

// TODO: Update with actual Momu admin credentials
const ADMIN_EMAIL = 'admin@momu.com';
const ADMIN_USER_ID = 'momu-admin-user-id';

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        // Only set the user if they are an admin
        if (currentUser && (currentUser.email === ADMIN_EMAIL || currentUser.id === ADMIN_USER_ID)) {
          setUser(currentUser);
        } else {
          // If not admin, handle as not authenticated
          setUser(null);
          // Clear any stored auth
          localStorage.removeItem('momu-admin-auth');
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await signIn(email, password);
    
    if (!error && data?.user) {
      // Check if user is the admin
      if (data.user.email === ADMIN_EMAIL || data.user.id === ADMIN_USER_ID) {
        // Grant access
        setUser(data.user);
        // Store auth token in localStorage (optional, as Supabase manages this)
        localStorage.setItem('momu-admin-auth', 'true');
        return { error: null };
      } else {
        // Not an admin, deny access
        setUser(null);
        await signOut(); // Sign out non-admin user
        return { 
          error: { 
            message: 'You are not authorized to access this dashboard.'
          } 
        };
      }
    }
    
    return { error };
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    localStorage.removeItem('momu-admin-auth');
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