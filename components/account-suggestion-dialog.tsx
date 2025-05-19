"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export function AccountSuggestionDialog({ onSignUp }: { onSignUp: () => void }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Show dialog after a short delay for a nice effect
    const timer = setTimeout(() => setOpen(true), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen} modal>
      <DialogContent
        className="max-w-md rounded-xl shadow-xl border-0 bg-gradient-to-br from-white via-primary/20 to-primary/60 dark:from-gray-900 dark:via-primary/30 dark:to-white/10 w-full sm:w-auto"
        style={{ width: '85vw', maxWidth: 400 }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-3 sm:mb-6">
            <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <DialogTitle className="text-sm sm:text-base font-bold">Create an Account</DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 mb-1 mt-2 sm:mt-3">
            <span className="block font-medium text-gray-800 dark:text-gray-100">Unlock a smarter, more personal news experience:</span>
          </DialogDescription>
          <div className="pl-3 sm:pl-5 space-y-1 sm:space-y-2 mt-1 mb-1">
            <div className="relative pl-3 text-xs sm:text-sm leading-snug sm:leading-relaxed before:content-['•'] before:absolute before:left-0 before:text-primary before:text-base sm:before:text-lg">
              <span className="font-semibold text-primary">Curate your news feed</span>
              <span className="text-gray-700 dark:text-gray-200"> — Choose the topics and categories that matter most to you, and see more of what you love.</span>
            </div>
            <div className="relative pl-3 text-xs sm:text-sm leading-snug sm:leading-relaxed before:content-['•'] before:absolute before:left-0 before:text-primary before:text-base sm:before:text-lg">
              <span className="font-semibold text-primary">Sync your preferences</span>
              <span className="text-gray-700 dark:text-gray-200"> — Save your settings and access your personalized experience from any device, anytime.</span>
            </div>
            <div className="relative pl-3 text-xs sm:text-sm leading-snug sm:leading-relaxed before:content-['•'] before:absolute before:left-0 before:text-primary before:text-base sm:before:text-lg">
              <span className="font-semibold text-primary">Enjoy exclusive features</span>
              <span className="text-gray-700 dark:text-gray-200"> — Get early access to new tools and enhancements designed just for our members.</span>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 mt-4">
          <Button className="w-full" onClick={() => { setOpen(false); onSignUp(); }}>
            Create Account
          </Button>
          <Button
            variant="outline"
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => setOpen(false)}
          >            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
