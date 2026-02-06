import { useState, useRef, useEffect, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: ReactNode
  badge?: string | number
}

export default function Accordion({
  title,
  children,
  defaultOpen = false,
  icon,
  badge
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    }
  }, [children])

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group -m-5 p-5"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-violet-400">{icon}</span>
          )}
          <span className="font-display text-xl tracking-wide text-zinc-100">
            {title}
          </span>
          {badge !== undefined && (
            <span className="text-xs font-medium bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={20}
          className={`text-zinc-500 transition-transform duration-200 group-hover:text-zinc-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className="transition-all duration-200 ease-out overflow-hidden"
        style={{
          height: isOpen ? height : 0,
          opacity: isOpen ? 1 : 0
        }}
      >
        <div ref={contentRef} className="pt-5">
          {children}
        </div>
      </div>
    </div>
  )
}
