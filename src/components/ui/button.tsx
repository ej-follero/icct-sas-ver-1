import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-blue-700 hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-red-700 hover:shadow-lg",
        outline:
          "border border-input bg-background hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-gray-200 hover:shadow-md",
        ghost: "hover:bg-blue-50 hover:text-blue-700",
        link: "text-primary underline-offset-4 hover:underline hover:text-blue-700",
        // Custom ICCT variants
        icct: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg",
        success: "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-lg",
        danger: "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const buttonClasses = React.useMemo(
      () => cn(buttonVariants({ variant, size, className })),
      [variant, size, className]
    )
    
    return (
      <Comp
        className={buttonClasses}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 