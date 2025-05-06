const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');

// Rating analyzer endpoint (protected route)
router.get('/rating-analyzer', protect, (req, res) => {
  res.json({
    message: 'Rating analyzer endpoint',
    user: req.user,
  });
});

module.exports = router;