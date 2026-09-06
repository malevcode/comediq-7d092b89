import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border-0 bg-white/10 px-3 py-2 text-base text-gray-900 shadow-[0_12px_38px_rgba(2,10,30,0.10)] ring-offset-background backdrop-blur-xl file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:file:text-white dark:focus-visible:ring-[#8ec5ff]/50 dark:shadow-[0_12px_38px_rgba(2,10,30,0.24)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
