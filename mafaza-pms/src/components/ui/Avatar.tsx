import { cn, getInitials } from '@/lib/utils';
import type { Profile } from '@/types';

interface AvatarProps {
  profile?: Profile | null;
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

// Deterministic color from name string
const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function Avatar({ profile, name, src, size = 'md', className }: AvatarProps) {
  const displayName = name ?? profile?.full_name ?? '?';
  const avatarSrc = src ?? profile?.avatar_url;
  const initials = getInitials(displayName);
  const color = getAvatarColor(displayName);

  return (
    <div className={cn(
      'relative rounded-full overflow-hidden flex items-center justify-center shrink-0',
      sizeMap[size],
      !avatarSrc && color,
      className
    )}>
      {avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-semibold select-none">{initials}</span>
      )}
    </div>
  );
}

export function AvatarGroup({
  profiles,
  max = 3,
  size = 'sm',
}: {
  profiles: Profile[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}) {
  const shown = profiles.slice(0, max);
  const overflow = profiles.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((p) => (
        <div key={p.id} className="ring-2 ring-white rounded-full">
          <Avatar profile={p} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div className={cn(
          'ring-2 ring-white rounded-full flex items-center justify-center bg-gray-200 text-gray-600 font-medium',
          sizeMap[size],
          'text-[10px]'
        )}>
          +{overflow}
        </div>
      )}
    </div>
  );
}
