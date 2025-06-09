"use client"

import { useEffect } from "react"

export function ToastListener() {
  useEffect(() => {
    console.log('[ToastListener] Mounted');
    function handleAuthEvent(e: Event) {
      const customEvent = e as CustomEvent;
      console.log('[ToastListener] Received auth-toast event:', customEvent.detail);
      if (customEvent.detail?.type === "sign-in") {
        // Sonner toast logic for sign-in
      } else if (customEvent.detail?.type === "sign-out") {
        // Sonner toast logic for sign-out
      } else if (customEvent.detail?.type === "sign-in-error") {
        // Sonner toast logic for sign-in error
      } else if (customEvent.detail?.type === "sign-out-error") {
        // Sonner toast logic for sign-out error
      }
    }
    window.addEventListener("auth-toast", handleAuthEvent);
    return () => window.removeEventListener("auth-toast", handleAuthEvent);
  }, []);

  return null;
}
