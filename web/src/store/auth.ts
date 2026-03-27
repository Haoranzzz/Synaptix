import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, AuthError } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data?.user) set({ user: data.user });
    return { error };
  },
  signUpWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (data?.user && !error) {
      set({ user: data.user });
      
      // Try to create profile and default watchlist
      try {
        // Check if profile exists (might have been created by trigger if configured)
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!profile) {
          await supabase.from('user_profiles').insert({
            id: data.user.id,
            email: email,
            display_name: email.split('@')[0],
          });

          await supabase.from('user_watchlists').insert({
            user_id: data.user.id,
            name: '默认自选',
            is_default: true,
          });
        }
      } catch (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }
    return { error };
  },
  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, loading: false });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },
}));
