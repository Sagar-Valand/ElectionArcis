const express = require('express');
const router = express.Router();
const { getHistory,getVehiclesByAssembly,getAllGpsData} = require('../controllers/gpsController');

// You should protect this route with authentication middleware
// Example: const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
// router.route('/report').get(isAuthenticatedUser, authorizeRoles('admin'), getDowntimeReport);

// For now, we'll create a simple public route
router.post('/getHistory', getHistory);
router.post('/getVehiclesByAssembly',getVehiclesByAssembly);
router.post('/getAllGpsData',getAllGpsData);

module.exports = router;
