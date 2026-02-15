'use client';

import { useAppStore } from '@/store/useAppStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function TooltipWrapper({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {label}
      </div>
    </div>
  );
}

export function UserPresence() {
  const { activeUsers, isConnected } = useAppStore();

  return (
    <div className="flex items-center gap-2">
      {/* Connection indicator */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}
        />
        <span className="hidden sm:inline">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Active user avatars */}
      {activeUsers.length > 0 && (
        <div className="flex items-center -space-x-2">
          {activeUsers.slice(0, 5).map((user) => (
            <TooltipWrapper key={user.userId} label={`${user.name} (online)`}>
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-green-500">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  ) : null}
                  <AvatarFallback
                    className="text-xs font-semibold text-white"
                    style={{ backgroundColor: getAvatarColor(user.name) }}
                  >
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full" />
              </div>
            </TooltipWrapper>
          ))}
          {activeUsers.length > 5 && (
            <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-semibold text-gray-600">
              +{activeUsers.length - 5}
            </div>
          )}
        </div>
      )}

      {activeUsers.length > 0 && (
        <span className="text-xs text-muted-foreground hidden md:inline">
          {activeUsers.length} online
        </span>
      )}
    </div>
  );
}

// Export a simple Tooltip component
export { };
