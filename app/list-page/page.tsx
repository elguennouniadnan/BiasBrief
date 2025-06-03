import ListPageClient from "./ListPageClient";
import { cookies } from "next/headers";

async function fetchArticles() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/news`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.articles || [];
}

async function fetchCategories() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/sections`, { cache: "no-store" });
  if (!res.ok) return ["All"];
  const data = await res.json();
  return ["All", ...(data.categories?.filter((c: string) => c && c !== "All") || [])];
}

export default async function Page() {
  const [initialArticles, initialCategories] = await Promise.all([
    fetchArticles(),
    fetchCategories(),
  ]);
  return <ListPageClient initialArticles={initialArticles} initialCategories={initialCategories} />;
}
