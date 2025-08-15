import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { UserProfile } from '@/types/firestoreSchema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const organizationId = searchParams.get('organizationId');
    const isIndividual = searchParams.get('isIndividual');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = adminDb.collection('users').orderBy('createdAt', 'desc');

    if (email) {
      query = query.where('email', '==', email);
    }
    if (organizationId) {
      query = query.where('organizationId', '==', organizationId);
    }
    if (isIndividual !== null) {
      query = query.where('isIndividual', '==', isIndividual === 'true');
    }

    const snapshot = await query.limit(limit).offset(offset).get();
    
    // Enrich with organization data
    const users = [];
    for (const doc of snapshot.docs) {
      const userData = doc.data() as UserProfile;
      
      // Get organization details if user belongs to one
      let organization = null;
      if (userData.organizationId) {
        const orgDoc = await adminDb.collection('organizations').doc(userData.organizationId).get();
        if (orgDoc.exists) {
          organization = { id: orgDoc.id, ...orgDoc.data() };
        }
      }

      // Get subscription details
      let subscription = null;
      if (userData.subscriptionId) {
        const subDoc = await adminDb.collection('userSubscriptions').doc(userData.subscriptionId).get();
        if (subDoc.exists) {
          subscription = { id: subDoc.id, ...subDoc.data() };
        }
      }

      users.push({
        id: doc.id,
        ...userData,
        organization,
        subscription
      });
    }

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch users'
    }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    

    const body = await request.json();
    const userData = body as Omit<UserProfile, 'createdAt'>;

    // Generate unique user ID
    const userId = `user_${Date.now()}`;

    const newUser: any = {
      ...userData,
      createdAt: FieldValue.serverTimestamp()
    };

    const docRef = adminDb.collection('users').doc(userId);
    await docRef.set(newUser);

    return NextResponse.json({
      success: true,
      data: { id: userId, ...newUser },
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create user'
    }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const docRef = adminDb.collection('users').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    await docRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp()
    });

    const updatedDoc = await docRef.get();
    
    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
      message: 'User updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update user'
    }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const docRef = adminDb.collection('users').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete user'
    }, { status: 500 });
  }
} 