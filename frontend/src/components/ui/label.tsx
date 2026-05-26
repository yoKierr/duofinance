import React from 'react'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

export function Label({ children, className = '', ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-zinc-300 ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}