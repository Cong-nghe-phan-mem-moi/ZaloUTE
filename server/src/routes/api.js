const express = require('express');
const router = express.Router();

// Basic health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

module.exports = router;
