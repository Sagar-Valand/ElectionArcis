const express = require('express');
const router = express.Router();
const { getDowntimeReport } = require('../controllers/downtimeController');

// You should protect this route with authentication middleware
// Example: const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
// router.route('/report').get(isAuthenticatedUser, authorizeRoles('admin'), getDowntimeReport);

// For now, we'll create a simple public route
router.get('/report', getDowntimeReport);

module.exports = router;
