const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    createTrack,
    getTracks,
    getTopics,
    getTopicTimeline,
    createTopic,
} = require("../controllers/dashboardController");

/*
Dashboard Cards
*/
router.get(
    "/tracks",
    protect,
    getTracks
);

router.post(
    "/tracks",
    protect,
    createTrack
);

router.post(
    "/tracks/:trackId/topics",
    protect,
    createTopic
);

/*
Open Track
*/
router.get(
    "/tracks/:trackId/topics",
    protect,
    getTopics
);

/*
Open Topic Timeline
*/
router.get(
    "/topics/:topicId/timeline",
    protect,
    getTopicTimeline
);

module.exports = router;