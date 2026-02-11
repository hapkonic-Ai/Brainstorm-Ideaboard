'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useSocket } from '@/hooks/useSocket';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAppStore();

  // This initializes socket event listeners
  useSocket();

  useEffect(() => {
    if (!token) return;
    connectSocket(token);
    return () => {
      // Don't disconnect on every re-render, only when truly unmounting
    };
  }, [token]);

  return <>{children}</>;
}
