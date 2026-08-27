import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import {
  getTracks,
  createTrack,
  getTopics,
  createTopic,
  getTimeline,
} from "../api/dashboard.js";
import { getSummary, generateSummary } from "../api/summary.js";
import { getQuiz, generateQuiz, submitQuiz } from "../api/quiz.js";

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  // Navigation & selection states
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState(null);

  // Data states
  const [tracks, setTracks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [timeline, setTimeline] = useState(null);
  const [summary, setSummary] = useState(null);
  const [quiz, setQuiz] = useState(null);

  // Loading states
  const [tracksLoading, setTracksLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  // Error states
  const [tracksError, setTracksError] = useState(null);
  const [topicsError, setTopicsError] = useState(null);
  const [timelineError, setTimelineError] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [quizError, setQuizError] = useState(null);

  // Timers for polling
  const summaryPollTimer = useRef(null);
  const quizPollTimer = useRef(null);

  const clearSummaryPoll = useCallback(() => {
    if (summaryPollTimer.current) {
      clearTimeout(summaryPollTimer.current);
      summaryPollTimer.current = null;
    }
  }, []);

  const clearQuizPoll = useCallback(() => {
    if (quizPollTimer.current) {
      clearTimeout(quizPollTimer.current);
      quizPollTimer.current = null;
    }
  }, []);

  // --- Track Actions ---
  const fetchTracks = useCallback(async () => {
    setTracksLoading(true);
    setTracksError(null);
    try {
      const res = await getTracks();
      const tracksData = Array.isArray(res)
        ? res
        : res.tracks || res.data || [];
      setTracks(tracksData);
      return tracksData;
    } catch (err) {
      setTracksError(err.message || "Failed to load tracks");
      toast.error("Failed to load learning tracks");
      return [];
    } finally {
      setTracksLoading(false);
    }
  }, []);

  const createNewTrack = useCallback(async (name, topicId = null) => {
    try {
      const res = await createTrack(name, topicId);
      toast.success("New track created!");
      await fetchTracks();
      return res;
    } catch (err) {
      toast.error(err.message || "Failed to create track");
      throw err;
    }
  }, [fetchTracks]);

  // --- Topic Actions ---
  const fetchTopics = useCallback(async (trackId) => {
    if (!trackId) return [];
    setSelectedTrackId(trackId);
    setTopicsLoading(true);
    setTopicsError(null);
    try {
      const res = await getTopics(trackId);
      const topicsData = Array.isArray(res)
        ? res
        : res.topics || res.data || [];
      setTopics(topicsData);
      return topicsData;
    } catch (err) {
      setTopicsError(err.message || "Failed to load topics");
      toast.error("Failed to load topics");
      return [];
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  const createNewTopic = useCallback(async (trackId, topicName) => {
    try {
      const res = await createTopic(trackId, topicName);
      toast.success("Topic created successfully!");
      await fetchTopics(trackId);
      return res;
    } catch (err) {
      toast.error(err.message || "Failed to create topic");
      throw err;
    }
  }, [fetchTopics]);

  // --- Timeline Actions ---
  const fetchTimeline = useCallback(async (topicId) => {
    if (!topicId) return null;
    setSelectedTopicId(topicId);
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const res = await getTimeline(topicId);
      const timelineData = res.timeline || res.data || res;
      setTimeline(timelineData);
      return timelineData;
    } catch (err) {
      setTimelineError(err.message || "Failed to load timeline");
      toast.error("Failed to load timeline activities");
      return null;
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  // --- Summary Flow (Single direct fetch with loader, no polling) ---
  const fetchSummary = useCallback(async (activityId, retry = false) => {
    if (!activityId) return;
    setSelectedActivityId(activityId);
    clearSummaryPoll();
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      let res = await getSummary(activityId);
      let summaryData = res?.summary || res?.data || res;

      if (!summaryData || summaryData.status === "NOT_STARTED" || retry) {
        // Trigger generation asynchronously if needed
        await generateSummary(activityId);
        res = await getSummary(activityId);
        summaryData = res?.summary || res?.data || res;
      }

      setSummary(summaryData);
      return summaryData;
    } catch (err) {
      if (err.status === 404) {
        try {
          await generateSummary(activityId);
          const res = await getSummary(activityId);
          const summaryData = res?.summary || res?.data || res;
          setSummary(summaryData);
          return summaryData;
        } catch (genErr) {
          setSummaryError(genErr.message || "Failed to generate summary");
          return null;
        }
      }
      setSummaryError(err.message || "Failed to fetch summary");
      return null;
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // --- Quiz & Async Polling Flow ---
  const fetchQuiz = useCallback(async (activityId, retry = false) => {
    if (!activityId) return;
    setSelectedActivityId(activityId);
    clearQuizPoll();
    setQuizLoading(true);
    setQuizError(null);

    const poll = async (attempts = 0) => {
      if (attempts > 40) {
        setQuizError("Quiz generation timed out. Please try again.");
        setQuizLoading(false);
        return;
      }
      try {
        const res = await getQuiz(activityId);
        const quizData = res.quiz || res.data || res;
        setQuiz(quizData);

        if (quizData?.status === "COMPLETED") {
          setQuizLoading(false);
          clearQuizPoll();
        } else if (quizData?.status === "FAILED") {
          setQuizError(quizData?.error || "Quiz generation failed");
          setQuizLoading(false);
          clearQuizPoll();
        } else {
          quizPollTimer.current = setTimeout(() => poll(attempts + 1), 2500);
        }
      } catch (err) {
        setQuizError(err.message);
        setQuizLoading(false);
        clearQuizPoll();
      }
    };

    try {
      let initialRes = await getQuiz(activityId);
      let quizData = initialRes.quiz || initialRes.data || initialRes;

      if (!quizData || quizData.status === "NOT_STARTED" || retry) {
        await generateQuiz(activityId);
        setQuiz({ status: "PROCESSING", questions: [] });
        quizPollTimer.current = setTimeout(() => poll(0), 2500);
      } else if (quizData.status === "PROCESSING") {
        setQuiz(quizData);
        quizPollTimer.current = setTimeout(() => poll(0), 2500);
      } else {
        setQuiz(quizData);
        setQuizLoading(false);
      }
    } catch (err) {
      if (err.status === 404) {
        try {
          await generateQuiz(activityId);
          setQuiz({ status: "PROCESSING", questions: [] });
          quizPollTimer.current = setTimeout(() => poll(0), 2500);
          return;
        } catch (genErr) {
          setQuizError(genErr.message);
          setQuizLoading(false);
          return;
        }
      }
      setQuizError(err.message || "Failed to fetch quiz");
      setQuizLoading(false);
    }
  }, []);

  // --- Submit Quiz ---
  const submitQuizAttempt = useCallback(async (activityId, submissionData) => {
    try {
      const res = await submitQuiz(activityId, submissionData);
      toast.success("Quiz attempt submitted successfully!");
      return res;
    } catch (err) {
      toast.error(err.message || "Failed to submit quiz attempt");
      throw err;
    }
  }, []);

  const value = {
    selectedTrackId,
    setSelectedTrackId,
    selectedTopicId,
    setSelectedTopicId,
    selectedActivityId,
    setSelectedActivityId,
    tracks,
    topics,
    timeline,
    summary,
    quiz,
    tracksLoading,
    topicsLoading,
    timelineLoading,
    summaryLoading,
    quizLoading,
    tracksError,
    topicsError,
    timelineError,
    summaryError,
    quizError,
    fetchTracks,
    createNewTrack,
    fetchTopics,
    createNewTopic,
    fetchTimeline,
    fetchSummary,
    fetchQuiz,
    submitQuizAttempt,
    clearSummaryPoll,
    clearQuizPoll,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
