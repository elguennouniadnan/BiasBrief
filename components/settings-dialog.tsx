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
  themePreference: boolean
  setThemePreference: (dark: boolean) => void
  fontSize: string
  setFontSize: (size: string) => void
  articlesPerPage: number
  setArticlesPerPage: (count: number) => void
  cardSize?: number
  setCardSize: (size: number) => void
  sortOrder: 'new-to-old' | 'old-to-new'
  setSortOrder: (order: 'new-to-old' | 'old-to-new') => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  categories,
  preferredCategories,
  setPreferredCategories,
  themePreference,
  setThemePreference,
  fontSize,
  setFontSize,
  articlesPerPage,
  setArticlesPerPage,
  cardSize = 100,
  setCardSize,
  sortOrder,
  setSortOrder,
}: SettingsDialogProps) {
  const { user, updateEmail, updatePassword, updateUser } = useAuth()
  const [localPreferredCategories, setLocalPreferredCategories] = useState<string[]>(preferredCategories)
  const [localThemePreference, setLocalThemePreference] = useState(themePreference)
  const [localFontSize, setLocalFontSize] = useState(fontSize)
  const [localArticlesPerPage, setLocalArticlesPerPage] = useState(articlesPerPage)
  const [localCardSize, setLocalCardSize] = useState<number>(cardSize)
  const [localSortOrder, setLocalSortOrder] = useState<'new-to-old' | 'old-to-new'>(sortOrder)
  const [activeTab, setActiveTab] = useState("content")
  const [emailUpdateSuccess, setEmailUpdateSuccess] = useState(false)
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false)
  const [emailUpdateLoading, setEmailUpdateLoading] = useState(false)
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false)

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      // Always sync with localStorage when dialog opens
      let stored: unknown = []
      if (typeof window !== 'undefined') {
        try {
          stored = JSON.parse(localStorage.getItem("preferredCategories") || "[]")
        } catch {
          stored = []
        }
      }
      setLocalPreferredCategories(Array.isArray(stored) ? stored : [])
      setLocalThemePreference(themePreference)
      setLocalFontSize(fontSize)
      setLocalArticlesPerPage(articlesPerPage)
      setLocalCardSize(cardSize)
      setLocalSortOrder(sortOrder)
      setEmailUpdateSuccess(false)
      setPasswordUpdateSuccess(false)
    }
  }, [open, themePreference, fontSize, articlesPerPage, cardSize, sortOrder, categories])

  const handleSave = () => {
    setPreferredCategories(localPreferredCategories)
    // Always update localStorage to reflect the new preferred categories, even if empty
    if (typeof window !== 'undefined') {
      localStorage.setItem("preferredCategories", JSON.stringify(localPreferredCategories))
    }
    setThemePreference(localThemePreference)
    setFontSize(localFontSize)
    setArticlesPerPage(localArticlesPerPage)
    setCardSize(localCardSize)
    setSortOrder(localSortOrder)

    // Update user preferences if logged in
    if (user) {
      updateUser({
        preferences: {
          ...user.preferences,
          preferredCategories: localPreferredCategories,
        },
      })
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

  // Email update form
  const emailFormSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
  })

  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: user?.email || "",
      password: "",
    },
  })

  const onEmailSubmit = async (values: z.infer<typeof emailFormSchema>) => {
    setEmailUpdateSuccess(false)
    setEmailUpdateLoading(true)

    try {
      const success = await updateEmail(values.email, values.password)
      if (success) {
        setEmailUpdateSuccess(true)
        emailForm.reset({ email: values.email, password: "" })
      }
    } finally {
      setEmailUpdateLoading(false)
    }
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
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your news experience. Changes will be saved when you click Save.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className={`grid w-full ${user ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="appearance">Display</TabsTrigger>
            {user && <TabsTrigger value="account">Account</TabsTrigger>}
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-4 px-2">
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
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6 mt-4 px-2">
            <div>
              <h3 className="text-sm font-medium mb-2">Theme Preference</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-preference">Default to dark mode</Label>
                <Switch
                  id="theme-preference"
                  checked={localThemePreference}
                  onCheckedChange={setLocalThemePreference}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Font Size</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={localFontSize === "small" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocalFontSize("small")}
                  className={`w-full ${localFontSize === "small" ? "bg-primary hover:bg-primary/90" : ""}`}
                >
                  <span className="text-xs">Small</span>
                </Button>
                <Button
                  variant={localFontSize === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocalFontSize("medium")}
                  className={`w-full ${localFontSize === "medium" ? "bg-primary hover:bg-primary/90" : ""}`}
                >
                  <span className="text-sm">Medium</span>
                </Button>
                <Button
                  variant={localFontSize === "large" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocalFontSize("large")}
                  className={`w-full ${localFontSize === "large" ? "bg-primary hover:bg-primary/90" : ""}`}
                >
                  <span className="text-base">Large</span>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Articles Per Page</h3>
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

          {user && (
            <TabsContent value="account" className="space-y-6 mt-4 px-2">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Update Email</h3>

                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                    {emailUpdateSuccess && (
                      <div className="p-3 text-sm bg-green-50 text-green-600 rounded-md">
                        Email updated successfully!
                      </div>
                    )}

                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="password"
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

                    <Button type="submit" disabled={emailUpdateLoading}>
                      {emailUpdateLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Email"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>

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
