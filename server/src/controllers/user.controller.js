const UserService = require('../service/user.service');
const FriendRequestService = require('../service/friendRequest.service');
async function editProfile(req, res) {
  try {
    const userId = req.user.userId;
    const updateData = {
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      bio: req.body.bio,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      address: req.body.address,
      avatar: req.body.avatar,
    };



    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        code: 'NO_UPDATE_DATA',
        message: 'No fields to update provided',
      });
    }

    const result = await UserService.editProfile(userId, updateData);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('Edit Profile Error:', error);

    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_USER_ID',
        message: 'Invalid user ID format',
      });
    }

    if (error.errors) {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
}

async function getMyProfile(req, res) {
  try {
    const userId = req.user.userId;
    console.log('Getting profile for userId:', userId);
    const result = await UserService.getMyProfile(userId);

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Get Profile Error:', error);

    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_USER_ID',
        message: 'Invalid user ID format',
      });
    }

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
    });
  }
}

async function getMyProfileIsUser(req, res) {
  try {
    const userId = req.user.userId;
    const result = await UserService.getMyProfileByRole(userId, 'user');

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Get User Profile Error:', error);

    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
}

async function getMyProfileIsAdmin(req, res) {
  try {
    const userId = req.user.userId;
    const result = await UserService.getMyProfileByRole(userId, 'admin');

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Get Admin Profile Error:', error);

    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
}

async function searchUsers(req, res) {
  try {
    // console.log('Search Users - query:', req.query, 'userId:', req.user.userId);
    const keyword = req.query.keyword;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const myId = req.user.userId;
    // console.log(await User.findById(myId));

    const result = await UserService.searchUsers(keyword, page, limit, myId);
    console.log(result);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });

  } catch (error) {
    console.error('Search Users Error:', error);

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }

}

// [GET] /api/users/profile/:id
async function getOtherUserProfile(req, res) {
  try {
    const userId = req.params.id;
    const myId = req.user.userId;
    if (userId === myId) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_USER_ID',
        message: 'Không thể xem profile của chính mình qua endpoint này',
      });
    }

    const user = await UserService.getOtherUserProfile(userId, myId);

    if (user.relation !== 'friend') {
      const result = await FriendRequestService.checkFriendRequest(userId, myId);
      user.relation = result; // 'none', 'sent_request', 'received_request
    }

    return res.status(200).json({
      success: true,
      data: user,
    });   

  } catch (error) { 
    console.error('Get Other User Profile Error:', error);

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }

}


module.exports = {
  editProfile,
  getMyProfile,
  getMyProfileIsUser,
  getMyProfileIsAdmin,
  searchUsers,
  getOtherUserProfile,
};
