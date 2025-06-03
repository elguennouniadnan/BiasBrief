"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { CategoryFilter } from "@/components/category-filter"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { GridArticleCard } from "@/components/grid-article-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Article } from "@/lib/types"

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isBiasedMode, setIsBiasedMode] = useState(false)
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [preferredCategories, setPreferredCategories] = useState<string[]>([])
  const [defaultBiasMode, setDefaultBiasMode] = useState(false)
  const [defaultDarkMode, setDefaultDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState("medium")
  const [articlesPerPage, setArticlesPerPage] = useState(9)

  useEffect(() => {
    async function fetchArticles() {
      const q = query(collection(db, "articles"), orderBy("date", "desc"))
      const querySnapshot = await getDocs(q)
      const fetched: Article[] = []
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Article)
      })
      setArticles(fetched)
    }
    fetchArticles()
  }, [])

  useEffect(() => {
    const savedBookmarks = localStorage.getItem("bookmarks")
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks))
  }, [bookmarks])

  const toggleBookmark = (articleId: string) => {
    setBookmarks((prev) => {
      if (prev.includes(articleId)) {
        return prev.filter((id) => id !== articleId)
      } else {
        return [...prev, articleId]
      }
    })
  }

  useEffect(() => {
    const savedPreferredCategories = localStorage.getItem("preferredCategories")
    if (savedPreferredCategories) {
      setPreferredCategories(JSON.parse(savedPreferredCategories))
    } else {
      setPreferredCategories(Array.from(new Set(articles.map((article) => article.category).filter((c): c is string => Boolean(c)))))
    }

    const savedDefaultBiasMode = localStorage.getItem("defaultBiasMode")
    if (savedDefaultBiasMode) {
      const biasMode = savedDefaultBiasMode === "true"
      setDefaultBiasMode(biasMode)
      setIsBiasedMode(biasMode)
    }

    const savedDefaultDarkMode = localStorage.getItem("defaultDarkMode")
    if (savedDefaultDarkMode) {
      setDefaultDarkMode(savedDefaultDarkMode === "true")
    }

    const savedFontSize = localStorage.getItem("fontSize")
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }

    const savedArticlesPerPage = localStorage.getItem("articlesPerPage")
    if (savedArticlesPerPage) {
      setArticlesPerPage(Number(savedArticlesPerPage))
    }
  }, [articles])

  useEffect(() => {
    if (preferredCategories.length > 0) {
      localStorage.setItem("preferredCategories", JSON.stringify(preferredCategories))
    }
  }, [preferredCategories])

  useEffect(() => {
    localStorage.setItem("defaultBiasMode", defaultBiasMode.toString())
  }, [defaultBiasMode])

  useEffect(() => {
    localStorage.setItem("defaultDarkMode", defaultDarkMode.toString())
  }, [defaultDarkMode])

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize)
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem("articlesPerPage", articlesPerPage.toString())
  }, [articlesPerPage])

  useEffect(() => {
    const size =
      fontSize === "small"
        ? "0.925rem"
        : fontSize === "large"
        ? "1.125rem"
        : "1rem"
    document.documentElement.style.fontSize = size
  }, [fontSize])

  const filteredArticles = articles.filter((article) => {
    // If category is 'All', show all articles
    if (selectedCategory === "All") return true;
    // Only show articles with a defined category that matches exactly
    return article.category === selectedCategory;
  })

  // --- CATEGORY FETCHING FROM /api/sections ---
  const [allCategories, setAllCategories] = useState<string[]>(["All"]);
  useEffect(() => {
    async function fetchAllCategories() {
      let cached = null;
      if (typeof window !== 'undefined') {
        try {
          cached = JSON.parse(localStorage.getItem('allCategories') || 'null');
        } catch {}
      }
      if (Array.isArray(cached) && cached.length > 0) {
        setAllCategories(cached);
        return;
      }
      try {
        const response = await fetch('/api/sections');
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const categories = ['All', ...data.categories.filter((c: string) => c && c !== 'All')];
          setAllCategories(categories);
          if (typeof window !== 'undefined') {
            localStorage.setItem('allCategories', JSON.stringify(categories));
          }
        }
      } catch (e) {
        // ignore
      }
    }
    fetchAllCategories();
  }, []);

  // Responsive variant for hero cards
  const [isWiderThan1024, setIsWiderThan1024] = useState(false);
  useEffect(() => {
    const checkWidth1024: () => void = () => setIsWiderThan1024(window.innerWidth > 1024);
    checkWidth1024();
    window.addEventListener('resize', checkWidth1024);
    return () => window.removeEventListener('resize', checkWidth1024);
  }, []);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile: () => void = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderGrid = (articles: typeof filteredArticles) => (
    <div className="news-grid-md-fix grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[300vh] lg:h-[200vh]">
      {/* Article 1: Spans columns 1-2, rows 1-3 */}
      <div className="col-span-1 md:col-span-2 row-span-3">
        {articles[0] && (
          <GridArticleCard
            article={articles[0]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[0]?.id))}
            toggleBookmark={toggleBookmark}
            variant={isMobile ? "title-only" : isWiderThan1024 ? "hero" : "horizontal"}
            enableUnbias={true}
          />
        )}
      </div>
      {/* Article 2: Row 1, Column 3 */}
      <div className="col-span-1 row-span-1">
        {articles[1] && (
          <GridArticleCard
            article={articles[1]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[1]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>
      {/* Article 3: Row 2, Column 3 */}
      <div className="col-span-1 row-span-1">
        {articles[2] && (
          <GridArticleCard
            article={articles[2]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[2]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>
      {/* Article 4: Row 3, Column 3 */}
      <div className="col-span-1 row-span-1">
        {articles[3] && (
          <GridArticleCard
            article={articles[3]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[3]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>
      {/* Article 5: Row 4, Column 1 */}
      <div className="col-span-1 row-span-1">
        {articles[4] && (
          <GridArticleCard
            article={articles[4]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[4]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>
      {/* Article 6: Row 4, Columns 2 */}
      <div className="col-span-1 row-span-1">
        {articles[5] && (
          <GridArticleCard
            article={articles[5]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[5]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>
      {/* Article 7: Rows 4, Column 3 */}
      <div className="col-span-1 row-span-1">
        {articles[6] && (
          <GridArticleCard
            article={articles[6]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[6]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>
      {/* Article 8: Rows 5-6, Columns 2-3 */}
      <div className="col-span-1 md:col-span-2 row-span-3">
        {articles[7] && (
          <GridArticleCard
            article={articles[7]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[7]?.id))}
            toggleBookmark={toggleBookmark}
            variant={isMobile ? "title-only" : isWiderThan1024 ? "hero" : "horizontal"}
            enableUnbias={true}
          />
        )}
      </div>
      {/* Article 9: Row 1, Column 3 */}
      <div className="col-span-1 row-span-1">
        {articles[8] && (
          <GridArticleCard
            article={articles[8]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[8]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>
      {/* Article 10: Row 2, Column 3 */}
      <div className="col-span-1 row-span-1">
        {articles[9] && (
          <GridArticleCard
            article={articles[9]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[9]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>
      {/* Article 11: Row 3, Column 3 */}
      <div className="col-span-1 row-span-1">
        {articles[10] && (
          <GridArticleCard
            article={articles[10]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[10]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>

      {/* Article 12: Row 4, Column 1 */}
      <div className="col-span-1 row-span-1">
        {articles[11] && (
          <GridArticleCard
            article={articles[11]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[11]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>
      {/* Article 13: Row 4, Columns 2 */}
      <div className="col-span-1 row-span-1">
        {articles[12] && (
          <GridArticleCard
            article={articles[12]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[12]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>
      {/* Article 14: Rows 4, Column 3 */}
      <div className="col-span-1 row-span-1">
        {articles[13] && (
          <GridArticleCard
            article={articles[13]}
            isBiasedMode={isBiasedMode}
            isBookmarked={bookmarks.includes(String(articles[13]?.id))}
            toggleBookmark={toggleBookmark}
            variant="title-only"
          />
        )}
      </div>

    </div>
  )

  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme={defaultDarkMode ? "dark" : "light"} enableSystem>
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
          <Navbar
            searchQuery={searchQuery}
            setSearchQuery={(q) => {
              setSearchQuery(q)
              if (typeof window !== 'undefined' && q.trim() && window.location.pathname === '/') {
                // Redirect to /stories with search param
                window.location.href = `/stories?search=${encodeURIComponent(q)}`
              }
            }}
            showBookmarksOnly={showBookmarksOnly}
            setShowBookmarksOnly={setShowBookmarksOnly}
            preferredCategories={preferredCategories}
            setPreferredCategories={setPreferredCategories}
            themePreference={defaultDarkMode}
            setThemePreference={setDefaultDarkMode}
            fontSize={fontSize}
            setFontSize={setFontSize}
            articlesPerPage={articlesPerPage}
            setArticlesPerPage={setArticlesPerPage}
            cardSize={3}
            setCardSize={() => {}}
            sortOrder={"new-to-old"}
            setSortOrder={() => {}}
            categories={allCategories}
            allCategories={allCategories}
            customNewsEnabled={false}
            setCustomNewsEnabled={() => {}}
          />

          <CategoryFilter
            categories={allCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          {/* <main className="flex-1 container mx-auto px-4 py-6"> */}
          <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 py-6">

            {renderGrid(filteredArticles)}
            <div className="text-center mt-12">
              <Link href="/stories">
                <Button size="lg" className="px-8">
                  Read more stories
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </main>
        </div>
      </ThemeProvider>
      <style jsx global>{`
        @media (min-width: 768px) and (max-width: 1024px) {
          /* Increase height for article card 1 (hero card) */
          .news-hero-md-fix {
            min-height: 420px !important;
            height: 420px !important;
          }
          /* Reduce gap between article 2 & 3 and 4 & 5 */
          .news-grid-md-fix {
            grid-row-gap: 1rem !important;
            row-gap: 1rem !important;
          }
        }
      `}</style>
    </AuthProvider>
  )
}
