const generateOTP = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

const isOTPExpired = (expiresAt) => {
  if (!expiresAt) {
    return true;
  }
  return new Date() > new Date(expiresAt);
};

module.exports = {
  generateOTP,
  isOTPExpired,
};
