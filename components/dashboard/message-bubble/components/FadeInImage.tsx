"use client"

import React, { useState } from "react"

interface FadeInImageProps {
  src: string
  alt?: string
  className?: string
}

export default function FadeInImage({ src, alt = "", className = "" }: FadeInImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <img
      src={src}
      alt={alt}
      onLoad={() => setLoaded(true)}
      className={`transition-all duration-500 ease-out ${loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-95'} ${className}`}
    />
  )
}


