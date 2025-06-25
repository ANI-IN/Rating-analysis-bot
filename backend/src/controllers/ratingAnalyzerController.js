//backend/src/controllers/ratingAnalyzerController.js
const ratingAnalyzerService = require('../services/ratingAnalyzerService');

// Process a rating analysis query
exports.processQuery = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Query is required' 
      });
    }
    
    const result = await ratingAnalyzerService.analyzeQuery(query);
    res.json(result);
  } catch (error) {
    console.error('Rating Analyzer Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to process query' 
    });
  }
};