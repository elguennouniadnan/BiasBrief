import { headers } from "next/headers";

async function getBaseUrl() {
  const headersList = await headers();
  // headers() returns a Promise<ReadonlyHeaders> in some Next.js versions
  const host = headersList.get("host");
  const protocol = process.env.VERCEL_URL || process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}



export default function ListPage() {
  return <div>List page is under construction. Please create app/list-page/ListPageClient.tsx if you want to use this page.</div>;
}
