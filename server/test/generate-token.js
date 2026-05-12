const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';
const payload = {
  userId: '6a03000f5f1b8fd9d706e4a8', // Correct User ID from DB (ends in 8)
  role: 'user'
};



const token = jwt.sign(payload, secret, { expiresIn: '7d' });

console.log('\n--- TEST TOKEN GENERATED ---');
console.log('Copy the token below:');
console.log('\n' + token + '\n');
console.log('To use it in your browser, run this in the console (F12):');
console.log(`localStorage.setItem('token', '${token}'); location.reload();`);
console.log('-----------------------------\n');
