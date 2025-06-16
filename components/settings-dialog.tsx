"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/lib/auth"
import { Loader2, ChevronDown } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: string[]
  preferredCategories: string[]
  setPreferredCategories: (categories: string[]) => void
  articlesPerPage: number
  setArticlesPerPage: (count: number) => void
  sortOrder: 'new-to-old' | 'old-to-new'
  setSortOrder: (order: 'new-to-old' | 'old-to-new') => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  categories,
  preferredCategories,
  setPreferredCategories,
  articlesPerPage,
  setArticlesPerPage,
  sortOrder,
  setSortOrder,
}: SettingsDialogProps) {
  const { user, updatePassword, updateUser, providerId } = useAuth()
  const [localPreferredCategories, setLocalPreferredCategories] = useState<string[]>(preferredCategories)
  const [localArticlesPerPage, setLocalArticlesPerPage] = useState(articlesPerPage)
  const [localSortOrder, setLocalSortOrder] = useState<'new-to-old' | 'old-to-new'>(sortOrder)
  const [activeTab, setActiveTab] = useState("content")
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false)
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false)

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      let stored: unknown = []
      if (typeof window !== 'undefined') {
        try {
          stored = JSON.parse(localStorage.getItem("preferredCategories") || "[]")
        } catch {
          stored = []
        }
      }
      setLocalPreferredCategories(Array.isArray(stored) ? stored : [])
      setLocalArticlesPerPage(articlesPerPage)
      setLocalSortOrder(sortOrder)
      setPasswordUpdateSuccess(false)
    }
  }, [open, articlesPerPage, sortOrder, categories])

  const handleSave = async () => {
    setPreferredCategories(localPreferredCategories)
    if (typeof window !== 'undefined') {
      localStorage.setItem("preferredCategories", JSON.stringify(localPreferredCategories))
    }
    setArticlesPerPage(localArticlesPerPage)
    setSortOrder(localSortOrder)
    if (user) {
      updateUser({
        preferences: {
          ...user.preferences,
          preferredCategories: localPreferredCategories,
        },
      })
      try {
        const preferences = {
          ...user.preferences,
          preferredCategories: localPreferredCategories,
          articlesPerPage: localArticlesPerPage,
        }
        const payload = {
          id: user.id,
          email: user.email,
          name: user.name,
          photoURL: user.photoURL || '',
          preferences,
          providerId: providerId || null,
          emailVerified: providerId === 'google.com' ? 'N/A' : false,
        }
        await fetch("https://rizgap5i.rpcl.app/webhook/update-user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } catch (err) {
        console.error("Failed to send updated user data to webhook:", err)
      }
    }
    onOpenChange(false)
  }

  const toggleCategory = (category: string) => {
    setLocalPreferredCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category)
      } else {
        return [...prev, category]
      }
    })
  }

  const selectAllCategories = () => {
    setLocalPreferredCategories(categories.filter((c) => c !== "All"))
  }

  const clearAllCategories = () => {
    setLocalPreferredCategories([])
  }

  // Password update form
  const passwordFormSchema = z
    .object({
      currentPassword: z.string().min(1, { message: "Current password is required" }),
      newPassword: z.string().min(8, { message: "New password must be at least 8 characters" }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    setPasswordUpdateSuccess(false)
    setPasswordUpdateLoading(true)

    try {
      const success = await updatePassword(values.currentPassword, values.newPassword)
      if (success) {
        setPasswordUpdateSuccess(true)
        passwordForm.reset()
      }
    } finally {
      setPasswordUpdateLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto w-[85vw] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="mb-2 mt-1">Settings</DialogTitle>
          <DialogDescription>
              Customize your news experience. Changes will be saved when you click Save.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className={`grid w-full ${user && providerId === "password" ? "grid-cols-2" : "grid-cols-1"}`}>
            <TabsTrigger value="content">Preferences</TabsTrigger>
            {user && providerId === "password" && <TabsTrigger value="account">Account</TabsTrigger>}
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-4 px-2">
            {user && user.email && (
              <div>
                <h3 className="text-sm font-medium mb-2">Preferred Categories</h3>
                <p className="text-sm text-muted-foreground mb-4">Select which categories you want to see in your feed</p>

                <div className="flex justify-between mb-2">
                  <Button variant="outline" size="sm" onClick={selectAllCategories}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllCategories}>
                    Clear All
                  </Button>
                </div>

                <ScrollArea className="h-[140px] border p-3 rounded-sm">
                  <div className="space-y-4">
                    {categories
                      .filter((category) => category !== "All")
                      .map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={localPreferredCategories.includes(category)}
                            onCheckedChange={() => toggleCategory(category)}
                          />
                          <Label htmlFor={`category-${category}`}>{category}</Label>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">Sort Articles</h3>
              <div className="grid gap-2">
                <Select
                  value={localSortOrder}
                  onValueChange={(value: 'new-to-old' | 'old-to-new') => setLocalSortOrder(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new-to-old">New to Old</SelectItem>
                    <SelectItem value="old-to-new">Old to New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div>
              <h3 className="text-sm font-medium mb-2">Number of articles per page</h3>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-8"
                  value={localArticlesPerPage}
                  onChange={(e) => setLocalArticlesPerPage(Number(e.target.value))}
                >
                  <option value="6">6 articles</option>
                  <option value="9">9 articles</option>
                  <option value="12">12 articles</option>
                  <option value="15">15 articles</option>
                  <option value="18">18 articles</option>
                  <option value="21">21 articles</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              </div>
            </div>
          </TabsContent>


          {user && providerId === "password" && (
            <TabsContent value="account" className="space-y-6 mt-4 px-2">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Update Password</h3>

                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    {passwordUpdateSuccess && (
                      <div className="p-3 text-sm bg-green-50 text-green-600 rounded-md">
                        Password updated successfully!
                      </div>
                    )}

                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={passwordUpdateLoading}>
                      {passwordUpdateLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
