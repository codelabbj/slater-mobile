import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive touch-manipulation",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        // New modern variants
        glow: 'bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105 border-0',
        'outline-glow': 'btn-outline-glow',
        gradient: 'gradient-primary text-primary-foreground hover:shadow-lg',
        glass: 'glass-panel text-foreground hover:bg-white/10 dark:hover:bg-white/5',
      },
      size: {
        default: 'h-12 px-4 py-2 has-[>svg]:px-3 min-h-[44px] sm:h-12 sm:px-6',
        sm: 'h-10 rounded-full gap-1.5 px-3 has-[>svg]:px-2.5 min-h-[44px] sm:h-10',
        lg: 'h-12 rounded-full px-8 has-[>svg]:px-6 min-h-[44px] sm:h-12',
        icon: 'size-12 min-h-[44px] min-w-[44px] sm:size-12',
        'icon-sm': 'size-10 min-h-[44px] min-w-[44px] sm:size-10',
        'icon-lg': 'size-14 min-h-[44px] min-w-[44px] sm:size-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }