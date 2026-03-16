const express = require('express');

const { getUserCameraStats1,deleteCamera,getCameras, addDevice, getStreamDetails, updateCamera, shareCamera, 
       getSharedCamera, getSharedEmails, removeSharedCamera, getMultiplePageCamera, getOnlineCamera, dashboardData, 
       removeUserCamera, saveDeviceImage, getUserCameraStats,getdistrictwiseAccess, getDistrictNameByAssemblyName,
       getAllCameras, getCamerasByDistrict, getCurrentUserCameras ,getCurrentUserCameras1,updateCameraDetails,
       getMultipleCamera,getS,getDistrictCameraStats,getAssemblyCameraStats,getAllDistrictStatsForUser, addHelpdesk, 
       getHelpdeskdata, updateActivity,getAllRegions,addInventory,getInventory,updateInventory,getAllAssemblyStatsForUser,
addIncidence,getIncidence,updateIncidence} = require('../controllers/cameraController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/getAllCameras', isAuthenticatedUser,  getAllCameras);
router.post('/addDevice', isAuthenticatedUser, addDevice);
router.get('/getStreamDetails', getStreamDetails);
router.put('/updateCamera/:id', isAuthenticatedUser, updateCamera);
router.post('/shareCamera', isAuthenticatedUser, shareCamera);
router.get('/getSharedCamera', isAuthenticatedUser, getSharedCamera);
router.get('/getSharedEmails', isAuthenticatedUser, getSharedEmails);
router.post('/removeSharedCamera', isAuthenticatedUser, removeSharedCamera);
router.post('/removeUserCamera', isAuthenticatedUser, removeUserCamera);
router.get('/getMultiplePageCamera', getMultiplePageCamera);
router.get('/getOnlineCamera', isAuthenticatedUser, getOnlineCamera);
router.get('/dashboardData', isAuthenticatedUser, dashboardData);
router.post('/saveDeviceImage', isAuthenticatedUser, saveDeviceImage);
router.get('/getCameras',getCameras);
router.post('/getCurrentUserCameras', getCurrentUserCameras);
router.post('/getCurrentUserCameras1', getCurrentUserCameras1);
router.get('/getUserCameraStats',getUserCameraStats);
router.get('/getUserCameraStats1',getUserCameraStats1);
router.get('/getdistrictwiseAccess',getdistrictwiseAccess);
router.get("/getDistrictNameByAssemblyName",getDistrictNameByAssemblyName);
// router.get('/getAllCameras',  getAllCameras);
router.get('/getCamerasByDistrict/:districtId',getCamerasByDistrict)
// router.get("/getAllCameras",getAllCameras)
// router.get('/multiscreen-view',getMultiplePageCamera);
router.put('/update/:deviceId', updateCameraDetails);
router.get('/getAllRegions',getAllRegions);
router.get("/districtcamerastats", getDistrictCameraStats);
router.get("/getAssemblyCameraStats", getAssemblyCameraStats);

router.get('/getAllDistrictStatsForUser',getAllDistrictStatsForUser);
router.get('/getAllAssemblyStatsForUser',getAllAssemblyStatsForUser);
// Ensure you import the controller at the top
// const cameraController = require('../controllers/cameraController');

// Add this route:
router.delete('/delete/:deviceId', deleteCamera);

//Helpdesk API'S
router.post('/addhelpdesk',addHelpdesk);
router.post('/getHelpdeskdata',getHelpdeskdata);
router.put('/updateActivity',updateActivity);


//Inventory API'S
router.post('/addinventory',addInventory);
router.post('/getinventory',getInventory);
router.put('/updateinventory',updateInventory);

//Incidence API'S
router.post('/addincidence',addIncidence);
router.post('/getincidence',getIncidence);
router.put('/updateincidence',updateIncidence);




module.exports = router;
