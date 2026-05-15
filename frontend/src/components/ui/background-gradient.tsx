import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = true,
}: {
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}) {
  const variants = {
    initial: { backgroundPosition: '0% 50%' },
    animate: { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] },
  };

  const gradientClass =
    'bg-[radial-gradient(circle_farthest-side_at_0_100%,#52525b,transparent),radial-gradient(circle_farthest-side_at_100%_0,#a1a1aa,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#3f3f46,transparent),radial-gradient(circle_farthest-side_at_0_0,#d4d4d4,transparent)]';

  return (
    <div className={cn('group relative rounded-[22px] p-[4px]', containerClassName)}>
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? 'initial' : undefined}
        animate={animate ? 'animate' : undefined}
        transition={
          animate
            ? { duration: 6, repeat: Infinity, repeatType: 'reverse' as const }
            : undefined
        }
        style={{ backgroundSize: animate ? '400% 400%' : undefined }}
        className={cn(
          'absolute inset-0 z-[1] rounded-[22px] opacity-50 blur-xl transition duration-500 will-change-transform group-hover:opacity-80',
          gradientClass
        )}
      />
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? 'initial' : undefined}
        animate={animate ? 'animate' : undefined}
        transition={
          animate
            ? { duration: 6, repeat: Infinity, repeatType: 'reverse' as const }
            : undefined
        }
        style={{ backgroundSize: animate ? '400% 400%' : undefined }}
        className={cn('absolute inset-0 z-[1] rounded-[22px] will-change-transform', gradientClass)}
      />
      <div className={cn('relative z-10', className)}>{children}</div>
    </div>
  );
}
