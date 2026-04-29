import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

function initializeFirebase() {
  if (admin.apps.length > 0) return;

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized with service account key');
    } else {
      // Attempt to initialize with default credentials (standard for Cloud Run/Google Cloud)
      admin.initializeApp();
      console.log('Firebase Admin initialized with default credentials');
    }
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    // We don't throw here to allow the server to start, 
    // but subsequent Firestore/Auth calls will fail if initialization actually failed.
  }
}

initializeFirebase();

// Use getters to avoid immediate "No App" errors if initialization failed
export const db = admin.apps.length > 0 ? admin.firestore() : null as unknown as admin.firestore.Firestore;
export const auth = admin.apps.length > 0 ? admin.auth() : null as unknown as admin.auth.Auth;
export default admin;
