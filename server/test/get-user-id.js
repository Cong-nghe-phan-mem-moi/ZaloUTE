const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../src/models/user.model');

async function getFirstUser() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined in .env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({});
    if (user) {
      console.log('FOUND_USER_ID:' + user._id);
    } else {
      console.log('NO_USER_FOUND');
    }
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getFirstUser();
