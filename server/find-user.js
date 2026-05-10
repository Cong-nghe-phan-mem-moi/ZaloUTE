const mongoose = require('mongoose');
const mongoURI = 'mongodb://admin_db_user:uded63QlLrXcmjBz@ac-gmzwbal-shard-00-00.zalqytd.mongodb.net:27017,ac-gmzwbal-shard-00-01.zalqytd.mongodb.net:27017,ac-gmzwbal-shard-00-02.zalqytd.mongodb.net:27017/ZaloUTE?ssl=true&replicaSet=atlas-jraolm-shard-0&authSource=admin&appName=zalute';

async function run() {
  try {
    console.log('Connecting to Atlas...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas');
    
    const User = mongoose.connection.db.collection('users');
    const user = await User.findOne({ _id: new mongoose.Types.ObjectId('6a002287c2263b08e5b57591') });
    
    if (user) {
      console.log('User found:');
      console.log(JSON.stringify({
        fullName: user.fullName,
        email: user.email,
        account: user.account,
        allData: user
      }, null, 2));
    } else {
      console.log('User 6a002287c2263b08e5b57591 not found in Atlas.');
      // List a few to be sure
      const sample = await User.find().limit(3).toArray();
      console.log('Sample IDs in DB:', sample.map(u => u._id));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
