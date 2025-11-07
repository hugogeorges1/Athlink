import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-subtle',
  {
    variants: {
      variant: {
        default: 'bg-[#F97316] hover:bg-[#EA580C] text-white',
        secondary: 'border-2 border-[#2563EB] text-[#2563EB] hover:bg-grayl',
        ghost: 'hover:bg-grayl',
      },
      size: {
        sm: 'h-9 px-3 rounded-md',
        md: 'h-10 px-4 rounded-md',
        lg: 'h-12 px-6 rounded-md text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
