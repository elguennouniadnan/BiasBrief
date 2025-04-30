"use client"

import { useState, useEffect } from "react"
import { Search, Bookmark, Menu, X, Sun, Moon, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SettingsDialog } from "@/components/settings-dialog"
import { UserDropdown } from "@/components/user-dropdown"
import { motion } from "framer-motion"

interface NavbarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  isBiasedMode: boolean
  setIsBiasedMode: (biased: boolean) => void
  showBookmarksOnly: boolean
  setShowBookmarksOnly: (show: boolean) => void
  preferredCategories: string[]
  setPreferredCategories: (categories: string[]) => void
  defaultBiasMode: boolean
  setDefaultBiasMode: (biased: boolean) => void
  defaultDarkMode: boolean
  setDefaultDarkMode: (dark: boolean) => void
  fontSize: string
  setFontSize: (size: string) => void
  articlesPerPage: number
  setArticlesPerPage: (count: number) => void
}

export function Navbar({
  searchQuery,
  setSearchQuery,
  isBiasedMode,
  setIsBiasedMode,
  showBookmarksOnly,
  setShowBookmarksOnly,
  preferredCategories,
  setPreferredCategories,
  defaultBiasMode,
  setDefaultBiasMode,
  defaultDarkMode,
  setDefaultDarkMode,
  fontSize,
  setFontSize,
  articlesPerPage,
  setArticlesPerPage,
}: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md transition-all duration-300 ${
        scrolled ? "shadow-sm border-b border-gray-200/70 dark:border-gray-800/70" : ""
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 font-bold text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            NewsApp
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="relative max-w-md w-full mx-4 group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-primary transition-colors duration-200" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full border-gray-200 dark:border-gray-700 focus:border-primary dark:focus:border-primary transition-all duration-200 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="bias-toggle" className="text-sm font-medium">
                  {isBiasedMode ? "Biased" : "Unbiased"}
                </Label>
                <Switch
                  id="bias-toggle"
                  checked={isBiasedMode}
                  onCheckedChange={setIsBiasedMode}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={showBookmarksOnly ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                  title="Show bookmarks"
                  className={showBookmarksOnly ? "bg-primary hover:bg-primary/90" : ""}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle theme"
                className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-amber-500" />
                ) : (
                  <Moon className="h-5 w-5 text-indigo-500" />
                )}
              </Button>

              <UserDropdown openSettings={() => setIsSettingsOpen(true)} />
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="flex items-center gap-2">
              <Button
                variant={showBookmarksOnly ? "default" : "outline"}
                size="icon"
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                title="Show bookmarks"
                className={showBookmarksOnly ? "bg-primary hover:bg-primary/90" : ""}
              >
                <Bookmark className="h-4 w-4" />
              </Button>

              <UserDropdown openSettings={() => setIsSettingsOpen(true)} />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobile && isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="py-4 space-y-4 border-t border-gray-200 dark:border-gray-800"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full border-gray-200 dark:border-gray-700 focus:border-primary dark:focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="mobile-bias-toggle" className="text-sm font-medium">
                  {isBiasedMode ? "Biased" : "Unbiased"} Titles
                </Label>
                <Switch
                  id="mobile-bias-toggle"
                  checked={isBiasedMode}
                  onCheckedChange={setIsBiasedMode}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle theme"
                className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-amber-500" />
                ) : (
                  <Moon className="h-5 w-5 text-indigo-500" />
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        categories={["Politics", "Technology", "Health", "Sports", "Entertainment", "World News"]}
        preferredCategories={preferredCategories}
        setPreferredCategories={setPreferredCategories}
        defaultBiasMode={defaultBiasMode}
        setDefaultBiasMode={setDefaultBiasMode}
        defaultDarkMode={defaultDarkMode}
        setDefaultDarkMode={setDefaultDarkMode}
        fontSize={fontSize}
        setFontSize={setFontSize}
        articlesPerPage={articlesPerPage}
        setArticlesPerPage={setArticlesPerPage}
      />
    </header>
  )
}
