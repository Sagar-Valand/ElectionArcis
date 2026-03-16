const AiSetting = require("../models/aisetting");
const AiCoordinates = require("../models/aiCoordinates");
const Camera = require("../models/cameraModel");
const semaphore = require("../utils/semaphore");
const axios = require('axios');
const User = require('../models/userModel');

const getMultipleCamera = async (req, res) => {
  try {
    // === Step 1: Validate Inputs ===
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // === Step 2: Get User Accessible Regions ===
    const user = await User.findOne({ email }, { UserAccessibleRegions: 1 }).lean();

    if (!user || !user.UserAccessibleRegions?.length) {
      return res.status(200).json({ success: true, message: "User has no accessible regions.", data: [] });
    }
    const regionCodes = user.UserAccessibleRegions;

    // === Step 3: Fetch Cameras from Camera table ===
    const accessibleCameras = await Camera.find(
      { districtAssemblyCode: { $in: regionCodes } },
      { deviceId: 1, CameraName: 1, email: 1, _id: 0, locations: 1 }
    ).lean();

    if (!accessibleCameras.length) {
      return res.status(200).json({ success: true, message: "No cameras found in user's accessible regions.", data: [] });
    }

    // === Step 4: Return cameras directly ===
    return res.status(200).json({
      success: true,
      message: "Cameras fetched successfully",
      data: accessibleCameras,
    });

  } catch (error) {
    console.error("Error fetching cameras:", error);
    return res.status(500).json({ success: false, message: "Error fetching data", error: error.message });
  }
};


