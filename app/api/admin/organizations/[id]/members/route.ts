import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { OrganizationMember } from '@/types/firestoreSchema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - List organization members
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    let query: any = adminDb.collection('organizations').doc(id).collection('members');

    if (role) {
      query = query.where('role', '==', role);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    
    // Enrich with user data
    const members = [];
    for (const doc of snapshot.docs) {
      const memberData = doc.data() as OrganizationMember;
      
      // Get user details
      let user = null;
      const userDoc = await adminDb.collection('users').doc(doc.id).get();
      if (userDoc.exists) {
        user = { id: userDoc.id, ...userDoc.data() };
      }

      members.push({
        id: doc.id,
        ...memberData,
        user
      });
    }

    return NextResponse.json({
      success: true,
      data: members,
      count: members.length
    });

  } catch (error: any) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch organization members'
    }, { status: 500 });
  }
}

// POST - Add member to organization
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { userId, role = 'viewer', invited = false } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Check if user exists
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await adminDb.collection('organizations').doc(id).collection('members').doc(userId).get();
    if (existingMember.exists) {
      return NextResponse.json({
        success: false,
        error: 'User is already a member of this organization'
      }, { status: 400 });
    }

    const memberData: OrganizationMember = {
      role: role as 'admin' | 'editor' | 'viewer',
      joinedAt: FieldValue.serverTimestamp() as any,
      invited,
      status: invited ? 'invited' : 'active'
    };

    await adminDb.collection('organizations').doc(id).collection('members').doc(userId).set(memberData);

    return NextResponse.json({
      success: true,
      message: 'Member added successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error adding organization member:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to add organization member'
    }, { status: 500 });
  }
}

// PUT - Update member role
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { userId, role, status } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const memberRef = adminDb.collection('organizations').doc(id).collection('members').doc(userId);
    const memberDoc = await memberRef.get();

    if (!memberDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Member not found'
      }, { status: 404 });
    }

    const updates: Partial<OrganizationMember> = {};
    if (role) updates.role = role as 'admin' | 'editor' | 'viewer';
    if (status) updates.status = status as 'active' | 'invited' | 'removed';

    await memberRef.update(updates);

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating organization member:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update organization member'
    }, { status: 500 });
  }
}

// DELETE - Remove member from organization
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const memberRef = adminDb.collection('organizations').doc(id).collection('members').doc(userId);
    const memberDoc = await memberRef.get();

    if (!memberDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Member not found'
      }, { status: 404 });
    }

    await memberRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error: any) {
    console.error('Error removing organization member:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to remove organization member'
    }, { status: 500 });
  }
} 