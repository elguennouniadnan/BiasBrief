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
import { Settings, LogOut, LogIn } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import { AuthModal } from "@/components/auth/auth-modal"
import { motion } from "framer-motion"
import { useMediaQuery } from "@/hooks/use-media-query"
import { toast } from "sonner"

interface UserDropdownProps {
  openSettings: () => void
  showSignedOutMenu?: boolean
  onSignIn?: () => void
  customNewsEnabled?: boolean
  setCustomNewsEnabled?: (enabled: boolean) => void
}

export function UserDropdown({ openSettings, showSignedOutMenu = false, onSignIn, customNewsEnabled, setCustomNewsEnabled }: UserDropdownProps) {
  const { user, signOut, providerId } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"sign-in" | "sign-up">("sign-in")
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handleOpenAuthModal = (tab: "sign-in" | "sign-up") => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  // Helper to show toast and call signOut
  const handleSignOut = async () => {
    try {
      await signOut();
      toast('Signed out', { 
        description: 'You have signed out successfully.',
      });
    } catch (e) {
      toast('Sign out failed', { 
        description: (e as any)?.message || 'There was a problem signing out.',
        duration: 4000,
      });
    }
  }

  // Helper to open sign-in modal
  const handleSignIn = async () => {
    if (onSignIn) {
      try {
        await onSignIn();
      } catch (e) {
        console.error('Failed to trigger sign-in:', e);
      }
    }
  }

  if (!user && showSignedOutMenu) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 mr-2 rounded-full overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="User"
            >
              <Avatar className="h-9 w-9 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-bl from-primary/40 via-primary/60  to-primary/100 text-white text-base font-bold">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-2.21 3.582-4 8-4s8 1.79 8 4" stroke="currentColor" strokeWidth="2"/></svg>
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-56 overflow-hidden">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <DropdownMenuItem
                onClick={openSettings}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Settings className="h-4 w-4 text-primary" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignIn}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogIn className="h-4 w-4 text-primary" />
                <span>Sign In</span>
              </DropdownMenuItem>
            </motion.div>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    )
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
            className="relative h-9 w-9 mr-2 rounded-full overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Avatar className="h-9 w-9 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-primary/20">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name || user.email}
                  className="h-9 w-9 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-primary/40 via-primary/60  to-primary/100 text-white text-base font-bold">
                  {getInitials(user.email)}
                </AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-w-56 mr-2 overflow-hidden">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            {/* Custom News Toggle - always rendered, but adjust spacing for mobile */}
            {typeof customNewsEnabled === 'boolean' && typeof setCustomNewsEnabled === 'function' && (
              <>
                <DropdownMenuSeparator />
                <div className={
                  isMobile
                    ? "flex items-center gap-2 px-1.5 py-1 text-sm text-gray-700 dark:text-gray-200"
                    : "flex items-center justify-start gap-4 ml-1.5 mr-2 mb-2 text-sm text-gray-700 dark:text-gray-200"
                }>
                  <motion.span
                    className="relative inline-block h-3.5 w-3.5"
                    style={{ minWidth: 16 }}
                    animate={{ scale: customNewsEnabled ? 1 : 0.8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18, duration: 0.18 }}
                  >
                    <input
                      type="checkbox"
                      id="custom-news-toggle-dropdown"
                      checked={customNewsEnabled}
                      onChange={e => setCustomNewsEnabled(e.target.checked)}
                      className="h-5 w-5 rounded-full border-2 border-gray-300 appearance-none checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                      style={{ minWidth: 12 }}
                    />
                    {customNewsEnabled && (
                      <svg className="absolute right-0 top-0 h-6 w-6 pointer-events-none" viewBox="-4 3 20 18" fill="none">
                        <path d="M5 10.5L9 14.5L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </motion.span>
                  <label
                    htmlFor="custom-news-toggle-dropdown"
                    className={
                      `cursor-pointer select-none flex items-center gap-1 mt-1${isMobile ? ' ml-2' : ''}`
                    }
                  >
                    Customize News
                  </label>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={openSettings}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
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
