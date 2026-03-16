const express = require("express");
const { getaisetting,saveaisetting,getMultipleCamera} = require("../controllers/aisettingController");

const router = express.Router();

// Route to get AI detection settings
router.route("/getaisetting").get(getaisetting);
router.route("/saveaisetting").post(saveaisetting);
router.route("/getMultipleCamera").get(getMultipleCamera);
//router.post('/update_params', updateAiParams);
module.exports = router;