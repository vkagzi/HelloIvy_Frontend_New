import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-neutral-300 placeholder:text-neutral-400 selection:bg-blue-100 selection:text-neutral-900 flex field-sizing-content min-h-[100px] w-full rounded-lg border bg-white px-4 py-3 text-base shadow-sm transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        "hover:border-neutral-400",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-500",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
