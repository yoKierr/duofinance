import React from 'react'

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number }

export function FlameIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M12 2c1.5 3 1 4.5 0 6-1.2 1.8-3 3-3 5a3 3 0 1 0 6 0c0-2 1.2-3.2 2.4-4.8C18.6 6.8 19 4.4 18 3c-.8 1.6-2.6 2.8-4 3.5C14.5 4.7 13.5 3.1 12 2Z" fill="currentColor"/>
      <path d="M8.5 14.5c0 2.485 2.015 4.5 4.5 4.5s4.5-2.015 4.5-4.5c0-.9-.25-1.65-.73-2.44-.2.27-.42.53-.64.81-1.02 1.28-1.63 2.13-1.63 3.13a1.5 1.5 0 1 1-3 0c0-1.4.93-2.44 1.98-3.69.28-.33.57-.68.86-1.08-1.1.48-2.3 1.27-3.26 2.37-.95 1.08-1.48 2.07-1.48 3.4Z" fill="currentColor" opacity=".6"/>
    </svg>
  )
}

export function DiamondIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M7 3h10l4 5-9 13L3 8l4-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M3 8h18M7 3l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  )
}

export function StarIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="m12 3 2.9 5.88 6.5.95-4.7 4.58 1.1 6.44L12 18.77 6.2 20.85l1.1-6.44L2.6 9.83l6.5-.95L12 3Z" fill="currentColor"/>
    </svg>
  )
}


