import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Parse the service account key from environment variable with improved error handling
let serviceAccountKey = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Handle both single-line and multi-line JSON strings
    let keyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    
    // Remove surrounding quotes if present
    if ((keyString.startsWith('"') && keyString.endsWith('"')) ||
        (keyString.startsWith("'") && keyString.endsWith("'"))) {
      keyString = keyString.slice(1, -1);
    }
    
    // Clean up escape sequences if present
    keyString = keyString.replace(/\\"/g, '"').replace(/\\'/g, "'");
    
    serviceAccountKey = JSON.parse(keyString);
    console.log('[Firebase Admin] Service account key parsed successfully');
  } else {
    console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY not found in environment');
  }
} catch (error) {
  console.error('[Firebase Admin] Error parsing service account key:', (error as Error).message);
  console.error('[Firebase Admin] First 100 characters of key:', 
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.substring(0, 100));
  
  // Fallback: try alternative environment variable names
  try {
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('[Firebase Admin] Trying alternative environment variables...');
      serviceAccountKey = {
        type: 'service_account',
        project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
      console.log('[Firebase Admin] Service account key created from individual variables');
    }
  } catch (fallbackError) {
    console.error('[Firebase Admin] Fallback parsing also failed:', (fallbackError as Error).message);
  }
}

const firebaseAdminConfig = {
  credential: serviceAccountKey ? cert(serviceAccountKey) : undefined,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Initialize Firebase Admin (singleton pattern)
let app: App;
try {
  app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
  console.log('[Firebase Admin] App initialized successfully');
} catch (error) {
  console.error('[Firebase Admin] Error initializing app:', (error as Error).message);
  throw new Error(`Firebase Admin initialization failed: ${(error as Error).message}`);
}

// Get Firestore instance
export const adminDb = getFirestore(app);
export const db = adminDb; // Alias for compatibility

// Helper function to get Firebase Admin services
export function getFirebaseAdmin() {
  return { 
    app, 
    db: adminDb, 
    adminDb,
    Timestamp
  };
}

export default app;