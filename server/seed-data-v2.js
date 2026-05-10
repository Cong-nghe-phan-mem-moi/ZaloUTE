require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Account = require('./src/models/Account');
const connectDB = require('./src/config/database');

const seedData = async () => {
    await connectDB();
    try {
        await User.deleteMany({});
        await Account.deleteMany({});

        const adminData = {
            fullName: 'Admin User',
            email: 'admin@example.com',
            dateOfBirth: new Date('1990-01-01'),
            gender: 'male',
            avatar: 'https://example.com/admin.png'
        };

        const userData = {
            fullName: 'Normal User',
            email: 'user@example.com',
            dateOfBirth: new Date('1995-05-05'),
            gender: 'female',
            avatar: 'https://example.com/user.png'
        };

        const [admin, user] = await User.create([adminData, userData]);

        const adminAccount = await Account.create({
            userId: admin._id,
            email: 'admin@example.com',
            phoneNumber: '0123456789',
            password: 'password123',
            role: 'admin',
            isVerified: true
        });

        const userAccount = await Account.create({
            userId: user._id,
            email: 'user@example.com',
            phoneNumber: '0987654321',
            password: 'password123',
            role: 'user',
            isVerified: true
        });
        
        // Update user side-reference if necessary
        admin.account = adminAccount._id;
        await admin.save();
        user.account = userAccount._id;
        await user.save();

        console.log('Seeding completed successfully');
        console.log('Users and Accounts data:');
        console.log(JSON.stringify({
            adminUser: admin,
            adminAccount: adminAccount,
            normalUser: user,
            normalAccount: userAccount
        }, null, 2));

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedData();
