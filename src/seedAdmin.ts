import { firebaseAdmin, firebaseAuth } from './config/firebase-admin';
import dotenv from 'dotenv';

// Load environment variables from .env if available
dotenv.config();

const adminEmail = process.env.ADMIN_EMAIL || 'sarang@kiddoapp.in';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

async function seedAdmin() {
  try {
    const userRecord = await firebaseAuth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: 'Admin',
    });

    await firebaseAuth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

    const db = firebaseAdmin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      familyId: null,
      role: 'admin',
      email: adminEmail,
      points: 0,
      streak: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatar: 'admin',
    });

    console.log('✅ Admin user created:', adminEmail);
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️ Admin user already exists:', adminEmail);
    } else {
      console.error('❌ Error creating admin:', error);
    }
  }
}

seedAdmin();