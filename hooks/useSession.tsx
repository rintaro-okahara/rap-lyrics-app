import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

type SessionContextValue = {
  session: string | null;
  signInWithGoogle: (sessionLabel?: string) => void;
  signInWithApple: (sessionLabel?: string) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<string | null>(null);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      signInWithGoogle: (sessionLabel) => setSession(sessionLabel ?? 'google-user'),
      signInWithApple: (sessionLabel) => setSession(sessionLabel ?? 'apple-user'),
      signOut: () => setSession(null),
    }),
    [session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return value;
}
