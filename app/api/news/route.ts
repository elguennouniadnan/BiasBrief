import { NextResponse } from 'next/server';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import type { Article } from '@/lib/types';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Debug log for Firebase configuration
console.log('Firebase Config:', {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET(request: Request) {
  try {
    const articlesCollection = collection(db, 'articles');
    const articlesSnapshot = await getDocs(articlesCollection);
    let articles = articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Limit to 170 most recent articles for Safari
    const userAgent = request.headers.get('user-agent') || '';
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
    if (isSafari) {
      articles = articles.slice(0, 170);
    } else {
      articles = articles.slice(0, 200);
    }

    console.log('Categories from articles:', articles.map(article => article.section || 'Uncategorized'));

    // Extract unique sections (categories) from the articles
    const uniqueSections = ['All', ...Array.from(new Set(articles.map(article => article.section)))]

    const responseData = {
      articles,
      categories: uniqueSections,
      total: articles.length,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}