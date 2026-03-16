const express = require('express');
const multer = require('multer');

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

const { getQuality, getAudioInfo, setAudioInfo, getImageInfo,
    setImageInfo, getVideoSettings, setVideoSettings, rebootCamera,
    getMotionDetection, edgeEvents, tfdata, setMotionDetection, getHumanoid,
    getFace, getLineCross, setQuality, setFace, setHumanOid, setLineCross,
    getCustomerStats, setCustomerStats, getAreaDetection, setAreaDetection,
    getMissingObjectDetection, setMissingObjectDetection, setUnattendedObjectDetection,
    getUnattendedObjectDetection, getAlertSettings, setAlertSettings, getTimesettings,
    setTimesettings, ptzSettings, getHumanTracking, setHumanTracking,
    getAlarmSettings, talkToCamera } = require('../controllers/settingController');

const { isAuthenticatedUser } = require('../middleware/authMiddleware');
const e = require('express');

const router = express.Router();

router.get('/getQuality', isAuthenticatedUser, getQuality);
router.post('/setQuality', isAuthenticatedUser, setQuality);

router.get('/getAudioInfo', isAuthenticatedUser, getAudioInfo);
router.post('/setAudioInfo', isAuthenticatedUser, setAudioInfo);

router.get('/getImageInfo', isAuthenticatedUser, getImageInfo);
router.post('/setImageInfo', isAuthenticatedUser, setImageInfo);

router.get('/getVideoSettings', isAuthenticatedUser, getVideoSettings);
router.post('/setVideoSettings', isAuthenticatedUser, setVideoSettings);

router.get('/getTimesettings', isAuthenticatedUser, getTimesettings);
router.post('/setTimesettings', isAuthenticatedUser, setTimesettings);

router.get('/getMotionDetection', isAuthenticatedUser, getMotionDetection);
router.post('/setMotionDetection', isAuthenticatedUser, setMotionDetection);

router.get('/getHumanoid', isAuthenticatedUser, getHumanoid);
router.post('/setHumanoid', isAuthenticatedUser, setHumanOid);

router.get('/getFace', isAuthenticatedUser, getFace);
router.post('/setFace', isAuthenticatedUser, setFace);

router.get('/getLineCross', isAuthenticatedUser, getLineCross);
router.post('/setLineCross', isAuthenticatedUser, setLineCross);

router.get('/getCustomerStats', isAuthenticatedUser, getCustomerStats);
router.post('/setCustomerStats', isAuthenticatedUser, setCustomerStats);

router.get('/getAreaDetection', isAuthenticatedUser, getAreaDetection);
router.post('/setAreaDetection', isAuthenticatedUser, setAreaDetection);

router.get('/getUnattendedObjectDetection', isAuthenticatedUser, getUnattendedObjectDetection);
router.post('/setUnattendedObjectDetection', isAuthenticatedUser, setUnattendedObjectDetection);

router.get('/getMissingObjectDetection', isAuthenticatedUser, getMissingObjectDetection);
router.post('/setMissingObjectDetection', isAuthenticatedUser, setMissingObjectDetection);

router.get('/getAlertSettings', isAuthenticatedUser, getAlertSettings);
router.post('/setAlertSettings', isAuthenticatedUser, setAlertSettings);

router.get('/rebootCamera', isAuthenticatedUser, rebootCamera);
router.post('/edgeEvents', isAuthenticatedUser, edgeEvents);

router.post('/tfdata', isAuthenticatedUser, tfdata)
router.post('/ptzSettings', ptzSettings);

router.get('/getHumanTracking', isAuthenticatedUser, getHumanTracking);
router.post('/setHumanTracking', isAuthenticatedUser, setHumanTracking);

router.get('/getAlarmSettings', isAuthenticatedUser, getAlarmSettings);

// Route for video upload and streaming
router.post('/talkToCamera', upload.single('audio'), talkToCamera);

module.exports = router;
