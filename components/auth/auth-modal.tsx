"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SignInForm } from "@/components/auth/sign-in-form"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { toast } from "sonner"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "sign-in" | "sign-up"
}

export function AuthModal({ isOpen, onClose, defaultTab = "sign-in" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"sign-in" | "sign-up">(defaultTab)
  const [loading, setLoading] = useState<null | 'email' | 'google'>(null)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto w-[85vw] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="mb-4 mt-1">Welcome to BiasBrief</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {activeTab === "sign-in"
              ? "Sign in to access your personalized news experience."
              : "Create an account to personalize your news experience."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "sign-in" | "sign-up")}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="sign-in" className="mt-4">
            <SignInForm 
              onSuccess={() => {
                toast('Signed in', { description: 'You have signed in successfully.', duration: 1000 });
                onClose();
              }}
              onSignUpClick={() => setActiveTab("sign-up")}
              loading={loading}
              setLoading={setLoading}
            />
          </TabsContent>

          <TabsContent value="sign-up" className="mt-4">
            <SignUpForm onSuccess={() => {
              toast('Signed up', { description: 'Your account has been created successfully.', duration:1000 });
              onClose();
            }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
