import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Organization } from '@/types/firestoreSchema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - List all organizations
export async function GET(request: NextRequest) {
  try {
    

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const ownerId = searchParams.get('ownerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = adminDb.collection('organizations').orderBy('createdAt', 'desc');

    if (name) {
      query = query.where('name', '==', name);
    }
    if (ownerId) {
      query = query.where('ownerId', '==', ownerId);
    }

    const snapshot = await query.limit(limit).offset(offset).get();
    
    // Enrich with owner and subscription data
    const organizations = [];
    for (const doc of snapshot.docs) {
      const orgData = doc.data() as Organization;
      
      // Get owner details
      let owner = null;
      if (orgData.ownerId) {
        const ownerDoc = await adminDb.collection('users').doc(orgData.ownerId).get();
        if (ownerDoc.exists) {
          owner = { id: ownerDoc.id, ...ownerDoc.data() };
        }
      }

      // Get subscription details
      let subscription = null;
      if (orgData.subscriptionId) {
        const subDoc = await adminDb.collection('organizationSubscriptions').doc(orgData.subscriptionId).get();
        if (subDoc.exists) {
          subscription = { id: subDoc.id, ...subDoc.data() };
        }
      }

      // Get member count
      const membersSnapshot = await adminDb.collection('organizations').doc(doc.id).collection('members').get();
      const memberCount = membersSnapshot.size;

      organizations.push({
        id: doc.id,
        ...orgData,
        owner,
        subscription,
        memberCount
      });
    }

    return NextResponse.json({
      success: true,
      data: organizations,
      count: organizations.length
    });

  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch organizations'
    }, { status: 500 });
  }
}

// POST - Create new organization
export async function POST(request: NextRequest) {
  try {
    

    const body = await request.json();
    const orgData = body as Omit<Organization, 'createdAt'>;

    // Generate unique organization ID
    const orgId = `org_${Date.now()}`;

    const newOrg: any = {
      ...orgData,
      createdAt: FieldValue.serverTimestamp()
    };

    const docRef = adminDb.collection('organizations').doc(orgId);
    await docRef.set(newOrg);

    return NextResponse.json({
      success: true,
      data: { id: orgId, ...newOrg },
      message: 'Organization created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating organization:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create organization'
    }, { status: 500 });
  }
}

// PUT - Update organization
export async function PUT(request: NextRequest) {
  try {
    

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 });
    }

    const docRef = adminDb.collection('organizations').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Organization not found'
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
      message: 'Organization updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating organization:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update organization'
    }, { status: 500 });
  }
}

// DELETE - Delete organization
export async function DELETE(request: NextRequest) {
  try {
    

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');

    if (!orgId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 });
    }

    const docRef = adminDb.collection('organizations').doc(orgId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Organization not found'
      }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete organization'
    }, { status: 500 });
  }
} 