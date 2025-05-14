"use client"

import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import { AuthModal } from "@/components/auth/auth-modal"
import { motion } from "framer-motion"

interface UserDropdownProps {
  openSettings: () => void
}

export function UserDropdown({ openSettings }: UserDropdownProps) {
  const { user, signOut, isEmailVerified, providerId, resendVerificationEmail } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"sign-in" | "sign-up">("sign-in")
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  useEffect(() => {
    function handleOpenAuthModal(e: CustomEvent) {
      setAuthModalTab("sign-in")
      setAuthModalOpen(true)
    }
    window.addEventListener("open-auth-modal", handleOpenAuthModal as EventListener)
    return () => window.removeEventListener("open-auth-modal", handleOpenAuthModal as EventListener)
  }, [])

  const handleOpenAuthModal = (tab: "sign-in" | "sign-up") => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  if (!user) {
    return (
      <>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab={authModalTab} />
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-9 w-9 rounded-full overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Avatar className="h-9 w-9 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-base font-bold">
                {getInitials(user.email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 overflow-hidden">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {/* Email verification warning */}
            {providerId === "password" && !isEmailVerified && (
              <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded mb-2 flex flex-col gap-2">
                <span>
                  Please verify your email address to unlock all features. Check your inbox for a verification link.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={verificationLoading}
                  onClick={async () => {
                    setVerificationLoading(true)
                    setVerificationError(null)
                    try {
                      await resendVerificationEmail()
                      setVerificationSent(true)
                    } catch (err: any) {
                      setVerificationError(err?.message || "Failed to send verification email.")
                    } finally {
                      setVerificationLoading(false)
                    }
                  }}
                >
                  {verificationLoading ? "Sending..." : "Resend Verification Email"}
                </Button>
                {verificationSent && (
                  <span className="text-green-600 text-xs mt-1">Verification email sent!</span>
                )}
                {verificationError && (
                  <span className="text-red-600 text-xs mt-1">{verificationError}</span>
                )}
              </div>
            )}
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={openSettings}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab={authModalTab} />
    </>
  )
}
