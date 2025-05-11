import { NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '15', 10);
    const sortOrderParam = searchParams.get('sortOrder');
    const category = searchParams.get('category');
    const sortOrder = sortOrderParam === 'new-to-old' ? 'desc' : 'asc';
    const articlesCollection = collection(db, 'articles');


    let totalCount = 0;
    if (category && category !== 'All') {
      // Count only articles in the selected category
      const categorySnapshot = await getDocs(query(articlesCollection, where('category', '==', category)));
      totalCount = categorySnapshot.size;
    } else {
      // Count all articles
      const allSnapshot = await getDocs(articlesCollection);
      totalCount = allSnapshot.size;
    }

    // Build Firestore query with optional category filter
    let q;
    if (category && category !== 'All') {
      q = query(
        articlesCollection,
        where('category', '==', category),
        orderBy('rawDate', sortOrder),
        limit(pageSize)
      );
    } else {
      q = query(
        articlesCollection,
        orderBy('rawDate', sortOrder),
        limit(pageSize)
      );
    }

    // For pages after the first, use startAfter
    if (page > 1) {
      let prevDocs;
      if (category && category !== 'All') {
        prevDocs = query(
          articlesCollection,
          where('category', '==', category),
          orderBy('rawDate', sortOrder),
          limit((page - 1) * pageSize)
        );
      } else {
        prevDocs = query(
          articlesCollection,
          orderBy('rawDate', sortOrder),
          limit((page - 1) * pageSize)
        );
      }
      const prevSnapshot = await getDocs(prevDocs);
      const lastVisible = prevSnapshot.docs[prevSnapshot.docs.length - 1];
      if (lastVisible) {
        if (category && category !== 'All') {
          q = query(
            articlesCollection,
            where('category', '==', category),
            orderBy('rawDate', sortOrder),
            startAfter(lastVisible),
            limit(pageSize)
          );
        } else {
          q = query(
            articlesCollection,
            orderBy('rawDate', sortOrder),
            startAfter(lastVisible),
            limit(pageSize)
          );
        }
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