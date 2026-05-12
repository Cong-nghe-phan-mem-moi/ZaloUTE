/**
 * JWT Token Generator cho Postman Testing
 * Tự động lấy user thực từ DB hoặc dùng ID tùy chỉnh
 * 
 * Usage: 
 *   node generate-token.js              (lấy user đầu tiên từ DB)
 *   node generate-token.js <userId>     (tạo token cho user ID cụ thể)
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Account = require('./src/models/account.model');

// Default JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Generate token
function generateToken(userId, accountId, email, role = 'user') {
  const payload = {
    id: accountId,
    userId: userId,
    email: email,
    role: role,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
  });

  return token;
}

// Verify token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

// Main
async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zaloute');
    console.log('✅ Connected to MongoDB\n');

    const userIdFromArgs = process.argv[2];

    let user;

    // Debug: Check collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📌 Available collections:', collections.map(c => c.name).join(', '));
    console.log('');

    if (userIdFromArgs) {
      // Lấy user theo ID từ argument
      user = await User.findById(userIdFromArgs).populate('account');
      if (!user) {
        console.error('❌ User not found with ID:', userIdFromArgs);
        process.exit(1);
      }
    } else {
      // Lấy user đầu tiên từ DB - query trực tiếp (bypass validation)
      const usersCollection = db.collection('users');
      const rawUser = await usersCollection.findOne();

      if (!rawUser) {
        console.error('❌ No users found in database. Please insert a test user first.');
        process.exit(1);
      }

      // Convert raw user to Mongoose document with account populated
      user = await User.findById(rawUser._id).populate('account');
      if (!user) {
        console.error('❌ User found but could not be loaded by Mongoose. Check schema validation.');
        console.log('Raw user:', rawUser);
        process.exit(1);
      }
    }

    console.log('='.repeat(70));
    console.log('JWT Token Generator - ZaloUTE API Testing');
    console.log('='.repeat(70));
    console.log('');

    console.log('📌 User Found in Database:');
    console.log('-'.repeat(70));
    console.log('User ID:', user._id);
    console.log('Name:', user.fullName);
    console.log('Email:', user.account.email);
    console.log('Account ID:', user.account._id);
    console.log('Role:', user.account.role);
    console.log('');

    console.log('📌 Generated Token:');
    console.log('-'.repeat(70));
    const token = generateToken(user._id.toString(), user.account._id.toString(), user.account.email, user.account.role);
    console.log('Token:', token);
    console.log('');
    console.log('Decoded:', verifyToken(token));
    console.log('');

    console.log('='.repeat(70));
    console.log('💡 How to use in Postman:');
    console.log('='.repeat(70));
    console.log('1. Copy the token above');
    console.log('2. Go to Postman → Environments');
    console.log('3. Select "ZaloUTE-Dev" environment');
    console.log('4. Set jwt_token = <paste token>');
    console.log('5. Click Save');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
