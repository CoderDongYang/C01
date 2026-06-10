import { Users } from 'lucide-react';
import type { OnlineUser } from '@/types';

interface OnlineUsersProps {
  users: OnlineUser[];
  maxVisible?: number;
}

function getInitials(name: string) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

export default function OnlineUsersBadge({ users, maxVisible = 3 }: OnlineUsersProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = users.length - visibleUsers.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-xs font-medium text-white"
            style={{ backgroundColor: user.color }}
            title={user.username}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              getInitials(user.username)
            )}
          </div>
        ))}
        {hiddenCount > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
            +{hiddenCount}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span>{users.length} 人在线</span>
      </div>
    </div>
  );
}
