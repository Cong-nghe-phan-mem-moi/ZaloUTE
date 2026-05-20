const FriendRequestService = require('../service/friendRequest.service');

async function handleSendFriendRequest(req, res) {
  try {
    const senderId = req.user.id;
    const receiverId = req.body.receiverId;

    // console.log(req.user);

    const result = await FriendRequestService.sendFriendRequest(senderId, receiverId);
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error in handleSendFriendRequest:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
}


async function handleAcceptFriendRequest(req, res) {
  try {
    const receiverId = req.user.id;
    const senderId = req.body.senderId;

    // console.log('handleAcceptFriendRequest - senderId:', senderId, 'receiverId:', receiverId);

    const result = await FriendRequestService.acceptFriendRequest(senderId, receiverId);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in handleAcceptFriendRequest:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  handleSendFriendRequest,
  handleAcceptFriendRequest,
};