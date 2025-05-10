"use client"

import * as React from "react"
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
import Image from "next/image"

interface NavbarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  showBookmarksOnly: boolean
  setShowBookmarksOnly: (show: boolean) => void
  preferredCategories: string[]
  setPreferredCategories: (categories: string[]) => void
  defaultBiasMode: boolean
  setDefaultBiasMode: (biased: boolean) => void
  themePreference: boolean
  setThemePreference: (dark: boolean) => void
  fontSize: string
  setFontSize: (size: string) => void
  articlesPerPage: number
  setArticlesPerPage: (count: number) => void
  cardSize: number
  setCardSize: (size: number) => void
  sortOrder: 'new-to-old' | 'old-to-new'
  setSortOrder: (order: 'new-to-old' | 'old-to-new') => void
}

export function Navbar({
  searchQuery,
  setSearchQuery,
  showBookmarksOnly,
  setShowBookmarksOnly,
  preferredCategories,
  setPreferredCategories,
  defaultBiasMode,
  setDefaultBiasMode,
  themePreference,
  setThemePreference,
  fontSize,
  setFontSize,
  articlesPerPage,
  setArticlesPerPage,
  cardSize,
  setCardSize,
  sortOrder,
  setSortOrder
}: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchBarOpen, setSearchBarOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (searchBarOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchBarOpen])

  const handleThemeChange = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    setThemePreference(newTheme === 'dark')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (searchBarOpen && !target.closest('.search-container')) {
        setSearchBarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [searchBarOpen])

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchBarOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [setSearchQuery])

  const ThemeIcon = mounted ? theme === "dark" ? Sun : Moon : null

  return (
    <header className={`sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
      scrolled ? "shadow-sm border-b border-border/50" : ""
    }`}>
      <div className="w-full px-2 md:container md:px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 relative h-12 w-32 md:w-48 ml-4 md:ml-0">
            {mounted && (
              <Image
                src={theme === "dark" ? "/logo3.png" : "/logo2.png"}
                alt="BiasBrief"
                fill
                className="object-contain"
                priority
              />
            )}
          </div>

          {!isMobile && (
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="search-container relative max-w-md mx-4">
                <motion.div
                  animate={{
                    width: searchBarOpen ? "100%" : "40px",
                    opacity: 1
                  }}
                  initial={{ width: "40px", opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex items-center"
                >
                  {searchBarOpen ? (
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full border-0 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                        onClick={() => {
                          setSearchBarOpen(false)
                          setSearchQuery('')
                        }}
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchBarOpen(true)}
                      className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant={showBookmarksOnly ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                  title="Show bookmarks"
                  className={showBookmarksOnly ? "bg-primary hover:bg-primary/90" : ""}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSettingsOpen(true)}
                  className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThemeChange}
                  title="Toggle theme"
                  className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  {ThemeIcon && <ThemeIcon className="h-4 w-4 text-amber-500" />}
                </Button>

                <UserDropdown openSettings={() => setIsSettingsOpen(true)} />
              </div>
            </div>
          )}

          {isMobile && (
            <div className="flex items-center gap-2">
              <div className="search-container relative">
                {searchBarOpen ? (
                  <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4">
                    <div className="relative max-w-md mx-auto mt-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full border-0 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                        onClick={() => {
                          setSearchBarOpen(false)
                          setSearchQuery('')
                        }}
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchBarOpen(true)}
                    className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <UserDropdown openSettings={() => setIsSettingsOpen(true)} />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        {isMobile && isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="py-4 space-y-4 border-t border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 pr-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSettingsOpen(true)}
                  className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThemeChange}
                  title="Toggle theme"
                  className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {ThemeIcon && <ThemeIcon className="h-4 w-4 text-amber-500" />}
                </Button>
              </div>
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
        themePreference={theme === "dark"}
        setThemePreference={setThemePreference}
        fontSize={fontSize}
        setFontSize={setFontSize}
        articlesPerPage={articlesPerPage}
        setArticlesPerPage={setArticlesPerPage}
        cardSize={cardSize}
        setCardSize={setCardSize}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
    </header>
  )
}
