const User = require('../models/userModel');
const Camera = require('../models/cameraModel');
const Stream = require('../models/streamModel');
const Plan = require('../models/planModel');
const Payment = require('../models/paymentModel');
const Order = require('../models/orderModel');
const MasterPlan = require('../models/masterPlans');
const AIEvent = require('../models/aiEvent');
const axios = require('axios');
const emsUrl = 'https://ems.ambicam.com:5000/api';
const https = require('https');
// User Management
// Function to format the date according to Indian Standard Time

const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // Use true for production environments with valid certificates
});

const getFormattedDate = () => {
    const options = {
        timeZone: 'Asia/Kolkata',
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Use 24-hour format
    };

    // Create a new Date object for the current time
    const date = new Date();

    // Format the date and time using Intl.DateTimeFormat for DD/MM/YY HH:MM:SS
    const formattedDateTime = new Intl.DateTimeFormat('en-GB', options).format(date);

    // Split the formatted date and time
    const [datePart, timePart] = formattedDateTime.split(', ');
    const dateParts = datePart.split('/');

    // Combine the date and time into the desired format
    const [day, month, year] = dateParts;

    return `${day}/${month}/${year} ${timePart}`;
};

// get all users
exports.getAllUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';  // Search parameter for deviceId

    try {
        // Define the aggregation pipeline
        const matchStage = {
            $match: {
                ...(search && { email: { $regex: search, $options: 'i' } })  // Match by email if search is provided
            }
        }

        const projectStage = {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                mobile: 1,
                Isverified: 1,
                createdAt: 1
            }
        }

        const skipStage = { $skip: (page - 1) * limit }
        const limitStage = { $limit: limit }

        // Execute the aggregation pipeline
        const users = await User.aggregate([
            matchStage,
            projectStage,
            skipStage,
            limitStage
        ]);

        if (!users.length) {
            return res.status(400).json({
                success: false,
                message: 'No users found'
            });
        }
        const totalCount = await User.countDocuments(matchStage.$match);
        const totalPages = Math.ceil(totalCount / limit);

        res.status(200).json({
            success: true,
            data: users,
            total: totalCount,
            page,
            limit,
            totalPages
        });

    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// create user
