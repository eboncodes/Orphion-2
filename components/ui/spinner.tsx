"use client"

import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "dots" | "pulse" | "bars"
  className?: string
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-5 w-5", 
  lg: "h-8 w-8",
  xl: "h-12 w-12"
}

const SpinnerVariants = {
  default: ({ size }: { size: keyof typeof sizeClasses }) => (
    <div
      className={cn(
        "rounded-full border-2 border-gray-200 border-t-blue-600",
        sizeClasses[size]
      )}
    />
  ),
  
  dots: ({ size }: { size: keyof typeof sizeClasses }) => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-blue-600",
            size === "sm" ? "h-1.5 w-1.5" : 
            size === "md" ? "h-2 w-2" : 
            size === "lg" ? "h-3 w-3" : "h-4 w-4"
          )}
        />
      ))}
    </div>
  ),
  
  pulse: ({ size }: { size: keyof typeof sizeClasses }) => (
    <div
      className={cn(
        "rounded-full bg-blue-600",
        sizeClasses[size]
      )}
    />
  ),
  
  bars: ({ size }: { size: keyof typeof sizeClasses }) => (
    <div className="flex space-x-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-blue-600 rounded-sm",
            size === "sm" ? "h-3 w-0.5" : 
            size === "md" ? "h-4 w-1" : 
            size === "lg" ? "h-6 w-1.5" : "h-8 w-2"
          )}
        />
      ))}
    </div>
  )
}

export function Spinner({ 
  size = "md", 
  variant = "default", 
  className = "" 
}: SpinnerProps) {
  const SpinnerComponent = SpinnerVariants[variant]
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <SpinnerComponent size={size} />
    </div>
  )
} 