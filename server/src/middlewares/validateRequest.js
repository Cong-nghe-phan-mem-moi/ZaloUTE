const validateEditProfile = (req, res, next) => {
  const {
    fullName,
    email,
    phone,
    bio,
    dateOfBirth,
    gender,
    address,
    avatar,
    socialLinks,
  } = req.body;



  const errors = [];

  if (fullName !== undefined) {
    if (typeof fullName !== 'string' || fullName.trim().length === 0) {
      errors.push('Full name must be a non-empty string');
    }
    if (fullName.length < 3) {
      errors.push('Full name must be at least 3 characters');
    }
    if (fullName.length > 50) {
      errors.push('Full name must not exceed 50 characters');
    }
  }

  if (email !== undefined) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }

  if (phone !== undefined) {
    if (phone.trim().length > 0) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        errors.push('Invalid phone number format');
      }
    }
  }

  if (bio !== undefined) {
    if (typeof bio !== 'string' || bio.length > 500) {
      errors.push('Bio must not exceed 500 characters');
    }
  }

  if (address !== undefined) {
    if (typeof address !== 'string' || address.length > 100) {
      errors.push('Address must not exceed 100 characters');
    }
  }

  if (gender !== undefined) {
    if (!['male', 'female', 'other', null].includes(gender)) {
      errors.push('Gender must be one of: male, female, other');
    }
  }

  if (dateOfBirth !== undefined) {
    const date = new Date(dateOfBirth);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date of birth format');
    }
    const age = new Date().getFullYear() - date.getFullYear();
    if (age < 13) {
      errors.push('User must be at least 13 years old');
    }
  }

  if (avatar !== undefined) {
    if (typeof avatar !== 'string' && avatar !== null) {
      errors.push('Avatar must be a string or null');
    }
  }

  if (socialLinks !== undefined) {
    if (
      socialLinks === null ||
      Array.isArray(socialLinks) ||
      typeof socialLinks !== 'object'
    ) {
      errors.push('Social links must be an object');
    } else {
      const allowedKeys = ['facebook', 'instagram', 'tiktok', 'youtube', 'website'];

      Object.keys(socialLinks).forEach((key) => {
        if (!allowedKeys.includes(key)) {
          errors.push(`Social link field '${key}' is not supported`);
          return;
        }

        const value = socialLinks[key];
        if (typeof value !== 'string') {
          errors.push(`Social link '${key}' must be a string`);
          return;
        }

        if (value.length > 255) {
          errors.push(`Social link '${key}' must not exceed 255 characters`);
        }
      });
    }
  }




  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

module.exports = { validateEditProfile };
