import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold outline-none transition-all duration-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "border-2 border-foreground bg-primary text-primary-foreground shadow-nb hover:shadow-nb-lg hover:-translate-x-[1px] hover:-translate-y-[1px]",
        secondary:
          "border-2 border-foreground bg-accent text-accent-foreground shadow-nb hover:shadow-nb-lg hover:-translate-x-[1px] hover:-translate-y-[1px]",
        outline:
          "border-2 border-foreground bg-card text-foreground shadow-nb hover:shadow-nb-lg hover:-translate-x-[1px] hover:-translate-y-[1px]",
        ghost: "font-semibold hover:bg-muted",
        destructive:
          "border-2 border-foreground bg-destructive text-destructive-foreground shadow-nb hover:shadow-nb-lg hover:-translate-x-[1px] hover:-translate-y-[1px]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
