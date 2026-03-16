const axios = require("axios");
const https = require("https");
const aiEvent = require("../models/aiEvent");
const Camera = require("../models/cameraModel");
const Plan = require("../models/planModel");
const futureAlerts = require("../models/futureAlerts");
const blobfuseMountDirectory = "/etc/blobfuse/temp";
const arcisGPT = require("../models/gptData");
const gptSession = require("../models/gptSession");
const mongoose = require('mongoose');

let storedImageUrls = new Set();
let imageCount = 0;

let storedClipUrls = new Set();
let clipCount = 0;

// Create an httpsAgent with custom settings
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

// move file to blobfuse
const moveFileToBlobfuse = async (fileUrl, userId, modelName, callback) => {
    try {
        // Extracting the file name from the URL
        const fileName = fileUrl.split("/").pop();

        // Determine if the file is an image or clip based on the file extension or MIME type
        const isImage = fileName.match(/\.(jpg|jpeg|png|gif)$/i);
        const fileType = isImage ? "images" : "clips";

        // Get today's date folder path
        const today = new Date();
        const todayDateFolder = `${today.getFullYear()}-${(today.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

        // Define the directory path
        const directoryPath = path.join(
            blobfuseMountDirectory,
            userId,
            "retrain_dataset",
            modelName,
            fileType,
            todayDateFolder
        );

        // Create the directory structure if it does not exist
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        // Full path to save the file
        const filePath = path.join(directoryPath, fileName);

        // Fetch file data
        const response = await axios.get(fileUrl, { responseType: "stream" });

        // Create a write stream to save the file
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        writer.on("finish", async () => {
            try {
                const blockBlobClient = containerClient.getBlockBlobClient(
                    `${userId}/${modelName}/${fileType}/${todayDateFolder}/${fileName}`
                );
                await blockBlobClient.uploadFile(filePath);
                fs.unlinkSync(filePath); // Remove file after upload

                // console.log(`File ${fileName} stored successfully at ${blockBlobClient.url}`);
                callback(null, fileName);
            } catch (uploadError) {
                console.error(
                    `Error uploading file to Blob Storage: ${uploadError.message}`
                );
                callback(uploadError);
            }
        });

        writer.on("error", (err) => {
            console.error(`Error writing file to ${filePath}: ${err.message}`);
            callback(err);
        });
    } catch (error) {
        console.error(`Error moving file URL to folder: ${error.message}`);
        // callback(error);
    }
};


// CREATE AI EVENT DATA
exports.createData = async (req, res) => {
    try {
        // Save the new Data document to the database
        if (
            !req.body.deviceId ||
            !req.body.sendtime ||
            !req.body.imgurl ||
            req.body.ImgCount === undefined ||
            req.body.ImgCount === null ||
            !req.body.userId ||
            !req.body.modelname ||
            !req.body.dvr_plan
        ) {
            // console.log(req.body);
            // https://media.arcisai.io:5080/mp4/dvr_plan/cameraid/events/modelname/(imagefile)
            return res
                .status(403)
                .json({ statusCode: 403, message: "Missing Required Field" });
        }

        const aiEventData = await aiEvent.create(req.body);

        return res.status(200).json({
            statusCode: 200,
            message: "Data created successfully",
            data: aiEventData,
        });
    } catch (error) {
        console.error("Error creating data:", error);
        res.status(500).json({ message: "Internal Server Error" }); // Respond with an error message
    }
};

// Controller to handle GET requests
exports.getData = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page, default is 1
        const limit = parseInt(req.query.limit) || 80; // Items per page, default is 20

        const totalBoxes = await aiEvent.countDocuments();
        const totalPages = Math.ceil(totalBoxes / limit);

        const skip = (page - 1) * limit;

        // Fetch all data from the database
        const allData = await aiEvent.find().skip(skip).limit(limit);

        res.status(200).json({ allData, totalPages, totalBoxes }); // Respond with the fetched data
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal server error" }); // Respond with an error message
    }
};

// get data by userid
exports.getDataByUserId = async (req, res) => {
    try {
        const { pageNumber = 1, limit = 50 } = req.body;

        const skip = (pageNumber - 1) * limit;

        // Aggregate to get cameraId and img_count for each cameraId
        const cameraImgCounts = await aiEvent.aggregate([
            { $match: { userId: req.user.id } },
            {
                $group: {
                    _id: "$deviceId",
                    img_count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
            {
                $skip: skip,
            },
            {
                $limit: limit,
            },
            {
                $project: {
                    cameraid: "$_id",
                    img_count: 1,
                    _id: 0,
                },
            },
        ]);

        return res.status(200).json({ cameraImgCounts });
    } catch (error) {
        console.error("Error fetching data:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// get ai cameras by userid
exports.getAiCameras = async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Fetch plans associated with the userId
      const plans = await Plan.find({ userId });
  
      if (!plans || plans.length === 0) {
        return res.status(404).json({ message: "No plans found for this user." });
      }
  
      // Extract deviceIds from plans where ai_name exists
      const deviceIds = plans
        .filter((plan) => plan.ai_name && plan.ai_name.length > 0)
        .map((plan) => plan.deviceId);
  
      // Fetch camera names based on found deviceIds
      const cameras = await Camera.find(
        { deviceId: { $in: deviceIds } },
        "deviceId name"
      );
  
      return res.status(200).json({ total: cameras.length, cameras });
    } catch (error) {
      console.error("Error fetching AI Cameras by User ID:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  };

// get data by date
exports.getDataByDate = async (req, res) => {
  try {
    const {
      pageNumber = 1,
      limit = 50,
      date,
      deviceId,
      modelname,
      from,
      to,
    } = req.body; // Added from and to parameters

    const selectedDate = date;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(selectedDate)) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    const targetDate = `${selectedDate} 00:00:00`;
    const nextDay = new Date(selectedDate); // Convert to Date object
    nextDay.setDate(nextDay.getDate() + 1); // Add 1 day

    const nextDayString = `${nextDay.getFullYear()}-${String(
      nextDay.getMonth() + 1
    ).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")} 00:00:00`;

    let fromTime = targetDate; // Default to start of the day
    let toTime = nextDayString; // Default to start of next day

    // Parse 'from' time if provided
    if (from) {
      const fromDateTime = `${selectedDate} ${from}`;
      fromTime = fromDateTime;
    }

    // Parse 'to' time if provided
    if (to) {
      const toDateTime = `${selectedDate} ${to}`;
      toTime = toDateTime;
    }

    // Construct query with time filtering
    const query = {
      userId: req.user.id,
      sendtime: {
        $gte: fromTime, // Use fromTime in IST
        $lt: toTime, // Use toTime in IST
      },
    };

    if (Array.isArray(deviceId) && deviceId.length > 0) {
      query.$or = deviceId.map((id) => ({
        deviceId: { $regex: id, $options: "i" }, // Partial & case-insensitive match
      }));
    } else if (typeof deviceId === "string" && deviceId.trim() !== "") {
      query.deviceId = { $regex: deviceId, $options: "i" };
    }

    if (modelname && modelname.length > 0) {
      query.modelname = modelname;
    }

    const skip = (pageNumber - 1) * limit;
    const totalBoxes = await aiEvent.countDocuments(query);
    const totalPages = Math.ceil(totalBoxes / limit);

    const allData = await aiEvent
      .find(query)
      .sort({ sendtime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Extract deviceIds from response
    const deviceIds = allData.map((item) =>
      item.deviceId.replace(/^RTSP-/, "")
    );

    // Fetch cameras
    const cameras = await Camera.find().lean();
    const cameraMap = new Map(
      cameras.map((cam) => [cam.deviceId.replace(/^RTSP-/, ""), cam.name])
    );

    // Attach camera names
    const responseData = allData.map((item) => ({
      ...item,
      cameraName:
        cameraMap.get(item.deviceId.replace(/^RTSP-/, "")) || "Unknown",
    }));

    res
      .status(200)
      .json({ allData: responseData, totalPages, page: pageNumber });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// get model names
exports.getModelNames = async (req, res) => {
    try {
        const userId = req.user.id;
        const modelNames = await aiEvent.find({ userId }).distinct("modelname");

        res.status(200).json({ modelNames });
    } catch (error) {
        console.error("Error fetching model names:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// get image count
exports.getImageCount = async (req, res) => {
    try {
        const { modelname, date } = req.query;

        if (!modelname || !date) {
            return res.status(400).json({ message: "modelname, date are required" });
        }

        // Step 1: Fetch data based on the modelname and userId
        const allData = await aiEvent.find({ modelname, userId: req.user.id });

        // Step 2: Filter the fetched data based on the input date
        const filteredData = allData.filter((data) => {
            // Extract the date part from sendtime and compare it with the input date
            const dataDate = data.sendtime.split(" ")[0];
            return dataDate === date;
        });

        // Step 3: Calculate the sum of all images
        let totalImages = 0;
        filteredData.forEach((data) => {
            totalImages += data.ImgCount;
        });

        // Step 4: Calculate the average image count for the whole day
        const averageImageCount = Math.ceil(totalImages / filteredData.length);

        // console.log(averageImageCount)
        res.status(200).json({ averageImageCount }); // Respond with the average image count
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal server error" }); // Respond with an error message
    }
};


// store image
exports.storeImage = (req, res) => {
    const { imageUrls, modelName } = req.body;

    if (!imageUrls || !modelName || !Array.isArray(imageUrls)) {
        return res.status(400).json({
            error:
                "Image URLs, Customer ID, and Model Name are required, and imageUrls should be an array",
        });
    }

    let storedImages = [];
    let failedImages = [];

    const storeNextImage = (index) => {
        if (index >= imageUrls.length) {
            // console.log(`Processed all images. Total stored images: ${imageCount}`);
            if (imageCount >= 100) {
                // console.log('Minimum 100 images stored. Exiting.');
                return res.status(200).json({
                    message: "Minimum 100 images stored",
                    storedImages,
                    failedImages,
                });
            }
            return res.status(200).json({ storedImages, failedImages });
        }

        const imageUrl = imageUrls[index];

        if (storedImageUrls.has(imageUrl)) {
            // console.log(`Image URL ${imageUrl} already stored.`);
            storedImages.push({ imageUrl, status: "already stored" });
            return storeNextImage(index + 1);
        }

        moveFileToBlobfuse(imageUrl, userId, modelName, (err, imageName) => {
            if (err) {
                // console.log(`Failed to store image ${imageUrl}. Error: ${err.message}`);
                failedImages.push({ imageUrl, error: err.message });
            } else {
                storedImageUrls.add(imageUrl);
                imageCount++;
                storedImages.push({ imageUrl, imageName, status: "stored" });
            }
            storeNextImage(index + 1);
        });
    };

    storeNextImage(0);
};


// get camera ids by user
exports.getCameraIdsByCustomer = async (req, res) => {
    try {
        const cameraIds = await aiEvent.distinct("deviceId", {
            userId: req.user.id,
        });
        // Respond with the list of cameraIds
        return res.status(200).json(cameraIds);
    } catch (error) {
        console.error("Error fetching camera IDs:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
