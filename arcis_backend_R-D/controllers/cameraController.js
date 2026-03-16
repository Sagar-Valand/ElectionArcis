const Camera = require("../models/cameraModel");
const plan = require("../models/planModel");
const Stream = require("../models/streamModel");
const User = require("../models/userModel");
const District = require("../models/district");
const Helpdeskdata = require("../models/helpdesk");
const Operator = require("../models/operator");
const Inventory = require("../models/inventoryUpdation");
const Incidence = require("../models/IncidenceMaster");
const GpsData = require('../models/GpsData');
const axios = require("axios");
const https = require("https");
const mongoose = require("mongoose");
const { setCache, getCache, deleteCache } = require('./cacheController')
const basicAuth = `Basic ${Buffer.from(`admin:admin`).toString("base64")}`;
const apiUrl = "https://p2p.vmukti.com/api/proxy/http";
const emsUrl = "https://etaems.arcisai.io:5000/api";
let globalProxies = []; // Global variable for proxy data

// Create an httpsAgent with custom settings
const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // Set to true if you want to verify certificates, or false for self-signed certificates
});

// Function to fetch and store proxy statuses in global memory and Redis
const fetchProxies = async () => {
    try {
        console.log("Fetching proxy statuses...");

        const response = await axios.get(apiUrl, {
            httpsAgent,
            headers: { Authorization: basicAuth },
        });

        if (response.data && response.data.proxies) {
            globalProxies = response.data.proxies; // Update only if valid data is received
            console.log("Proxy data updated.");
        } else {
            console.warn("Warning: No valid proxy data received. Retaining old data.");
        }
    } catch (error) {
        console.error("Error fetching proxies:", error.message);
        console.log("Continuing with previously stored proxy data.");
    }
};

// Run fetchProxies every 30 seconds
setInterval(fetchProxies, 10000);
// Initial fetch on server start
fetchProxies();

// async function mapCamerasToRegion(allAccessibleCamerasCurrentRequest, cameraDistrict) {
//     const cameraRegionMapped = [];
//     for (const camera of allAccessibleCamerasCurrentRequest) {
//         const status = await Stream.find(
//             {deviceId : camera.deviceId},
//             {mediaUrl : 1},
//             { _id : 0, status : 1},
//             {lean : true},
//         );
//         cameraDistrict.forEach(district => {
//             if (camera.districtAssemblyCode === district.districtAssemblyCode){
//                 cameraRegionMapped.push({...camera,...district,...status[0]})
//             }
//         })
//     }
//     return cameraRegionMapped;
// }

// Optimized Helper
async function mapCamerasToRegion(cameras, districts, streams, operators) {
    // Build maps for quick lookup
    const districtMap = new Map(districts.map(d => [d.districtAssemblyCode, d]));
    const streamMap = new Map(streams.map(s => [s.deviceId, s]));
    
    // Create Operator Map
    const operatorMap = new Map(operators.map(o => [o.operatorId, o]));

    return cameras.map(camera => {
        const districtInfo = districtMap.get(camera.districtAssemblyCode) || {};
        const streamData = streamMap.get(camera.deviceId) || {};
        
        // Lookup Operator based on common operatorId
        const operatorData = operatorMap.get(camera.operatorId) || {};

        return {
            ...camera,
            ...districtInfo,
            
            // Stream Data
            mediaUrl: streamData.mediaUrl || null,
            p2purl: streamData.p2purl || null,
            token: streamData.token || null,
            plan: streamData.plan || null,
            status: streamData.status, 
            is_live: streamData.is_live, 
            last_checked: streamData.last_checked,

            // Operator Data
            // We rename these fields to avoid conflict with camera 'name'
            operatorName: operatorData.name || null,
            operatorMobile: operatorData.mobile || null
        };
    });
}