// The getaisetting function is already correct for the two-table architecture.
const getaisetting = async (req, res) => {
    try {
        await semaphore.acquire();
        const { deviceId } = req.query;
        if (!deviceId) return res.status(400).json({ success: false, message: "Device ID is required" });
        const [settings, coordinates] = await Promise.all([
            AiSetting.findOne({ deviceId }).lean(),
            AiCoordinates.findOne({ deviceId }).lean()
        ]);
        if (!settings && !coordinates) {
            return res.status(200).json({ success: true, message: "No settings found.", data: [{ deviceId }] });
        }
        const combinedSettings = { ...(settings || { deviceId }), ...(coordinates || {}) };
        combinedSettings.deviceId = deviceId;
        res.status(200).json({ success: true, message: "Settings fetched successfully", data: [combinedSettings] });
    } catch (error) {
        console.error("Error in getaisetting:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    } finally {
        semaphore.release();
    }
};

// ===================================================================
// === RE-INTRODUCED HELPER FUNCTION TO TRANSFORM PARAMETERS       ===
// ===================================================================
/**
 * Translates the raw database parameters into the specific nested format
 * required by the third-party AI service.
 * @param {string} moduleName - The name of the AI module.
 * @param {any} rawParams - The coordinate data from our database.
 * @returns {object|null} The transformed parameters, or null if input is invalid.
 */
const transformModuleParams = (moduleName, rawParams) => {
    if (!rawParams || (Array.isArray(rawParams) && rawParams.length === 0)) {
        return null;
    }
    switch (moduleName) {
        case 'line_crossing_detection':
            return { line_coordinates: rawParams[0] };
        case 'idle_time_detection':
            return { rois: rawParams };
        // Add more cases for other modules like object_detection if they need specific formatting
        // case 'object_detection':
        //     return { detection_zones: rawParams };
        default:
            return null; // Return null for modules without specific transformations
    }
};

/**
 * [FINAL VERSION] Saves data, handles ALL modules, sends TRANSFORMED params, and handles START/STOP logic.
 */
const saveaisetting = async (req, res) => {
    try {
        await semaphore.acquire();
        const { deviceId, ...allSettings } = req.body;

        if (!deviceId) {
            return res.status(400).json({ success: false, message: "Device ID is required" });
        }

        const settingsPayload = {};
        const coordinatesPayload = {};
        const coordinateKeys = ['line_crossing_detection_params', 'idle_time_detection_params', 'ppe_detection_params', 'object_detection_params', 'screenshot'];
        for (const key in allSettings) {
            if (coordinateKeys.includes(key)) {
                coordinatesPayload[key] = allSettings[key];
            } else {
                settingsPayload[key] = allSettings[key];
            }
        }

        await Promise.all([
            AiSetting.findOneAndUpdate({ deviceId }, { $set: settingsPayload }, { new: true, upsert: true }),
            AiCoordinates.findOneAndUpdate({ deviceId }, { $set: coordinatesPayload }, { new: true, upsert: true })
        ]);

        const [freshSettings, freshCoordinates] = await Promise.all([
            AiSetting.findOne({ deviceId }).lean(),
            AiCoordinates.findOne({ deviceId }).lean()
        ]);
        const finalSettings = { ...(freshSettings || {}), ...(freshCoordinates || {}) };

        const camera = await Camera.findOne({ deviceId: deviceId });
        if (!camera || !camera.mediaUrl) {
            console.error(`Could not find camera details for deviceId: ${deviceId}.`);
        } else {
            const mediaUrl = camera.mediaUrl;
            const aiServiceBaseUrl = 'http://192.168.15.15:5000/api';
            
            const aiModuleConfig = [
                { name: 'object_detection',        paramKey: 'object_detection_params' },
                { name: 'face_recognition',        paramKey: null },
                { name: 'idle_time_detection',     paramKey: 'idle_time_detection_params' },
                { name: 'line_crossing_detection', paramKey: 'line_crossing_detection_params' },
                { name: 'person_count_detection',  paramKey: null },
                { name: 'fire_smoke_detection_custom', paramKey: null },
                { name: 'ppe_detection',           paramKey: 'ppe_detection_params' },
                { name: 'medical_ppe_detection',   paramKey: null },
                { name: 'mobile_detection',        paramKey: null },
                { name: 'evm_detection',           paramKey: null }
            ];

            const enabledAiModules = [];
            const moduleParamsForApi = {};

            aiModuleConfig.forEach(module => {
                if (finalSettings[module.name] === true) {
                    enabledAiModules.push(module.name);
                    if (module.paramKey) {
                        const rawParams = finalSettings[module.paramKey];
                        // --- THIS IS THE KEY ---
                        // Call the translator function to get the correct format
                        const transformedParams = transformModuleParams(module.name, rawParams);
                        if (transformedParams) {
                            moduleParamsForApi[module.name] = transformedParams;
                        }
                    }
                }
            });

            if (enabledAiModules.length > 0) {
                const startApiUrl = `${aiServiceBaseUrl}/start_processing`;
                const apiPayload = {
                    camera_urls: [`rtmp://${mediaUrl}:80/live-record/${deviceId}`],
                    camera_ids: [deviceId],
                    ai_modules: enabledAiModules,
                    output_base_url: `rtmp://${mediaUrl}:80/live-record/`,
                    module_params: moduleParamsForApi // This object now has the correct nested format
                };

                console.log("\n--- STARTING/UPDATING AI PROCESSING (TRANSFORMED PAYLOAD) ---");
                console.log(JSON.stringify(apiPayload, null, 2));
                
                axios.post(startApiUrl, apiPayload)
                    .then(response => console.log(`AI service start/update call for ${deviceId} successful.`))
                    .catch(apiError => console.error(`Error calling AI start/update service:`, apiError.message));
            } else {
                const stopApiUrl = `${aiServiceBaseUrl}/stop_processing`;
                const stopPayload = { camera_ids: [deviceId] };
                console.log(`\n--- STOPPING AI PROCESSING for ${deviceId} ---`);
                
                axios.post(stopApiUrl, stopPayload)
                    .then(response => console.log(`AI service stop call for ${deviceId} successful.`))
                    .catch(apiError => console.error(`Error calling AI stop service:`, apiError.message));
            }
        }
        
        res.status(200).json({
            success: true,
            message: "Settings saved successfully and AI service updated.",
            data: finalSettings
        });
    } catch (error)
        {
        console.error("Error in saveaisetting controller:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    } finally {
        semaphore.release();
    }
};

module.exports = { getMultipleCamera, getaisetting, saveaisetting};
