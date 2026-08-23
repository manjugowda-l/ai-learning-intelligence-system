const dashboardService = require("../services/dashboardService");

const createTrack = async (req, res) => {
    try {
        console.log(req.headers);
        console.log(req.body);
        const track = await dashboardService.createManualTrack(

            req.user.id,
            req.body.trackName
        );

        res.status(201).json(track);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const getTracks = async (req, res) => {
    try {
        const tracks =
            await dashboardService.getDashboardTracks(
                req.user.id
            );

        res.status(200).json(tracks);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const getTopics = async (req, res) => {
    try {
        const topics =
            await dashboardService.getTopicsInTrack(
                req.user.id,
                req.params.trackId
            );

        res.status(200).json(topics);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const getTopicTimeline = async (req, res) => {
    try {
        const { topicId } = req.params;

        const timeline =
            await dashboardService.getTopicTimeline(
                req.user.id,
                topicId
            );

        return res.status(200).json({
            success: true,
            data: timeline,
        });
    } catch (error) {
        console.error(
            "Failed to get topic timeline:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const createTopic = async (req, res) => {
    try {
        const topic =
            await dashboardService.addTopicToTrack(
                req.user.id,
                req.params.trackId,
                req.body.topicName
            );

        return res.status(201).json(topic);

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    createTrack,
    getTracks,
    getTopics,
    getTopicTimeline,
    createTopic,
};