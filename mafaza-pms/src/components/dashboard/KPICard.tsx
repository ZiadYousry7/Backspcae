'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number; // percentage change (positive = up, negative = down)
  trendLabel?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
  loading?: boolean;
}

const colorMap = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   value: 'text-blue-700',   border: 'border-blue-100' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600', value: 'text-green-700',  border: 'border-green-100' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600', value: 'text-yellow-700', border: 'border-yellow-100' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',     value: 'text-red-700',    border: 'border-red-100' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', value: 'text-purple-700', border: 'border-purple-100' },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color = 'blue',
  className,
  loading = false,
}: KPICardProps) {
  const colors = colorMap[color];

  return (
    <div className={cn(
      'bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow',
      colors.border,
      className
    )}>
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-8 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-3/4" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className={cn('p-2.5 rounded-xl', colors.icon)}>
              {icon}
            </div>
            {trend !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                trend > 0 ? 'bg-green-50 text-green-600' :
                trend < 0 ? 'bg-red-50 text-red-600' :
                'bg-gray-50 text-gray-500'
              )}>
                {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>

          <p className="text-2xl font-bold text-gray-900 mb-1">
            {value}
          </p>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {(subtitle || trendLabel) && (
            <p className="text-xs text-gray-400 mt-1">{trendLabel ?? subtitle}</p>
          )}
        </>
      )}
    </div>
  );
}
