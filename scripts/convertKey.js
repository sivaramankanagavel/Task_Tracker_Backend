// scripts/convertKey.js
const fs = require('fs');

const serviceAccount = require('../serviceAccount.json');

const escapedKey = serviceAccount.private_key.replace(/\n/g, '\\n');

console.log(`FIREBASE_ADMIN_PRIVATE_KEY="${escapedKey}"`);