import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export type SpotlightProps = {
  /** Cursor position relative to the spotlight container (pixels). */
  mousePosition: { x: number; y: number };
  className?: string;
};

/**
 * Soft radial spotlight following the cursor (Aceternity-style, no framer-motion).
 */
export function Spotlight({ mousePosition, className }: SpotlightProps) {
  const { x, y } = mousePosition;

  return (
    <div className={cn('pointer-events-none absolute inset-0 z-[1] overflow-hidden', className)}>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(650px circle at ${x}px ${y}px, rgba(255, 255, 255, 0.09), transparent 55%),
            radial-gradient(420px circle at ${x}px ${y}px, rgba(255, 255, 255, 0.05), transparent 50%)
          `,
        }}
      />
    </div>
  );
}

export const spotlightGridStyle: CSSProperties = {
  backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
  backgroundSize: '40px 40px',
};
