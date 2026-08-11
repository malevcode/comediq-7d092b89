import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border-0 bg-white/10 px-3 py-2 text-sm text-gray-900 shadow-[0_12px_38px_rgba(2,10,30,0.10)] ring-offset-background backdrop-blur-xl placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:focus-visible:ring-[#8ec5ff]/50 dark:shadow-[0_12px_38px_rgba(2,10,30,0.24)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
