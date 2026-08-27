import { ChevronRight, RefreshCw, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/Summary/Header";
import Section from "../components/Summary/Section";
import Quiz from "../components/Summary/Quiz";
import { useDashboard } from "../context/DashboardContext.jsx";

export default function Summary() {
  const { activityId } = useParams();
  const { summary, summaryLoading, summaryError, fetchSummary } = useDashboard();

  useEffect(() => {
    if (activityId) {
      fetchSummary(activityId);
    }
  }, [activityId, fetchSummary]);

  const handleRetry = () => {
    fetchSummary(activityId, true);
  };

  const keyPoints = summary?.keyPoints || summary?.sections || [];
  const status = summary?.status || (summaryLoading ? "PROCESSING" : "IDLE");

  // Dynamic date, topic name, title, and reading time estimation
  const summaryDate = summary?.generatedAt || summary?.updatedAt || summary?.activityDate || summary?.createdAt;
  const topicName = summary?.activityTopic || "Activity";
  const title = summary?.activityTitle || (summary?.activityTopic ? `${summary.activityTopic} Summary` : "Activity Summary");

  const totalWords = keyPoints.reduce((acc, curr) => {
    const text = typeof curr === "string" ? curr : `${curr.title || ""} ${curr.content || curr.text || ""}`;
    return acc + text.split(/\s+/).filter(Boolean).length;
  }, 0);
  const estimatedMinutes = Math.max(1, Math.ceil(totalWords / 150));
  const readTime = `${estimatedMinutes} min read`;

  return (
    <div className="p-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-8">
        <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
          Dashboard
        </Link>
        <ChevronRight size={14} className="text-gray-400" />

        <span className="text-gray-500">{topicName}</span>
        <ChevronRight size={14} className="text-gray-400" />

        <span className="font-medium text-gray-900">Summary</span>
      </div>

      <div className="max-w-5xl mx-auto">
        <Header topicName={topicName} date={summaryDate} readTime={readTime} title={title} />

        {/* Status: PROCESSING / LOADING */}
        {(status === "PROCESSING" || (summaryLoading && status !== "COMPLETED")) && (
          <div className="my-10 p-10 text-center bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex justify-center mb-4 text-amber-500">
              <Sparkles className="animate-pulse h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating Summary...</h3>
            <p className="text-gray-500 mb-6">
              Our AI service is analyzing your activity and preparing the summary key points.
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="text-sm font-medium text-amber-600">Processing request...</span>
            </div>
          </div>
        )}

        {/* Status: FAILED */}
        {(status === "FAILED" || (summaryError && status !== "PROCESSING")) && (
          <div className="my-10 p-8 text-center bg-red-50 border border-red-200 rounded-2xl">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Summary Generation Failed</h3>
            <p className="text-sm text-red-600 mb-6">{summaryError || summary?.error || "An error occurred while generating summary."}</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
            >
              <RefreshCw size={16} />
              Retry Summary Generation
            </button>
          </div>
        )}

        {/* Status: COMPLETED */}
        {status === "COMPLETED" && (
          <>
            <div className="space-y-4">
              {Array.isArray(keyPoints) && keyPoints.length > 0 ? (
                keyPoints.map((item, idx) => {
                  const title = typeof item === "string" ? `Key Point ${idx + 1}` : item.title || `Point ${idx + 1}`;
                  const content = typeof item === "string" ? item : item.content || item.text || "";
                  return <Section key={idx} title={title} content={content} />;
                })
              ) : (
                <div className="p-6 bg-white border rounded-xl text-center text-gray-500">
                  No summary key points available.
                </div>
              )}
            </div>

            <Quiz activityId={activityId} />
          </>
        )}
      </div>
    </div>
  );
}