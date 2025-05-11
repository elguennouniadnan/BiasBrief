import { NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const articleRef = doc(db, 'articles', params.id);
    const articleSnap = await getDoc(articleRef);
    if (!articleSnap.exists()) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    // Merge doc data with id and ensure all Article fields are present
    const data = articleSnap.data() as Partial<Article> | undefined;
    console.log('Fetched article data:', data);
    const article: Article = {
      id: Number(params.id),
      date: data?.date ?? '',
      imageUrl: data?.imageUrl ?? '',
      source: data?.source ?? '',
      section: data?.section ?? '',
      category: data?.category ?? '',
      imageHtml: data?.imageHtml ?? 'false',
      titleBiased: data?.titleBiased ?? '',
      titleUnbiased: data?.titleUnbiased ?? '',
      snippet: data?.snippet ?? '',
      body: data?.body ?? '',
    };
    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}
