'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getStoredUser, getStoredToken } from '@/lib/auth';
import { useAppStore } from '@/store/useAppStore';
import { connectSocket } from '@/lib/socket';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSocket } from '@/hooks/useSocket';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, setToken, token } = useAppStore();

  // Initialize socket listeners
  useSocket();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();
    if (storedUser) setUser(storedUser);
    if (storedToken) {
      setToken(storedToken);
      connectSocket(storedToken);
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
