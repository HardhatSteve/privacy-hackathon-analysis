interface NavDividerProps {
  className?: string
}

export function NavDivider({
  className = "mx-1 hidden h-8 w-px bg-slate-200",
}: NavDividerProps) {
  return <div className={className} />
}
