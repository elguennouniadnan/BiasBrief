import { headers } from "next/headers";
import StoriesPageClient from "./StoriesPageClient";

async function getBaseUrl() {
  // Use headers from next/headers correctly
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.VERCEL_URL || process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

async function fetchCategories(baseUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/api/sections`, { cache: "no-store" });
    if (!res.ok) return ["All"];
    const data = await res.json();
    return ["All", ...(data.categories?.filter((c: string) => c && c !== "All") || [])];
  } catch {
    return ["All"];
  }
}

export default async function Page() {
  // Fetch the first page of articles server-side for hydration
  const baseUrl = await getBaseUrl();
  console.log('[SSR] Fetching initial articles from', `${baseUrl}/api/news?page=1&pageSize=9&sortOrder=new-to-old`);
  const articlesRes = await fetch(`${baseUrl}/api/news?page=1&pageSize=9&sortOrder=new-to-old`, { cache: "no-store" });
  let initialArticles = [];
  let initialTotalPages = 1;
  let initialTotalCount = 0;
  if (articlesRes.ok) {
    const data = await articlesRes.json();
    initialArticles = data.articles || [];
    initialTotalPages = data.totalPages || Math.max(1, Math.ceil((data.totalCount || 0) / 9));
    initialTotalCount = data.totalCount || initialArticles.length;
  }
  const initialCategories = await fetchCategories(baseUrl);
  return <StoriesPageClient initialArticles={initialArticles} initialCategories={initialCategories} initialTotalPages={initialTotalPages} initialTotalCount={initialTotalCount} />;
}
