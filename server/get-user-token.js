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

    // Find user with role 'user' (not admin)
    const user = await User.findOne({ email: 'user@example.com' }).populate('account');

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    const token = generateToken(user._id.toString(), user.account._id.toString(), user.email, user.account.role);

    console.log('JWT Token:', token);
    console.log('account_id (id):', user.account._id.toString());
    console.log('user_id (userId):', user._id.toString());
    console.log('role:', user.account.role);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
