import { NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Firebase configuration (same as api/news)
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

export async function GET() {
  try {
    // Fetch the document with id '0' from the 'section' collection (singular)
    const sectionDoc = await getDoc(doc(db, 'sections', '0'));

    if (!sectionDoc.exists()) {
      return NextResponse.json({ categories: [] });
    }
    const data = sectionDoc.data();
    
    return NextResponse.json({ categories: data.sectionNames || [] });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.error();
  }
}