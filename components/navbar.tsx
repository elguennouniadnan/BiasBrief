"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Search, Bookmark, Sun, Moon, Settings, FolderHeart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SettingsDialog } from "@/components/settings-dialog"
import { UserDropdown } from "@/components/user-dropdown"
import { motion } from "framer-motion"
import { Logo } from "@/components/logo"
import Image from "next/image"
import { useAuth } from "@/lib/auth"
import { AuthModal } from "@/components/auth/auth-modal"

interface NavbarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  showBookmarksOnly: boolean
  setShowBookmarksOnly: (show: boolean) => void
  preferredCategories: string[]
  setPreferredCategories: (categories: string[]) => void
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
  categories: string[]
  defaultBiasMode: boolean
  setDefaultBiasMode: (biased: boolean) => void
  customNewsEnabled: boolean
  setCustomNewsEnabled: (enabled: boolean) => void
  allCategories: string[] // Added canonical categories prop
}

export function Navbar({
  searchQuery,
  setSearchQuery,
  showBookmarksOnly,
  setShowBookmarksOnly,
  preferredCategories,
  setPreferredCategories,
  themePreference,
  setThemePreference,
  fontSize,
  setFontSize,
  articlesPerPage,
  setArticlesPerPage,
  cardSize,
  setCardSize,
  sortOrder,
  setSortOrder,
  categories,
  defaultBiasMode,
  setDefaultBiasMode,
  customNewsEnabled,
  setCustomNewsEnabled,
  allCategories, // Added canonical categories prop
}: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchBarOpen, setSearchBarOpen] = useState(false)
  const [pendingSearch, setPendingSearch] = useState(searchQuery)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"sign-in" | "sign-up">("sign-in")
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
        setPendingSearch(searchQuery)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [searchQuery])

  useEffect(() => {
    function handleOpenAuthModal(e: CustomEvent) {
      setIsSettingsOpen(false)
      // Open the auth modal via UserDropdown
      const userDropdownBtn = document.querySelector('[data-auth-modal-trigger]') as HTMLElement
      if (userDropdownBtn) userDropdownBtn.click()
    }
    window.addEventListener('open-auth-modal', handleOpenAuthModal as EventListener)
    return () => window.removeEventListener('open-auth-modal', handleOpenAuthModal as EventListener)
  }, [])

  const ThemeIcon = mounted ? theme === "dark" ? Sun : Moon : null

  return (
    <header className={`sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
      scrolled ? "shadow-sm border-b border-border/50" : ""
    }`}>
      <div className="w-full px-2 md:container md:px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 mr-10 md:mr-4 sm:ml-0">
            <Logo />
          </div>

          {!isMobile && (
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="search-container flex justify-end relative w-full max-w-xl">
                <motion.div
                  animate={{
                    width: searchBarOpen ? "100%" : "40px",
                    opacity: 1
                  }}
                  initial={{ width: "40px", opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex items-center justify-end"
                >
                  {searchBarOpen ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        setSearchQuery(pendingSearch);
                        setPendingSearch("");
                        setSearchBarOpen(false);
                      }}
                      className="relative w-full"
                    >
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        ref={searchInputRef}
                        type="search"
                        placeholder="Search articles..."
                        value={pendingSearch}
                        onChange={e => setPendingSearch(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') {
                            setSearchBarOpen(false)
                            setPendingSearch(searchQuery)
                          }
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            setSearchQuery(pendingSearch);
                            setPendingSearch("");
                            setSearchBarOpen(false);
                          }
                        }}
                        className="pl-10 pr-2 w-full border-0 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                        onClick={() => {
                          setSearchBarOpen(false)
                          setPendingSearch(searchQuery)
                        }}
                      >
                        <X className="h-4 w-4 ml-2 text-gray-400" />
                      </Button>
                    </form>
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
                  variant={showBookmarksOnly ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                  title="Show bookmarks"
                  className={showBookmarksOnly && customNewsEnabled ? "bg-red-100 hover:bg-red-200" : showBookmarksOnly ? "bg-primary hover:bg-primary/90" : ""}
                >
                  {customNewsEnabled ? (
                    <FolderHeart className={`h-4 w-4 ${showBookmarksOnly ? "text-red-500" : ""}`} />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
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

                <div className="flex items-center gap-1">
                  <Switch
                    id="custom-news-toggle"
                    checked={customNewsEnabled}
                    onCheckedChange={setCustomNewsEnabled}
                  />
                  <Label htmlFor="custom-news-toggle" className="text-xs px-2 leading-tight">
                    <span className="block">Custom</span>
                    <span className="block">News</span>
                  </Label>
                </div>

                {user ? (
                  <UserDropdown openSettings={() => setIsSettingsOpen(true)} />
                ) : (
                  <UserDropdown
                    openSettings={() => setIsSettingsOpen(true)}
                    showSignedOutMenu={true}
                    onSignIn={() => {
                      setAuthModalTab("sign-in");
                      setAuthModalOpen(true);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {isMobile && (
            <div className="flex items-center gap-1 w-full justify-end">
              <div className="search-container relative">
                {searchBarOpen ? (
                  <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4">
                    <div className="relative max-w-md mx-auto mt-2">
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          setSearchQuery(pendingSearch);
                          setPendingSearch("");
                          setSearchBarOpen(false);
                        }}
                        className="relative w-full"
                      >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none z-10" />
                        <Input
                          ref={searchInputRef}
                          type="search"
                          placeholder="Search articles..."
                          value={pendingSearch}
                          onChange={e => setPendingSearch(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Escape') {
                              setSearchBarOpen(false)
                              setPendingSearch(searchQuery)
                            }
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              setSearchQuery(pendingSearch);
                              setPendingSearch("");
                              setSearchBarOpen(false);
                            }
                          }}
                          className="pl-12 w-full border-0 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 no-clear-button"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                          onClick={() => {
                            setSearchBarOpen(false)
                            setPendingSearch(searchQuery)
                          }}
                        >
                          <X className="h-4 w-4 text-gray-400" />
                        </Button>
                      </form>
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

              <Button
                variant={showBookmarksOnly ? "default" : "ghost"}
                size="icon"
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                title="Show bookmarks"
                className={showBookmarksOnly && customNewsEnabled ? "bg-red-100 hover:bg-red-200" : showBookmarksOnly ? "bg-primary hover:bg-primary/90" : ""}
              >
                {customNewsEnabled ? (
                  <FolderHeart className={`h-4 w-4 ${showBookmarksOnly ? "text-red-500" : ""}`} />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>

              {/* Custom news toggle for mobile */}
              <div className="flex items-center gap-1 scale-90">
                <Switch
                  id="custom-news-toggle-mobile"
                  checked={customNewsEnabled}
                  onCheckedChange={setCustomNewsEnabled}
                  className="h-6 w-11"
                />
                <Label htmlFor="custom-news-toggle-mobile" className="text-[10px] px-1">Custom News</Label>
              </div>

              {/* User avatar or sign in/settings for mobile */}
              {user ? (
                <UserDropdown openSettings={() => setIsSettingsOpen(true)} />
              ) : (
                <UserDropdown
                  openSettings={() => setIsSettingsOpen(true)}
                  showSignedOutMenu={true}
                  onSignIn={() => {
                    setAuthModalTab("sign-in");
                    setAuthModalOpen(true);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        categories={Array.isArray(allCategories) ? allCategories : []}
        preferredCategories={preferredCategories}
        setPreferredCategories={setPreferredCategories}
        themePreference={themePreference}
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

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab={authModalTab} />
    </header>
  )
}
