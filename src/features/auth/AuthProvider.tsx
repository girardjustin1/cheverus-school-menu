import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';
interface Auth {
  user: { id: string; email: string } | null;
  demo: boolean;
  loading: boolean;
  error: string;
  enterDemo: () => void;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [demo, setDemo] = useState(() => sessionStorage.getItem('cheverus.demo') === 'true');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data, error: authError }) => {
        if (active) {
          setUser(data.session?.user || null);
          setLoading(false);
          if (authError) setError(authError.message);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user || null);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const enterDemo = () => {
    queryClient.clear();
    sessionStorage.setItem('cheverus.demo', 'true');
    setDemo(true);
  };
  const signOut = async () => {
    if (!demo && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    queryClient.clear();
    sessionStorage.removeItem('cheverus.demo');
    setDemo(false);
    setUser(null);
  };
  return (
    <AuthContext.Provider
      value={{
        user: demo
          ? { id: 'sample-parent', email: '' }
          : user
            ? { id: user.id, email: user.email || '' }
            : null,
        demo,
        loading,
        error,
        enterDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is missing');
  return context;
}
