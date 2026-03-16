const mongoose = require('mongoose');

// --- HELPER: DYNAMIC MODEL FACTORY ---
const getDynamicLogModel = (dateString) => {
    // Input: "2025-01-29" -> Suffix: "2025_01_29"
    const suffix = dateString.replace(/-/g, '_');
    const collectionName = `Camerastopduration_${suffix}`;

    // Schema definition (needs to match your service)
    const OfflineLogSchema = new mongoose.Schema({
        name: { type: String },
        last_start_time: { type: String },
        last_close_time: { type: String },
        entryDate: { type: String },
        updateDate: { type: String }
    });

    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName];
    }
    return mongoose.model(collectionName, OfflineLogSchema, collectionName);
};

const formatMsToHHMM = (milliseconds) => {
    if (!milliseconds || milliseconds < 0) return "00:00";
    const totalMinutes = Math.floor(milliseconds / 1000 / 60);
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
};

exports.getDowntimeReport = async (req, res) => {
    try {
        // 1. Get date from query params (default to today if not provided)
        // Expected format: ?date=2025-01-29
        const targetDate = req.query.date || new Date().toISOString().split('T')[0];

        // 2. Get the dynamic model for that specific date
        const LogModel = getDynamicLogModel(targetDate);

        // 3. Run aggregation on the dynamic model
        const report = await LogModel.aggregate([
            {
                $lookup: {
                    from: 'camera',
                    localField: 'name',
                    foreignField: 'deviceId',
                    as: 'cameraDetails'
                }
            },
            { $unwind: { path: '$cameraDetails', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'district',
                    localField: 'cameraDetails.districtAssemblyCode',
                    foreignField: 'districtAssemblyCode',
                    as: 'districtDetails'
                }
            },
            { $unwind: { path: '$districtDetails', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    startTimeObj: {
                        $cond: [
                            { $and: [{ $ne: ['$last_start_time', null] }, { $ne: ['$last_start_time', ''] }] },
                            { $toDate: '$last_start_time' },
                            null
                        ]
                    },
                    endTimeObj: {
                        $cond: [
                            { $and: [{ $ne: ['$last_close_time', null] }, { $ne: ['$last_close_time', ''] }] },
                            { $toDate: '$last_close_time' },
                            '$$NOW'
                        ]
                    }
                }
            },
            {
                $addFields: {
                    durationMs: {
                        $cond: [
                            { $and: [{ $ne: ['$startTimeObj', null] }, { $ne: ['$endTimeObj', null] }] },
                            { $subtract: ['$endTimeObj', '$startTimeObj'] },
                            0
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    camera_id: '$name',
                    district: { $ifNull: ['$districtDetails.dist_name', 'N/A'] },
                    assembly: { $ifNull: ['$districtDetails.accName', 'N/A'] },
                    ps: { $ifNull: ['$cameraDetails.ps_id', 'N/A'] },
                    location: {
                        $cond: [
                            { $isArray: '$cameraDetails.locations' },
                            { $arrayElemAt: ['$cameraDetails.locations', 0] },
                            {
                                $cond: [
                                    { $ne: ['$cameraDetails.locations', null] },
                                    '$cameraDetails.locations',
                                    'N/A'
                                ]
                            }
                        ]
                    },
                    start_time: '$last_start_time',
                    close_time: '$last_close_time',
                    durationMs: 1
                }
            }
        ]);

        let totalMs = 0;
        const data = report.map(r => {
            totalMs += r.durationMs || 0;
            return {
                camera_id: r.camera_id,
                district: r.district,
                assembly: r.assembly,
                ps: r.ps,
                location: r.location,
                start_time: r.start_time,
                close_time: r.close_time,
                difference: formatMsToHHMM(r.durationMs)
            };
        });

        res.status(200).json({
            success: true,
            selectedDate: targetDate, // Added to response for clarity
            data,
            totalDowntime: formatMsToHHMM(totalMs)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: err.message
        });
    }
};
