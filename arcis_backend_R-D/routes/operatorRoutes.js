const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadDistrictDetails, uploadPasswordHashExcel} = require("../controllers/operatorController");

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Route
router.post("/upload", upload.single("file"), uploadDistrictDetails);
router.post("/uploadExcel", upload.single("file"), uploadPasswordHashExcel);



module.exports = router;