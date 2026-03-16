const AnalyticsImage = require("../models/analyticsimage");
const Camera = require("../models/cameraModel");
const { sendMailattachment } = require("../utils/sendEmail");
const semaphore = require("../utils/semaphore");
const User = require("../models/userModel");
// const Settings = require("../models/Settings"); // Assuming Settings model is not used in the provided code
const messageMapping = {
  1: "Facial recognition",
  2: "Human Detection",
  3: "Fire & Smoke Detection",
  4: "Automatic Number Plate Recognition",
  5: "PPE kit Violation",
  6: "Object Detection",
  7: "Detecting phone usage while driving",
  8: "Monitoring head movements",
  9: "Eyes closing",
  10: "Yawning while driving",
  11: "No Seatbelt usage",
  12: "Identifying conversations with passengers",
  13: "Emotion detection",
  14: "No_Uniform",
  15: "Smoking Detection",
  16: "Unauthorized Entry detection",
  17: "Line Crossing",
  18: "Vactant Parking",
  19: "HeatMap for crowd",
  20: "Head count",
  21: "Person counting and Time analyisis in Tickt Kiosk",
  22: "Crowd Object Detection",
  23: "UnAuthorized Parking",
  24: "Human Activity detection",
  25: "Person counting and Time analysis in Ticket scanning area",
  26:"line crossing",
  27:"entry/exit",
  28:"Pre-stamped",
  29:"Medical PPE kit violation",
  30:"Gender Detection",
  31: "Object detection (Pen,Watch,Mobile)",
  32:"Fall Detection",
  33:"Sack Loading",
  34:"Sack Unloading",
  35:"Tampering Detection",
  36: "Handwash Violation",
  38: "Gloves Violation",
};

function renderSendTime(currentsendtime){
    let somevariable = currentsendtime.split("-");
    if(somevariable.length != 7 || somevariable[0].length != 4){
      return new Date("Nothing")
    }
    return new Date(Date.UTC(
      parseInt(somevariable[0]),
      parseInt(somevariable[1]) - 1,
      parseInt(somevariable[2]),
      parseInt(somevariable[3]),
      parseInt(somevariable[4]),
      parseInt(somevariable[5]),
    ));
}

// Time interval for sending emails (15 minutes in milliseconds)
const EMAIL_INTERVAL = 15 * 60 * 1000;
let intervalStartTime = Date.now(); // Initialize interval start time
let lastAnalyticsImage = null; // Variable to hold the last analytics image


