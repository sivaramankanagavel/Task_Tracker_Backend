const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ['ADMIN', 'TASK_CREATOR', 'READ_ONLY_USER', 'USER'],
    default: 'USER'
  },
  emailVerified: { type: Boolean, default: false },
  oauthProviderId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;