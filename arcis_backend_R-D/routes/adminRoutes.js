const express = require('express');
const { getAllUsers, createUser, updateUserById, deleteUserById, getCameras, addCameraToUser, deleteCameraFromUser, updateCamera,  bulkAddCamerasToUser } = require('../controllers/adminController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

const router = express.Router();

// users
router.get('/getAllUsers', getAllUsers);
router.post('/createUser', createUser);
router.put('/updateUserById/:id', updateUserById);
router.post('/deleteUserById/:id', deleteUserById);

// camera
router.get('/getCameras', getCameras);
router.post('/addCameraToUser', addCameraToUser);
router.post('/deleteCameraFromUser', deleteCameraFromUser);
router.post('/updateCamera', updateCamera);
router.post('/bulkAddCamerasToUser', bulkAddCamerasToUser);

module.exports = router;
