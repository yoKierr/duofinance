import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'ghost' | 'outline'
}

export function Button({ children, className = '', variant = 'default', ...props }: ButtonProps) {
  const baseClasses = 'px-4 py-2 font-medium transition-colors'

  // Если передан кастомный класс duofinance-button, не добавляем наши variant стили,
  // чтобы не конфликтовать с внешней палитрой/бордерами
  const isDuofinanceStyled = className.includes('duofinance-button')

  // Не добавляем rounded-lg если используется duofinance-button класс
  const roundedClass = isDuofinanceStyled ? '' : 'rounded-lg'

  const variantClasses: Record<string, string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    custom: ''
  }

  const effectiveVariant = isDuofinanceStyled ? 'custom' : variant

  return (
    <button
      className={`${baseClasses} ${roundedClass} ${variantClasses[effectiveVariant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}