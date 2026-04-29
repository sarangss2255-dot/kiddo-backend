import admin from 'firebase-admin';
import { env } from './env.js';

if (admin.apps.length === 0) {
  if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
  } else {
    admin.initializeApp();
  }
}

export const firebaseAdmin = admin;
export const firebaseAuth = admin.auth();
