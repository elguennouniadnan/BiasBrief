import type React from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'BiasBrief - Understand Media Bias',
  description: 'Compare biased and unbiased versions of news articles to better understand media bias.',
  generator: 'BiasBrief'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="container mx-auto px-2 sm:px-2 lg:px-2 max-w-7xl">
            {children}
          </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
