require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Account = require('./src/models/Account');
const connectDB = require('./src/config/database');

const seedData = async () => {
  await connectDB();
  
  try {
    // Clear existing data
    await User.deleteMany({});
    await Account.deleteMany({});
    
    // Create Users first
    const usersData = [
      {
        fullName: 'Admin User',
        email: 'admin@example.com',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male'
      },
      {
        fullName: 'Normal User',
        email: 'user@example.com',
        dateOfBirth: new Date('1995-05-05'),
        gender: 'female'
      }
    ];
    
    const createdUsers = await User.create(usersData);
    
    // Sample accounts
    const accountsData = [
      {
        user: createdUsers[0]._id,
        email: 'admin@example.com',
        passwordHash: 'hashed_password_123',
        provider: 'local',
        role: 'admin',
        isVerified: true
      },
      {
        user: createdUsers[1]._id,
        email: 'user@example.com',
        passwordHash: 'hashed_password_123',
        provider: 'local',
        role: 'user',
        isVerified: true
      }
    ];
    
    const createdAccounts = await Account.create(accountsData);
    
    // Update User references to Account
    for (let i = 0; i < createdUsers.length; i++) {
        createdUsers[i].account = createdAccounts[i]._id;
        await createdUsers[i].save();
    }

    console.log('Seed data created successfully:');
    createdAccounts.forEach((acc, index) => {
      const user = createdUsers.find(u => u._id.equals(acc.user));
      console.log('--- Account ' + (index + 1) + ' ---');
      console.log('Email: ' + acc.email);
      console.log('Name: ' + user.fullName);
      console.log('Role: ' + acc.role);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
