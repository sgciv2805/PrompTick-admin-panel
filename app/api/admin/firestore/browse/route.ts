import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') || 'root') as 'root' | 'collection' | 'document';
    const path = (searchParams.get('path') || '').trim();
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '50', 10), 500));
    const startAfterId = (searchParams.get('startAfter') || '').trim();

    if (mode === 'root') {
      const cols = await adminDb.listCollections();
      const entries = cols.map((c) => ({ type: 'collection', id: c.id, name: c.id, path: c.path }));
      return NextResponse.json({ success: true, data: { entries } });
    }

    if (!path) {
      return NextResponse.json({ success: false, error: 'path is required for non-root mode' }, { status: 400 });
    }

    if (mode === 'collection') {
      let query = adminDb.collection(path).limit(limit);
      if (startAfterId) {
        // Fetch the document to use as a cursor
        const cursorDoc = await adminDb.collection(path).doc(startAfterId).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }
      const snap = await query.get();
      const entries = snap.docs.map((d) => ({ type: 'document', id: d.id, name: d.id, path: `${path}/${d.id}` }));
      return NextResponse.json({ success: true, data: { entries, page: { size: entries.length } } });
    }

    if (mode === 'document') {
      const docRef = adminDb.doc(path);
      const subcols = await docRef.listCollections();
      const entries = subcols.map((c) => ({ type: 'collection', id: c.id, name: c.id, path: c.path }));
      return NextResponse.json({ success: true, data: { entries } });
    }

    return NextResponse.json({ success: false, error: 'Invalid mode' }, { status: 400 });
  } catch (error: any) {
    console.error('Firestore browse error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to browse' }, { status: 500 });
  }
}


