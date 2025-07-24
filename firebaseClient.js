const admin = require("firebase-admin");

const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_ADMIN_PROJECT_ID,
  "private_key": process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;