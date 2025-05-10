import { NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '15', 10);
    const articlesCollection = collection(db, 'articles');

    // Get all docs to determine total count (for pagination UI)
    const allSnapshot = await getDocs(articlesCollection);
    const totalCount = allSnapshot.size;

    // Sort by date descending (default)
    let q = query(articlesCollection, orderBy('date', 'desc'), limit(pageSize));

    // For pages after the first, use startAfter
    if (page > 1) {
      // Find the last doc of the previous page
      const prevDocs = query(articlesCollection, orderBy('date', 'desc'), limit((page - 1) * pageSize));
      const prevSnapshot = await getDocs(prevDocs);
      const lastVisible = prevSnapshot.docs[prevSnapshot.docs.length - 1];
      if (lastVisible) {
        q = query(articlesCollection, orderBy('date', 'desc'), startAfter(lastVisible), limit(pageSize));
      }
    }

    const articlesSnapshot = await getDocs(q);
    const articles = articlesSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

    return NextResponse.json({ articles, totalCount });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.error();
  }
}