// Retry logic for email sending (No changes needed here as per requirement)
async function sendMailWithRetry(analyticsImageToSend, retries = 3, delay = 2000) { // Modified to accept single analytics image
  if (!analyticsImageToSend) {
    console.log("No analytics image to send.");
    return; // Exit if no image to send
  }

  try {
    // const settings = await Settings.findOne(); // Assuming Settings model is not used in the provided code, removed it
    // if (!settings || !settings.emailEnabled) {  // Assuming Settings model is not used in the provided code, removed it
    //     console.log("Email functionality is disabled.");
    //     return; // Do not attempt to send an email
    // }

    if (!process.env.EMAIL_TO) { // Basic check if email is configured, replace with proper settings check if needed
      console.log("Email functionality is disabled or EMAIL_TO not configured.");
      return;
    }


    const streamDetail = await StreamDetails.findOne({ deviceId: analyticsImageToSend.cameradid });

    if (!streamDetail || !streamDetail.email) {
      console.error(`No email found for the camera device: ${analyticsImageToSend.cameradid}`);
      return;
    }


    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Attempt ${attempt} of ${retries}: Sending email...`);

        // Send the email with attachment (if image URL exists) - Now sending single image
        await sendMailattachment({
          analyticsImage: analyticsImageToSend, // Pass the single analytics image
          recipientEmail: process.env.EMAIL_TO // Recipient email
        });

        console.log("Email sent successfully.");
        return; // Stop retrying if email is sent successfully
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error.message);

        if (attempt === retries) {
          console.error("Max retry attempts reached. Email sending failed.");
          throw error; // Rethrow the error if max retries are reached
        }

        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
      }
    }


  } catch (error) {
    // Handle any errors outside the retry loop
    console.error("Error in sendMailWithRetry function:", error.message);
  }
}


const saveAnalyticsImage = async (req, res) => {
  try {
    await semaphore.acquire(); // Ensure only one request processes at a time

    const { cameradid, sendtime, imgurl, an_id, ImgCount, numberplateid, person_name, male_count, female_count } = req.body;

    if (!cameradid || !sendtime || !imgurl || !an_id || !ImgCount) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    let newCorrectTime = renderSendTime(sendtime);

    if (newCorrectTime == 'Invalid Date'){
      return res.status(535).json({ 
        success: false, 
        message: "Server does not read this Date and Time",
        suggestion: `Send the date in format YYYY-mm-DD-HH-MM-SS-000`, 
        recievedTimeString: `${sendtime}` });
    }

    const streamDetail = await StreamDetails.findOne({ deviceId: cameradid });

    if (!streamDetail) {
      return res.status(404).json({ success: false, message: "Camera ID not found in streamdetails table" });
    }

    const analyticsImage = new AnalyticsImage({
      cameradid,
      sendtime: newCorrectTime,
      msg: messageMapping[an_id] || "No Event Occurred",
      imgurl,
      an_id,
      ImgCount,
      numberplateid: numberplateid,
      person_name: person_name,
      male_count: male_count,
      female_count: female_count
    });

    await analyticsImage.save();

    lastAnalyticsImage = analyticsImage; // Store the latest image, overwriting the previous one

    const currentTime = Date.now();
    const intervalEndTime = intervalStartTime + EMAIL_INTERVAL;


    if (currentTime >= intervalEndTime) {
      // Send only the last image if available
      if (lastAnalyticsImage) {
        sendMailWithRetry(lastAnalyticsImage).catch(err => { // Send the last image
          console.error("Failed to send batched email:", err);
        });
        lastAnalyticsImage = null; // Clear the last image after sending
      }

      intervalStartTime = intervalEndTime; // Update interval start time for the next interval

    }


    res.status(201).json({ success: true, message: "Data saved successfully, email sending in background if interval reached", data: analyticsImage });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    semaphore.release();
  }
};
const getAnalyticsImages = async (req, res) => {
  try {
    // Step 1: Get email and date from query parameters
    const { email, date } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // Validate the date format (dd/mm/yyyy)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: "Invalid date format. Use dd/mm/yyyy." });
    }

    // --- Start of Corrected Logic ---

    // Step 2: Find the user to get their accessible regions
    const user = await User.findOne({ email }, { UserAccessibleRegions: 1 }).lean();

    if (!user || !user.UserAccessibleRegions?.length) {
      // User is valid but has no permissions, return empty array
      return res.status(200).json({ message: "User has no accessible regions.", data: [] });
    }

    const regionCodes = user.UserAccessibleRegions;

    // Step 3: Get the full camera documents the user has access to.
    // We need their details (like CameraName) to return to the frontend.
    const accessibleCameras = await Camera.find(
        { districtAssemblyCode: { $in: regionCodes } },
        { deviceId: 1, CameraName: 1, email: 1, _id: 0 ,locations:1 } // Add any other fields the frontend needs
    ).lean();
    
    if (!accessibleCameras.length) {
        return res.status(200).json({ message: "No cameras found in user's accessible regions.", data: [] });
    }
    
    // Create a list of device IDs from the cameras found
    const accessibleDeviceIds = accessibleCameras.map(cam => cam.deviceId);
    
    // Create a Map for fast lookups to add camera details later
    const cameraDetailsMap = new Map(accessibleCameras.map(cam => [cam.deviceId, cam]));

    // Step 4: Fetch the analytics images based on camera IDs and date
    const [day, month, year] = date.split("/");
    const startDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`); // UTC start of day
    const endDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);   // UTC end of day

    const analyticsImages = await AnalyticsImage.find({
        cameradid: { $in: accessibleDeviceIds }, // Filter by user's cameras
        sendtime: {                              // Filter by selected date
            $gte: startDate,
            $lte: endDate,
        },
    })
    .sort({ sendtime: -1 })
    .lean(); // Use .lean() for better performance

    // Step 5: Manually attach the camera details to each analytics image
    // This replicates what the $lookup was supposed to do.
    const responseData = analyticsImages.map(image => {
        return {
            ...image,
            cameraDetails: cameraDetailsMap.get(image.cameradid) || null // Get details from map
        };
    });

    // --- End of Corrected Logic ---

    return res
      .status(200)
      .json({ message: "Records fetched successfully", data: responseData });

  } catch (error) {
    console.error("Error fetching analytics images:", error);
    return res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
};

const getZoneWiseCounts = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const zoneMappings = {
      'Parking': [3, 4, 5, 15, 18, 22, 23],
      'Entry & Ticket area': [3, 5, 15, 19, 20, 21, 22, 24, 25],
      'Passage Area': [3, 5, 15, 19, 20, 22, 24],
      'Staff Operations': [1, 5, 15, 16],
      'Platform': [3, 5, 15, 17, 19, 20, 21, 22, 24],
      'Tunnel': [3, 5, 22]
    };

    // Optimized MongoDB query with indexing
    const cameras = await AnalyticsImage.aggregate([
      {
        $match: { cameradid: { $exists: true } } // Filter early
      },
      {
        $lookup: {
          from: "cameradetails",
          localField: "cameradid",
          foreignField: "deviceId",
          as: "cameraDetails"
        }
      },
      {
        $match: { "cameraDetails.email": email } // Filter after lookup
      },
      {
        $group: { _id: "$an_id", count: { $sum: 1 } } // Aggregate counts
      }
    ]);

    // Convert to map for quick lookup
    const anIdCounts = Object.fromEntries(cameras.map(({ _id, count }) => [_id, count]));

    // Calculate zone-wise counts efficiently
    const zoneCounts = Object.entries(zoneMappings).map(([zone, ids]) => ({
      zone,
      totalCameras: ids.reduce((sum, id) => sum + (anIdCounts[id] || 0), 0)
    }));

    res.status(200).json({ success: true, zoneCounts });
  } catch (error) {
    console.error('Error fetching zone counts:', error);
    res.status(500).json({ message: "Error fetching zone counts", error: error.message });
  }
};

module.exports = { saveAnalyticsImage, getAnalyticsImages, getZoneWiseCounts };