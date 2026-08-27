const Dashboard = require("../models/Dashboard");
const Activity = require("../models/Activity");

/*
Normalize names before comparing them.

Examples:

"Computer Networks"
→ "computer networks"

"Computer-Networks"
→ "computer networks"

"Computer  Networks"
→ "computer networks"
*/
const normalizeName = (value) => {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[-_&]+/g, " ")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ");
};

/*
Normalize individual words so that common
variations such as:

network
networks
networking

can be compared more reliably.

This is intentionally conservative.
*/
const normalizeToken = (token) => {
    let word = token;

    if (word.length > 5 && word.endsWith("ing")) {
        word = word.slice(0, -3);
    }

    if (word.length > 4 && word.endsWith("ies")) {
        word = word.slice(0, -3) + "y";
    } else if (
        word.length > 4 &&
        word.endsWith("s") &&
        !word.endsWith("ss")
    ) {
        word = word.slice(0, -1);
    }

    return word;
};

const getTokens = (value) => {
    return normalizeName(value)
        .split(" ")
        .filter(Boolean)
        .map(normalizeToken);
};

const getNormalizedTokenSet = (value) => {
    return new Set(getTokens(value));
};

/*
Simple Levenshtein distance.

Used only as an additional signal,
not as the only matching rule.
*/
const levenshteinDistance = (a, b) => {
    const rows = a.length + 1;
    const cols = b.length + 1;

    const matrix = Array.from(
        { length: rows },
        () => Array(cols).fill(0)
    );

    for (let i = 0; i < rows; i++) {
        matrix[i][0] = i;
    }

    for (let j = 0; j < cols; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i < rows; i++) {
        for (let j = 1; j < cols; j++) {
            const cost =
                a[i - 1] === b[j - 1] ? 0 : 1;

            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[rows - 1][cols - 1];
};

/*
Returns a value between 0 and 1.

1   = identical
0   = completely different
*/
const stringSimilarity = (a, b) => {
    const left = normalizeName(a);
    const right = normalizeName(b);

    if (!left || !right) {
        return 0;
    }

    if (left === right) {
        return 1;
    }

    const distance =
        levenshteinDistance(left, right);

    return (
        1 -
        distance /
            Math.max(left.length, right.length)
    );
};

/*
Token similarity.

Example:

Computer Networking
→ computer, network

Computer Networks
→ computer, network

Similarity = 1
*/
const tokenSimilarity = (a, b) => {
    const left = getNormalizedTokenSet(a);
    const right = getNormalizedTokenSet(b);

    if (!left.size || !right.size) {
        return 0;
    }

    let intersection = 0;

    for (const token of left) {
        if (right.has(token)) {
            intersection++;
        }
    }

    const union = new Set([
        ...left,
        ...right,
    ]).size;

    return intersection / union;
};

/*
Final matching decision.

Exact normalized match:
100% confidence.

Otherwise we combine:
- token similarity
- string similarity

A high threshold prevents unrelated
topics from being merged accidentally.
*/
const namesMatch = (first, second) => {
    const normalizedFirst =
        normalizeName(first);

    const normalizedSecond =
        normalizeName(second);

    if (
        normalizedFirst &&
        normalizedFirst === normalizedSecond
    ) {
        return true;
    }

    const tokenScore =
        tokenSimilarity(first, second);

    const stringScore =
        stringSimilarity(first, second);

    const score =
        tokenScore * 0.7 +
        stringScore * 0.3;

    return score >= 0.85;
};
/*
Create dashboard if it does not exist
*/
const getOrCreateDashboard = async (userId) => {
    let dashboard = await Dashboard.findOne({ userId });

    if (!dashboard) {
        dashboard = await Dashboard.create({
            userId,
            tracks: [],
        });
    }

    return dashboard;
};

/*
Manual Track Creation
Frontend:
+ Add Track
*/
const createManualTrack = async (userId, trackName) => {

    const dashboard = await getOrCreateDashboard(userId);

    const existingTrack = dashboard.tracks.find(
        (track) =>
            namesMatch(track.name, trackName)
    );

    if (existingTrack) {
        throw new Error("Track already exists");
    }

    dashboard.tracks.push({
        name: trackName,
        isManual: true,
        topics: [],
    });

    await dashboard.save();

    return dashboard.tracks[
        dashboard.tracks.length - 1
    ];
};

/*
Dashboard Cards
*/
const getDashboardTracks = async (userId) => {

    const dashboard = await getOrCreateDashboard(userId);

    return dashboard.tracks.map((track) => ({
        id: track._id,

        name: track.name,

        isManual: track.isManual,

        topicCount: track.topics.length,

        lastActive:
            track.topics.length > 0
                ? track.topics.reduce(
                      (latest, topic) =>
                          topic.lastActive > latest
                              ? topic.lastActive
                              : latest,
                      track.topics[0].lastActive
                  )
                : null,
    }));
};

/*
Open Track
Topics are created later by AI.
Frontend:
DSA
↓
Arrays
Trees
Graphs
*/
const getTopicsInTrack = async (
    userId,
    trackId
) => {

    const dashboard = await getOrCreateDashboard(userId);

    const track = dashboard.tracks.id(trackId);

    if (!track) {
        throw new Error("Track not found");
    }

    return track.topics.map((topic) => ({
        id: topic._id,

        name: topic.name,

        isManual: topic.isManual,

        activityCount:
            topic.activities.length,

        lastActive: topic.lastActive,
    }));
};

/*
Open Topic Timeline
Frontend:
Arrays
↓
15 June → Sliding Window
14 June → Kadane
*/
const getTopicTimeline = async (
    userId,
    topicId
) => {
    const dashboard =
        await getOrCreateDashboard(userId);

    let targetTopic = null;
    let targetTrack = null;

    for (const track of dashboard.tracks) {
        const topic = track.topics.id(topicId);

        if (topic) {
            targetTopic = topic;
            targetTrack = track;
            break;
        }
    }

    if (!targetTopic) {
        throw new Error("Topic not found");
    }

    const activityIds =
        targetTopic.activities.map(
            (item) => item.activityId
        );

    const activities = await Activity.find({
        _id: {
            $in: activityIds,
        },
        userId,
    }).sort({
        startedAt: -1,
    });

    return {
        track: {
            id: targetTrack._id,
            name: targetTrack.name,
        },

        topic: {
            id: targetTopic._id,
            name: targetTopic.name,
        },

        activityCount: activities.length,

        activities: activities.map(
            (activity) => ({
                id: activity._id,

                title: activity.title,

                url: activity.url,

                platform: activity.platform,

                sourceType:
                    activity.sourceType,

                duration:
                    activity.duration,

                activeStudyTime:
                    activity.activeStudyTime,

                startedAt:
                    activity.startedAt,

                completedAt:
                    activity.completedAt,

                classification:
                    activity.classification,
            })
        ),
    };
};

/*
These functions are NOT used now.
AI Layer will use them later.
*/

/*
AI:
Creates Topics
*/
const addTopicToTrack = async (
    userId,
    trackId,
    topicName
) => {

    const dashboard = await getOrCreateDashboard(userId);

    const track = dashboard.tracks.id(trackId);

    if (!track) {
        throw new Error("Track not found");
    }

    const existingTopic =
        track.topics.find(
            (topic) =>
                namesMatch(
                    topic.name,
                    topicName
                )
        );

    if (existingTopic) {
        throw new Error("Topic already exists");
    }

    track.topics.push({
        name: topicName.trim(),
        isManual: true,
        activities: [],
        lastActive: null,
    });

    await dashboard.save();

    return track.topics[
        track.topics.length - 1
    ];
};

/*
AI:
Links Activities
*/
const linkActivityToTopic = async (
    userId,
    topicId,
    activityId,
    summaryId = null
) => {

    const dashboard = await getOrCreateDashboard(userId);

    let targetTopic = null;

    dashboard.tracks.forEach((track) => {

        const topic = track.topics.id(topicId);

        if (topic) {
            targetTopic = topic;
        }
    });

    if (!targetTopic) {
        throw new Error("Topic not found");
    }

    targetTopic.activities.push({
        activityId,
        summaryId,
    });

    targetTopic.lastActive = new Date();

    await dashboard.save();

    return targetTopic;
};


const getOrCreateAITrack = async (
    userId,
    trackName
) => {
    const dashboard =
        await getOrCreateDashboard(userId);

    let track = dashboard.tracks.find(
        (track) =>
            namesMatch(
                track.name,
                trackName
            )
    );

    if (!track) {
        dashboard.tracks.push({
            name: trackName.trim(),
            isManual: false,
            topics: [],
        });

        await dashboard.save();

        track =
            dashboard.tracks[
                dashboard.tracks.length - 1
            ];
    }

    return track;
};

/*
AI Classification → Dashboard Integration

classification:
{
    track: "Data Structures & Algorithms",
    topic: "Graph Traversal",
    ...
}
*/
const integrateClassification = async (
    userId,
    activityId,
    classification
) => {
    if (
        !classification?.track ||
        !classification?.topic
    ) {
        throw new Error(
            "Classification track and topic are required"
        );
    }

    const dashboard =
        await getOrCreateDashboard(userId);

    /*
    STEP 1:
    Find an existing track.

    namesMatch() handles:
    - case differences
    - spaces
    - hyphens
    - underscores
    - singular/plural
    - common word-form differences
    - small spelling differences
    */

    let track = dashboard.tracks.find(
        (existingTrack) =>
            namesMatch(
                existingTrack.name,
                classification.track
            )
    );

    /*
    STEP 2:
    If no existing track matches,
    create a new AI track.
    */

    if (!track) {
        dashboard.tracks.push({
            name: classification.track.trim(),
            isManual: false,
            topics: [],
        });

        track =
            dashboard.tracks[
                dashboard.tracks.length - 1
            ];
    }

    /*
    STEP 3:
    Search for the topic ONLY inside
    the matched track.
    */

    let topic = track.topics.find(
        (existingTopic) =>
            namesMatch(
                existingTopic.name,
                classification.topic
            )
    );

    /*
    STEP 4:
    If the topic doesn't exist,
    create an AI topic.
    */

    if (!topic) {
        track.topics.push({
            name: classification.topic.trim(),
            isManual: false,
            activities: [],
            lastActive: new Date(),
        });

        topic =
            track.topics[
                track.topics.length - 1
            ];
    }

    /*
    STEP 5:
    Prevent the same activity from
    being linked more than once.
    */

    const alreadyLinked =
        topic.activities.some(
            (item) =>
                item.activityId.toString() ===
                activityId.toString()
        );

    if (!alreadyLinked) {
        topic.activities.push({
            activityId,
            summaryId: null,
            linkedAt: new Date(),
        });
    }

    /*
    STEP 6:
    Every time an activity is classified
    into this topic, update lastActive.
    */

    topic.lastActive = new Date();

    await dashboard.save();

    return {
        track,
        topic,
    };
};

module.exports = {
    getOrCreateDashboard,
    createManualTrack,
    getDashboardTracks,
    getTopicsInTrack,
    getTopicTimeline,
    integrateClassification,

    // ai only
    getOrCreateAITrack,
    addTopicToTrack,
    linkActivityToTopic,
};