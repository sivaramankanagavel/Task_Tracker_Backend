const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/appError");
const admin = require("../firebaseConfig"); // <--- CHANGED THIS LINE

class AuthService {
  async emailLogin(email, password) {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      const customToken = await admin.auth().createCustomToken(userRecord.uid);
      const firebaseUser = {
        email: userRecord.email,
        displayName: userRecord.displayName || userRecord.email,
        photoURL: userRecord.photoURL || "",
        emailVerified: userRecord.emailVerified,
      };
      return await this.generateUserToken(firebaseUser);
    } catch (error) {
      throw new AppError("Authentication failed: " + error.message, 401);
    }
  }

  async googleLogin(idToken) {
    try {
      // This line now uses the 'admin' instance initialized by firebaseConfig.js
      const decodedToken = await admin.auth().verifyIdToken(idToken); 

      const firebaseUser = {
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email,
        photoURL: decodedToken.picture || "",
        emailVerified: decodedToken.email_verified,
      };
      return await this.generateUserToken(firebaseUser);
    } catch (error) {
      throw new AppError("Google authentication failed: " + error.message, 401);
    }
  }

  async verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new AppError("Invalid token", 401);
    }
  }

  async generateUserToken(firebaseUser) {
    try {
      let user = await User.findOne({ email: firebaseUser.email });

      if (!user) {
        user = await User.create({
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
          profilePicture: firebaseUser.photoURL || "",
          emailVerified: firebaseUser.emailVerified,
          role: "USER",
        });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      throw new AppError("Failed to generate user token: " + error.message, 500);
    }
  }
}

module.exports = new AuthService();
