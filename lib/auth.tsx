"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface User {
  id: string
  email: string
  name: string
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
  signOut: () => void
  updateUser: (updates: Partial<User>) => void
  updateEmail: (email: string, password: string) => Promise<boolean>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on initial render
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user))
    } else {
      localStorage.removeItem("user")
    }
  }, [user])

  // Mock authentication functions
  const signIn = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would call an API
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, any email/password combination works
      // In a real app, this would validate credentials against a backend
      const mockUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        email,
        name: email.split("@")[0],
        preferences: {
          defaultBiasMode: false,
          preferredCategories: [],
        },
      }

      setUser(mockUser)
      return true
    } catch (error) {
      console.error("Sign in error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    // In a real app, this would call an API
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, create a user with the provided details
      const mockUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        email,
        name,
        preferences: {
          defaultBiasMode: false,
          preferredCategories: [],
        },
      }

      setUser(mockUser)
      return true
    } catch (error) {
      console.error("Sign up error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  const updateEmail = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would verify the password and update the email
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (user) {
        setUser({ ...user, email })
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
    // In a real app, this would verify the current password and update to the new one
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Password update would happen on the backend
      return true
    } catch (error) {
      console.error("Update password error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateUser,
    updateEmail,
    updatePassword,
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
