import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';

// Firebase config (should match /lib/firebase and other API routes)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const sectionMap: Record<string, string> = {
  "All": "all",
  "World news": "world",
  "US news": "us-news",
  "Sport": "sport",
  "Football": "football",
  "Music": "music",
  "UK news": "uk-news",
  "Society": "society",
  "Television & radio": "tv-and-radio",
  "Film": "film",
  "Business": "business",
  "Opinion": "commentisfree",
  "Education": "education",
  "Books": "books",
  "Art and design": "artanddesign",
  "Environment": "environment",
  "Politics": "politics",
  "Stage": "stage",
  "Technology": "technology",
  "Australia news": "australia-news",
  "Life and style": "lifeandstyle",
  "Food": "food",
  "Culture": "culture",
  "Science": "science",
  "Travel": "travel",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sectionName = searchParams.get('section');
  if (!sectionName || !(sectionName in sectionMap)) {
    return NextResponse.json({ error: 'Invalid or missing section parameter' }, { status: 400 });
  }
  const sectionId = sectionMap[sectionName];
  try {
    const docRef = doc(db, 'front-page-articles', sectionId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }
    const data = docSnap.data();
    // Expecting the document to have an 'articles' array
    return NextResponse.json({ articles: data?.articles || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles', details: (error as Error).message }, { status: 500 });
  }
}
