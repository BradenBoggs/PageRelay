import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
    'focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs',
                outline:
                    'border-input bg-background hover:bg-accent hover:text-accent-foreground border shadow-xs',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
    const Component = asChild ? Slot : 'button';

    return (
        <Component
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}
