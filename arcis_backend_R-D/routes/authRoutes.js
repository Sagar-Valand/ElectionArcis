const express = require('express');
const { registerUser, loginUser, logoutUser, logoutFromAllDevices, getUserProfile, resetPassword, verifyUser, forgotPassword, sendOtp, verifyOtp, verifyToken, updateName, updateMobile, sendVerificationEmail, verifyEmail, sendVerificationMobile, updatePassword, resendOtp, deleteUser } = require('../controllers/authController');
const { isAuthenticatedUser, authorizedRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/resendOtp', resendOtp);
router.post('/verify', verifyUser);
router.post('/login', loginUser);
router.get('/logout', isAuthenticatedUser, logoutUser); // Single device logout
router.get('/logout-all', isAuthenticatedUser, logoutFromAllDevices); // Logout from all devices
router.get('/profile', isAuthenticatedUser, getUserProfile);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);
router.post('/sendOtp', sendOtp);
router.post('/verifyOtp', verifyOtp);
router.get("/verifytok", isAuthenticatedUser, verifyToken);
router.post("/sendVerificationMobile", isAuthenticatedUser, sendVerificationMobile);
router.post("/updateName", isAuthenticatedUser, updateName);
router.post("/updateMobile", isAuthenticatedUser, updateMobile);
router.post("/sendVerificationEmail", isAuthenticatedUser, sendVerificationEmail);
router.post("/verifyEmail", isAuthenticatedUser, verifyEmail);
router.post("/updatePassword", isAuthenticatedUser, updatePassword);
router.post("/deleteUser", deleteUser);

module.exports = router;
