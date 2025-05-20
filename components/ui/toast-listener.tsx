"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export function ToastListener() {
  const { toast } = useToast();

  useEffect(() => {
    console.log('[ToastListener] Mounted');
    function handleAuthEvent(e: Event) {
      const customEvent = e as CustomEvent;
      console.log('[ToastListener] Received auth-toast event:', customEvent.detail);
      if (customEvent.detail?.type === "sign-in") {
        toast({
          title: "Signed in",
          description: "You have successfully signed in.",
          duration: 3000,
        });
      } else if (customEvent.detail?.type === "sign-out") {
        toast({
          title: "Signed out",
          description: "You have successfully signed out.",
          duration: 3000,
        });
      } else if (customEvent.detail?.type === "sign-in-error") {
        toast({
          title: "Sign in failed",
          description: customEvent.detail?.message || "There was a problem signing in.",
          variant: "destructive",
          duration: 4000,
        });
      } else if (customEvent.detail?.type === "sign-out-error") {
        toast({
          title: "Sign out failed",
          description: customEvent.detail?.message || "There was a problem signing out.",
          variant: "destructive",
          duration: 4000,
        });
      }
    }
    window.addEventListener("auth-toast", handleAuthEvent);
    return () => window.removeEventListener("auth-toast", handleAuthEvent);
  }, [toast]);

  return null;
}
