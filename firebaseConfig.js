const admin = require('firebase-admin');

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey ? privateKey.replace(/\\n/g, '\n') : undefined
      }),
      databaseURL: `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    process.exit(1);
  }
}

module.exports = admin;