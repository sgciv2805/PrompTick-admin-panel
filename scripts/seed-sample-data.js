const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('../service-account-key.json');
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedSampleData() {
  console.log('🌱 Seeding sample users and organizations...');

  try {
    // Create sample users
    const users = [
      {
        id: 'user_1',
        email: 'john.doe@example.com',
        displayName: 'John Doe',
        photoURL: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
        isIndividual: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      {
        id: 'user_2',
        email: 'jane.smith@example.com',
        displayName: 'Jane Smith',
        photoURL: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
        isIndividual: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      {
        id: 'user_3',
        email: 'bob.wilson@acme.com',
        displayName: 'Bob Wilson',
        photoURL: 'https://ui-avatars.com/api/?name=Bob+Wilson&background=random',
        isIndividual: false,
        organizationId: 'org_1',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      {
        id: 'user_4',
        email: 'alice.johnson@techcorp.com',
        displayName: 'Alice Johnson',
        photoURL: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=random',
        isIndividual: false,
        organizationId: 'org_2',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }
    ];

    // Create sample organizations
    const organizations = [
      {
        id: 'org_1',
        name: 'Acme Corporation',
        description: 'A leading technology company specializing in innovative solutions',
        ownerId: 'user_1',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      {
        id: 'org_2',
        name: 'TechCorp Industries',
        description: 'Global software development and consulting firm',
        ownerId: 'user_2',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }
    ];

    // Add users to Firestore
    for (const user of users) {
      await db.collection('users').doc(user.id).set(user);
      console.log(`✅ Created user: ${user.email}`);
    }

    // Add organizations to Firestore
    for (const org of organizations) {
      await db.collection('organizations').doc(org.id).set(org);
      console.log(`✅ Created organization: ${org.name}`);
    }

    // Add organization members
    const members = [
      {
        organizationId: 'org_1',
        userId: 'user_3',
        role: 'admin',
        joinedAt: FieldValue.serverTimestamp(),
        status: 'active'
      },
      {
        organizationId: 'org_2',
        userId: 'user_4',
        role: 'editor',
        joinedAt: FieldValue.serverTimestamp(),
        status: 'active'
      }
    ];

    for (const member of members) {
      await db.collection('organizations').doc(member.organizationId)
        .collection('members').doc(member.userId).set(member);
      console.log(`✅ Added member ${member.userId} to organization ${member.organizationId}`);
    }

    console.log('🎉 Sample data seeding completed successfully!');
    console.log(`📊 Created ${users.length} users and ${organizations.length} organizations`);

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    process.exit(1);
  }
}

// Run the seeding
seedSampleData().then(() => {
  console.log('✅ Seeding completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
}); 