'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { workspaceApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { isAuthenticated } from '@/lib/auth';

function JoinContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const [loading, setLoading] = useState(true);

    const joinWorkspace = useCallback(async (inviteCode: string) => {
        try {
            const res = await workspaceApi.join(inviteCode);
            const ws = res.data.workspace;
            toast({ title: `Successfully joined ${ws.name}!` });
            router.push(`/workspace/${ws.id}`);
        } catch (e: unknown) {
            if (e && typeof e === 'object' && 'response' in e) {
                const err = e as { response?: { data?: { error?: string } } };
                toast({ title: err.response?.data?.error || 'Failed to join workspace', variant: 'destructive' });
            } else {
                toast({ title: 'Failed to join workspace', variant: 'destructive' });
            }
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (!code) {
            toast({ title: 'Invalid invite link', variant: 'destructive' });
            router.push('/');
            return;
        }

        if (!isAuthenticated()) {
            sessionStorage.setItem('joinCode', code);
            router.push('/login');
            return;
        }

        joinWorkspace(code);
    }, [code, router, joinWorkspace]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-violet-50 p-4">
            {loading ? (
                <>
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Joining Workspace...</h2>
                    <p className="text-gray-500 mt-2 text-center max-w-sm">Please wait while we verify your invitation code.</p>
                </>
            ) : null}
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-violet-50 p-4"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>}>
            <JoinContent />
        </Suspense>
    );
}
