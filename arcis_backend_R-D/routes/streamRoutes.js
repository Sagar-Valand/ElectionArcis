const express = require('express');
const { getStreamByCameraObjectId, updateStream, getAllStreams } = require('../controllers/streamController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/getStreamByCameraObjectId', isAuthenticatedUser, getStreamByCameraObjectId);
router.post('/updateStream', isAuthenticatedUser, updateStream);
router.get('/getAllStreams', getAllStreams);

module.exports = router;
