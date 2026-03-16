const GpsData = require('../models/GpsData');
const Camera = require("../models/cameraModel");
const  mongoose = require("mongoose");


exports.getHistory = async (req, res) => {
    try {
        const { name, date } = req.body; 
        // Example date: "2025-12-18"

        // 1. Validation
        if (!name || !date) {
            return res.status(400).json({ message: "Vehicle 'name' and 'date' are required" });
        }

        // 2. Determine which collection to open
        // We still need this because your service saves data into daily collections
        const cleanDate = date.replace(/-/g, ''); 
        const collectionName = `gpsdata_${cleanDate}`; 
        
        console.log(`Target Collection: ${collectionName}`);

        // 3. Direct DB Access
        const db = mongoose.connection.db;

        // 4. Check if Collection Exists
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length === 0) {
            return res.status(404).json({ 
                message: `No data found for date: ${date}` 
            });
        }

        // 5. Create Regex to match the Date in 'createdAt' string
        // createdAt format is "2025-12-18 11:53:36"
        // Regex "^2025-12-18" matches the start of the string
        const dateRegex = new RegExp(`^${date}`);

        // 6. Query
        const history = await db.collection(collectionName)
            .find({ 
                name: name,
                createdAt: { $regex: dateRegex } // ✅ Filter: createdAt must match the date
            }) 
            .project({            
                name: 1,
                latitude: 1,
                longitude: 1,
                totalDistance: 1,
                createdAt: 1,     // ✅ Select: Return createdAt field
                _id: 0            
            })
            .sort({ createdAt: 1 }) // ✅ Sort: Ascending by createdAt (Time)
            .toArray();

        // 7. Return Data
        if (history.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(history);

    } catch (error) {
        console.error("History API Error:", error);
        res.status(500).json({ message: "Server Error fetching history" });
    }
};
exports.getVehiclesByAssembly = async (req, res) => {
    try {
        const { districtAssemblyCode } = req.body;

        if (!districtAssemblyCode) {
            return res.status(400).json({
                success: false,
                message: "District Assembly Code is required"
            });
        }

        
        const cameras = await Camera.find(
            { districtAssemblyCode: districtAssemblyCode },
            { locations: 1, deviceId: 1, _id: 0 }
        ).lean();

        
        const vehicleList = cameras
            .filter(cam => cam.locations && cam.locations.length > 0)
            .map(cam => ({
                vehicleNo: cam.locations[0], 
                cameraId: cam.deviceId
            }))
            .sort((a, b) => a.vehicleNo.localeCompare(b.vehicleNo));

        res.json({
            success: true,
            vehicles: vehicleList
        });

    } catch (error) {
        console.error("Error fetching vehicles:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getAllGpsData = async (req, res) => {
      try {
        const { name, date } = req.body; 
        // Example date: "2025-12-18"

        // 1. Validation
        if (!name || !date) {
            return res.status(400).json({
                message: "Vehicle 'name' and 'date' are required"
            });
        }

        // 2. Dynamic Collection Name
        const cleanDate = date.replace(/-/g, '');
        const collectionName = `gpsdata_${cleanDate}`;

        console.log(`Target Collection: ${collectionName}`);

        // 3. Direct DB Access
        const db = mongoose.connection.db;

        // 4. Check Collection Exists
        const collections = await db
            .listCollections({ name: collectionName })
            .toArray();

        if (collections.length === 0) {
            return res.status(404).json({
                message: `No data found for date: ${date}`
            });
        }

        // 5. Date Regex for createdAt
        const dateRegex = new RegExp(`^${date}`);

        // 6. Query (NO projection → fetch all fields)
        const history = await db
            .collection(collectionName)
            .find({
                name: name,
                createdAt: { $regex: dateRegex }
            })
            .sort({ createdAt: 1 }) // chronological order
            .toArray();

        // 7. Response
        return res.status(200).json(history);

    } catch (error) {
        console.error("Full History API Error:", error);
        res.status(500).json({
            message: "Server Error fetching full history"
        });
    }
};
