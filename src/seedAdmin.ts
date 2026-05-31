import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { firebaseAdmin, firebaseAuth } from './config/firebase-admin.js';
import { connectDatabase } from './config/database.js';
import { ROLES } from './constants/roles.js';
import { User } from './models/user.model.js';

dotenv.config();

const adminEmail = (process.env.ADMIN_EMAIL || 'sarangblazicon@gmail.com').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

async function seedAdmin() {
  try {
    await connectDatabase();

    let userRecord;
    try {
      userRecord = await firebaseAuth.getUserByEmail(adminEmail);
      console.log('Firebase admin user already exists:', adminEmail);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }

      userRecord = await firebaseAuth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: 'Admin',
      });
      console.log('Firebase admin user created:', adminEmail);
    }

    await firebaseAuth.setCustomUserClaims(userRecord.uid, { role: ROLES.ADMIN });

    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          role: ROLES.ADMIN,
          email: adminEmail,
          firebaseUid: userRecord.uid,
          firstName: 'Admin',
          lastName: '',
          avatar: 'admin',
          familyId: null,
          isActive: true,
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    );

    try {
      await firebaseAdmin.firestore().collection('users').doc(userRecord.uid).set(
        {
          familyId: null,
          role: ROLES.ADMIN,
          email: adminEmail,
          points: 0,
          streak: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          avatar: 'admin',
        },
        { merge: true },
      );
    } catch (error) {
      console.warn('Firestore admin mirror skipped:', error);
    }

    console.log('Admin user seeded:', adminEmail);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
