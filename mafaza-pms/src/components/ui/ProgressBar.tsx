import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  height?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'auto';
  showLabel?: boolean;
  label?: string;
}

function getColor(value: number, colorProp: ProgressBarProps['color']): string {
  if (colorProp !== 'auto') {
    const map = {
      blue:   'bg-blue-500',
      green:  'bg-green-500',
      yellow: 'bg-yellow-500',
      red:    'bg-red-500',
    };
    return colorProp ? map[colorProp] : map.blue;
  }
  if (value >= 80) return 'bg-green-500';
  if (value >= 50) return 'bg-blue-500';
  if (value >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
}

const heightMap = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

export function ProgressBar({
  value,
  className,
  height = 'md',
  color = 'auto',
  showLabel = false,
  label,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const barColor = getColor(pct, color);

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-gray-500">{label}</span>}
          {showLabel && <span className="text-xs font-medium text-gray-700">{pct}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-gray-100 rounded-full overflow-hidden', heightMap[height])}>
        <div
          className={cn('rounded-full transition-all duration-500', barColor, heightMap[height])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
