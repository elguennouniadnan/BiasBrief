"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Search, Bookmark, Sun, Moon, Settings, FolderHeart, X, BookMarkedIcon } from "lucide-react"
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
import { AccountSuggestionDialog } from "@/components/account-suggestion-dialog"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

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
  const [showAccountSuggestionDialog, setShowAccountSuggestionDialog] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)")
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const pathname = usePathname();
  const isArticlePage = pathname.startsWith('/article/');

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

  useEffect(() => {
    if (user) return; // Only for unsigned users
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('accountSuggestionShown')) return;
    const timer = setTimeout(() => {
      setShowAccountSuggestionDialog(true);
      sessionStorage.setItem('accountSuggestionShown', 'true');
    }, 10000);
    return () => clearTimeout(timer);
  }, [user]);

  const ThemeIcon = mounted ? theme === "dark" ? Sun : Moon : null

  return (
    <>
      {!user && showAccountSuggestionDialog && (
        <AccountSuggestionDialog onSignUp={() => {
          setAuthModalTab("sign-up");
          setAuthModalOpen(true);
          setShowAccountSuggestionDialog(false);
        }} />
      )}
      <header className={`sticky top-0 z-50 pb-2 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
        scrolled ? "shadow-sm border-b border-border/50" : ""
      }`}>
        <div className="w-full md:container md:px-4 mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 mt-1 mx-1 md:mr-2 md:mt-3">
              <Logo className="w-[200px] h-[70px] md:w-[220px] md:h-[80px]" />
            </div>

            {!isMobile && (
              <div className="flex items-center gap-3 flex-1 justify-end pt-2">
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
                    {/* Hide search button on article page */}
                    {!isArticlePage && (
                      searchBarOpen ? (
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
                          className="h-9 w-9 rounded-full text-black hover:text-gray-700 dark:text-gray-200 hover:shadow-md p-0 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 focus:outline-none flex items-center justify-center group"
                        >
                          <Search className="h-5 w-5 transition-colors duration-200" />
                        </Button>
                      )
                    )}
                  </motion.div>
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  {/* Hide Show Bookmarks Only button on article page */}
                  {!isArticlePage && (
                    <Button
                      variant={showBookmarksOnly ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                      className={cn(
                        "h-9 w-9 rounded-full p-0 transition-all duration-200 flex items-center justify-center",
                        showBookmarksOnly
                          ? "dark:bg-gray-300 text-gray-100 hover:bg-primary dark:text-gray-900 dark:hover:bg-gray-300 shadow-md hover:shadow-md hover:scale-110 opacity-90 hover:opacity-100"
                          : "text-black hover:text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 hover:shadow-md hover:scale-110 opacity-90 hover:opacity-100"
                      )}
                    >
                      <Bookmark className="h-5 w-5" />
                    </Button>
                  )}

                  {/* Theme toggle button - always visible on desktop */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleThemeChange}
                    title="Toggle theme"
                    className="h-9 w-9 rounded-full text-amber-500 dark:text-amber-500 dark:hover:shadow-md hover:shadow-md p-0 transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-400 dark:hover:text-amber-700 hover:text-amber-500 hover:scale-110 opacity-90 hover:opacity-100 flex items-center justify-center"
                  >
                    {ThemeIcon && (
                      <span className="h-5 w-5 inline-flex items-center justify-center dark:bg-clip-text">
                        <ThemeIcon className="h-5 w-5 dark:bg-clip-text" />
                      </span>
                    )}
                  </Button>

                  {user ? (
                    <div className="transition-all duration-200 hover:scale-110 hover:opacity-90">
                      <UserDropdown 
                        openSettings={() => setIsSettingsOpen(true)}
                        customNewsEnabled={customNewsEnabled}
                        setCustomNewsEnabled={setCustomNewsEnabled}
                      />
                    </div>
                  ) : (
                    <div className="transition-all duration-200 hover:scale-110 hover:opacity-90">
                      <UserDropdown
                        openSettings={() => setIsSettingsOpen(true)}
                        showSignedOutMenu={true}
                        onSignIn={() => {
                          setAuthModalTab("sign-in");
                          setAuthModalOpen(true);
                        }}
                        customNewsEnabled={customNewsEnabled}
                        setCustomNewsEnabled={setCustomNewsEnabled}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {isMobile && (
              <div className="flex items-center gap-1 w-full justify-end min-w-0 px-1">
                <div className="search-container relative">
                  {/* Hide search button on article page */}
                  {!isArticlePage && (
                    searchBarOpen ? (
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
                        className="h-9 w-9 rounded-full text-black hover:text-gray-700 dark:text-gray-200 hover:shadow-md p-0 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 focus:outline-none flex items-center justify-center group"
                      >
                        <Search className="h-5 w-5 transition-colors duration-200" />
                      </Button>
                    )
                  )}
                </div>

                {/* Hide Show Bookmarks Only button on article page */}
                {!isArticlePage && (
                  <Button
                    variant={showBookmarksOnly ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                    className={cn(
                      "h-9 w-9 rounded-full p-0 transition-all duration-200 flex items-center justify-center",
                      showBookmarksOnly
                        ? "bg-primary dark:bg-gray-200 text-gray-100 dark:text-gray-900 hover:scale-110"
                        : "text-gray-700 dark:text-gray-200 hover:scale-110"
                    )}
                  >
                    <Bookmark className="h-5 w-5" />
                  </Button>
                )}

                {/* Theme toggle button - always visible on mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThemeChange}
                  title="Toggle theme"
                  className="h-9 w-9 rounded-full text-amber-500 dark:text-amber-50 dark:hover:shadow-md hover:shadow-md p-0 transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-400 dark:hover:text-amber-700 hover:text-amber-500 hover:scale-110 opacity-90 hover:opacity-100 flex items-center justify-center mr-2"
                >
                  {ThemeIcon && (
                    <span className="h-5 w-5 inline-flex items-center justify-center dark:bg-clip-text">
                      <ThemeIcon className="h-5 w-5 dark:bg-clip-text" />
                    </span>
                  )}
                </Button>

                {/* User avatar or sign in/settings for mobile */}
                {user ? (
                  <div className="transition-all duration-200 hover:scale-110 hover:opacity-90">
                    <UserDropdown 
                      openSettings={() => setIsSettingsOpen(true)}
                      customNewsEnabled={customNewsEnabled}
                      setCustomNewsEnabled={setCustomNewsEnabled}
                    />
                  </div>
                ) : (
                  <div className="transition-all duration-200 hover:scale-110 hover:opacity-90">
                    <UserDropdown
                      openSettings={() => setIsSettingsOpen(true)}
                      showSignedOutMenu={true}
                      onSignIn={() => {
                        setAuthModalTab("sign-in");
                        setAuthModalOpen(true);
                      }}
                      customNewsEnabled={customNewsEnabled}
                      setCustomNewsEnabled={setCustomNewsEnabled}
                    />
                  </div>
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
          articlesPerPage={articlesPerPage}
          setArticlesPerPage={setArticlesPerPage}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        {/* Auth modal - separate from UserDropdown to avoid unmounting issues */}
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab={authModalTab} />
      </header>
    </>
  )
}
