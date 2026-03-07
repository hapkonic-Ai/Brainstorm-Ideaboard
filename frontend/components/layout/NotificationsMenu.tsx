import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function NotificationsMenu() {
    const [invites, setInvites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    async function fetchInvites() {
        try {
            const res = await api.get('/boards/invites/me');
            setInvites(res.data.invites);
        } catch (err) {
            console.error('Failed to fetch invites:', err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchInvites();
        // In a real prod setup, listen to socket events here to live-update the badge.
    }, []);

    async function handleAccept(inviteId: string) {
        try {
            await api.post(`/boards/invites/${inviteId}/accept`);
            toast({ title: 'Invitation accepted!' });

            // Remove invite from list
            const invite = invites.find(i => i.id === inviteId);
            setInvites(invites.filter(i => i.id !== inviteId));

            // Optionally route them to the new board
            if (invite?.board) {
                router.push(`/board/${invite.board.id}`);
            }
        } catch (err: any) {
            toast({ title: err.response?.data?.error || 'Failed to accept invite', variant: 'destructive' });
        }
    }

    async function handleDecline(inviteId: string) {
        try {
            await api.post(`/boards/invites/${inviteId}/decline`);
            toast({ title: 'Invitation declined' });
            setInvites(invites.filter(i => i.id !== inviteId));
        } catch (err) {
            toast({ title: 'Failed to decline invite', variant: 'destructive' });
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group p-2 hover:bg-gray-100 rounded-lg shrink-0">
                    <Bell className="h-[18px] w-[18px] text-gray-600 group-hover:text-amber-500 transition-colors" />
                    {invites.length > 0 && (
                        <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg border border-gray-100">
                <DropdownMenuLabel className="p-3 pb-2 text-sm font-semibold flex items-center justify-between">
                    Notifications
                    {invites.length > 0 && (
                        <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full text-xs">
                            {invites.length} New
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />

                <div className="max-h-80 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-6 bg-gray-50/50">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                    ) : invites.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-500 bg-gray-50/50 flex flex-col items-center">
                            <Bell className="h-6 w-6 text-gray-300 mb-2 opacity-50" />
                            You're all caught up!
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {invites.map((invite) => (
                                <div key={invite.id} className="p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-9 w-9 border border-white shadow-sm shrink-0">
                                            <AvatarImage src={invite.inviter?.avatar} />
                                            <AvatarFallback style={{ backgroundColor: getAvatarColor(invite.inviter?.name || 'User') }} className="text-white text-xs">
                                                {getInitials(invite.inviter?.name || 'User')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 leading-tight">
                                                <span className="font-semibold">{invite.inviter?.name}</span> invited you to edit <span className="font-semibold">"{invite.board?.name}"</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Just now</p>

                                            <div className="flex gap-2 mt-3">
                                                <Button size="sm" className="h-7 px-3 text-xs w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleAccept(invite.id)}>
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Accept
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-7 px-3 text-xs w-full" onClick={() => handleDecline(invite.id)}>
                                                    <X className="h-3 w-3 mr-1" />
                                                    Decline
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
