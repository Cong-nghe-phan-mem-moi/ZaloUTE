const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');
const Account = require('./src/models/account.model');
const User = require('./src/models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

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

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zaloute');

    // Find account by email, then use the linked user for the token payload.
    const account = await Account.findOne({ email: 'user@example.com' }).populate('user');

    if (!account || !account.user) {
      console.error('User not found');
      process.exit(1);
    }

    const user = account.user;
    const token = generateToken(user._id.toString(), account._id.toString(), account.email, account.role);

    console.log('JWT Token:', token);
    console.log('account_id (id):', account._id.toString());
    console.log('user_id (userId):', user._id.toString());
    console.log('role:', account.role);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
