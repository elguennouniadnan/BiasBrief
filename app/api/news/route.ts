import { NextResponse } from 'next/server';
import type { Article } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Extract query parameters
  const query = searchParams.get('q') || '';
  
  try {
    // Fetch data from The Guardian API
    const apiKey = process.env.GUARDIAN_API_KEY;
    let guardianApiUrl = 'https://content.guardianapis.com/search?';
    
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('api-key', apiKey || '');
    params.append('page-size', '200');
    params.append('show-fields', 'headline,trailText,thumbnail,publication');
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
      
      return {
        id,
        category: item.pillarName || 'Other', // Use pillarName for colors/badges
        section: item.sectionName, // Use sectionName for tabs
        titleUnbiased: item.fields?.headline || item.webTitle,
        titleBiased: `BREAKING: ${item.fields?.headline || item.webTitle}!`,
        content: item.webTitle,
        snippet: item.fields?.trailText || 'No snippet available',
        date: item.webPublicationDate,
        imageUrl: item.fields?.thumbnail || '/placeholder.svg',
        source: item.fields?.publication || 'The Guardian'
      };
    });

    // Extract unique sections (for tabs) from the response
    const uniqueSections = ['All', ...Array.from(new Set(articles.map(article => article.section)))];
    
    return NextResponse.json({
      articles,
      categories: uniqueSections, // This will be used for the tabs
      total: data.response.total,
      currentPage: data.response.currentPage,
      pages: data.response.pages
    });
    
  } catch (error) {
    console.error('Error fetching data from The Guardian API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}