exports.createUser = async (req, res) => {
    const { name, email, mobile, password } = req.body;
    try {
        const isExist = await User.findOne({ email });
        if (isExist) {
            return res.status(400).json({
                success: false,
                message: 'User already exist'
            });
        }

        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!regex.test(password)) {
            return res.status(400).json({
                success: false,
                data: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.',
            });
        }

        const newUser = await User.create({
            name,
            email,
            mobile,
            Isverified: 1,
            password
        })

        const { password: pwd, __v, ...userData } = newUser.toObject();

        return res.status(201).json({
            success: true,
            data: userData
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// update user by id
exports.updateUserById = async (req, res) => {
    const { name, email, phone, password, Isverified } = req.body;
    const userId = req.params.id;
    try {
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (password) {
            const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

            if (!regex.test(password)) {
                return res.status(400).json({
                    success: false,
                    data: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.',
                });
            }
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { name, email, phone, Isverified, ...(password && { password }) },
            { new: true }  // Return the updated document
        );

        return res.status(200).json({
            success: true,
            data: updatedUser
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// delete user by id
exports.deleteUserById = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// Get cameras with pagination, search, and filtering
exports.getCameras = async (req, res) => {
    const { page = 1, limit = 10, deviceId, email } = req.query;

    try {
        // Build the query object
        const query = {};

        // Add case-insensitive regex for filtering
        if (deviceId || email) {
            query.$or = [];

            if (deviceId) {
                query.$or.push({ deviceId: { $regex: String(deviceId), $options: "i" } }); // Convert to string and case-insensitive search
            }

            if (email) {
                query.$or.push({ email: { $regex: String(email), $options: "i" } }); // Convert to string and case-insensitive search
            }
        }

        // Pagination settings
        const skip = (page - 1) * limit;

        // Fetch cameras with query, pagination, and limit
        const cameras = await Camera.find(query)
            .skip(skip)
            .limit(parseInt(limit));

        // Extract deviceIds from the cameras
        const deviceIds = cameras.map(camera => camera.deviceId);

        // Fetch associated stream data
        const streamData = await Stream.find({ deviceId: { $in: deviceIds } }).select('deviceId plan').exec();

        // Create a lookup table for deviceId -> plan
        const streamLookup = streamData.reduce((lookup, stream) => {
            lookup[stream.deviceId] = stream.plan || 'Unknown'; // Use 'Unknown' if no plan is found
            return lookup;
        }, {});

        // Add plan to each camera based on deviceId
        const camerasWithPlans = cameras.map(camera => ({
            ...camera._doc, // Spread the original camera data
            plan: streamLookup[camera.deviceId] || 'Unknown' // Default to 'Unknown' if no match
        }));

        // Count total documents matching the query
        const total = await Camera.countDocuments(query);

        res.status(200).json({
            success: true,
            data: camerasWithPlans,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};



// add camera to user 
exports.addCameraToUser = async (req, res) => {
    const { name, deviceId, email } = req.body;

    try {

        const created_date = getFormattedDate();
        console.log(created_date);

        const userId = await User.findOne({ email }).select('_id');

        // check deviceId is already exist or not
        const existingCamera = await axios.post(`${emsUrl}/camera/check-p2p-camera-exists`, {
            deviceId: deviceId,
        }, {
            httpsAgent: httpsAgent  // Add the HTTPS agent to the request config
        });

        console.log(existingCamera);
        if (existingCamera.data.exist === false) {
            return res.status(400).json({
                success: false,
                message: 'Device ID Not Exists',
            });
        }

        // check deviceId is already exist or not
        const existingCamera1 = await Camera.findOne({ deviceId });
        if (existingCamera1) {
            return res.status(400).json({
                success: false,
                message: 'Device ID added already',
            });
        }

        const result = await Camera.updateOne(
            { deviceId: deviceId }, // Filter to find the camera by deviceId (or any other unique identifier)
            {
                $set: {
                    userId: userId._id,
                    email,
                    name,
                    created_date,
                    productType: existingCamera.data.productType
                },
            },
            { upsert: true } // Optional: creates a new document if no matching document is found
        );


        // Fetch the camera's plan
        const cameraPlan = await Plan.findOne({ deviceId }).select('storagePlan');

        // Determine the plan to update
        const planToUpdate = cameraPlan?.storagePlan || "LIVE"; // If storagePlan exists, use it; otherwise, default to "LIVE"

        // Update or upsert the stream document
        const updateStream = await Stream.updateOne(
            { deviceId: deviceId }, // Filter to find the camera by deviceId (or any other unique identifier)
            {
                $set: {
                    plan: planToUpdate,
                },
            },
            { upsert: true } // Optional: creates a new document if no matching document is found
        );

        res.status(200).json({
            success: true,
            result,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// Bulk Add Cameras to User
exports.bulkAddCamerasToUser = async (req, res) => {
    const { cameras } = req.body; // Expecting an array of camera data

    try {
        const created_date = getFormattedDate();
        const results = [];

        for (const camera of cameras) {
            const { deviceId, productType, email } = camera;

            try {
                // Find user by email
                const user = await User.findOne({ email }).select('_id');
                if (!user) {
                    results.push({
                        deviceId,
                        success: false,
                        message: 'User not found',
                    });
                    continue; // Skip to the next camera
                }

                // Check if deviceId already exists (external check)
                const existingCameraResponse = await axios.post(`${emsUrl}/camera/check-p2p-camera-exists`, {
                    deviceId: deviceId,
                }, {
                    httpsAgent: httpsAgent,
                });

                if (existingCameraResponse.data.exists) {
                    results.push({
                        deviceId,
                        success: false,
                        message: 'Device ID already exists externally',
                    });
                    continue; // Skip to the next camera
                }

                // Check if deviceId already exists (internal check)
                const existingCamera = await Camera.findOne({ deviceId });
                if (existingCamera) {
                    results.push({
                        deviceId,
                        success: false,
                        message: 'Device ID already exists in the database',
                    });
                    continue; // Skip to the next camera
                }

                // Update or insert camera in the database
                await Camera.updateOne(
                    { deviceId: deviceId },
                    {
                        $set: {
                            userId: user._id,
                            email,
                            name: deviceId,
                            created_date,
                            productType,
                        },
                    },
                    { upsert: true }
                );

                // Fetch the camera's plan
                const cameraPlan = await Plan.findOne({ deviceId }).select('storagePlan');
                const planToUpdate = cameraPlan?.storagePlan || "LIVE";

                // Update or insert stream data
                await Stream.updateOne(
                    { deviceId: deviceId },
                    {
                        $set: {
                            plan: planToUpdate,
                        },
                    },
                    { upsert: true }
                );

                // Add success result
                results.push({
                    deviceId,
                    success: true,
                    message: 'Camera added successfully',
                });
            } catch (error) {
                // Add failure result for this camera
                results.push({
                    deviceId,
                    success: false,
                    message: error.message,
                });
            }
        }

        // Return results
        res.status(200).json({
            success: true,
            results,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// delete camera from user
exports.deleteCameraFromUser = async (req, res) => {
    const { deviceId } = req.body;
    try {
        const result = await Camera.deleteOne({ deviceId });
        const result1 = await Stream.deleteOne({ deviceId });
        res.status(200).json({
            success: true,
            result,
            result1
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

// update camera plan
exports.updateCamera = async (req, res) => {
    const { deviceId, plan, email, name, productType, remotePortRtsp } = req.body;

    console.log(req.body);
    try {
        const user = email ? await User.findOne({ email }).select('_id') : null;

        const updateFields = {
            name,
            productType,
        };

        if (email && user) {
            updateFields.email = email;
            updateFields.userId = user._id;
        }

        const updateCamera = await Camera.updateOne(
            { deviceId }, // Filter to find the camera by deviceId
            { $set: updateFields }
        );


        const result = await Stream.findOne({ deviceId: deviceId })

        if (plan) {
            if (plan === 'LIVE') {
                await axios.post(`${emsUrl}/camera/disable-rtsp`, { deviceId }, { httpsAgent })
            }
            else {
                await axios.post(`${emsUrl}/camera/enable-rtsp`, { deviceId, port: remotePortRtsp }, { httpsAgent })
            }

            await Stream.updateOne({ deviceId: deviceId }, {
                $set: {
                    plan: plan
                }
            });

            const closeStreamUrl = `http://media2.arcisai.io:8080/api/closestream?streamPath=${result.plan}/RTSP-${deviceId}`;
            await axios.get(closeStreamUrl)
                .then(response => {
                    console.log('Stream closed :', response.data);
                })
                .catch(error => {
                    console.error('Error closing stream:', error);
                });

        }
        res.status(200).json({
            success: true,
            updateCamera,
        });

    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}
