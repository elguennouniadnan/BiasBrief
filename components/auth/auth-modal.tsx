"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SignInForm } from "@/components/auth/sign-in-form"
import { SignUpForm } from "@/components/auth/sign-up-form"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "sign-in" | "sign-up"
}

export function AuthModal({ isOpen, onClose, defaultTab = "sign-in" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"sign-in" | "sign-up">(defaultTab)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to NewsApp</DialogTitle>
          <DialogDescription>
            {activeTab === "sign-in"
              ? "Sign in to access your personalized news experience."
              : "Create an account to personalize your news experience."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue={activeTab}
          onValueChange={(value) => setActiveTab(value as "sign-in" | "sign-up")}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="sign-in" className="mt-4">
            <SignInForm onSuccess={onClose} />
          </TabsContent>

          <TabsContent value="sign-up" className="mt-4">
            <SignUpForm onSuccess={onClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
