const FriendRequestService = require('../service/friendRequest.service');

async function handleSendFriendRequest(req, res) {
  try {
    const senderId = req.user.id;
    const receiverId = req.body.receiverId;

    console.log(req.user);

    const result = await FriendRequestService.sendFriendRequest(senderId, receiverId);
    
    return res.status(201).json(result);
  } catch (error) {
    // Nếu em có middleware errorHandler thì dùng next(error)
    // Nếu chưa có thì trả về lỗi trực tiếp ở đây
    console.error('Error in handleSendFriendRequest:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  handleSendFriendRequest,
  // ... các hàm khác
};