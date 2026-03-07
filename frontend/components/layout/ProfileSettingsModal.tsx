import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { userApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface ProfileSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsModal({ open, onOpenChange }: ProfileSettingsModalProps) {
    const { user, setUser } = useAppStore();
    const [name, setName] = useState(user?.name || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && user) {
            setName(user.name || '');
            setAvatar(user.avatar || '');
        }
    }, [open, user]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const res = await userApi.updateProfile({
                name: name.trim(),
                avatar: avatar.trim() || undefined
            });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast({ title: 'Profile updated successfully' });
            onOpenChange(false);
        } catch (e: unknown) {
            if (e && typeof e === 'object' && 'response' in e) {
                const err = e as { response?: { data?: { error?: string } } };
                toast({ title: err.response?.data?.error || 'Failed to update profile', variant: 'destructive' });
            } else {
                toast({ title: 'Failed to update profile', variant: 'destructive' });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Profile Settings</DialogTitle>
                    <DialogDescription>
                        Update your personal details and profile picture.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="avatar">Profile Picture URL (Optional)</Label>
                        <Input id="avatar" type="url" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://example.com/avatar.jpg" />
                    </div>
                    <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
