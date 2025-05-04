import { NextResponse } from 'next/server';
import type { Article } from '@/lib/types';

// Helper function to extract image URL from HTML string
function extractImageUrl(htmlString: string): string | null {
  try {
    const match = htmlString.match(/src="([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Extract query parameters
  const query = searchParams.get('q') || '';
  
  try {
    // Fetch data from The Guardian API
    const apiKey = process.env.GUARDIAN_API_KEY;
    
    if (!apiKey) {
      console.error('GUARDIAN_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    let guardianApiUrl = 'https://content.guardianapis.com/search?';
    
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('api-key', apiKey);
    params.append('page-size', '200');
    params.append('show-fields', 'headline,trailText,body,thumbnail,main,bodyImage,publication,lastModified');
    params.append('order-by', 'newest');
    params.append('show-references', 'all');
    
    // Add search query if provided
    if (query) {
      params.append('q', query);
    }
    
    guardianApiUrl += params.toString();
    
    const response = await fetch(guardianApiUrl);
    const data = await response.json();
    
    // Transform the data to match our Article type
    const articles: Article[] = data.response.results.map((item: any, index: number) => {
      // Generate a unique ID by combining the current timestamp and index
      const timestamp = Date.now();
      const id = parseInt(`${Math.floor(timestamp / 1000)}${index.toString().padStart(3, '0')}`);
      
      // Extract image URL from HTML content if available, or fallback to thumbnail
      const mainImageUrl = item.fields?.main ? extractImageUrl(item.fields.main) : null;
      const bodyImageUrl = item.fields?.bodyImage ? extractImageUrl(item.fields.bodyImage) : null;
      const imageUrl = mainImageUrl || bodyImageUrl || item.fields?.thumbnail || '/placeholder.svg';
      
      return {
        id,
        category: item.pillarName || 'Other', // Use pillarName for colors/badges
        section: item.sectionName, // Use sectionName for tabs
        titleUnbiased: item.fields?.headline || item.webTitle,
        titleBiased: `BREAKING: ${item.fields?.headline || item.webTitle}!`,
        content: item.webTitle,
        snippet: item.fields?.trailText || 'No snippet available',
        date: item.webPublicationDate,
        imageUrl,
        source: item.fields?.publication || 'The Guardian',
        body: item.fields?.body,
        references: item.references || [],
        tags: item.tags || [],
        webUrl: item.webUrl,
        isBookmarked: false // Default to false, can be updated later
      };
    });

    // Extract unique sections (for tabs) from the response
    const uniqueSections = ['All', ...Array.from(new Set(articles.map(article => article.section)))];
    
    const responseData = {
      articles,
      categories: uniqueSections,
      total: data.response.total,
      currentPage: data.response.currentPage,
      pages: data.response.pages
    };

    console.log('Transformed API Response:', {
      articlesCount: articles.length,
      categories: uniqueSections,
      total: data.response.total,
      currentPage: data.response.currentPage,
      pages: data.response.pages
    });
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error fetching data from The Guardian API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}