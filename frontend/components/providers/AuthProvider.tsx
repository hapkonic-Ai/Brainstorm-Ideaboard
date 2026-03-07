'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { getStoredToken, getStoredUser } from '@/lib/auth';
import { authApi } from '@/lib/api';

const PUBLIC_PATHS = ['/login', '/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setToken } = useAppStore();

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      setToken(token);
      setUser(storedUser);

      // Refresh user data from server
      authApi.me().then((res) => {
        setUser(res.data.user);
      }).catch(() => {
        // Token invalid
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push('/login');
        }
      });
    } else {
      if (!PUBLIC_PATHS.includes(pathname)) {
        router.push('/login');
      }
    }
  }, [pathname, router, setToken, setUser]);

  return <>{children}</>;
}
