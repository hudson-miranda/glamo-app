import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-white dark:ring-offset-gray-950 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ruby-500/25 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-br from-ruby-500 to-ruby-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(177,35,61,0.12)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_20px_rgba(177,35,61,0.18)] hover:-translate-y-0.5 active:translate-y-0',
        destructive: 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 shadow-sm',
        outline: 'border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-900/80 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-ruby-600 dark:hover:text-ruby-400 hover:border-ruby-200/60 dark:hover:border-ruby-800/40 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
        secondary: 'bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-gray-150 dark:hover:bg-gray-700/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
        ghost: 'hover:bg-gray-100/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100',
        link: 'text-ruby-600 dark:text-ruby-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 rounded-xl px-4 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
