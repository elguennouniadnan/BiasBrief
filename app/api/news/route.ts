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
    const preferredCategoriesParam = searchParams.get('preferredCategories');
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';
    let preferredCategories: string[] = [];
    if (preferredCategoriesParam) {
      preferredCategories = preferredCategoriesParam.split(',').map((c) => c.trim()).filter(Boolean);
    }
    const sortOrder = sortOrderParam === 'new-to-old' ? 'desc' : 'asc';
    const articlesCollection = collection(db, 'articles');

    // If allCategories=1, return all unique categories (sections) in the collection
    if (searchParams.get('allCategories') === '1') {
      const allSnapshot = await getDocs(articlesCollection);
      const allSections = Array.from(new Set(allSnapshot.docs.map(doc => doc.data().section).filter(Boolean)));
      return NextResponse.json({ categories: allSections });
    }

    // Handle fetching articles by array of IDs
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean);
      let articles: any[] = [];
      // Firestore 'in' query only supports up to 10 values, so batch if needed
      for (let i = 0; i < ids.length; i += 10) {
        const batch = ids.slice(i, i + 10);
        const q = query(articlesCollection, where('__name__', 'in', batch));
        const snap = await getDocs(q);
        articles = articles.concat(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
      }
      // Optionally sort by the order of ids
      articles.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      return NextResponse.json({ articles, totalCount: articles.length });
    }

    let totalCount = 0;
    let articles: any[] = [];
    // Fetch all articles for search if searchQuery is present
    if (searchQuery) {
      // Fetch up to 1000 most recent articles
      const allSnapshot = await getDocs(query(articlesCollection, orderBy('rawDate', 'desc'), limit(1000)));
      let allDocs = allSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      // In-memory filter for search
      allDocs = allDocs.filter(article => {
        const fields = [article.title, article.snippet, article.body].join(' ').toLowerCase();
        return fields.includes(searchQuery);
      });
      totalCount = allDocs.length;
      articles = allDocs.slice((page - 1) * pageSize, page * pageSize);
      return NextResponse.json({ articles, totalCount });
    }

    if (preferredCategories.length > 0) {
      // If a specific category is selected, allow any category (not just preferred)
      if (category && category !== 'All') {
        // Only query for the selected category
        const q = query(
          articlesCollection,
          where('category', '==', category),
          orderBy('rawDate', sortOrder)
        );
        const snap = await getDocs(q);
        let allDocs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        allDocs.sort((a, b) => {
          const dateA = new Date(a.rawDate).getTime();
          const dateB = new Date(b.rawDate).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        const articles = allDocs.slice((page - 1) * pageSize, page * pageSize);
        return NextResponse.json({ articles, totalCount: allDocs.length });
      }

      // Firestore 'in' query only supports up to 10 values, so batch if needed
      const batches = [];
      for (let i = 0; i < preferredCategories.length; i += 10) {
        const batch = preferredCategories.slice(i, i + 10);
        batches.push(batch);
      }
      let allDocs: any[] = [];
      for (const batch of batches) {
        const q = query(
          articlesCollection,
          where('category', 'in', batch),
          orderBy('rawDate', sortOrder)
        );
        const snap = await getDocs(q);
        allDocs = allDocs.concat(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
      }
      // Sort and paginate manually
      allDocs.sort((a, b) => {
        const dateA = new Date(a.rawDate).getTime();
        const dateB = new Date(b.rawDate).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
      articles = allDocs.slice((page - 1) * pageSize, page * pageSize);
      totalCount = allDocs.length;
    } else {
      // Count only articles in the selected category or all articles
      if (category && category !== 'All') {
        const categorySnapshot = await getDocs(query(articlesCollection, where('category', '==', category)));
        totalCount = categorySnapshot.size;
      } else {
        const allSnapshot = await getDocs(articlesCollection);
        totalCount = allSnapshot.size;
      }

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
      articles = articlesSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    }

    return NextResponse.json({ articles, totalCount });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.error();
  }
}