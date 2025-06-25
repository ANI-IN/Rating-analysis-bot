//backend/src/routes/rating.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { processQuery } = require('../controllers/ratingAnalyzerController');

// Protected route to analyze ratings
router.post('/rating-analyzer', protect, processQuery);

module.exports = router;