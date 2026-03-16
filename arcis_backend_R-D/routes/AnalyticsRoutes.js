const express = require("express");
const {
  saveAnalyticsImage,getAnalyticsImages,getZoneWiseCounts // ✅ Correct import
} = require("../controllers/analyticsimageController"); // ✅ Ensure correct path
// const { getEmailSettings, updateEmailSettings } = require('../controllers/settingsController');
//const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// ✅ Ensure correct function name
router.route("/analytics").post(saveAnalyticsImage); 
router.route("/getanalyticsimages").get(getAnalyticsImages);
router.route("/getZoneWiseCounts").get(getZoneWiseCounts);
// router.get('/settings', getEmailSettings); // ✅ Correct route
// router.put('/admin/email-settings', updateEmailSettings); // ✅ Correct route
module.exports = router;