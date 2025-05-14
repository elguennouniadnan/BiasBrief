"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { auth, db, googleProvider } from "@/lib/firebase"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth"
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore"

export interface User {
  id: string
  email: string
  name: string
  photoURL?: string
  preferences: {
    defaultBiasMode: boolean
    preferredCategories: string[]
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (name: string, email: string, password: string) => Promise<boolean>
  signInWithGoogle: () => Promise<boolean>
  signOut: () => void
  updateUser: (updates: Partial<User>) => Promise<void>
  updateEmail: (email: string, password: string) => Promise<boolean>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  providerId: string | null
  isEmailVerified: boolean
  resendVerificationEmail: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true)

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get or create user profile in Firestore
        const userRef = doc(db, "users", firebaseUser.uid)
        let userSnap = await getDoc(userRef)
        let userData = userSnap.exists() ? userSnap.data() : null
        if (!userData) {
          // Create new user profile
          userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
            photoURL: firebaseUser.photoURL || "",
            preferences: {
              defaultBiasMode: false,
              preferredCategories: [],
            },
          }
          await setDoc(userRef, userData)
        }
        setUser({
          id: firebaseUser.uid,
          email: userData.email,
          name: userData.name,
          photoURL: userData.photoURL,
          preferences: userData.preferences,
        })
        // Get the main providerId (first in providerData)
        setProviderId(firebaseUser.providerData[0]?.providerId || null)
        setIsEmailVerified(firebaseUser.emailVerified)
      } else {
        setUser(null)
        setProviderId(null)
        setIsEmailVerified(true)
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return true
    } catch (error) {
      console.error("Sign in error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      // Create user profile in Firestore
      const userRef = doc(db, "users", cred.user.uid)
      await setDoc(userRef, {
        id: cred.user.uid,
        email,
        name,
        photoURL: cred.user.photoURL || "",
        preferences: {
          defaultBiasMode: false,
          preferredCategories: [],
        },
      })
      // Send email verification
      if (cred.user && !cred.user.emailVerified) {
        await sendEmailVerification(cred.user)
      }
      // Send user data and preferences to webhook
      try {
        // Get preferences from localStorage (if available)
        let preferences = null
        if (typeof window !== 'undefined') {
          const prefStr = localStorage.getItem("preferredCategories")
          preferences = prefStr ? JSON.parse(prefStr) : []
        }
        const payload = {
          id: cred.user.uid,
          email,
          name,
          photoURL: cred.user.photoURL || "",
          preferences,
        }
        await fetch("https://rizgap5i.rpcl.app/webhook-test/create-user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } catch (err) {
        console.error("Failed to send user data to webhook:", err)
      }
      return true
    } catch (error) {
      console.error("Sign up error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      // User profile will be created/updated by onAuthStateChanged
      // Send user data and preferences to webhook
      try {
        const googleUser = result.user
        // Get preferences from localStorage (if available)
        let preferences = null
        if (typeof window !== 'undefined') {
          const prefStr = localStorage.getItem("preferredCategories")
          preferences = prefStr ? JSON.parse(prefStr) : []
        }
        const payload = {
          id: googleUser.uid,
          email: googleUser.email,
          name: googleUser.displayName || googleUser.email?.split("@")[0] || "",
          photoURL: googleUser.photoURL || "",
          providerId: googleUser.providerData[0]?.providerId || null,
          preferences,
          // Any other info you want to send
          phoneNumber: googleUser.phoneNumber || null,
          emailVerified: googleUser.emailVerified,
        }
        await fetch("https://rizgap5i.rpcl.app/webhook-test/create-user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } catch (err) {
        console.error("Failed to send Google user data to webhook:", err)
      }
      return true
    } catch (error) {
      console.error("Google sign-in error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    firebaseSignOut(auth)
  }

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      const userRef = doc(db, "users", user.id)
      await updateDoc(userRef, updates)
      setUser({ ...user, ...updates })
    }
  }

  const updateEmail = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      if (auth.currentUser) {
        await signInWithEmailAndPassword(auth, auth.currentUser.email || "", password)
        await firebaseUpdateEmail(auth.currentUser, email)
        await updateUser({ email })
        return true
      }
      return false
    } catch (error) {
      console.error("Update email error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      if (auth.currentUser) {
        await signInWithEmailAndPassword(auth, auth.currentUser.email || "", currentPassword)
        await firebaseUpdatePassword(auth.currentUser, newPassword)
        return true
      }
      return false
    } catch (error) {
      console.error("Update password error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser)
    }
  }

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateUser,
    updateEmail,
    updatePassword,
    providerId,
    isEmailVerified,
    resendVerificationEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
