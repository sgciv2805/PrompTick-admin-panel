import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldPath } from 'firebase-admin/firestore';

function isCollectionPath(path: string): boolean {
  const segments = path.split('/').filter(Boolean);
  return segments.length % 2 === 1;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const collectionPath: string = (body.collectionPath || '').trim();
    const fieldsRaw: unknown = body.fields;
    const limit: number = Math.max(1, Math.min(parseInt(String(body.limit ?? '100'), 10), 500));
    const startAfterId: string = (body.startAfterId || '').trim();

    if (!collectionPath) {
      return NextResponse.json({ success: false, error: 'collectionPath is required' }, { status: 400 });
    }
    if (!isCollectionPath(collectionPath)) {
      return NextResponse.json({
        success: false,
        error: `Path "${collectionPath}" looks like a document path. Provide a collection path (odd number of segments).`,
      }, { status: 400 });
    }

    const fields: string[] = Array.isArray(fieldsRaw)
      ? (fieldsRaw as any[]).map((f) => String(f).trim()).filter(Boolean)
      : String(fieldsRaw || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: 'fields must be a non-empty list' }, { status: 400 });
    }

    let query = adminDb.collection(collectionPath).limit(limit);
    // Build field paths for select
    const fieldPaths: (string | FieldPath)[] = fields.map((f) => {
      // Allow dot-notation and quoted keys already
      return f;
    });
    query = query.select(...fieldPaths);

    if (startAfterId) {
      const cursorDoc = await adminDb.collection(collectionPath).doc(startAfterId).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      success: true,
      data: {
        path: collectionPath,
        fields,
        entries,
        page: { size: entries.length },
      },
    });
  } catch (error: any) {
    console.error('Firestore collection-select error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch selected fields' }, { status: 500 });
  }
}


