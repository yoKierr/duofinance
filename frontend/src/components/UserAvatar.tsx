import { cn } from '@/lib/utils'

export function UserAvatar({
  username,
  avatar,
  className,
}: {
  username: string
  avatar?: string
  className?: string
}) {
  const initial = username.charAt(0).toUpperCase() || '?'

  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        className={cn('rounded-full object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 font-bold text-white',
        className
      )}
      aria-hidden
    >
      {initial}
    </div>
  )
}
