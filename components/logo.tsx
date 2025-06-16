"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useState, useEffect } from "react"

interface LogoProps {
  className?: string
}

export function Logo({ className = "" }: LogoProps) {
  const { theme } = useTheme()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Optimistic: use light theme logo by default, update after mount
  const logoSrc = !mounted
    ? "/logo2.png" // default to light theme logo for SSR/first paint
    : theme === "dark"
      ? "/logo3.png"
      : "/logo2.png"

  const logoSize = !mounted
    ? { width: 220, height: 118.8 } // default desktop size for SSR
    : isMobile
      ? { width: 170, height: 92 }
      : { width: 220, height: 118.8 }

  return (
    <Link href="/" className={`relative block ${className}`} style={logoSize}>
      <Image src={logoSrc || "/placeholder.svg"} alt="BiasBrief" fill className="object-contain" priority />
    </Link>
  )
}
