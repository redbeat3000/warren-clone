import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string | null;
  role: 'chairperson' | 'treasurer' | 'secretary' | 'member' | 'viewer';
  status: 'active' | 'inactive';
  photo_url: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile data
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setAuthUser(null);
        }
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUid: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_uid', authUid)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setAuthUser({
          id: data.id,
          email: data.email || '',
          first_name: data.first_name,
          last_name: data.last_name,
          full_name: data.full_name,
          role: data.role,
          status: data.status,
          photo_url: data.photo_url
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return { error };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) {
      toast({
        title: "Sign Up Failed", 
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return { error };
    }

    if (data.user && !data.session) {
      toast({
        title: "Check Your Email",
        description: "Please check your email and click the confirmation link to complete your registration.",
      });
    }

    setIsLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    return { error };
  };

  const isAdmin = () => {
    return authUser?.role && ['chairperson', 'treasurer', 'secretary'].includes(authUser.role);
  };

  const getProfilePicture = () => {
    if (authUser?.photo_url) {
      return authUser.photo_url;
    }
    
    // Default avatars based on role
    if (isAdmin()) {
      return '/admin-avatar.svg';
    }
    return '/user-avatar.svg';
  };

  return {
    user,
    session,
    authUser,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    getProfilePicture,
  };
};