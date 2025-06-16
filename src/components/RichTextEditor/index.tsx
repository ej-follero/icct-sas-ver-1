"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface RichTextEditorProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

const RichTextEditor = React.forwardRef<HTMLTextAreaElement, RichTextEditorProps>(
  ({ value = "", onChange, placeholder, className, ...props }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

RichTextEditor.displayName = "RichTextEditor"

export default RichTextEditor 