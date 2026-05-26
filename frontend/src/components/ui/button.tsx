import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'ghost' | 'outline'
}

export function Button({ children, className = '', variant = 'default', ...props }: ButtonProps) {
  const baseClasses = 'px-4 py-2 font-medium transition-colors'

  // Если передан кастомный класс finstart-button, не добавляем наши variant стили,
  // чтобы не конфликтовать с внешней палитрой/бордерами
  const isFinstartStyled = className.includes('finstart-button')

  // Не добавляем rounded-lg если используется finstart-button класс
  const roundedClass = isFinstartStyled ? '' : 'rounded-lg'

  const variantClasses: Record<string, string> = {
    default: 'bg-white text-neutral-950 border border-zinc-500 hover:bg-zinc-200',
    ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white',
    outline: 'border border-zinc-600 text-zinc-100 hover:bg-zinc-800',
    custom: ''
  }

  const effectiveVariant = isFinstartStyled ? 'custom' : variant

  return (
    <button
      className={`${baseClasses} ${roundedClass} ${variantClasses[effectiveVariant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}