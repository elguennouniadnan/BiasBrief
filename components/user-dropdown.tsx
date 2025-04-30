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
import { useState } from "react"
import { AuthModal } from "@/components/auth/auth-modal"
import { motion } from "framer-motion"

interface UserDropdownProps {
  openSettings: () => void
}

export function UserDropdown({ openSettings }: UserDropdownProps) {
  const { user, signOut } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"sign-in" | "sign-up">("sign-in")

  const handleOpenAuthModal = (tab: "sign-in" | "sign-up") => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  if (!user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAuthModal("sign-in")}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Sign In
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenAuthModal("sign-up")}
            className="bg-primary hover:bg-primary/90 transition-colors"
          >
            Sign Up
          </Button>
        </div>

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
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 overflow-hidden">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
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
