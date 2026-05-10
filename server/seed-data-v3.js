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
            user: admin._id,
            email: 'admin@example.com',
            passwordHash: 'hashed_password123', // Field name is passwordHash
            provider: 'local',
            roles: ['admin'],
            isVerified: true
        });

        const userAccount = await Account.create({
            user: user._id,
            email: 'user@example.com',
            passwordHash: 'hashed_password123',
            provider: 'local',
            roles: ['user'],
            isVerified: true
        });
        
        admin.account = adminAccount._id;
        await admin.save();
        user.account = userAccount._id;
        await user.save();

        console.log('Seeding completed successfully');
        console.log('Users and Accounts data:');
        const output = {
            admin: {
                user: admin,
                account: { ...adminAccount.toObject(), password: 'password123 (stored as hashed_password123)' }
            },
            user: {
                user: user,
                account: { ...userAccount.toObject(), password: 'password123 (stored as hashed_password123)' }
            }
        };
        console.log(JSON.stringify(output, null, 2));

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedData();
