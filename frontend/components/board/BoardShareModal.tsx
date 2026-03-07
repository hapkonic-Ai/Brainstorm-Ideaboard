import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { UserPlus, Search, Loader2 } from 'lucide-react';

interface BoardShareModalProps {
    boardId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BoardShareModal({ boardId, open, onOpenChange }: BoardShareModalProps) {
    const [emailSearch, setEmailSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const { currentBoard } = useAppStore();

    async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setEmailSearch(value);

        // Minor debounce behavior
        if (value.trim().length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await api.get(`/users/search?email=${encodeURIComponent(value)}`);
            setSearchResults(res.data.users || []);
        } catch (err) {
            console.error('Failed to search users:', err);
        } finally {
            setIsSearching(false);
        }
    }

    async function handleInvite(userId: string) {
        try {
            await api.post(`/boards/${boardId}/invites`, { inviteeId: userId });
            toast({ title: 'Invitation sent successfully!' });
            setEmailSearch('');
            setSearchResults([]);
            onOpenChange(false);
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to send invitation';
            toast({ title: message, variant: 'destructive' });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share "{currentBoard?.name}"</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Invite people by email</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Enter email address..."
                                className="pl-9"
                                value={emailSearch}
                                onChange={handleSearch}
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {searchResults.length > 0 && (
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Users found
                            </p>
                        )}

                        {searchResults.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback style={{ backgroundColor: getAvatarColor(user.name) }} className="text-white text-xs">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="secondary" onClick={() => handleInvite(user.id)}>
                                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                                    Invite
                                </Button>
                            </div>
                        ))}

                        {emailSearch.length >= 3 && searchResults.length === 0 && !isSearching && (
                            <p className="text-sm text-center text-gray-500 py-4">No users found with that email.</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
