import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { useAuth as originalUseAuth } from '../../src/features/auth/AuthProvider';
import { prototypeLoginEvent } from './identity';

type Auth = ReturnType<typeof originalUseAuth>;
const Context = createContext<Auth | null>(null);
export function AuthProvider({
  children,
  signedIn = true,
}: {
  children: ReactNode;
  signedIn?: boolean;
}) {
  const [active, setActive] = useState(signedIn);
  const client = useQueryClient();
  useEffect(() => {
    const enter = () => setActive(true);
    window.addEventListener(prototypeLoginEvent, enter);
    return () => window.removeEventListener(prototypeLoginEvent, enter);
  }, []);
  return (
    <Context.Provider
      value={{
        user: active ? { id: 'prototype-parent', email: 'parent@example.com' } : null,
        demo: true,
        loading: false,
        error: '',
        passwordAction: null,
        finishPasswordAction: () => {},
        enterDemo: () => setActive(true),
        signOut: async () => {
          client.clear();
          setActive(false);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('Prototype AuthProvider is missing');
  return value;
}