// Optimized Controller
exports.getCurrentUserCameras = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne(
            { email },
            { UserAccessibleRegions: 1, _id: 0 }
        ).lean();

        if (!user || !user.UserAccessibleRegions?.length) {
            return res.status(404).json({
                success: false,
                message: "User or accessible regions not found",
            });
        }

        const regionCodes = user.UserAccessibleRegions;

        // STEP 1: Fetch Cameras first
        // We do this first to get the list of operatorIds and deviceIds needed for the next queries
        const cameras = await Camera.find(
            { districtAssemblyCode: { $in: regionCodes } },
            {
                deviceId: 1,
                name: 1,
                ps_id: 1,
                locations: 1,
                location_Type: 1,
                districtAssemblyCode: 1,                   
                latitude: 1,
                longitude: 1,
                operatorId: 1, // <--- Crucial: Fetch operatorId to link with Operator collection
                _id: 0
            }
        ).lean();

        if (!cameras.length) {
            return res.json([]); 
        }

        // Extract IDs for bulk fetching to optimize performance
        const deviceIds = cameras.map(c => c.deviceId);
        // Get unique operator IDs (filter out nulls)
        const operatorIds = [...new Set(cameras.map(c => c.operatorId).filter(id => id))];

        // STEP 2: Fetch Districts, Streams, and Operators in parallel
        // Make sure to destructure 'operators' here
        const [districts, streams, operators] = await Promise.all([
            District.find(
                { districtAssemblyCode: { $in: regionCodes } },
                { dist_name: 1, accName: 1, districtAssemblyCode: 1, _id: 0 }
            ).lean(),

            Stream.find(
                { deviceId: { $in: deviceIds } },
                {
                    deviceId: 1,
                    mediaUrl: 1,
                    p2purl: 1,
                    token: 1,
                    plan: 1,
                    status: 1,
                    is_live: 1,
                    last_checked: 1,
                    _id: 0
                }
            ).lean(),

            Operator.find(
                { operatorId: { $in: operatorIds } },
                { operatorId: 1, name: 1, mobile: 1, _id: 0 }
            ).lean()
        ]);

        // STEP 3: Map everything together
        // Now 'operators' is defined from the Promise.all result above
        const cameraRegionMapped = await mapCamerasToRegion(cameras, districts, streams, operators);
        
        console.log("Mapped Data Count:", cameraRegionMapped.length);
        res.json(cameraRegionMapped);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getCurrentUserCameras1 = async (req, res) => {
    try {
        const { email } = req.body;
        
        // 1. Get User
        const user = await User.findOne({ email }, { UserAccessibleRegions: 1, _id: 0 }).lean();

        if (!user || !user.UserAccessibleRegions?.length) {
            return res.status(404).json({ success: false, message: "User or accessible regions not found" });
        }

        const regionCodes = user.UserAccessibleRegions;

        // 2. Fetch Cameras First (Optimized to filter by Region)
        // We do this to get the operatorIds and deviceIds needed for the next step.
        const cameras = await Camera.find(
            { districtAssemblyCode: { $in: regionCodes } }, 
            { 
                deviceId: 1, 
                name: 1, 
                status: 1, 
                is_live: 1, 
                ps_id: 1, 
                locations: 1, 
                location_Type: 1, 
                districtAssemblyCode: 1, 
                operatorId: 1, // Need this to link operator
                _id: 0 
            }
        ).lean();

        // Extract IDs for bulk fetching
        const deviceIds = cameras.map(c => c.deviceId);
        const operatorIds = [...new Set(cameras.map(c => c.operatorId).filter(id => id))];

        // 3. Parallel Fetch: Districts, User Streams, Operators, and GLOBAL Stream IDs
        const [districts, userStreams, operators, allStreamableDeviceIds] = await Promise.all([
            // Districts
            District.find(
                { districtAssemblyCode: { $in: regionCodes } }, 
                { dist_name: 1, accName: 1, districtAssemblyCode: 1, _id: 0 }
            ).lean(),

            // Streams (User Specific)
            Stream.find(
                { deviceId: { $in: deviceIds } }, 
                { deviceId: 1, mediaUrl: 1, p2purl: 1, token: 1, plan: 1, status: 1, is_live: 1, last_checked: 1, _id: 0 }
            ).lean(),

            // Operators (User Specific)
            Operator.find(
                { operatorId: { $in: operatorIds } },
                { operatorId: 1, name: 1, mobile: 1, _id: 0 }
            ).lean(),

            // ALL Distinct Device IDs (Global list from Stream table, as requested)
            Stream.distinct("deviceId")
        ]);

        // 4. Map the data
        const userVisibleCameras = await mapCamerasToRegion(cameras, districts, userStreams, operators);

        // 5. Send Response with both objects
        res.json({
            userCameras: userVisibleCameras,
            allDeviceIds: allStreamableDeviceIds 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getHelpdeskdata = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne(
            { email },
            { UserAccessibleRegions: 1, _id: 0 }
        ).lean();
        if (!user || !user.UserAccessibleRegions?.length) {
            return res.status(404).json({
                success: false,
                message: "User or accessible regions not found",
            });
        }
        const regionCodes = user.UserAccessibleRegions;
        const [districts, cameras] = await Promise.all([
            District.find(
                { districtAssemblyCode: { $in: regionCodes } },
                { dist_name: 1, accName: 1, districtAssemblyCode: 1, _id: 0 }
            ).sort({ dist_name: 1, accName: 1 }).lean(),
            Helpdeskdata.find(
                { districtAssemblyCode: { $in: regionCodes } },
                {
                    dist_name: 1,
                    accName: 1,
                    vehicleNo: 1,
                    cameraId: 1,
                    activity: 1,
                    dateTime: 1,
                    _id: 0
                }
            ).lean(),
        ]);
        const cameraRegionMapped = await maphelpdesk(cameras, districts);
     
        res.json({
            success: true,
            districts,
            cameras: cameraRegionMapped
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

async function maphelpdesk(cameras, districts) {
    const districtMap = new Map(districts.map(d => [d.districtAssemblyCode, d]));
    console.log("districtMap: ",districtMap);
    
    return cameras.map(camera => {
        const districtInfo = districtMap.get(camera.districtAssemblyCode) || {};
        console.log("districtInfo: ",districtInfo);
        return {
            ...camera,
            ...districtInfo
        };
    });
}

exports.addHelpdesk = async (req, res) => {
    try {
        const {
            dist_name,
            accName,
            vehicleNo,
            cameraId,
            activity,
            districtAssemblyCode,
            dateTime 
        } = req.body;
  
        const finalDateTime = dateTime ? new Date(dateTime) : new Date();
        const newEntry = new Helpdeskdata({
            dist_name,
            accName,
            vehicleNo,
            cameraId,
            activity,
            districtAssemblyCode,
            dateTime: finalDateTime
        });
        const result = await newEntry.save();
        res.status(200).json({
            success: true,
            message: "Helpdesk entry added successfully",
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateActivity = async (req, res) => {
   
    const { cameraId, activity, dateTime } = req.body;
    if (!cameraId || !activity || !dateTime) {
        return res.status(400).json({
            success: false,
            message: 'Camera ID, Activity, and Date & Time are required fields.'
        });
    }
    try {
 
        const updatedCamera = await Helpdeskdata.findOneAndUpdate(
            { cameraId: cameraId }, 
            {
                $set: {
                    activity: activity,
                    dateTime: dateTime
                }
            }, 
        );
        console.log(updatedCamera);
        
      
        if (!updatedCamera) {
            return res.status(404).json({
                success: false,
                message: 'Camera with the specified ID was not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Activity and timestamp updated successfully.'
        });
    } catch (error) {

        console.error('Error updating camera activity:', error);
        res.status(500).json({
            success: false,
            message: 'An internal server error occurred.'
        });
    }
}



exports.getInventory = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne(
      { email },
      { UserAccessibleRegions: 1, _id: 0 }
    ).lean();

    if (!user || !user.UserAccessibleRegions?.length) {
      return res.status(404).json({
        success: false,
        message: "User or accessible regions not found",
      });
    }

    const regionCodes = user.UserAccessibleRegions;
    console.log("Region Codes from User:", regionCodes);

    
    const districts = await District.find(
      { districtAssemblyCode: { $in: regionCodes } },
      { dist_name: 1, accName: 1, districtAssemblyCode: 1, _id: 0 }
    )
      .sort({ dist_name: 1, accName: 1 })
      .lean();

      
      const inventoryItems = await Inventory.find(
          { districtAssemblyCode: { $in: regionCodes } },
          {
              cameraId: 1,
              dist_name: 1,
              accName: 1,
              vehicleNo: 1,
              material: 1,
              status: 1,
              remarks: 1,
              startDate: 1,
              endDate: 1,
              oldSerialNumber: 1,
              newSerialNumber: 1,
              accode: 1,
              actionTaken: 1,
              districtAssemblyCode: 1,
              _id: 0,
            }
        ).lean();
        console.log(inventoryItems);
    

    console.log("Found Districts count:", districts.length);
    console.log("Found Inventory items count:", inventoryItems.length);

   
    if (inventoryItems.length === 0) {
       console.log("DEBUG: No inventory items matched specific codes:", regionCodes);
    }

    const mappedInventory = await mapInventory(inventoryItems, districts);
    console.log(mappedInventory);
    

    res.json({
      success: true,
      districts,
      inventory: mappedInventory,
    });
  } catch (error) {
    console.error("Error in getInventory:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


async function mapInventory(inventoryItems, districts) {

  const districtMap = new Map(districts.map((d) => [d.districtAssemblyCode, d]));
  console.log(districtMap);
  

  return inventoryItems.map((item) => {

    const districtInfo = districtMap.get(item.districtAssemblyCode) || {};
    console.log(districtInfo);
    

    
    return {
      ...item, 
      ...districtInfo,
    };
  });
}

exports.addInventory = async (req, res) => {
    try {
  
        const {
            cameraId, 
            dist_name, 
            accName, 
            vehicleNo, 
            material, 
            status,
            remarks, 
            startDate, 
            endDate, 
            oldSerialNumber, 
            newSerialNumber,
            districtAssemblyCode 
        } = req.body;

        const newEntry = new Inventory({
            cameraId, 
            dist_name, 
            accName, 
            vehicleNo, 
            material, 
            status,
            remarks, 
            startDate, 
            endDate, 
            oldSerialNumber, 
            newSerialNumber,
            districtAssemblyCode 
        });

        const result = await newEntry.save();
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.updateInventory = async (req, res) => {
    try {
        const { 
            oldCameraId, 
            cameraId,    
            vehicleNo,
            material,
            status, 
            remarks, 
            startDate,
            endDate,
            actionTaken, 
            newSerialNumber, 
            oldSerialNumber,
        } = req.body;

     
        const lookupId = oldCameraId || cameraId;

        if (!lookupId) {
            return res.status(400).json({
                success: false,
                message: 'Camera ID is required.'
            });
        }

        const updateData = {
            cameraId: cameraId,
            ...(vehicleNo && { vehicleNo }), 
            ...(material && { material }),
            ...(status && { status }),
            ...(remarks && { remarks }),
            ...(actionTaken && { actionTaken }),
            ...(newSerialNumber && { newSerialNumber }),
            ...(oldSerialNumber && { oldSerialNumber }),
            ...(startDate && { startDate }),
            ...(endDate && { endDate }),
        };

    
        const savedInventory = await Inventory.findOneAndUpdate(
            { cameraId: lookupId },    
            { $set: updateData },      
            {
                new: true,               
                upsert: true,            
                runValidators: true,
                setDefaultsOnInsert: true 
            }
        );

        if (!savedInventory) {
            throw new Error("The database operation failed.");
        }

        res.status(200).json({
            success: true,
            message: 'Inventory details saved successfully.',
            data: savedInventory
        });

    } catch (error) {
        console.error("---ERROR ---", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error occurred.',
            error: error.message
        });
    }
};

async function mapIncidence(items, districts) {
  if (!items || items.length === 0) 
      return [];
  const districtMap = new Map(districts.map((d) => [d.districtAssemblyCode, d]));
  return items.map((item) => {
    const districtInfo = districtMap.get(item.districtAssemblyCode) || {};
    console.log(districtInfo);
    
    return {
      ...item,
      ...districtInfo,
      dist_name: districtInfo.dist_name || item.dist_name,
      accName: districtInfo.accName || item.accName
    };
  });
}

exports.getIncidence = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne(
      { email },
      { UserAccessibleRegions: 1, _id: 0 }
    ).lean();

    if (!user || !user.UserAccessibleRegions?.length) {
      return res.status(200).json({
        success: true,
        districts: [],
        incidences: [],
        vehicles: [] 
      });
    }

    const regionCodes = user.UserAccessibleRegions;


    const districts = await District.find(
      { districtAssemblyCode: { $in: regionCodes } },
      { dist_name: 1, accName: 1, districtAssemblyCode: 1, _id: 0 }
    ).sort({ dist_name: 1, accName: 1 }).lean();

 
    const incidenceItems = await Incidence.find(
        { districtAssemblyCode: { $in: regionCodes } }
    ).lean();

 
    const cameraItems = await Camera.find(
        { districtAssemblyCode: { $in: regionCodes } },
        { locations: 1, deviceId: 1, districtAssemblyCode: 1, _id: 0 }
    ).lean();

    const mappedIncidences = await mapIncidence(incidenceItems, districts);
    
  
    const mappedVehicles = await mapIncidence(cameraItems.map(cam => ({
        ...cam,
     
        vehicleNo: (cam.locations && cam.locations.length > 0) ? cam.locations[0] : "Unknown",

        cameraId: cam.deviceId
    })), districts);


    const finalVehicles = mappedVehicles.filter(v => v.vehicleNo && v.vehicleNo !== "Unknown");


    res.json({
      success: true,
      districts,
      incidences: mappedIncidences,
      vehicles: finalVehicles 
    });

  } catch (error) {
    console.error("Error in getIncidence:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.addIncidence = async (req, res) => {
    try {
        const {
            dist_name, 
            accName, 
            vehicleNo, 
            incidentDetails, 
            driverName,
            driverContact, 
            category,
            cameraId, 
            incidentDateTime, 
            accode, 
            districtAssemblyCode
        } = req.body;

        const finalIncidentDateTime = incidentDateTime ? new Date(incidentDateTime) : new Date();

        const newEntry = new Incidence({
            dist_name, 
            accName, 
            vehicleNo, 
            incidentDetails, 
            driverName,
            driverContact, 
            category,
            cameraId, 
            incidentDateTime: finalIncidentDateTime,
            accode, districtAssemblyCode
        });

        const result = await newEntry.save();
        res.status(200).json({ success: true, message: "Incidence report added successfully", result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateIncidence = async (req, res) => {
  const { 
    originalCameraId, 
    cameraId,         
    vehicleNo, 
    incidentDetails, 
    driverName, 
    driverContact, 
    category,
    incidentDateTime 
  } = req.body;


  const searchId = originalCameraId || cameraId;
  console.log(searchId);
  

  if (!searchId) {
    return res.status(400).json({ success: false, message: 'Camera ID is required for lookup.' });
  }

  try {
    const updatedIncidence = await Incidence.findOneAndUpdate(
      { cameraId: searchId }, 
      {
        $set: {
          cameraId: cameraId, 
          ...(vehicleNo && { vehicleNo }),
          ...(incidentDetails && { incidentDetails }),
          ...(driverName && { driverName }),
          ...(driverContact && { driverContact }),
          ...(incidentDateTime && { incidentDateTime }),
          ...(category && {category})
        }
      },
      { new: true } 
    );
    console.log(updatedIncidence);

    if (!updatedIncidence) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    

    res.status(200).json({ success: true, message: 'Updated successfully.', data: updatedIncidence });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.getAllRegions = async (req, res) => {
    try {
        const regions = await District.aggregate([
            // Stage 1: Group documents by 'dist_name'
            {
                $group: {
                    _id: "$dist_name", // Group by the district name
                    // For each group, create a set of unique assembly names
                    assemblies: { $addToSet: "$accName" } 
                }
            },
            // Stage 2: Sort the assemblies array within each group
            {
                $project: {
                    _id: 1, // Keep the district name for the next stage
                    assemblies: { $sortArray: { input: "$assemblies", sortBy: 1 } }
                }
            },
            // Stage 3: Reshape the output documents to be more user-friendly
            {
                $project: {
                    _id: 0, // Exclude the default _id field
                    district: "$_id", // Rename _id to 'district'
                    assemblies: 1 // Keep the sorted assemblies array
                }
            },
            // Stage 4: Sort the final list of districts alphabetically
            {
                $sort: { district: 1 }
            }
        ]);

        res.status(200).json(regions);

    } catch (error) {
        console.error("Error fetching all regions:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch region list.",
            error: error.message,
        });
    }
};
// In controllers/cameraController.js

// In controllers/cameraController.js

// In your camera controller file (e.g., cameraController.js)
exports.deleteCamera = async (req, res) => {
    console.log("\n--- RECEIVED CAMERA DELETE REQUEST ---");
    try {
        const { deviceId } = req.params;

        console.log(`[1] Device ID received for deletion: '${deviceId}'`);

        if (!deviceId) {
            console.error("[!] Delete failed: Device ID is missing from URL params.");
            return res.status(400).json({ 
                success: false, 
                message: "Device ID is required to perform deletion." 
            });
        }

        // --- Step 1: Find and Delete ---
        console.log(`[2] Executing findOneAndDelete for deviceId: '${deviceId}'`);
        
        // Using findOneAndDelete to remove the document matching the deviceId
        const deletedCamera = await Camera.findOneAndDelete({ deviceId: deviceId });

        // --- Step 2: Check if document existed ---
        if (!deletedCamera) {
            console.error(`[!] Delete failed: Camera with Device ID '${deviceId}' not found in database.`);
            return res.status(404).json({
                success: false,
                message: `Camera with Device ID '${deviceId}' not found.`,
            });
        }

        console.log("[3] Document deleted successfully:", deletedCamera);

        // --- Step 3: Send Success Response ---
        res.status(200).json({
            success: true,
            message: "Camera deleted successfully.",
            data: deletedCamera, // Sending back the deleted data is often helpful for UI updates
        });

    } catch (error) {
        console.error("--- UNEXPECTED SERVER ERROR DURING DELETE ---", error);
        res.status(500).json({
            success: false,
            message: "An unexpected error occurred while deleting the camera.",
            error: error.message,
        });
    }
};

exports.updateCameraDetails = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { district, assembly, location, location_Type, operatorName, operatorMobile, operatorId } = req.body;

        // 1. Find the existing camera to see if it already has an operator linked
        const existingCamera = await Camera.findOne({ deviceId });
        let linkedOperatorId = existingCamera ? existingCamera.operatorId : (operatorId || null);

        // 2. Handle Operator Logic
        if (operatorName || (operatorMobile && operatorMobile !== "N/A")) {
            
            // --- NEW LOGIC: CALCULATE Srno TO SATISFY SCHEMA VALIDATION ---
            // We only need to find the count if we are about to create a NEW operator
            const totalOperators = await Operator.countDocuments();
            const nextSrno = totalOperators + 1;

            if (linkedOperatorId) {
                // CASE A: Update existing linked operator
                await Operator.findOneAndUpdate(
                    { operatorId: linkedOperatorId },
                    { 
                        $set: { 
                            name: operatorName || "N/A", 
                            mobile: operatorMobile || "N/A" 
                        } 
                    }
                );
            } else if (operatorMobile && operatorMobile !== "N/A") {
                // CASE B: Link by Mobile, or create new if mobile doesn't exist
                const operatorDoc = await Operator.findOneAndUpdate(
                    { mobile: operatorMobile },
                    { 
                        $set: { name: operatorName || "N/A" },
                        $setOnInsert: { 
                            operatorId: `OP-${Date.now()}`,
                            Srno: nextSrno // <--- ADDED Srno HERE for validation
                        }
                    },
                    { upsert: true, new: true }
                );
                linkedOperatorId = operatorDoc.operatorId;
            } else {
                // CASE C: Create brand new operator (No Mobile provided)
                const newOpId = `OP-${Date.now()}`;
                const newOp = await Operator.create({
                    operatorId: newOpId,
                    name: operatorName || "N/A",
                    mobile: operatorMobile || "N/A",
                    Srno: nextSrno // <--- ADDED Srno HERE for validation
                });
                linkedOperatorId = newOp.operatorId;
            }
        }

        // 3. Find District Code
        const districtInfo = await District.findOne({ dist_name: district, accName: assembly }).lean();
        if (!districtInfo) return res.status(404).json({ success: false, message: "District not found" });
        
        const { districtAssemblyCode } = districtInfo;

        // 4. Update Camera
        const updateData = {
            locations: [location || 'N/A'],
            location_Type: location_Type || "indoor",
            districtAssemblyCode,
            deviceId,
            operatorId: linkedOperatorId 
        };

        const savedCamera = await Camera.findOneAndUpdate(
            { deviceId },
            { $set: updateData },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, message: "Saved successfully", data: savedCamera });
    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// exports.getAllCameras = async (req, res) => {
//     // Retrieve pagination, search, and status filter parameters from the query
//     const userId = req.user.id;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
//     const search = req.query.search || ""; // Search parameter for `name`
//     const statusFilter = req.query.status || ""; // Filter by online/offline status
//     // const isDefaultCacheKey = search === "" && statusFilter === "";
//     // const cacheKey = `cameras:${userId}:page=${page}:limit=${limit}`;
//     // console.log("check", cacheKey);
//     try {
//         // Check if the data is cached in Redis
//         // if (isDefaultCacheKey) {
//         //     const cachedData = await getCache(cacheKey);
//         //     if (cachedData) {
//         //         console.log("Cache hit for cameras:", cacheKey);

//         //         // Parse cached data
//         //         let responseData = JSON.parse(cachedData);

//         //         // Update status from globalProxies in real-time
//         //         responseData.cameras = responseData.cameras.map((camera) => {
//         //             const proxy = globalProxies.find((proxy) => proxy.name === camera.deviceId);
//         //             return { ...camera, status: proxy ? proxy.status : "offline" };
//         //         });

//         //         return res.status(200).json(responseData);
//         //     }
//         // }

//         // Define the aggregation pipeline to fetch cameras
//         const matchStage = {
//             $match: {
//                 userId: userId,
//                 ...(search && { name: { $regex: search, $options: "i" } }), // Match by `name` if search is provided
//             },
//         };

//         const projectStage = {
//             $project: {
//                 _id: 1,
//                 name: 1,
//                 deviceId: 1,
//                 isp2p: 1,
//                 productType: 1,
//                 lastImage: 1,
//                 timestamp: 1,
//             },
//         };

//         // Execute the aggregation pipeline
//         const cameras = await Camera.aggregate([matchStage, projectStage]);

//         if (!cameras.length) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No cameras found",
//             });
//         }

//         // Match each camera with its corresponding proxy status
//         const updatedCameras = cameras.map((camera) => {
//             const proxy = globalProxies.find((proxy) => proxy.name === camera.deviceId);
//             return { ...camera, status: proxy ? proxy.status : "offline" };
//         });

//         // Filter cameras based on the status filter if provided
//         const filteredCameras = statusFilter
//             ? updatedCameras.filter((camera) => camera.status === statusFilter)
//             : updatedCameras;

//         // Calculate total count for filtered cameras
//         const totalCount = filteredCameras.length;

//         // Apply pagination to the filtered cameras
//         const paginatedCameras = filteredCameras.slice(
//             (page - 1) * limit,
//             page * limit
//         );

//         // Calculate total pages
//         const totalPages = Math.ceil(totalCount / limit);

//         const responseData = {
//             success: true,
//             cameras: paginatedCameras,
//             page,
//             limit,
//             total: totalCount,
//             totalPages,
//         };

//         // Store response in cache only if both search and statusFilter are empty
//         // if (isDefaultCacheKey) {
//         //     await setCache(cacheKey, JSON.stringify(responseData), 86400);
//         // }

//         // Return the paginated and filtered results
//         res.status(200).json(responseData);
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// Function to format the date according to Indian Standard Time
const getFormattedDate = () => {
    const options = {
        timeZone: "Asia/Kolkata",
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false, // Use 24-hour format
    };

    // Create a new Date object for the current time
    const date = new Date();

    // Format the date and time using Intl.DateTimeFormat for DD/MM/YY HH:MM:SS
    const formattedDateTime = new Intl.DateTimeFormat("en-GB", options).format(
        date
    );

    // Split the formatted date and time
    const [datePart, timePart] = formattedDateTime.split(", ");
    const dateParts = datePart.split("/");

    // Combine the date and time into the desired format
    const [day, month, year] = dateParts;

    return `${day}/${month}/${year} ${timePart}`;
};

// create a new camera
exports.addDevice = async (req, res) => {
    try {
        const { name, deviceId, isp2p } = req.body;

        const created_date = getFormattedDate();
        console.log(created_date);
        const userId = req.user.id;
        const useremail = req.user.email;

        // check deviceId is already exist or not
        // const existingCamera = await axios.post(
        //     `${emsUrl}/camera/check-p2p-camera-exists`,
        //     {
        //         deviceId: deviceId,
        //     },
        //     {
        //         httpsAgent: httpsAgent, // Add the HTTPS agent to the request config
        //     }
        // );

        // console.log(existingCamera);
        // if (existingCamera.data.exist === false) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Device ID Not Exists",
        //     });
        // }

        // check deviceId is already exist or not
        const existingCamera1 = await Camera.findOne({ deviceId });
        if (existingCamera1) {
            return res.status(400).json({
                success: false,
                message: "Device ID added already",
            });
        }

        const result = await Camera.updateOne(
            { deviceId: deviceId }, // Filter to find the camera by deviceId (or any other unique identifier)
            {
                $set: {
                    userId,
                    email: useremail,
                    name,
                    created_date,
                    isp2p,
                    // productType: existingCamera.data.data,
                },
            },
            { upsert: true } // Optional: creates a new document if no matching document is found
        );

        await deleteCache(`cameras:${userId}`);
        // Fetch the camera's plan
        const cameraPlan = await plan.findOne({ deviceId }).select("storagePlan");

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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// get stream details
exports.getStreamDetails = async (req, res) => {
    try {
        const { deviceId } = req.query;

        if (!deviceId) {
            return res.status(400).json({
                success: false,
                message: "Device ID is required",
            });
        }

        // Find the stream/camera details by deviceId
        const streamDetails = await Stream.findOne({ deviceId }).lean(); // .lean() is good practice for performance

        if (!streamDetails) {
            return res.status(404).json({
                success: false,
                message: "No stream found for the given device ID",
            });
        }

        // You were also trying to find the camera name. If the 'name' field
        // exists on the Stream model, it will already be in streamDetails.
        // Let's assume the camera name is in a field called 'name' or 'cameraName'
        const cameraName = streamDetails.name || streamDetails.cameraName || 'Unnamed Camera';

        // *** THIS IS THE KEY CHANGE ***
        // Wrap the response in the structure your frontend expects.
        const responseData = {
            success: true,
            streamData: [{
                ...streamDetails,
                cameraName: cameraName, // Make sure cameraName is included
            }],
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Error in getStreamDetails:", error); // Log the full error
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update a camera by id
exports.updateCamera = async (req, res) => {
    try {
        const { name } = req.body;
        const { id } = req.params;

        const updatedCamera = await Camera.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        );

        if (!updatedCamera) {
            return res.status(404).json({
                success: false,
                message: "Camera not found",
            });
        }
        res.status(200).json({
            success: true,
            data: updatedCamera,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// share a camera
exports.shareCamera = async (req, res) => {
    try {
        const { email, deviceId } = req.body;

        const camera = await Camera.findOne({ deviceId });

        if (!camera) {
            return res.status(400).json({
                success: false,
                message: "Camera not found",
            });
        }

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        if (camera.userId !== req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You are not authorized to share this camera",
            });
        }

        camera.sharedWith.push({ email, userId: existingUser._id });
        await camera.save();

        res.status(200).json({
            success: true,
            message: "Camera shared successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// get shared camera
exports.getSharedCamera = async (req, res) => {
    try {

        // const cachedSharedCameras = await getCache(`sharedCameras:${req.user.id}`);
        // if (cachedSharedCameras) {
        //     return res.status(200).json({ success: true, data: JSON.parse(cachedSharedCameras).data });
        // }

        const sharedCameras = await Camera.find({ 'sharedWith.email': req.user.email }).select('name deviceId').lean();

        if (!sharedCameras) {
            return res.status(400).json({
                success: false,
                message: 'No shared cameras found',
            });
        }

        // Fetch proxies
        const response = await axios.get(apiUrl, {
            httpsAgent,
            headers: {
                'Authorization': basicAuth,
            },
        });

        const proxies = response.data.proxies;

        // Match each camera with its corresponding proxy status
        const updatedCameras = sharedCameras.map(camera => {
            const proxy = proxies.find(proxy => proxy.name === camera.deviceId);
            return {
                ...camera,
                status: proxy ? proxy.status : 'Unknown'
            };
        });

        const totalCount = updatedCameras.length;
        // await setCache(`sharedCameras:${req.user.id}`, JSON.stringify({ data: updatedCameras, total: totalCount }), 86400);
        res.status(200).json({
            success: true,
            data: updatedCameras,
            total: totalCount
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// fetch shared emails of a camera
exports.getSharedEmails = async (req, res) => {
    try {
        const { deviceId } = req.query;

        // const cachedSharedEmails = await getCache(`sharedEmails:${deviceId}`);
        // if (cachedSharedEmails) {
        //     return res.status(200).json({ success: true, data: JSON.parse(cachedSharedEmails) });
        // }

        const camera = await Camera.findOne({ deviceId });
        if (!camera) {
            return res.status(400).json({
                success: false,
                message: 'Camera not found',
            });
        }

        if (camera.userId !== req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You are not authorized to access this camera',
            });
        }

        const sharedEmails = camera.sharedWith.map(user => user.email);
        // await setCache(`sharedEmails:${deviceId}`, JSON.stringify(sharedEmails), 86400);
        res.status(200).json({
            success: true,
            data: sharedEmails,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// remove shared camera
exports.removeSharedCamera = async (req, res) => {
    try {
        const { email, deviceId } = req.body;
        const userId = req.user.id;

        // Fetch the camera by deviceId
        const camera = await Camera.findOne({ deviceId });
        if (!camera) {
            return res.status(404).json({
                success: false,
                message: "Camera not found",
            });
        }

        // Check if the user is the owner or part of sharedWith
        const isOwner = camera.userId === userId;
        const sharedUser = camera.sharedWith.find((user) => user.userId === userId);

        if (!isOwner && !sharedUser) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to remove this camera",
            });
        }

        // Check if the email being removed is part of sharedWith
        const userToRemove = camera.sharedWith.find((user) => user.email === email);
        if (!userToRemove) {
            return res.status(404).json({
                success: false,
                message: "Shared user not found",
            });
        }

        // Update the sharedWith list to remove the user
        camera.sharedWith = camera.sharedWith.filter(
            (user) => user.email !== email
        );
        await camera.save();

        return res.status(200).json({
            success: true,
            message: "Camera removed from shared list",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// remove user camera
exports.removeUserCamera = async (req, res) => {
    const { deviceId } = req.body;
    try {
        const userId = req.user.id;
        const camera = await Camera.findOne({ deviceId });
        if (!camera) {
            return res.status(400).json({
                success: false,
                message: "Camera not found",
            });
        }
        if (camera.userId !== userId) {
            return res.status(400).json({
                success: false,
                message: "You are not authorized to remove this camera",
            });
        }

        await Camera.deleteOne({ deviceId });
        await Stream.deleteOne({ deviceId });
        await deleteCache(`cameras:${userId}`);
        res.status(200).json({
            success: true,
            message: "Camera removed successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getMultiplePageCamera = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get pagination parameters from the query
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 9; // Default to 10 items per page
        const skip = (page - 1) * limit;

        // Fetch all cameras for the user
        const cameraInfo = await Camera.find({ userId })
            .select('name deviceId')
            .lean();

        const deviceIds = cameraInfo.map(camera => camera.deviceId);

        // Fetch stream details
        const streamDetails = await Stream.find({ deviceId: { $in: deviceIds } })
            .select('deviceId mediaUrl p2purl plan quality token')
            .lean();

        // Fetch proxy details
        const response = await axios.get(apiUrl, {
            httpsAgent,
            headers: {
                'Authorization': basicAuth,
            },
        });

        const proxies = response.data.proxies;

        // Match each camera with its corresponding proxy status
        const updatedCameras = cameraInfo.map(camera => {
            const proxy = proxies.find(proxy => proxy.name === camera.deviceId);
            return {
                ...camera,
                status: proxy ? proxy.status : 'Unknown',
            };
        });

        // Filter for online cameras
        const onlineCameras = updatedCameras.filter(
            (camera) => camera.status === "online"
        );

        // Count total online cameras
        const totalOnlineCameras = onlineCameras.length;

        // Apply pagination to online cameras
        const paginatedCameras = onlineCameras
            .slice(skip, skip + limit)
            .map(camera => {
                const stream = streamDetails.find(stream => stream.deviceId === camera.deviceId);
                return {
                    ...camera,
                    ...stream,
                };
            });

        return res.status(200).json({
            success: true,
            data: paginatedCameras,
            total: totalOnlineCameras,
            page,
            limit,
            totalPages: Math.ceil(totalOnlineCameras / limit),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// get Online camera for edge event
exports.getOnlineCamera = async (req, res) => {
    try {
        const userId = req.user.id;

        const cameraInfo = await Camera.find({ userId }).select('name deviceId').lean();

        const deviceIds = cameraInfo.map(camera => camera.deviceId);

        const streamDetails = await Stream.find({ deviceId: { $in: deviceIds } }).select('deviceId p2purl').lean();

        const response = await axios.get(apiUrl, {
            httpsAgent,
            headers: {
                'Authorization': basicAuth,
            },
        });

        const proxies = response.data.proxies;

        // Match each camera with its corresponding proxy status
        const updatedCameras = cameraInfo.map(camera => {
            const proxy = proxies.find(proxy => proxy.name === camera.deviceId);
            return {
                ...camera,
                status: proxy ? proxy.
                    status : 'Unknown'
            }
        });
        const onlineCameras = updatedCameras.filter(
            (camera) => camera.status === "online"
        );

        const cameraDetails = onlineCameras.map(camera => {
            const stream = streamDetails.find(stream => stream.deviceId === camera.deviceId);
            return {
                ...camera,
                ...stream,
            };
        });

        return res.status(200).json({
            success: true,
            data: cameraDetails,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// dashboard data
exports.dashboardData = async (req, res) => {
    try {
        const userId = req.user.id;

        // fetch status
        const response = await axios.get(apiUrl, {
            httpsAgent,
            headers: {
                'Authorization': basicAuth,
            },
        });
        const proxies = response.data.proxies;

        // get online camera
        const cameraInfo = await Camera.find({ userId }).select('name deviceId sharedWith').lean();
        const planInfo = await plan.find({ userId }).select('plan ai_name').lean();
        // Match each camera with its corresponding proxy status
        const updatedCameras = cameraInfo.map(camera => {
            const proxy = proxies.find(proxy => proxy.name === camera.deviceId);
            return {
                ...camera,
                status: proxy ? proxy.status : 'Unknown'
            };
        });

        // get online camera
        const onlineCameras = updatedCameras.filter(
            (camera) => camera.status === "online"
        );
        // total cameras
        const totalCamera = cameraInfo.length;
        const totalOnlineCameras = onlineCameras.length;
        const totalOfflineCameras = cameraInfo.length - totalOnlineCameras;

        // total shared cameras
        const totalSharedCameras = cameraInfo.filter(camera => camera.sharedWith?.length > 0).length;

        // total ai camera count
        const totalAiCamera = planInfo.filter(plan => plan.ai_name?.length > 0).length;

        return res.status(200).json({
            success: true,
            data: {
                totalCamera,
                totalOnlineCameras,
                totalOfflineCameras,
                totalSharedCameras,
                totalAiCamera
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

}


// last image setup
exports.saveDeviceImage = async (req, res) => {
    const { deviceId, imageUrl, timestamp } = req.body;
    console.log('body response', req.body);
    if (!deviceId || !imageUrl || !timestamp) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const camera = await Camera.findOne({ deviceId });
        if (camera) {
            // Update existing camera's imageUrl and timestamp fields
            camera.lastImage = imageUrl;
            camera.timestamp = timestamp;
            await camera.save();
        } else {
            // If the camera doesn't exist, return an error or handle accordingly
            return res.status(404).json({ error: 'Camera not found' });
        }
        console.log('Camera image updated successfully', camera);
        res.status(200).json({ message: 'Camera image updated successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
        console.log(error);
    }
}



exports.getCameras = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required in the request body."
            });
        }

        // 1. Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // 2. Get district IDs from user's AccessId
        const userDids = (user.AccessId || []).map(item => item.did).filter(Boolean);

        // 3. Fetch matching districts by did
        const matchedDistricts = await District.find(
            { did: { $in: userDids } },
            '_id dist_name accode accName did'
        );

        // 4. Convert district ObjectIds to strings
        const districtIdStrings = matchedDistricts.map(d => d._id.toString());

        // 5. Fetch all cameras whose dist_id matches any district _id
        const cameras = await Camera.find({
            dist_id: { $in: districtIdStrings }
        });

        // 6. Fetch stream data for all cameras
        const deviceIds = cameras.map(cam => cam.deviceId).filter(Boolean);
        const streams = await Stream.find({
            deviceId: { $in: deviceIds }
        });

        const streamMap = {};
        streams.forEach(s => {
            streamMap[s.deviceId] = s.is_live;
        });

        // 7. Count stats and collect deviceIds
        let totalCameras = cameras.length;
        let onlineCameras = 0;
        let offlineCameras = 0;
        const onlineDeviceIds = [];
        const offlineDeviceIds = [];

        cameras.forEach(cam => {
            const isLive = streamMap[cam.deviceId] === true;
            if (isLive) {
                onlineCameras++;
                onlineDeviceIds.push(cam.deviceId);
            } else {
                offlineCameras++;
                offlineDeviceIds.push(cam.deviceId);
            }
        });

        // 8. Map cameras by dist_id
        const camerasByDistrict = {};
        districtIdStrings.forEach(id => {
            camerasByDistrict[id] = [];
        });

        cameras.forEach(cam => {
            const distId = cam.dist_id?.toString();
            if (camerasByDistrict[distId]) {
                camerasByDistrict[distId].push(cam);
            }
        });

        // 9. Enrich districts with camera list
        const enrichedDistricts = matchedDistricts.map(d => ({
            _id: d._id,
            dist_name: d.dist_name,
            accode: d.accode,
            accName: d.accName,
            did: d.did,
            cameras: camerasByDistrict[d._id.toString()] || []
        }));

        // 10. Final response
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                isVerified: user.Isverified
            },
            matchedDistricts: enrichedDistricts,
            cameraStats: {
                totalCameras,
                onlineCameras,
                offlineCameras,
                onlineDeviceIds,
                offlineDeviceIds
            }
        });

    } catch (error) {
        console.error("Error fetching user and camera data:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve data",
            error: error.message
        });
    }
};


// Make sure you have the 'District' model imp

exports.getdistrictwiseAccess = async (req, res) => {
    try {
        const email = req.query.email;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required." });
        }

        const user = await User.findOne({ email }).lean();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        let regionQuery = {};
        if (user.role !== 'admin') {
            const userRegions = user.UserAccessibleRegions || [];
            if (userRegions.length === 0) {
                return res.status(200).json({
                    success: true,
                    user: { /* user details */ },
                    matchedDistricts: []
                });
            }
            regionQuery = { districtAssemblyCode: { $in: userRegions } };
        }

        // --- START OF THE FIX ---

        // Instead of .find(), use an aggregation pipeline to get unique districts
        const uniqueAccessibleDistricts = await District.aggregate([
            // Stage 1: Find all documents that match the user's access rights (same as your 'find' query)
            {
                $match: regionQuery
            },
            // Stage 2: Group the results by 'dist_name' to ensure uniqueness
            {
                $group: {
                    _id: "$dist_name", // Group by the field you want to be unique
                    // Keep the first document found for each unique 'dist_name'
                    // '$$ROOT' refers to the entire document
                    doc: { $first: "$$ROOT" } 
                }
            },
            // Stage 3: Promote the nested 'doc' back to the top level
            {
                $replaceRoot: { newRoot: "$doc" }
            },
            // Stage 4 (Optional but Recommended): Sort the final list alphabetically
            {
                $sort: { dist_name: 1 } // 1 for ascending, -1 for descending
            }
        ]);
        
        // --- END OF THE FIX ---

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                isVerified: user.Isverified
            },
            // Send the new, unique, and sorted list to the frontend
            matchedDistricts: uniqueAccessibleDistricts
        });

    } catch (error) {
        console.error("Error fetching user's district-wise access:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve user access data",
            error: error.message
        });
    }
};

exports.getCamerasByDistrict = async (req, res) => {
    try {
        // --- NOTE FOR FRONTEND: The 'districtId' in the URL should now be the ---
        // --- 'districtAssemblyCode' (e.g., "4" for a district or "4.1" for an assembly) ---
        const regionCode = req.params.districtId;
        
        // This function now REQUIRES an authenticated user.
        // Assuming auth middleware populates req.user
        const user = req.user; 

        if (!user) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }
        if (!regionCode) {
            return res.status(400).json({ success: false, message: "Region code (districtId) is required." });
        }

        // --- Step 1: Enforce Access Control (New Security Layer) ---
        if (user.role !== 'admin') {
            const userRegions = user.UserAccessibleRegions || [];
            // Check if user's access allows them to view the requested region.
            // e.g., A user with access to "4" can view "4.1".
            const isAllowed = userRegions.some(allowedRegion => regionCode.startsWith(allowedRegion));
            if (!isAllowed) {
                return res.status(403).json({ success: false, message: "Forbidden. You do not have access to this region." });
            }
        }

        // --- Step 2: Get Cameras using the new 'districtAssemblyCode' ---
        // Use a regex to find all cameras whose code starts with the given region code.
        const cameras = await Camera.find({
            districtAssemblyCode: { $regex: `^${regionCode}` }
        }).select('_id name deviceId isp2p productType lastImage timestamp districtAssemblyCode').lean();

        // --- Step 3: Add Online/Offline Status (Enhancement) ---
        const deviceIds = cameras.map(cam => cam.deviceId).filter(Boolean);
        let camerasWithStatus = cameras;
        if (deviceIds.length > 0) {
            const streams = await Stream.find({ deviceId: { $in: deviceIds } }, 'deviceId status').lean();
            const onlineStreamDeviceIds = new Set(streams.filter(s => s.status === true).map(s => s.deviceId));
            camerasWithStatus = cameras.map(cam => ({
                ...cam,
                status: onlineStreamDeviceIds.has(cam.deviceId) ? 'online' : 'offline'
            }));
        }

        res.status(200).json({
            success: true,
            // The top-level 'accode' is removed as it might be ambiguous now.
            // The camera objects themselves will contain the necessary identifiers.
            cameras: camerasWithStatus,
        });

    } catch (error) {
        console.error("Error fetching cameras by district (region):", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve cameras",
            error: error.message
        });
    }
};



exports.getDistrictNameByAssemblyName = async (req, res) => {
    try {
        const { email, dist_name } = req.query;

        if (!email || !dist_name) {
            return res.status(400).json({
                success: false,
                message: "Both 'email' and 'dist_name' are required as query parameters."
            });
        }

        // Step 1: Find the user by email
        const user = await User.findOne({ email }).lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with the provided email."
            });
        }

        // Step 2: Build the query to find assemblies within the specified district
        const query = {
            dist_name: dist_name,
            // Ensure we are only fetching assembly-level documents, not the main district doc itself
            accName: { $exists: true, $ne: null } 
        };

        // Step 3: Apply access control based on the new model
        if (user.role !== 'admin') {
            const userRegions = user.UserAccessibleRegions || [];
            // Add a condition to only find assemblies the user has explicit access to.
            query.districtAssemblyCode = { $in: userRegions };
        }
        // For 'admin', no additional filtering is needed; they get all assemblies in the district.

        // Step 4: Find all matching assemblies
        const assemblies = await District.find(query)
            .select('_id dist_name accName accode districtAssemblyCode')
            .lean();

        // It's not an error to find none; just return an empty array.
        return res.status(200).json({
            success: true,
            // IMPORTANT: Use the original key 'districts' to avoid breaking the frontend.
            districts: assemblies
        });

    } catch (error) {
        console.error("Error fetching districts/assemblies:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve district data.",
            error: error.message
        });
    }
};



// exports.getUserCameraStats = async (req, res) => {
//     try {
//         const  email  = req.query.email;

//         if (!email) {
//             return res.status(400).json({ success: false, message: "Email is required" });
//         }

//         const stats = await Camera.aggregate([
//             {
//                 $match: { email }
//             },
//             {
//                 $lookup: {
//                     from: "stream",
//                     localField: "deviceId",
//                     foreignField: "deviceId",
//                     as: "streamData"
//                 }
//             },
//             {
//                 $addFields: {
//                     is_live: {
//                         $ifNull: [{ $arrayElemAt: ["$streamData.is_live", 0] }, false]
//                     }
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalCameras: { $sum: 1 },
//                     onlineCameras: {
//                         $sum: {
//                             $cond: [{ $eq: ["$is_live", true] }, 1, 0]
//                         }
//                     },
//                     offlineCameras: {
//                         $sum: {
//                             $cond: [{ $ne: ["$is_live", true] }, 1, 0]
//                         }
//                     },
//                     onlineDeviceIds: {
//                         $push: {
//                             $cond: [{ $eq: ["$is_live", true] }, "$deviceId", "$$REMOVE"]
//                         }
//                     },
//                     offlineDeviceIds: {
//                         $push: {
//                             $cond: [{ $ne: ["$is_live", true] }, "$deviceId", "$$REMOVE"]
//                         }
//                     }
//                 }
//             },
//             {
//                 $addFields: {
//                     is_live: "$onlineCameras"
//                 }
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     totalCameras: 1,
//                     onlineCameras: 1,
//                     offlineCameras: 1,
//                     is_live: 1,
//                     onlineDeviceIds: 1,
//                     offlineDeviceIds: 1
//                 }
//             }
//         ]);

//         const result = stats[0] || {
//             totalCameras: 0,
//             onlineCameras: 0,
//             offlineCameras: 0,
//             is_live: 0,
//             onlineDeviceIds: [],
//             offlineDeviceIds: []
//         };

//         res.status(200).json({
//             success: true,
//             data: result
//         });

//     } catch (error) {
//         console.error("Error getting user camera stats:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };



// exports.getUserCameraStats = async (req, res) => { // Keep original name and structure
//     console.log("--- getUserCameraStats Request Start ---");
//     try { // Use try...catch as in the original function
//         const email = req.query.email;
//         if (!email) {
//             return res.status(400).json({ success: false, message: "Email is required in the request query parameters." });
//         }
//         console.log(`Processing request for email: ${email}`);

//         // 1. Find user
//         const user = await User.findOne({ email }).lean();
//         if (!user) {
//             console.log("User not found.");
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         // 2. Get user's district IDs
//         const userDids = (user.AccessId || []).map(item => item.did).filter(Boolean);
//         const baseZeroStats = { totalCameras: 0, onlineCameras: 0, offlineCameras: 0, onlineDeviceIds: [], offlineDeviceIds: [], isLiveCount: 0, connectedOnce: 0 }; // For early returns

//         if (userDids.length === 0) {
//             console.log("User has no associated DIDs.");
//             return res.status(200).json({ success: true, cameraStats: baseZeroStats });
//         }

//         // 3. Get matching District ObjectIds
//         const matchedDistricts = await District.find({ did: { $in: userDids } }, '_id').lean();
//         const districtIds = matchedDistricts.map(d => d._id);
//         if (districtIds.length === 0) {
//             console.log("No districts found matching user DIDs.");
//             return res.status(200).json({ success: true, cameraStats: baseZeroStats });
//         }

//         // 4. Get ALL camera device IDs associated with these districts
//         const userCameras = await Camera.find(
//             { dist_id: { $in: districtIds } },
//             'deviceId' // Fetch only deviceId for now
//         ).lean();

//         const totalCameras = userCameras.length;
//         const deviceIds = userCameras.map(cam => cam.deviceId).filter(Boolean); // List of all user's camera device IDs

//         console.log(`Total cameras associated with user: ${totalCameras}`);
//         console.log("Associated Device IDs:", deviceIds);

//         if (totalCameras === 0) {
//             console.log("No cameras found in associated districts.");

//             return res.status(200).json({ success: true, cameraStats: baseZeroStats });
//         }

//         // 5. Fetch stream data and determine online cameras
//         const streams = await Stream.find({ deviceId: { $in: deviceIds } }, 'deviceId is_live').lean();
//         const streamMap = {};
//         streams.forEach(s => { streamMap[s.deviceId] = s.is_live === true; }); // Ensure boolean comparison

//         const onlineDeviceIds = [];
//         const offlineDeviceIds = [];

//         deviceIds.forEach(id => { // Iterate using the comprehensive deviceIds list
//             if (streamMap[id] === true) {
//                 onlineDeviceIds.push(id);
//             } else {
//                 offlineDeviceIds.push(id);
//             }
//         });

//         const onlineCameras = onlineDeviceIds.length;
//         const offlineCameras = totalCameras - onlineCameras;
//         // isLiveCount is identical to onlineCameras based on this logic
//         const isLiveCount = onlineCameras;

//         console.log(`Currently Online Cameras Count: ${onlineCameras}`, onlineDeviceIds);
//         console.log(`Currently Offline Cameras Count: ${offlineCameras}`, offlineDeviceIds);

//         // --- Connected Once Logic (Update then Count) ---

//         // 6. OPTIONAL but recommended: Ensure flag exists
//         // Silently ensure the default value is set if the field was missing.
//         await Camera.updateMany(
//             { deviceId: { $in: deviceIds }, connectedOnceFlag: { $exists: false } },
//             { $set: { connectedOnceFlag: false } }
//         ).catch(err => console.error("Error during flag initialization:", err)); // Log error but continue

//         // 7. UPDATE: Set the flag to true for cameras that are online AND flag is currently false
//         if (onlineDeviceIds.length > 0) {
//             console.log(`Attempting to update connectedOnceFlag for ${onlineDeviceIds.length} online devices where flag is false.`);
//             try {
//                 const flagUpdateResult = await Camera.updateMany(
//                     {
//                         deviceId: { $in: onlineDeviceIds }, // Target currently online cameras
//                         connectedOnceFlag: false            // Optimization: Only if flag is currently false
//                     },
//                     { $set: { connectedOnceFlag: true } }    // Action: Set flag to true
//                 );
//                 console.log("Flag Update Result:", flagUpdateResult);
//             } catch (updateError) {
//                  console.error("ERROR during Camera flag update:", updateError);
//                  // Log error but proceed to count anyway
//             }
//         } else {
//             console.log("No cameras currently online to update flag for.");
//         }

//         // 8. COUNT: Query the database for the final count *after* the update attempt.
//         // This reads the persistent state.
//         console.log(`Counting cameras with connectedOnceFlag=true among user's devices:`, deviceIds);
//         let connectedOnceCount = 0;
//         try {
//              connectedOnceCount = await Camera.countDocuments({
//                 deviceId: { $in: deviceIds },    // Filter: ALL cameras associated with the user
//                 connectedOnceFlag: true          // Condition: Flag must be true
//             });
//             console.log(`Final database count for connectedOnce: ${connectedOnceCount}`);
//         } catch(countError) {
//              console.error("ERROR during Camera count:", countError);
//              // If count fails, maybe default to 0 or handle differently? For now, it will be 0.
//              connectedOnceCount = 0; // Default to 0 on error
//         }


//         // --- End Connected Once Logic ---

//         // 9. Final response - matching original structure
//         res.status(200).json({
//             success: true,
//             cameraStats: {
//                 totalCameras,
//                 onlineCameras,
//                 offlineCameras,
//                 onlineDeviceIds,    // Keep original fields
//                 offlineDeviceIds,   // Keep original fields
//                 isLiveCount,        // Keep original fields
//                 connectedOnce: connectedOnceCount // Use the count directly from the database query
//             }
//         });

//     } catch (error) { // Catch block from original function
//         console.error("FATAL Error in getUserCameraStats:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to retrieve camera stats",
//             error: error.message
//         });
//     }
//     console.log("--- getUserCameraStats Request End ---");
// };



exports.getUserCameraStats = async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const userDids = user.UserAccessibleRegions || [];

        const matchedDistricts = await District.find(
            { districtAssemblyCode: { $in: userDids } },
            'districtAssemblyCode'
        );

        const districtIdStrings = matchedDistricts.map(d => d.districtAssemblyCode.toString());

        const cameras = await Camera.find({ districtAssemblyCode: { $in: districtIdStrings } });
        const deviceIds = cameras.map(cam => cam.deviceId).filter(Boolean);

        const streams = await Stream.find({ deviceId: { $in: deviceIds } });

        const totalCameras = cameras.length;
        const onlineCameras = streams.filter(s => s.status === true).length;
        const offlineCameras = totalCameras - onlineCameras;
        const isLiveCount = streams.filter(s => s.is_live === true).length;

        res.status(200).json({
            success: true,
            cameraStats: {
                totalCameras,
                onlineCameras,
                offlineCameras,
                isLiveCount,
            }
        });
    } catch (error) {
        console.error("Error fetching user and camera data:", error);
        res.status(500).json({ success: false, message: "Failed to retrieve data", error: error.message });
    }
};


const buildCameraQuery = (baseQuery, type) => {
    if (type && type !== "All") {
        // Creates a Case-Insensitive Regex (e.g., matches "Indoor", "indoor", "INDOOR")
        // The 'i' flag makes it case insensitive
        // The ^ and $ ensure exact word match (so "Indoor" doesn't match "Indoors")
        baseQuery.location_Type = { $regex: new RegExp(`^${type}$`, 'i') };
    }
    return baseQuery;
};

// 1. Get User Stats (Top Cards)
exports.getUserCameraStats1= async (req, res) => {
    try {
        const { email, locationType } = req.query; 
        
        if (!email) return res.status(400).json({ success: false, message: "Email is required." });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        const userDids = user.UserAccessibleRegions || [];

        const matchedDistricts = await District.find({ districtAssemblyCode: { $in: userDids } });
        const districtIdStrings = matchedDistricts.map(d => d.districtAssemblyCode.toString());

        const uniqueDistrictNames = [...new Set(matchedDistricts.map(d => d.dist_name))];
        const districtList = uniqueDistrictNames.map(name => {
            const d = matchedDistricts.find(m => m.dist_name === name);
            return { dist_name: name, districtAssemblyCode: d ? d.districtAssemblyCode : null };
        });

        // --- FIXED FILTER LOGIC ---
        let cameraQuery = { districtAssemblyCode: { $in: districtIdStrings } };
        cameraQuery = buildCameraQuery(cameraQuery, locationType);
        // --------------------------
        
        const cameras = await Camera.find(cameraQuery);
        const deviceIds = cameras.map(cam => cam.deviceId).filter(Boolean);
        const streams = await Stream.find({ deviceId: { $in: deviceIds } });

        const totalCameras = cameras.length;
        const onlineCameras = streams.filter(s => s.status === true).length;
        const offlineCameras = totalCameras - onlineCameras;
        const isLiveCount = streams.filter(s => s.is_live === true).length;

        res.status(200).json({
            success: true,
            cameraStats: { totalCameras, onlineCameras, offlineCameras, isLiveCount },
            districts: districtList
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ success: false, message: "Error", error: error.message });
    }
};

// 2. Get District Stats (Table Rows)
exports.getDistrictCameraStats = async (req, res) => {
    try {
        const { districtCode, email, locationType } = req.query; 
        
        if (!districtCode || !email) return res.status(400).json({ success: false, message: "Required fields missing" });

        const user = await User.findOne({ email }).lean();
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const district = await District.findOne({ districtAssemblyCode: districtCode }).lean();
        if (!district) return res.status(404).json({ success: false, message: "District not found" });

        const userRegions = user.UserAccessibleRegions || [];

        const accessibleAssemblies = await District.find({
            dist_name: district.dist_name,
            districtAssemblyCode: { $in: userRegions }
        }).lean();

        const accessibleAssemblyCodes = accessibleAssemblies.map(a => a.districtAssemblyCode);

        // --- FIXED FILTER LOGIC ---
        let cameraQuery = { districtAssemblyCode: { $in: accessibleAssemblyCodes } };
        cameraQuery = buildCameraQuery(cameraQuery, locationType);
        // --------------------------

        const cameras = await Camera.find(cameraQuery);
        const deviceIds = cameras.map(camera => camera.deviceId);
        const streams = await Stream.find({ deviceId: { $in: deviceIds } });

        const totalCamera = cameras.length;
        const onlineCamera = streams.filter(s => s.status === true).length;
        const offlineCamera = totalCamera - onlineCamera;
        const isLiveCount = streams.filter(s => s.is_live === true).length;

        res.json({
            success: true,
            data: {
                districtName: district.dist_name,
                onlineCamera,
                offlineCamera,
                isLiveCount,
                totalCamera
            },
        });

    } catch (error) {
        console.error("Error fetching district stats:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 3. Get Assembly Stats (Expand Row)
exports.getAssemblyCameraStats = async (req, res) => {
    try {
        const { dist_name, email, locationType } = req.query;

        if (!dist_name || !email) return res.status(400).json({ success: false, message: "Required fields missing" });

        const user = await User.findOne({ email }).lean();
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        
        const userRegions = user.UserAccessibleRegions || [];

        const allAssembliesInDistrict = await District.find({
            dist_name: dist_name,
            accName: { $exists: true, $ne: null }
        }).lean();

        if (allAssembliesInDistrict.length === 0) return res.status(404).json({ success: false, message: "No assemblies found." });

        const accessibleAssemblies = allAssembliesInDistrict.filter(assembly =>
            userRegions.includes(assembly.districtAssemblyCode)
        );

        const assemblyStats = [];

        for (const assembly of accessibleAssemblies) {
            
            // --- FIXED FILTER LOGIC ---
            let cameraQuery = { districtAssemblyCode: assembly.districtAssemblyCode };
            cameraQuery = buildCameraQuery(cameraQuery, locationType);
            // --------------------------

            const cameras = await Camera.find(cameraQuery);
            const deviceIds = cameras.map(c => c.deviceId);
            const streams = await Stream.find({ deviceId: { $in: deviceIds } });

            const totalCamera = cameras.length;
            const onlineCamera = streams.filter(s => s.status === true).length;
            const offlineCamera = totalCamera - onlineCamera;
            const isLiveCount = streams.filter(s => s.is_live === true).length;

            assemblyStats.push({
                assemblyName: assembly.accName,
                assemblyCode: assembly.districtAssemblyCode,
                totalCamera,
                onlineCamera,
                offlineCamera,
                isLiveCount,
            });
        }

        res.json({
            success: true,
            districtName: dist_name,
            assemblies: assemblyStats
        });

    } catch (error) {
        console.error("Error fetching assembly stats:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.getAllDistrictStatsForUser = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ success: false, message: "User email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const userDids = user.UserAccessibleRegions || [];

        const matchedDistricts = await District.find(
            { districtAssemblyCode: { $in: userDids } },
            'dist_name districtAssemblyCode'
        );

        const districtGroups = new Map();
        matchedDistricts.forEach(d => {
            if (!districtGroups.has(d.dist_name)) {
                districtGroups.set(d.dist_name, []);
            }
            districtGroups.get(d.dist_name).push(d.districtAssemblyCode);
        });

        const statsPromises = Array.from(districtGroups.entries()).map(async ([districtName, codes]) => {
            const cameras = await Camera.find({ districtAssemblyCode: { $in: codes } });
            const deviceIds = cameras.map(camera => camera.deviceId);
            const streams = await Stream.find({ deviceId: { $in: deviceIds } });

            const totalCamera = cameras.length;
            const onlineCamera = streams.filter(s => s.status === true).length;
            const offlineCamera = totalCamera - onlineCamera;
            const isLiveCount = streams.filter(s => s.is_live === true).length;

            return {
                districtName,
                districtCode: codes.join(', '),
                onlineCamera,
                offlineCamera,
                isLiveCount,
                totalCamera,
            };
        });

        const allDistrictStats = await Promise.all(statsPromises);
        res.json({ success: true, data: allDistrictStats });

    } catch (error) {
        console.error("Error fetching all district camera stats:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getAllAssemblyStatsForUser = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ success: false, message: "User email is required" });
        }

        // 1. Find user and their accessible regions
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Use a Set to ensure we only have unique codes from the user's profile
        const userDids = [...new Set(user.UserAccessibleRegions || [])];

        // 2. Fetch the assembly details
        const matchedAssemblies = await District.find(
            { districtAssemblyCode: { $in: userDids } },
            'dist_name districtAssemblyCode accName'
        );

        // 3. De-duplicate: Ensure we only process each unique code once
        // This prevents the "1.1" appearing multiple times if the DB has duplicates
        const uniqueAssemblyMap = new Map();
        matchedAssemblies.forEach(item => {
            if (!uniqueAssemblyMap.has(item.districtAssemblyCode)) {
                uniqueAssemblyMap.set(item.districtAssemblyCode, item);
            }
        });

        // 4. Map through unique assemblies to get stats
        const statsPromises = Array.from(uniqueAssemblyMap.values()).map(async (assembly) => {
            const { districtAssemblyCode, dist_name, accName } = assembly;

            // Find cameras belonging ONLY to this specific assembly code
            const cameras = await Camera.find({ districtAssemblyCode });
            const deviceIds = cameras.map(camera => camera.deviceId);

            // Find streams for these specific cameras
            const streams = await Stream.find({ deviceId: { $in: deviceIds } });

            const totalCamera = cameras.length;
            const onlineCamera = streams.filter(s => s.status === true).length;
            const offlineCamera = totalCamera - onlineCamera;
            const isLiveCount = streams.filter(s => s.is_live === true).length;

            return {
                // If accName is missing/null, it shows "Assembly [Code]" instead of just the code
                accName: accName && accName !== "" ? accName : `Assembly ${districtAssemblyCode}`, 
                assemblyCode: districtAssemblyCode,
                parentDistrict: dist_name, // Used for frontend filtering
                totalCamera,
                onlineCamera,
                offlineCamera,
                isLiveCount,
            };
        });

        const allAssemblyStats = await Promise.all(statsPromises);
        
        res.json({ 
            success: true, 
            count: allAssemblyStats.length,
            data: allAssemblyStats 
        });

    } catch (error) {
        console.error("Error fetching assembly camera stats:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



// exports.getAllCameras = async (req, res) => {
//     try {
//         // --- Authentication & User Info ---
//         let userEmail = req.user?.email || req.query.email;
//         if (!userEmail) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User email not found in authenticated session or query parameter.",
//             });
//         }

//         const user = await User.findOne({ email: userEmail }).lean();
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         // --- Pagination, Search, Filter Parameters ---
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const search = req.query.search || "";
//         const statusFilter = req.query.status || "";

//         // --- Step 1: Get Accessible Districts ---
//         const userDids = (user.AccessId || []).map(item => item.did).filter(Boolean);

//         if (userDids.length === 0 && user.role !== 'admin') {
//             return res.status(200).json({
//                 success: true,
//                 message: "User has no assigned districts.",
//                 user: { _id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role },
//                 accessibleDistricts: [],
//                 cameras: [],
//                 cameraStats: { totalCameras: 0, onlineCameras: 0, offlineCameras: 0, onlineDeviceIds: [], offlineDeviceIds: [] },
//                 page: 1,
//                 limit: limit,
//                 total: 0,
//                 totalPages: 0
//             });
//         }

//         const accessibleDistricts = await District.find(
//             { districtAssemblyCode: { $in: userDids } },
//             '_id dist_name accode accName did'
//         ).lean();

//         const accessibleDistrictIdString = accessibleDistricts.map(d => d.did.toString());

//         // --- Step 2: Fetch ALL Accessible Cameras ---
//         const allAccessibleCameras = await Camera.find({
//             did: { $in: accessibleDistrictIdString }
//         }, '_id name deviceId isp2p productType lastImage timestamp did accode').lean();

//         console.log(allAccessibleCameras);
        
//         // --- Step 3: Determine Status using Stream Data ---
//         const deviceIds = allAccessibleCameras.map(cam => cam.deviceId).filter(Boolean);
//         let onlineCameras = 0;
//         let offlineCameras = 0;
//         let camerasWithStatus = [];

//         if (deviceIds.length > 0) {
//             const streams = await Stream.find({
//                 deviceId: { $in: deviceIds }
//             }, 'deviceId status').lean();

//             const streamMap = {};
//             streams.forEach(s => {
//                 streamMap[s.deviceId] = s.status === true;
//             });

//             camerasWithStatus = allAccessibleCameras.map(camera => {
//                 const isOnline = streamMap[camera.deviceId];
//                 const status = isOnline ? 'online' : 'offline';
//                 if (isOnline) onlineCameras++;
//                 else offlineCameras++;
//                 return { ...camera, status };
//             });
//         } else {
//             camerasWithStatus = allAccessibleCameras.map(camera => ({ ...camera, status: 'offline' }));
//         }

//         const totalCameras = allAccessibleCameras.length;
//         const overallOnlineDeviceIds = camerasWithStatus.filter(cam => cam.status === 'online').map(cam => cam.deviceId);
//         const overallOfflineDeviceIds = camerasWithStatus.filter(cam => cam.status === 'offline').map(cam => cam.deviceId);

//         // --- Step 4: Group cameras district-wise and assembly-wise ---
//         const districtMap = new Map();
//         accessibleDistricts.forEach(d => districtMap.set(d.did, d));

//         // const districtWiseCameras = {};
//         // const assemblyWiseCameras = {};

//         // for (const camera of camerasWithStatus) {
//         //     const district = districtMap.get(camera.did);
//         //     if (district) {
//         //         if (!districtWiseCameras[district.dist_name]) {
//         //             districtWiseCameras[district.dist_name] = [];
//         //         }
//         //         console.log("distwisecam: ",districtWiseCameras);
//         //         districtWiseCameras[district.dist_name].push(camera);
                

//         //         if (district.accode) {
//         //             if (!assemblyWiseCameras[district.accode]) {
//         //                 assemblyWiseCameras[district.accode] = [];
//         //             }
//         //             assemblyWiseCameras[district.accode].push(camera);
//         //         }
//         //     }
//         // }

//         // --- Step 5: Apply Search and Status Filters ---
//         let filteredCameras = camerasWithStatus;

//         if (search) {
//             const searchRegex = new RegExp(search, "i");
//             filteredCameras = filteredCameras.filter(camera =>
//                 searchRegex.test(camera.name) || (camera.deviceId && searchRegex.test(camera.deviceId))
//             );
//         }

//         if (statusFilter && (statusFilter === 'online' || statusFilter === 'offline')) {
//             filteredCameras = filteredCameras.filter(camera => camera.status === statusFilter);
//         }

//         // --- Step 6: Apply Pagination ---
//         const totalFilteredCount = filteredCameras.length;
//         const totalPages = Math.ceil(totalFilteredCount / limit);
//         const paginatedCameras = filteredCameras.slice((page - 1) * limit, page * limit);

//         // --- Step 7: Prepare Final Response ---
//         res.status(200).json({
//             success: true,
//             user: {
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 mobile: user.mobile,
//                 role: user.role,
//             },
//             accessibleDistricts: accessibleDistricts,
//             cameraStats: {
//                 totalCameras: totalCameras,
//                 onlineCameras: onlineCameras,
//                 offlineCameras: offlineCameras,
//                 onlineDeviceIds: overallOnlineDeviceIds,
//                 offlineDeviceIds: overallOfflineDeviceIds,
//             },
//             cameras: paginatedCameras,
//             page: page,
//             limit: limit,
//             total: totalFilteredCount,
//             totalPages: totalPages
//         });

//     } catch (error) {
//         console.error("Error fetching combined camera data:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to retrieve camera data",
//             error: error.message
//         });
//     }
// };





// exports.getAllCameras = async (req, res) => {
//     // Retrieve pagination, search, and status filter parameters from the query
//     const userId = req.user.id;
//     console.log(userId);
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
//     const search = req.query.search || ""; // Search parameter for name
//     const statusFilter = req.query.status || ""; // Filter by online/offline status
//     // const isDefaultCacheKey = search === "" && statusFilter === "";
//     // const cacheKey = cameras:${userId}:page=${page}:limit=${limit};
//     // console.log("check", cacheKey);
//     try {
//         // Check if the data is cached in Redis
//         // if (isDefaultCacheKey) {
//         //     const cachedData = await getCache(cacheKey);
//         //     if (cachedData) {
//         //         console.log("Cache hit for cameras:", cacheKey);

//         //         // Parse cached data
//         //         let responseData = JSON.parse(cachedData);

//         //         // Update status from globalProxies in real-time
//         //         responseData.cameras = responseData.cameras.map((camera) => {
//         //             const proxy = globalProxies.find((proxy) => proxy.name === camera.deviceId);
//         //             return { ...camera, status: proxy ? proxy.status : "offline" };
//         //         });

//         //         return res.status(200).json(responseData);
//         //     }
//         // }

//         // Define the aggregation pipeline to fetch cameras
//         const matchStage = {
//             $match: {
//                 userId: userId,
//                 ...(search && { name: { $regex: search, $options: "i" } }), // Match by name if search is provided
//             },
//         };

//         const projectStage = {
//             $project: {
//                 _id: 1,
//                 name: 1,
//                 deviceId: 1,
//                 isp2p: 1,
//                 productType: 1,
//                 lastImage: 1,
//                 timestamp: 1,
//             },
//         };

//         // Execute the aggregation pipeline
//         const cameras = await Camera.aggregate([matchStage, projectStage]);

//         if (!cameras.length) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No cameras found",
//             });
//         }

//         // Match each camera with its corresponding proxy status
//         const updatedCameras = cameras.map((camera) => {
//             const proxy = globalProxies.find((proxy) => proxy.name === camera.deviceId);
//             return { ...camera, status: proxy ? proxy.status : "offline" };
//         });

//         // Filter cameras based on the status filter if provided
//         const filteredCameras = statusFilter
//             ? updatedCameras.filter((camera) => camera.status === statusFilter)
//             : updatedCameras;

//         // Calculate total count for filtered cameras
//         const totalCount = filteredCameras.length;

//         // Apply pagination to the filtered cameras
//         const paginatedCameras = filteredCameras.slice(
//             (page - 1) * limit,
//             page * limit
//         );

//         // Calculate total pages
//         const totalPages = Math.ceil(totalCount / limit);

//         const responseData = {
//             success: true,
//             cameras: paginatedCameras,
//             page,
//             limit,
//             total: totalCount,
//             totalPages,
//         };

//         // Store response in cache only if both search and statusFilter are empty
//         // if (isDefaultCacheKey) {
//         //     await setCache(cacheKey, JSON.stringify(responseData), 86400);
//         // }

//         // Return the paginated and filtered results
//         res.status(200).json(responseData);
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };











// exports.getAllCameras = async (req, res) => {
//     try {
//         const { email, status: statusFilterRaw, search = "" } = req.query;

//         const validStatusFilters = ['online', 'offline', 'all'];
//         const statusFilter = validStatusFilters.includes(statusFilterRaw?.toLowerCase()) ? statusFilterRaw.toLowerCase() : 'all';

//         if (!email) {
//             return res.status(400).json({ success: false, message: "Email is required in query parameters." });
//         }

//         const user = await User.findOne({ email });

//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         const userDids = Array.isArray(user.AccessId) ? user.AccessId.map(item => item?.did).filter(Boolean) : [];

//         if (userDids.length === 0 && user.role !== 'admin') {
//             return res.status(200).json({
//                 success: true,
//                 message: "User has no assigned districts.",
//                 user: { _id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role },
//                 accessibleDistricts: [],
//                 cameras: [],
//                 cameraStats: {
//                     totalCameras: 0,
//                     onlineCameras: 0,
//                     offlineCameras: 0,
//                     onlineDeviceIds: [],
//                     offlineDeviceIds: [],
//                 }
//             });
//         }

//         const matchedDistricts = await District.find({ did: { $in: userDids } }, '_id');
//         const districtIdStrings = matchedDistricts.map(d => d._id.toString());

//         if (districtIdStrings.length === 0) {
//             return res.status(200).json({
//                 success: true,
//                 cameraStats: { totalCameras: 0, onlineCameras: 0, offlineCameras: 0 },
//                 cameras: []
//             });
//         }

//         const allUserCameras = await Camera.find({ dist_id: { $in: districtIdStrings } }).lean();

//         if (allUserCameras.length === 0) {
//             return res.status(200).json({
//                 success: true,
//                 cameraStats: { totalCameras: 0, onlineCameras: 0, offlineCameras: 0 },
//                 cameras: []
//             });
//         }

//         const deviceIds = allUserCameras.map(cam => cam.deviceId).filter(Boolean);
//         const streams = deviceIds.length > 0 ? await Stream.find({ deviceId: { $in: deviceIds } }).lean() : [];

//         const streamStatusMap = new Map();
//         streams.forEach(s => {
//             if (s.deviceId) {
//                 streamStatusMap.set(s.deviceId, s.status === true);
//             }
//         });

//         let onlineCount = 0;
//         let offlineCount = 0;

//         const camerasWithStatus = allUserCameras.map(cam => {
//             const isOnline = streamStatusMap.get(cam.deviceId) === true;
//             if (isOnline) onlineCount++;
//             else offlineCount++;
//             return { ...cam, status: isOnline ? "online" : "offline" };
//         });

//         // Apply search
//         let filteredCameras = [...camerasWithStatus];
//         if (search) {
//             const searchRegex = new RegExp(search, "i");
//             filteredCameras = filteredCameras.filter(cam =>
//                 searchRegex.test(cam.name) || (cam.deviceId && searchRegex.test(cam.deviceId))
//             );
//         }

//         // Apply status filter
//         if (statusFilter === "online") {
//             filteredCameras = filteredCameras.filter(cam => cam.status === "online");
//         } else if (statusFilter === "offline") {
//             filteredCameras = filteredCameras.filter(cam => cam.status === "offline");
//         }

//         res.status(200).json({
//             success: true,
//             user: {
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 mobile: user.mobile,
//                 role: user.role,
//             },
//             accessibleDistricts: matchedDistricts,
//             cameraStats: {
//                 totalCameras: allUserCameras.length,
//                 onlineCameras: onlineCount,
//                 offlineCameras: offlineCount,
//                 onlineDeviceIds: streams.filter(s => s.status === true).map(s => s.deviceId),
//                 offlineDeviceIds: streams.filter(s => s.status === false).map(s => s.deviceId),
//             },
//             cameras: filteredCameras
//         });

//     } catch (error) {
//         console.error("Error fetching camera data:", error);
//         res.status(500).json({ success: false, message: "Failed to retrieve camera data", error: error.message });
//     }
// };



// exports.getAllCameras = async (req, res) => {
//     try {
//         const { email, status: statusFilterRaw, search = "", page = 1, limit = 10 } = req.query;

//         const pageNumber = parseInt(page) || 1;
//         const limitNumber = parseInt(limit) || 10;
//         const validStatusFilters = ['online', 'offline', 'all'];
//         const statusFilter = validStatusFilters.includes(statusFilterRaw?.toLowerCase()) ? statusFilterRaw.toLowerCase() : 'all';

//         if (!email) {
//             return res.status(400).json({ success: false, message: "Email is required in query parameters." });
//         }

//         const user = await User.findOne({ email });

//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         const userDids = Array.isArray(user.AccessId) ? user.AccessId.map(item => item?.did).filter(Boolean) : [];

//         if (userDids.length === 0 && user.role !== 'admin') {
//             return res.status(200).json({
//                 success: true,
//                 message: "User has no assigned districts.",
//                 user: { _id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role },
//                 accessibleDistricts: [],
//                 cameras: [],
//                 cameraStats: {
//                     totalCameras: 0,
//                     onlineCameras: 0,
//                     offlineCameras: 0,
//                     onlineDeviceIds: [],
//                     offlineDeviceIds: [],
//                 },
//                 page: 1,
//                 limit: limitNumber,
//                 total: 0,
//                 totalPages: 0
//             });
//         }

//         const matchedDistricts = await District.find({ did: { $in: userDids } }, '_id');
//         const districtIdStrings = matchedDistricts.map(d => d._id.toString());

//         if (districtIdStrings.length === 0) {
//             return res.status(200).json({
//                 success: true,
//                 cameraStats: { totalCameras: 0, onlineCameras: 0, offlineCameras: 0 },
//                 cameras: [],
//                 page: pageNumber,
//                 limit: limitNumber,
//                 total: 0,
//                 totalPages: 0
//             });
//         }

//         const allUserCameras = await Camera.find({ dist_id: { $in: districtIdStrings } }).lean();

//         if (allUserCameras.length === 0) {
//             return res.status(200).json({
//                 success: true,
//                 cameraStats: { totalCameras: 0, onlineCameras: 0, offlineCameras: 0 },
//                 cameras: [],
//                 page: pageNumber,
//                 limit: limitNumber,
//                 total: 0,
//                 totalPages: 0
//             });
//         }

//         const deviceIds = allUserCameras.map(cam => cam.deviceId).filter(Boolean);
//         const streams = deviceIds.length > 0 ? await Stream.find({ deviceId: { $in: deviceIds } }).lean() : [];

//         const streamStatusMap = new Map();
//         streams.forEach(s => {
//             if (s.deviceId) {
//                 streamStatusMap.set(s.deviceId, s.status === true);
//             }
//         });

//         let onlineCount = 0;
//         let offlineCount = 0;

//         const camerasWithStatus = allUserCameras.map(cam => {
//             const isOnline = streamStatusMap.get(cam.deviceId) === true;
//             if (isOnline)
//             onlineCount++;
//             else
//             offlineCount++;
//             return { ...cam, status: isOnline ? "online" : "offline" };
//         });

//         // Apply search
//         let filteredCameras = [...camerasWithStatus];
//         if (search) {
//             const searchRegex = new RegExp(search, "i");
//             filteredCameras = filteredCameras.filter(cam =>
//                 searchRegex.test(cam.name) || (cam.deviceId && searchRegex.test(cam.deviceId))
//             );
//         }

//         // Apply status filter
//         if (statusFilter === "online") {
//             filteredCameras = filteredCameras.filter(cam => cam.status === "online");
//         } else if (statusFilter === "offline") {
//             filteredCameras = filteredCameras.filter(cam => cam.status === "offline");
//         }

//         // Pagination
//         const totalFilteredCount = filteredCameras.length;
//         const totalPages = Math.ceil(totalFilteredCount / limitNumber);
//         const paginatedCameras = filteredCameras.slice((pageNumber - 1) * limitNumber, pageNumber * limitNumber);

//         res.status(200).json({
//             success: true,
//             user: {
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 mobile: user.mobile,
//                 role: user.role,
//             },
//             accessibleDistricts: matchedDistricts,
//             cameraStats: {
//                 totalCameras: allUserCameras.length,
//                 onlineCameras: onlineCount,
//                 offlineCameras: offlineCount,
//                 onlineDeviceIds: streams.filter(s => s.status === true).map(s => s.deviceId),
//                 offlineDeviceIds: streams.filter(s => s.status === false).map(s => s.deviceId),
//             },
//             cameras: paginatedCameras,
//             page: pageNumber,
//             limit: limitNumber,
//             total: totalFilteredCount,
//             totalPages: totalPages
//         });

//     } catch (error) {
//         console.error("Error fetching camera data:", error);
//         res.status(500).json({ success: false, message: "Failed to retrieve camera data", error: error.message });
//     }
// };

// exports.getAllCameras = async (req, res) => {
//     try {
//         // --- Authentication & User Info ---
//         let userEmail = null;
//         if (req.user && req.user.email) {
//             userEmail = req.user.email;
//         } else {
//             userEmail = req.query.email;
//             if (!userEmail) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "User email not found in authenticated session or query parameter.",
//                 });
//             }
//         }

//         const user = await User.findOne({ email: userEmail }).lean();
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         // --- Pagination, Search, Filter Parameters ---
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const search = req.query.search || "";
//         const statusFilter = req.query.status || "";

//         // --- Step 1: Get Accessible Districts ---
//         const userDids = (user.AccessId || []).map(item => item.did).filter(Boolean);

//         if (userDids.length === 0 && user.role !== 'admin') {
//             return res.status(200).json({
//                 success: true,
//                 message: "User has no assigned districts.",
//                 user: { _id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role },
//                 accessibleDistricts: [],
//                 cameras: [],
//                 cameraStats: { totalCameras: 0, onlineCameras: 0, offlineCameras: 0, onlineDeviceIds: [], offlineDeviceIds: [] },
//                 page: 1,
//                 limit: limit,
//                 total: 0,
//                 totalPages: 0
//             });
//         }

//         const accessibleDistricts = await District.find(
//             { did: { $in: userDids } },
//             '_id dist_name accode accName did'
//         ).lean();

//         const accessibleDistrictIdString = accessibleDistricts.map(d => d._id.toString());

//         // --- Step 2: Fetch ALL Accessible Cameras ---
//         const allAccessibleCameras = await Camera.find({
//             dist_id: { $in: accessibleDistrictIdString }
//         }, '_id name deviceId isp2p productType lastImage timestamp dist_id').lean();

//         // --- Step 3: Determine Status using Stream Data ---
//         const deviceIds = allAccessibleCameras.map(cam => cam.deviceId).filter(Boolean);
//         let streamMap = {};

//         if (deviceIds.length > 0) {
//             const streams = await Stream.find({
//                 deviceId: { $in: deviceIds }
//             }, 'deviceId is_live').lean();

//             streams.forEach(s => {
//                 streamMap[s.deviceId] = s.is_live === true;
//             });
//         }

//         // --- Step 4: Add Status and Count Online/Offline Cameras ---
//         let totalCameras = 0;
//         let onlineCameras = 0;
//         let offlineCameras = 0;
//         // const camerasWithStatus = allAccessibleCameras.map(camera => {
//         //     const isLive = streamMap[camera.deviceId] === true;
//         //     console.log(camera.deviceId)
//         //     const status = isLive ? 'online' : 'offline';
//         //     totalCameras++;
//         //     if (isLive) {
//         //         onlineCameras++;
//         //     } else {
//         //         offlineCameras++;
//         //     }
//         //     return { ...camera, status };
//         // });

//         const camerasWithStatus = allAccessibleCameras

//         console.log(camerasWithStatus)

//         // console.log((camerasWithStatus))

//         const overallOnlineDeviceIds = camerasWithStatus.filter(cam => cam.status === 'online').map(cam => cam.deviceId).filter(Boolean);
//         const overallOfflineDeviceIds = camerasWithStatus.filter(cam => cam.status === 'offline').map(cam => cam.deviceId).filter(Boolean);

//         // --- Step 5: Apply Search and Status Filters ---
//         let filteredCameras = camerasWithStatus;

//         if (search) {
//             const searchRegex = new RegExp(search, "i");
//             filteredCameras = filteredCameras.filter(camera =>
//                 searchRegex.test(camera.name) || (camera.deviceId && searchRegex.test(camera.deviceId))
//             );
//         }

//         if (statusFilter && (statusFilter === 'online' || statusFilter === 'offline')) {
//             filteredCameras = filteredCameras.filter(camera => camera.status === statusFilter);
//         }

//         // --- Step 6: Apply Pagination ---
//         const totalFilteredCount = filteredCameras.length;
//         const totalPages = Math.ceil(totalFilteredCount / limit);
//         const paginatedCameras = filteredCameras.slice((page - 1) * limit, page * limit);

//         // --- Step 7: Prepare Final Response ---
//         res.status(200).json({
//             success: true,
//             user: {
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 mobile: user.mobile,
//                 role: user.role,
//             },
//             accessibleDistricts: accessibleDistricts,
//             cameraStats: {
//                 totalCameras: allAccessibleCameras.length, // Total accessible cameras
//                 onlineCameras: onlineCameras,              // Online count of accessible cameras
//                 offlineCameras: offlineCameras,            // Offline count of accessible cameras
//                 onlineDeviceIds: overallOnlineDeviceIds,   // Online device IDs of accessible cameras
//                 offlineDeviceIds: overallOfflineDeviceIds, // Offline device IDs of accessible cameras
//             },
//             cameras: paginatedCameras,
//             page: page,
//             limit: limit,
//             total: totalFilteredCount,
//             totalPages: totalPages
//         });

//     } catch (error) {
//         console.error("Error fetching combined camera data:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to retrieve camera data",
//             error: error.message
//         });
//     }
// };
// Assuming you have these Mongoose models defined elsewhere:
// const User = require('../models/User');
// const Camera = require('../models/Camera');
// const District = require('../models/District');
// const Stream = require('../models/Stream');

// Assuming these models are imported at the top of your file


exports.getAllCameras = async (req, res) => {
    try {
        // --- Step 1: Authentication and Parameter Parsing ---
        let userEmail = req.user?.email;
        if (!userEmail) {
            return res.status(400).json({ success: false, message: "User email not found." });
        }

        const user = await User.findOne({ email: userEmail }).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.itemsPerPage) || parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const statusFilter = req.query.sortStatus || req.query.status || "";
        const selectedDistrictName = req.query.selectedDistrictName || "";
        const selectedAssemblyValue = req.query.selectedAssemblyValue || "";
        const view = req.query.view || "list";

        const userAccessibleRegions = user.UserAccessibleRegions || [];

        if (userAccessibleRegions.length === 0 && user.role !== "admin") {
            return res.status(200).json({
                success: true,
                message: "User has no assigned regions.",
                cameras: [],
                total: 0,
                totalPages: 0
            });
        }

        // --- Step 2: Pre-fetch Accessible District/Assembly Info ---
        const baseDistrictCodes = [...new Set(userAccessibleRegions.map(r => r.split('.')[0]))];

        const districtsForUIQuery =
            user.role === "admin"
                ? {}
                : {
                      $or: baseDistrictCodes.map(code => ({
                          districtAssemblyCode: { $regex: `^${code}` }
                      }))
                  };

        const accessibleDistrictsForUI = await District.find(
            districtsForUIQuery,
            "_id dist_name accode accName districtAssemblyCode"
        ).lean();

        // --- Step 3: Dynamic Query Conditions ---
        const queryConditions = [];

        // Condition A: User Permissions
        if (user.role !== "admin") {
            queryConditions.push({
                $or: userAccessibleRegions.map(region => ({
                    districtAssemblyCode: { $regex: `^${region}` }
                }))
            });
        }

        // Condition B: District + Assembly
        if (selectedAssemblyValue && selectedDistrictName) {
            const assembly = accessibleDistrictsForUI.find(
                d => d.accName === selectedAssemblyValue && d.dist_name === selectedDistrictName
            );

            if (assembly) {
                queryConditions.push({ districtAssemblyCode: assembly.districtAssemblyCode });
            } else {
                return res.status(200).json({
                    success: true,
                    message: "Assembly not found or accessible.",
                    cameras: [],
                    total: 0
                });
            }
        }

        // Condition C: Search
        if (search) {
            const searchRegex = new RegExp(search, "i");
            queryConditions.push({
                $or: [
                    { name: searchRegex },
                    { deviceId: searchRegex },
                    { ps_id: searchRegex },
                    { "locations.loc_name": searchRegex }
                ]
            });
        }

        // --- VIEW: "mapped" ---
        if (view === "mapped") {
            const cameraQuery = queryConditions.length ? { $and: queryConditions } : {};

            const allMatchingCameras = await Camera.find(
                cameraQuery,
                "_id name deviceId isp2p productType lastImage timestamp districtAssemblyCode ps_id locations"
            ).lean();

            const regionInfoLookup = accessibleDistrictsForUI.reduce((map, d) => {
                map[d.districtAssemblyCode] = d;
                return map;
            }, {});

            const enrichedCameras = allMatchingCameras.map(cam => ({
                ...cam,
                dist_name: regionInfoLookup[cam.districtAssemblyCode]?.dist_name || "N/A",
                accName: regionInfoLookup[cam.districtAssemblyCode]?.accName || "N/A",
                accode: regionInfoLookup[cam.districtAssemblyCode]?.accode || "N/A"
            }));

            const deviceIds = enrichedCameras.map(c => c.deviceId).filter(Boolean);

            let camerasWithStatus = [];
            if (deviceIds.length) {
                const streams = await Stream.find({ deviceId: { $in: deviceIds } }, "deviceId status").lean();
                const streamMap = new Map(streams.map(s => [s.deviceId, s.status === true]));

                camerasWithStatus = enrichedCameras.map(cam => ({
                    ...cam,
                    status: streamMap.get(cam.deviceId) ? "online" : "offline"
                }));
            } else {
                camerasWithStatus = enrichedCameras.map(cam => ({ ...cam, status: "offline" }));
            }

            const districtMap = new Map();

            for (const region of accessibleDistrictsForUI) {
                const districtCode = region.districtAssemblyCode.split(".")[0];
                if (!districtMap.has(districtCode)) {
                    districtMap.set(districtCode, {
                        dist_name: region.dist_name,
                        districtCode,
                        assemblies: {}
                    });
                }

                districtMap.get(districtCode).assemblies[region.districtAssemblyCode] = {
                    accName: region.accName,
                    accode: region.accode,
                    districtAssemblyCode: region.districtAssemblyCode,
                    cameras: []
                };
            }

            for (const cam of camerasWithStatus) {
                const districtCode = cam.districtAssemblyCode.split(".")[0];
                const district = districtMap.get(districtCode);

                if (district && district.assemblies[cam.districtAssemblyCode]) {
                    district.assemblies[cam.districtAssemblyCode].cameras.push(cam);
                }
            }

            const result = Array.from(districtMap.values()).map(d => ({
                ...d,
                assemblies: Object.values(d.assemblies)
            }));

            return res.status(200).json({ success: true, view: "mapped", data: result });
        }

        // --- VIEW: "list" (paginated) ---
        // Status Filter
        if (statusFilter === "online" || statusFilter === "offline") {
            const desiredStatus = statusFilter === "online";
            const streams = await Stream.find({ status: desiredStatus }, "deviceId").lean();
            const deviceIds = streams.map(s => s.deviceId);
            queryConditions.push({ deviceId: { $in: deviceIds } });
        }

        const finalQuery = queryConditions.length ? { $and: queryConditions } : {};

        const total = await Camera.countDocuments(finalQuery);

        const paginatedCameras = await Camera.find(
            finalQuery,
            "_id name deviceId isp2p productType lastImage timestamp districtAssemblyCode ps_id locations"
        )
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const regionLookup = accessibleDistrictsForUI.reduce((map, d) => {
            map[d.districtAssemblyCode] = d;
            return map;
        }, {});

        const enriched = paginatedCameras.map(cam => {
            const info = regionLookup[cam.districtAssemblyCode];
            return {
                ...cam,
                dist_name: info?.dist_name || "N/A",
                accName: info?.accName || "N/A",
                accode: info?.accode || "N/A"
            };
        });

        const deviceIds = enriched.map(c => c.deviceId).filter(Boolean);

        let camerasWithStatus = [];
        if (deviceIds.length) {
            const streams = await Stream.find({ deviceId: { $in: deviceIds } }, "deviceId status").lean();
            const streamMap = new Map(streams.map(s => [s.deviceId, s.status === true]));

            camerasWithStatus = enriched.map(cam => ({
                ...cam,
                status: streamMap.get(cam.deviceId) ? "online" : "offline"
            }));
        } else {
            camerasWithStatus = enriched.map(cam => ({ ...cam, status: "offline" }));
        }

        return res.status(200).json({
            success: true,
            view: "list",
            cameras: camerasWithStatus,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error in getAllCameras API:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve camera data",
            error: error.message
        });
    }
};
