const assert = require('node:assert/strict');
const test = require('node:test');

const { generateOTP, isOTPExpired } = require('../src/utils/otp');

test('generateOTP returns numeric string of requested length', () => {
  const otp = generateOTP(6);
  assert.equal(typeof otp, 'string');
  assert.equal(otp.length, 6);
  assert.match(otp, /^\d{6}$/);
});

test('isOTPExpired detects expiration correctly', () => {
  const future = new Date(Date.now() + 60 * 1000);
  const past = new Date(Date.now() - 60 * 1000);

  assert.equal(isOTPExpired(future), false);
  assert.equal(isOTPExpired(past), true);
  assert.equal(isOTPExpired(null), true);
});
