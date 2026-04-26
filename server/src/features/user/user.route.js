const express = require('express');
const router = express.Router();
const { successResponse } = require('../../shared/utils/response.util');

// In-memory user preferences (replace with DB in production)
let userPreferences = {
  theme: 'dark',
  fontSize: 'medium',
  language: 'python',
  showComplexityBadges: true,
};

/**
 * GET /api/user/preferences - Get user preferences
 */
router.get('/preferences', (req, res) => {
  res.status(200).json(successResponse(userPreferences));
});

/**
 * PUT /api/user/preferences - Update user preferences
 */
router.put('/preferences', (req, res) => {
  const { theme, fontSize, language, showComplexityBadges } = req.body;
  userPreferences = {
    ...userPreferences,
    ...(theme && { theme }),
    ...(fontSize && { fontSize }),
    ...(language && { language }),
    ...(showComplexityBadges !== undefined && { showComplexityBadges }),
  };
  res.status(200).json(successResponse(userPreferences, 'Preferences updated'));
});

/**
 * GET /api/user/stats - Get usage statistics
 */
router.get('/stats', (req, res) => {
  const stats = {
    totalQueries: Math.floor(Math.random() * 100) + 1, // Placeholder
    favoriteTopics: ['Sorting Algorithms', 'Graph Traversal', 'Dynamic Programming'],
    joinedAt: new Date().toISOString(),
  };
  res.status(200).json(successResponse(stats));
});

module.exports = router;
