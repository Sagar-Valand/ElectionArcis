const stream = require("../models/streamModel");

// get stream by cameraObjectId
exports.getStreamByCameraObjectId = async (req, res) => {
    try {
        const { cameraObjectId } = req.query;
        const streamData = await stream.aggregate([
            { $match: { cameraObjectId: cameraObjectId } }, // Filter by cameraObjectId
            { $project: { __v: 0 } } // Exclude the __v field
        ]);

        if (!streamData) {
            return res.status(404).json({ message: "Stream not found" });
        }

        res.status(200).json({
            success: true,
            data: streamData
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// update stream
exports.updateStream = async (req, res) => {
    try {
        const { cameraObjectId } = req.query;
        const streamData = await stream.updateOne(
            { cameraObjectId: cameraObjectId },
            req.body,
            { upsert: true }
        )
        res.status(200).json(streamData);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// get All streams
exports.getAllStreams = async (req, res) => {
    try {
        const streamData = await stream.find({}).select("-__v -_id");
        res.status(200).json(streamData);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }

}