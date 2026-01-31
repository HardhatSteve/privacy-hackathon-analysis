import * as React from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  placeholder?: string
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, placeholder, onChange, disabled, ...props }, ref) => {
    const [fileName, setFileName] = React.useState<string>("")
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => fileInputRef.current!)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFileName(e.target.files[0].name)
      } else {
        setFileName("")
      }
      onChange?.(e)
    }

    const handleClick = () => {
      if (!disabled) {
        fileInputRef.current?.click()
      }
    }

    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "flex h-12 w-full cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-slate-50/50 px-4 text-left transition-colors sm:h-11",
            "hover:border-slate-300 hover:bg-slate-100",
            "focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <Upload className="h-4 w-4 shrink-0 text-slate-500" />
          <span
            className={cn(
              "flex-1 truncate text-sm",
              fileName ? "font-medium text-slate-700" : "text-slate-500",
            )}
          >
            {fileName || placeholder}
          </span>
        </button>
      </div>
    )
  },
)
FileInput.displayName = "FileInput"

export { FileInput }
