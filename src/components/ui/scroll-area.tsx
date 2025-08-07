import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn(
      "relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm",
      "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
      "transition-all duration-200 ease-in-out",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] p-1">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner className="bg-gradient-to-br from-gray-100 to-gray-200" />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-all duration-300 ease-in-out",
      "hover:bg-gray-100/50 active:bg-gray-200/50",
      orientation === "vertical" &&
        "h-full w-3 border-l border-l-transparent p-[2px]",
      orientation === "horizontal" &&
        "h-3 flex-col border-t border-t-transparent p-[2px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb 
      className={cn(
        "relative flex-1 rounded-full transition-all duration-200 ease-in-out",
        "bg-gradient-to-b from-gray-300 to-gray-400",
        "hover:from-gray-400 hover:to-gray-500",
        "active:from-gray-500 active:to-gray-600",
        "shadow-sm hover:shadow-md",
        "before:absolute before:inset-0 before:rounded-full before:bg-white/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200"
      )} 
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

// Enhanced ScrollArea with custom variants
interface EnhancedScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  variant?: 'default' | 'minimal' | 'elegant' | 'modern'
  size?: 'sm' | 'md' | 'lg'
  showScrollbar?: boolean
}

const EnhancedScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  EnhancedScrollAreaProps
>(({ 
  className, 
  children, 
  variant = 'default', 
  size = 'md', 
  showScrollbar = true,
  ...props 
}, ref) => {
  const variantStyles = {
    default: "border-gray-200 bg-white shadow-sm",
    minimal: "border-transparent bg-transparent shadow-none",
    elegant: "border-gray-100 bg-gray-50/50 shadow-lg backdrop-blur-sm",
    modern: "border-blue-200 bg-blue-50/30 shadow-xl backdrop-blur-md"
  }

  const sizeStyles = {
    sm: "rounded-md",
    md: "rounded-lg", 
    lg: "rounded-xl"
  }

  const scrollbarStyles = {
    default: "w-3",
    minimal: "w-2",
    elegant: "w-4",
    modern: "w-3.5"
  }

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn(
        "relative overflow-hidden transition-all duration-300 ease-in-out",
        "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport 
        className={cn(
          "h-full w-full rounded-[inherit] transition-all duration-200",
          size === 'sm' && "p-2",
          size === 'md' && "p-3", 
          size === 'lg' && "p-4"
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      
      {showScrollbar && (
        <ScrollAreaPrimitive.ScrollAreaScrollbar
          orientation="vertical"
          className={cn(
            "flex touch-none select-none transition-all duration-300 ease-in-out",
            "hover:bg-gray-100/50 active:bg-gray-200/50",
            "h-full border-l border-l-transparent p-[2px]",
            scrollbarStyles[variant]
          )}
        >
          <ScrollAreaPrimitive.ScrollAreaThumb 
            className={cn(
              "relative flex-1 rounded-full transition-all duration-200 ease-in-out",
              variant === 'default' && "bg-gradient-to-b from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500",
              variant === 'minimal' && "bg-gray-300/50 hover:bg-gray-400/70",
              variant === 'elegant' && "bg-gradient-to-b from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600",
              variant === 'modern' && "bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600",
              "shadow-sm hover:shadow-md",
              "before:absolute before:inset-0 before:rounded-full before:bg-white/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200"
            )} 
          />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
      )}
      
      <ScrollAreaPrimitive.Corner 
        className={cn(
          "transition-colors duration-200",
          variant === 'default' && "bg-gradient-to-br from-gray-100 to-gray-200",
          variant === 'minimal' && "bg-transparent",
          variant === 'elegant' && "bg-gradient-to-br from-gray-200 to-gray-300",
          variant === 'modern' && "bg-gradient-to-br from-blue-100 to-blue-200"
        )} 
      />
    </ScrollAreaPrimitive.Root>
  )
})
EnhancedScrollArea.displayName = "EnhancedScrollArea"

// Auto-hiding scrollbar variant
const AutoHideScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm",
        "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
        "transition-all duration-200 ease-in-out",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] p-3">
        {children}
      </ScrollAreaPrimitive.Viewport>
      
      <ScrollAreaPrimitive.ScrollAreaScrollbar
        orientation="vertical"
        className={cn(
          "flex touch-none select-none transition-all duration-300 ease-in-out",
          "h-full w-3 border-l border-l-transparent p-[2px]",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <ScrollAreaPrimitive.ScrollAreaThumb 
          className={cn(
            "relative flex-1 rounded-full transition-all duration-200 ease-in-out",
            "bg-gradient-to-b from-gray-300 to-gray-400",
            "hover:from-gray-400 hover:to-gray-500",
            "shadow-sm hover:shadow-md",
            "before:absolute before:inset-0 before:rounded-full before:bg-white/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200"
          )} 
        />
      </ScrollAreaPrimitive.ScrollAreaScrollbar>
      
      <ScrollAreaPrimitive.Corner className="bg-gradient-to-br from-gray-100 to-gray-200" />
    </ScrollAreaPrimitive.Root>
  )
})
AutoHideScrollArea.displayName = "AutoHideScrollArea"

export { ScrollArea, ScrollBar, EnhancedScrollArea, AutoHideScrollArea } 