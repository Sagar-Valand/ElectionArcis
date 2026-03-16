const express = require('express');
const {

  createData,
  getData,
  getDataByUserId,
  getDataByDate,
  getModelNames,
  getImageCount,

  storeImage,
  getCameraIdsByCustomer,

} = require("../controllers/aiController");
const { isAuthenticatedUser } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/createData", createData);
router.get("/getData", getData);
router.get("/getDataByUserId", isAuthenticatedUser, getDataByUserId);
router.post("/getDataByDate", isAuthenticatedUser, getDataByDate);
router.get("/getModelNames", isAuthenticatedUser, getModelNames);
router.get("/getImageCount", isAuthenticatedUser, getImageCount);

router.post("/storeImage", isAuthenticatedUser, storeImage);

router.get(
  "/getCameraIdsByCustomer",
  isAuthenticatedUser,
  getCameraIdsByCustomer
);

module.exports = router;
