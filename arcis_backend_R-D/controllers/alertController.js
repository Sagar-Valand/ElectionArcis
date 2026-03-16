const  Alerts = require('../models/alterModel');

// exports.getReportByEmail = async (req, res) => {
//     console.log("getReportByEmail called");
//     try {
//         const { deviceSN, date } = req.query;
//         const email = req.user?.email;

//         if (!email) {
//             return res.status(400).json({ message: "Email is required" });
//         }

//         // Default date to today's date if not provided
//         const targetDate = date 
//             ? new Date(date).toISOString().split("T")[0] 
//             : new Date().toISOString().split("T")[0];

//         // Build query dynamically
//         const query = { email };
//         if (deviceSN) query.deviceSN = deviceSN;

//         // Use aggregation pipeline for efficient filtering and grouping
//         const pipeline = [
//             { $match: query }, // Match based on email and optional deviceSN
//             {
//                 $project: {
//                     deviceSN: 1,
//                     eventType: 1,
//                     timeStampDate: { $substr: ["$timeStamp", 0, 10] }, // Extract date part from timeStamp
//                 },
//             },
//             { $match: { timeStampDate: targetDate } }, // Filter by target date
//             {
//                 $group: {
//                     _id: "$eventType",
//                     count: { $sum: 1 },
//                 },
//             },
//         ];

//         const data = await Alerts.aggregate(pipeline);

//         // Calculate total count and event type counts
//         const totalCount = data.reduce((sum, item) => sum + item.count, 0);
//         const eventTypeCounts = data.reduce((acc, item) => {
//             acc[item._id] = item.count;
//             return acc;
//         }, {});

//         // Send response
//         res.status(200).json({
//             totalCount,
//             eventTypeCounts,
//             filtersApplied: {
//                 email,
//                 deviceSN: deviceSN || "All Devices",
//                 date: targetDate,
//             },
//         });
//     } catch (error) {
//         console.error("Error generating report:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

exports.getReportByEmail = async (req, res) => {
  try {
    const { deviceSN, date, eventType } = req.query;
    const email = req.user.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Default date to today's date if not provided
    const targetDate = date
      ? new Date(date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    // Build query dynamically
    const query = { email };
    if (deviceSN) query.deviceSN = deviceSN;

    // Predefined event types
    const predefinedEventTypes = [
      "MOTION",
      "HD",
      "FD",
      "REGIONENTER",
      "REGIONEXIT",
      "LINECROSS",
      "INTRUDE",
      "UNATTEND",
      "OBJREMOVE",
      "ARCIS",
    ];

    // Use aggregation pipeline for efficient filtering and grouping
    const pipeline = [
      { $match: query }, // Match based on email and optional deviceSN
      {
        $project: {
          deviceSN: 1,
          eventType: 1,
          timeStampDate: { $substr: ["$timeStamp", 0, 10] }, // Extract date part from timeStamp
        },
      },
      { $match: { timeStampDate: targetDate } }, // Filter by target date
    ];

    // Add eventType filter if provided
    if (eventType) {
      pipeline.push({ $match: { eventType } });
    }

    pipeline.push({
      $group: {
        _id: "$eventType",
        count: { $sum: 1 },
      },
    });

    const data = await Alerts.aggregate(pipeline);

    // Ensure all predefined event types are included
    const eventTypeCounts = predefinedEventTypes.reduce((acc, eventType) => {
      acc[eventType] = 0; // Initialize with 0
      return acc;
    }, {});

    // Update counts for event types present in the data
    data.forEach((item) => {
      eventTypeCounts[item._id] = item.count;
    });

    // Calculate total count
    const totalCount = Object.values(eventTypeCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    // eventTypeCounts["TOTAL"] = totalCount; // Assign total count to "TOTAL"

    // Send response
    res.status(200).json({
      success: true,
      totalCount,
      eventTypeCounts,
      filtersApplied: {
        email,
        deviceSN: deviceSN || "All Devices",
        date: targetDate || "Today",
        eventType: eventType || "All Event Types",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getTabularReports = async (req, res) => {
  try {
    const {
      deviceSN,
      date,
      eventType,
      page = 1,
      limitPerPage = 10,
    } = req.query;
    const email = req.user.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Default date to today's date if not provided
    const targetDate = date
      ? new Date(date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    // Build query dynamically
    const query = { email };
    if (deviceSN) query.deviceSN = deviceSN;

    // Prepare pagination
    const limit = parseInt(limitPerPage, 10) || 10; // Limit per page
    const skip = (parseInt(page, 10) - 1) * limit; // Skip for pagination

    // Define aggregation pipeline
    const pipeline = [
      { $match: query }, // Match based on email and optional deviceSN
      {
        $project: {
          deviceSN: 1,
          eventType: 1,
          timeStamp: 1,
          timeStampDate: { $substr: ["$timeStamp", 0, 10] }, // Extract date part from timeStamp
          imageUrl: 1,
        },
      },
      { $match: { timeStampDate: targetDate } }, // Filter by target date
    ];

    // Add eventType filter if provided
    if (eventType) {
      pipeline.push({ $match: { eventType } });
    }

    pipeline.push(
      { $sort: { timeStamp: -1 } }, // Sort by timeStamp descending
      { $skip: skip }, // Skip for pagination
      { $limit: limit } // Limit results for the page
    );

    const data = await Alerts.aggregate(pipeline);

    // Count total matching records
    const totalRecords = await Alerts.countDocuments({
      ...query,
      timeStamp: { $regex: `^${targetDate}` },
      ...(eventType ? { eventType } : {}),
    });

    // Prepare paginated response
    res.status(200).json({
      success: true,
      page: parseInt(page, 10),
      limitPerPage: limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data, // Tabular data
      filtersApplied: {
        email,
        deviceSN: deviceSN || "All Devices",
        date: targetDate, // Default or provided date
        eventType: eventType || "All Event Types",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};