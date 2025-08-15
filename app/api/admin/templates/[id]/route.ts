import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Initialize Firebase (you'll need to adjust this based on your config)
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateRef = doc(db, 'promptTemplates', id);
    const templateSnap = await getDoc(templateRef);
    
    if (!templateSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    const template = {
      id: templateSnap.id,
      ...templateSnap.data()
    };

    return NextResponse.json({ 
      success: true,
      template 
    });
    
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const updates = await request.json();
    
    if (!updates) {
      return NextResponse.json(
        { success: false, error: 'Update data is required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const templateRef = doc(db, 'promptTemplates', id);
    
    // Transform updates to use .value pattern
    const formattedUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (key !== 'id') {
        formattedUpdates[key] = { value: updates[key] };
      }
    });
    
    // Always update lastUpdated
    formattedUpdates.lastUpdated = { value: new Date().toISOString() };
    
    await updateDoc(templateRef, formattedUpdates);

    return NextResponse.json({ 
      success: true,
      message: 'Template updated successfully'
    });
    
  } catch (error) {
    console.error('Failed to update template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateRef = doc(db, 'promptTemplates', id);
    
    // Check if template exists
    const templateSnap = await getDoc(templateRef);
    if (!templateSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }
    
    await deleteDoc(templateRef);

    return NextResponse.json({ 
      success: true,
      message: 'Template deleted successfully'
    });
    
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}