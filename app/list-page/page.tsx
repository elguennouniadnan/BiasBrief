import { headers } from "next/headers";

async function getBaseUrl() {
  const headersList = await headers();
  // headers() returns a Promise<ReadonlyHeaders> in some Next.js versions
  const host = headersList.get("host");
  const protocol = process.env.VERCEL_URL || process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

async function fetchArticles() {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/news`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.articles || [];
}

async function fetchCategories() {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/sections`, { cache: "no-store" });
  if (!res.ok) return ["All"];
  const data = await res.json();
  return ["All", ...(data.categories?.filter((c: string) => c && c !== "All") || [])];
}

export default function ListPage() {
  return <div>List page is under construction. Please create app/list-page/ListPageClient.tsx if you want to use this page.</div>;
}
