import React from 'react'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
}

export function Progress({ value, className = '', ...props }: ProgressProps) {
  return (
    <div
      className={`w-full bg-zinc-800 rounded-full overflow-hidden ${className}`}
      {...props}
    >
      <div
        className="h-full bg-zinc-100 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}