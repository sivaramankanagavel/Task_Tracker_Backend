const admin = require('firebase-admin');

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

// Only initialize Firebase Admin if not in a test environment
if (process.env.NODE_ENV !== 'test') { // <--- ADDED THIS CONDITIONAL CHECK
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
      // In a real application, you might want to handle this more gracefully
      // For now, we'll exit to indicate a critical setup failure outside of tests.
      process.exit(1);
    }
  }
} else {
  // Log for clarity in test environment, this block will be executed
  console.log('Firebase Admin initialization skipped in test environment.');
}

module.exports = admin;
