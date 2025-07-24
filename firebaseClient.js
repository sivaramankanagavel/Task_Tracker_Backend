// firebaseClient.js
const admin = require("firebase-admin");

// --- CRUCIAL CHANGE: IMPORT YOUR CENTRALIZED ENVIRONMENT CONFIGURATION ---
const config = require('./env'); // Adjust this path if 'env.js' is not in the same directory as firebaseClient.js.
                                // For example, if firebaseClient.js is in a 'services/' folder and env.js is in the root, use '../env'

// The 'serviceAccount' object should now use values from the 'config' object.
// The private key (config.firebaseAdminPrivateKey) is ALREADY processed by env.js,
// so you do NOT need .replace(/\\n/g, '\n') here.
const serviceAccount = {
  "type": "service_account",
  "project_id": config.firebaseAdminProjectId,    // <-- Use config.firebaseAdminProjectId
  "private_key": config.firebaseAdminPrivateKey, // <-- Use config.firebaseAdminPrivateKey (already processed)
  "client_email": config.firebaseAdminClientEmail, // <-- Use config.firebaseAdminClientEmail
};

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;