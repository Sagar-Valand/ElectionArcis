const express = require('express');
const {
  getReportByEmail,
  getTabularReports,
} = require("../controllers/alertController");
const { isAuthenticatedUser } = require("../middleware/authMiddleware");
const router = express.Router();

// Route for generating reports
// router.get("/getReports", getReportByEmail);
router.get("/getReports", isAuthenticatedUser, getReportByEmail);
router.get("/getTabularReports", isAuthenticatedUser, getTabularReports);

module.exports = router;