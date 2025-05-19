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

  if (!mounted) {
    return null
  }

  const logoSrc =
    theme === "dark"
      ? "/logo3.png"
      : "/logo2.png"

  const logoSize = isMobile ? { width: 170, height: 92 } : { width: 220, height: 118.8 }

  return (
    <Link href="/" className={`relative block ${className}`} style={logoSize}>
      <Image src={logoSrc || "/placeholder.svg"} alt="BiasBrief" fill className="object-contain" priority />
    </Link>
  )
}
