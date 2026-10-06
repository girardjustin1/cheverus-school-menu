import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getUser, handleAuthCallback, logout, onAuthChange, type User } from '@netlify/identity';
interface Auth {
  user: { id: string; email: string } | null;
  demo: boolean;
  loading: boolean;
  error: string;
  passwordAction: 'recovery' | 'invite' | null;
  inviteToken?: string;
  finishPasswordAction: () => void;
  enterDemo: () => void;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [demo, setDemo] = useState(() => sessionStorage.getItem('cheverus.demo') === 'true');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passwordAction, setPasswordAction] = useState<'recovery' | 'invite' | null>(null);
  const [inviteToken, setInviteToken] = useState<string>();
  const [initialized, setInitialized] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    // Delay initialization to a microtask so StrictMode's first effect cleanup cannot redeem a token twice.
    void Promise.resolve().then(async () => {
      if (!active || initialized) return;
      try {
        const callback = await handleAuthCallback();
        if (active && callback) {
          sessionStorage.removeItem('cheverus.demo');
          setDemo(false);
          queryClient.clear();
        }
        if (active && (callback?.type === 'recovery' || callback?.type === 'invite')) {
          setPasswordAction(callback.type);
          setInviteToken(callback.token);
        }
        const current = await getUser();
        if (active) setUser(current);
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : 'Could not restore your sign-in.');
      } finally {
        if (active) {
          setLoading(false);
          setInitialized(true);
        }
      }
    });
    const unsubscribe = onAuthChange((event, current) => {
      if (active) {
        setUser(current);
        if (current && (event === 'login' || event === 'recovery')) {
          sessionStorage.removeItem('cheverus.demo');
          setDemo(false);
          queryClient.clear();
        }
        if (event === 'logout') queryClient.clear();
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [initialized, queryClient]);
  const enterDemo = () => {
    queryClient.clear();
    sessionStorage.setItem('cheverus.demo', 'true');
    setDemo(true);
  };
  const signOut = async () => {
    if (!demo) await logout();
    queryClient.clear();
    sessionStorage.removeItem('cheverus.demo');
    setDemo(false);
    setUser(null);
    setPasswordAction(null);
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
        passwordAction,
        inviteToken,
        finishPasswordAction: () => {
          setPasswordAction(null);
          setInviteToken(undefined);
        },
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
