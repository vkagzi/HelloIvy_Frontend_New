import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, onChange, value, ...props }, forwardedRef) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null)
    const textareaRef = (forwardedRef as React.RefObject<HTMLTextAreaElement>) || internalRef

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [textareaRef])

    React.useEffect(() => {
      adjustHeight()
    }, [value, adjustHeight])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight()
      onChange?.(e)
    }

    return (
      <textarea
        ref={textareaRef}
        data-slot="textarea"
        className={cn(
          "border-neutral-300 placeholder:text-neutral-400 selection:bg-blue-100 selection:text-neutral-900 flex min-h-[100px] w-full resize-none overflow-hidden rounded-lg border bg-white px-4 py-3 text-base shadow-sm transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
          "hover:border-neutral-400",
          "aria-invalid:ring-red-500/20 aria-invalid:border-red-500",
          className
        )}
        onChange={handleChange}
        value={value}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
