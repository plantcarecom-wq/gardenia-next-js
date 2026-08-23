import { cn } from '@/lib/utils';

const SIZE_MAP = {
  wide: 'max-w-7xl',
  default: 'max-w-6xl',
  narrow: 'max-w-3xl',
} as const;

export function Container({
  className,
  size = 'default',
  children,
}: {
  className?: string;
  size?: keyof typeof SIZE_MAP;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('w-full mx-auto px-4 md:px-6', SIZE_MAP[size], className)}>
      {children}
    </div>
  );
}
