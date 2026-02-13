'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { workspaceApi } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { workspaces, currentWorkspace, setWorkspaces, setCurrentWorkspace } = useAppStore();

  useEffect(() => {
    workspaceApi.getAll().then((res) => {
      const ws = res.data.workspaces;
      setWorkspaces(ws);
      if (ws.length > 0) {
        const first = currentWorkspace || ws[0];
        setCurrentWorkspace(first);
        router.replace(`/workspace/${first.id}`);
      }
    });
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <p>Loading your workspace...</p>
      </div>
    </div>
  );
}
